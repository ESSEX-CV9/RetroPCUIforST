// js/modules/data/dataService.js
/**
 * 数据服务
 * 统一的数据管理服务，集成到ServiceLocator架构中
 * 负责协调存储适配器和各个子数据管理器
 */
class DataService {
    constructor(serviceLocator) {
        this.serviceLocator = serviceLocator;
        this.eventBus = serviceLocator.get('eventBus');
        this.storage = serviceLocator.get('storage');
        
        // 存储适配器
        this.storageAdapter = new DataStorageAdapter(serviceLocator);
        
        // 子数据管理器
        this.player = new PlayerDataManager(serviceLocator);
        this.world = new WorldDataManager(serviceLocator);
        this.gameState = new GameStateManager(serviceLocator);
        
        // 设置存储适配器引用
        this.player.setStorageAdapter(this.storageAdapter);
        this.world.setStorageAdapter(this.storageAdapter);
        this.gameState.setStorageAdapter(this.storageAdapter);
        
        // 初始化状态
        this.initialized = false;
        this.initializationPromise = null;
        
        // 自动保存定时器
        this.autoSaveTimer = null;
        this.autoSaveInterval = 300000; // 5分钟
        
        // 数据变更追踪
        this.changeTracker = {
            lastSave: null,
            pendingChanges: false,
            changeCount: 0
        };
    }
    
    /**
     * 初始化数据服务
     * @returns {Promise<void>}
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        
        if (this.initializationPromise) {
            return this.initializationPromise;
        }
        
        this.initializationPromise = this._performInitialization();
        return this.initializationPromise;
    }
    
    /**
     * 执行初始化过程
     * @private
     */
    async _performInitialization() {
        try {
            console.log('开始初始化数据服务...');
            
            // 1. 初始化存储适配器
            await this.storageAdapter.initialize();
            
            // 2. 初始化各个子管理器
            await Promise.all([
                this.player.initialize(),
                this.world.initialize(),
                this.gameState.initialize()
            ]);
            
            // 3. 设置事件监听
            this.setupEventListeners();
            
            // 4. 启动自动保存
            await this.startAutoSave();
            
            // 5. 验证数据完整性
            await this.validateAllData();
            
            this.initialized = true;
            console.log('数据服务初始化完成');
            
            // 发布初始化完成事件
            this.eventBus.emit('dataServiceInitialized', {
                storageStatus: this.storageAdapter.getStorageStatus(),
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('数据服务初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 设置事件监听器
     * @private
     */
    setupEventListeners() {
        // 监听数据保存事件，更新变更追踪
        this.eventBus.on('dataStorageSaved', (data) => {
            this.changeTracker.lastSave = new Date().toISOString();
            this.changeTracker.pendingChanges = false;
            this.changeTracker.changeCount++;
        });
        
        // 监听各种数据变更事件
        const changeEvents = [
            'playerStatsChanged',
            'playerSkillsChanged', 
            'playerIdentityChanged',
            'playerDisguiseAbilitiesChanged',
            'worldLocationStateChanged',
            'worldNpcRelationChanged',
            'gameInterfaceChanged',
            'gameSettingsChanged'
        ];
        
        changeEvents.forEach(eventName => {
            this.eventBus.on(eventName, () => {
                this.changeTracker.pendingChanges = true;
            });
        });
        
        // 监听存储重连事件
        this.eventBus.on('dataStorageReconnected', () => {
            console.log('存储重新连接，触发数据同步');
            this.syncPendingChanges();
        });
        
        // 监听系统关机事件，保存数据
        this.eventBus.on('systemPowerChange', async (isOn) => {
            if (!isOn) {
                console.log('系统关机，保存所有数据');
                await this.saveAllData();
            }
        });
    }
    
    /**
     * 启动自动保存
     * @private
     */
    async startAutoSave() {
        // 获取自动保存设置
        const autoSaveEnabled = await this.gameState.getSetting('autoSave', true);
        const interval = await this.gameState.getSetting('autoSaveInterval', this.autoSaveInterval);
        
        if (autoSaveEnabled) {
            this.autoSaveInterval = interval;
            this.autoSaveTimer = setInterval(async () => {
                if (this.changeTracker.pendingChanges) {
                    console.log('自动保存触发');
                    await this.saveAllData();
                }
            }, this.autoSaveInterval);
            
            console.log(`自动保存已启动，间隔: ${this.autoSaveInterval / 1000}秒`);
        }
    }
    
    /**
     * 停止自动保存
     */
    stopAutoSave() {
        if (this.autoSaveTimer) {
            clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = null;
            console.log('自动保存已停止');
        }
    }
    
    /**
     * 保存所有数据
     * @returns {Promise<Object>} 保存结果
     */
    async saveAllData() {
        try {
            console.log('开始保存所有数据...');
            
            const results = {
                player: {},
                world: {},
                success: true,
                errors: []
            };
            
            // 保存玩家数据
            try {
                const [stats, skills, identities, disguiseAbilities] = await Promise.all([
                    this.player.getStats(),
                    this.player.getSkills(),
                    this.player.getIdentities(),
                    this.player.getDisguiseAbilities()
                ]);
                
                results.player.stats = await this.storageAdapter.savePersistentData('player_stats', stats);
                results.player.skills = await this.storageAdapter.savePersistentData('player_skills', skills);
                results.player.identities = await this.storageAdapter.savePersistentData('player_identities', identities);
                results.player.disguiseAbilities = await this.storageAdapter.savePersistentData('player_disguise_abilities', disguiseAbilities);
            } catch (error) {
                results.errors.push('保存玩家数据失败: ' + error.message);
                results.success = false;
            }
            
            // 保存世界数据
            try {
                const [locations, npcs] = await Promise.all([
                    this.world.getLocationStates(),
                    this.world.getNpcRelations()
                ]);
                
                results.world.locations = await this.storageAdapter.savePersistentData('world_locations', locations);
                results.world.npcs = await this.storageAdapter.savePersistentData('world_npcs', npcs);
            } catch (error) {
                results.errors.push('保存世界数据失败: ' + error.message);
                results.success = false;
            }
            
            // 记录保存时间
            await this.gameState.recordSaveTime();
            
            // 发布保存完成事件
            this.eventBus.emit('dataServiceSaveCompleted', {
                results,
                timestamp: new Date().toISOString()
            });
            
            console.log('所有数据保存完成', results);
            return results;
        } catch (error) {
            console.error('保存所有数据失败:', error);
            return {
                success: false,
                errors: [error.message]
            };
        }
    }
    
    /**
     * 验证所有数据完整性
     * @returns {Promise<Object>} 验证结果
     */
    async validateAllData() {
        try {
            const validation = {
                overall: true,
                results: {},
                errors: []
            };
            
            // 验证各个子系统
            const [playerValidation, worldValidation, gameStateValidation] = await Promise.all([
                this.player.validatePlayerData(),
                this.world.validateWorldData(),
                this.gameState.validateGameState()
            ]);
            
            validation.results.player = playerValidation;
            validation.results.world = worldValidation;
            validation.results.gameState = gameStateValidation;
            
            // 汇总验证结果
            if (!playerValidation.isValid) {
                validation.overall = false;
                validation.errors.push(...playerValidation.errors);
            }
            
            if (!worldValidation.isValid) {
                validation.overall = false;
                validation.errors.push(...worldValidation.errors);
            }
            
            if (!gameStateValidation.isValid) {
                validation.overall = false;
                validation.errors.push(...gameStateValidation.errors);
            }
            
            // 发布验证结果事件
            this.eventBus.emit('dataServiceValidationCompleted', validation);
            
            if (validation.overall) {
                console.log('数据完整性验证通过');
            } else {
                console.warn('数据完整性验证失败:', validation.errors);
            }
            
            return validation;
        } catch (error) {
            console.error('数据验证失败:', error);
            return {
                overall: false,
                errors: ['数据验证过程中发生错误: ' + error.message]
            };
        }
    }
    
    /**
     * 同步待处理的更改
     * @returns {Promise<boolean>} 是否成功
     */
    async syncPendingChanges() {
        if (!this.changeTracker.pendingChanges) {
            return true;
        }
        
        try {
            const result = await this.saveAllData();
            return result.success;
        } catch (error) {
            console.error('同步待处理更改失败:', error);
            return false;
        }
    }
    
    /**
     * 获取数据服务状态
     * @returns {Object} 服务状态信息
     */
    getServiceStatus() {
        return {
            initialized: this.initialized,
            storage: this.storageAdapter.getStorageStatus(),
            autoSave: {
                enabled: !!this.autoSaveTimer,
                interval: this.autoSaveInterval
            },
            changes: {
                lastSave: this.changeTracker.lastSave,
                pendingChanges: this.changeTracker.pendingChanges,
                changeCount: this.changeTracker.changeCount
            }
        };
    }
    
    /**
     * 获取完整的游戏数据快照
     * @returns {Promise<Object>} 游戏数据快照
     */
    async getGameDataSnapshot() {
        try {
            const [playerData, worldData, gameStateData] = await Promise.all([
                this.player.getCompletePlayerData(),
                this.world.getCompleteWorldData(),
                this.gameState.getCompleteGameState()
            ]);
            
            return {
                player: playerData,
                world: worldData,
                gameState: gameStateData,
                metadata: {
                    snapshotTime: new Date().toISOString(),
                    version: "1.0",
                    serviceStatus: this.getServiceStatus()
                }
            };
        } catch (error) {
            console.error('获取游戏数据快照失败:', error);
            return null;
        }
    }
    
    /**
     * 重置所有数据
     * @param {Object} options - 重置选项
     * @returns {Promise<boolean>} 是否成功
     */
    async resetAllData(options = {}) {
        try {
            const {
                resetPlayer = false,
                resetWorld = false,
                resetGameState = false,
                keepSettings = true
            } = options;
            
            console.log('开始重置数据...', options);
            
            if (resetPlayer) {
                // 重置玩家数据需要重新初始化
                await this.player.resetToDefaults();
                this.eventBus.emit('dataServicePlayerReset');
            }
            
            if (resetWorld) {
                await this.world.resetWorldData({
                    resetLocations: true,
                    resetNpcs: true,
                    keepVisible: true
                });
                this.eventBus.emit('dataServiceWorldReset');
            }
            
            if (resetGameState) {
                await this.gameState.resetGameState({
                    resetInterface: true,
                    resetSettings: !keepSettings,
                    resetSession: true
                });
                this.eventBus.emit('dataServiceGameStateReset');
            }
            
            // 保存重置后的数据
            await this.saveAllData();
            
            console.log('数据重置完成');
            this.eventBus.emit('dataServiceResetCompleted', options);
            
            return true;
        } catch (error) {
            console.error('重置数据失败:', error);
            return false;
        }
    }
    
    /**
     * 强制重新连接存储
     * @returns {Promise<boolean>} 是否成功
     */
    async reconnectStorage() {
        try {
            const result = await this.storageAdapter.reconnectLorebook();
            if (result) {
                // 重连成功，同步待处理的更改
                await this.syncPendingChanges();
            }
            return result;
        } catch (error) {
            console.error('重新连接存储失败:', error);
            return false;
        }
    }
    
    /**
     * 清理资源
     */
    destroy() {
        this.stopAutoSave();
        
        // 清理事件监听器
        // 注意：这里不需要手动清理，因为事件总线会在页面卸载时自动清理
        
        this.initialized = false;
        console.log('数据服务已清理');
    }
}

// 导出类
window.DataService = DataService;