// js/modules/data/gameStateManager.js
/**
 * 游戏状态管理器
 * 负责管理界面状态、系统设置、会话数据等临时游戏状态
 */
class GameStateManager {
    constructor(serviceLocator) {
        this.serviceLocator = serviceLocator;
        this.eventBus = serviceLocator.get('eventBus');
        this.storageAdapter = null; // 将在DataService中设置
        
        // 默认界面状态
        this.DEFAULT_INTERFACE_STATE = {
            current: 'terminal',
            previous: null,
            stack: ['terminal']
        };
        
        // 默认系统设置
        this.DEFAULT_SYSTEM_SETTINGS = {
            colorMode: 'green',
            isPowerOn: false,
            isTestMode: false,
            volume: 0.8,
            autoSave: true,
            autoSaveInterval: 300000 // 5分钟
        };
        
        // 默认会话数据
        this.DEFAULT_SESSION_DATA = {
            startTime: null,
            playTime: 0,
            lastSave: null,
            currentLocation: null,
            gameVersion: "1.0"
        };
        
        // 初始化标志
        this.initialized = false;
    }
    
    /**
     * 设置存储适配器
     * @param {DataStorageAdapter} storageAdapter - 存储适配器实例
     */
    setStorageAdapter(storageAdapter) {
        this.storageAdapter = storageAdapter;
    }
    
    /**
     * 初始化游戏状态管理器
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        
        try {
            // 确保游戏状态数据存在
            await this.ensureGameStateExists();
            
            // 初始化会话
            await this.initializeSession();
            
            this.initialized = true;
            console.log('游戏状态管理器初始化完成');
            
            // 发布初始化完成事件
            this.eventBus.emit('gameStateManagerInitialized');
        } catch (error) {
            console.error('游戏状态管理器初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 确保游戏状态数据存在，如不存在则创建默认数据
     * @private
     */
    async ensureGameStateExists() {
        // 检查并初始化界面状态
        const interfaceState = await this.storageAdapter.loadTempData('interface_state');
        if (!interfaceState) {
            await this.storageAdapter.saveTempData('interface_state', this.DEFAULT_INTERFACE_STATE);
            console.log('创建默认界面状态');
        }
        
        // 检查并初始化系统设置
        const systemSettings = await this.storageAdapter.loadTempData('system_settings');
        if (!systemSettings) {
            await this.storageAdapter.saveTempData('system_settings', this.DEFAULT_SYSTEM_SETTINGS);
            console.log('创建默认系统设置');
        }
        
        // 检查并初始化会话数据
        const sessionData = await this.storageAdapter.loadTempData('session_data');
        if (!sessionData) {
            await this.storageAdapter.saveTempData('session_data', this.DEFAULT_SESSION_DATA);
            console.log('创建默认会话数据');
        }
    }
    
    /**
     * 初始化游戏会话
     * @private
     */
    async initializeSession() {
        const sessionData = await this.getSessionData();
        
        // 如果没有活跃会话，创建新会话
        if (!sessionData.startTime) {
            sessionData.startTime = new Date().toISOString();
            sessionData.playTime = 0;
            await this.setSessionData(sessionData);
            
            this.eventBus.emit('gameSessionStarted', { startTime: sessionData.startTime });
        } else {
            // 恢复现有会话
            this.eventBus.emit('gameSessionResumed', { 
                startTime: sessionData.startTime,
                playTime: sessionData.playTime
            });
        }
    }
    
    // ==================== 界面状态相关方法 ====================
    
    /**
     * 获取界面状态
     * @returns {Promise<Object>} 界面状态对象
     */
    async getInterfaceState() {
        return await this.storageAdapter.loadTempData('interface_state', this.DEFAULT_INTERFACE_STATE);
    }
    
    /**
     * 获取当前界面
     * @returns {Promise<string>} 当前界面名称
     */
    async getCurrentInterface() {
        const state = await this.getInterfaceState();
        return state.current;
    }
    
    /**
     * 设置当前界面
     * @param {string} interfaceName - 界面名称
     * @param {boolean} addToStack - 是否添加到历史栈
     * @returns {Promise<boolean>} 是否成功
     */
    async setCurrentInterface(interfaceName, addToStack = true) {
        try {
            const state = await this.getInterfaceState();
            const previousInterface = state.current;
            
            state.previous = previousInterface;
            state.current = interfaceName;
            
            if (addToStack && previousInterface && previousInterface !== interfaceName) {
                // 添加到历史栈，但避免重复
                if (state.stack[state.stack.length - 1] !== previousInterface) {
                    state.stack.push(previousInterface);
                }
                
                // 限制栈大小
                if (state.stack.length > 10) {
                    state.stack.shift();
                }
            }
            
            await this.storageAdapter.saveTempData('interface_state', state);
            
            // 发布界面变更事件
            this.eventBus.emit('gameInterfaceChanged', {
                previous: previousInterface,
                current: interfaceName,
                stack: [...state.stack]
            });
            
            console.log(`界面已切换: ${previousInterface} -> ${interfaceName}`);
            return true;
        } catch (error) {
            console.error(`设置当前界面失败 (${interfaceName}):`, error);
            return false;
        }
    }
    
    /**
     * 返回上一个界面
     * @returns {Promise<string|null>} 上一个界面名称，如果没有则返回null
     */
    async goToPreviousInterface() {
        try {
            const state = await this.getInterfaceState();
            
            if (state.stack.length > 0) {
                const previousInterface = state.stack.pop();
                await this.setCurrentInterface(previousInterface, false);
                return previousInterface;
            }
            
            return null;
        } catch (error) {
            console.error('返回上一个界面失败:', error);
            return null;
        }
    }
    
    /**
     * 清空界面历史栈
     * @returns {Promise<boolean>} 是否成功
     */
    async clearInterfaceStack() {
        try {
            const state = await this.getInterfaceState();
            state.stack = [];
            state.previous = null;
            
            await this.storageAdapter.saveTempData('interface_state', state);
            this.eventBus.emit('gameInterfaceStackCleared');
            
            return true;
        } catch (error) {
            console.error('清空界面历史栈失败:', error);
            return false;
        }
    }
    
    // ==================== 系统设置相关方法 ====================
    
    /**
     * 获取系统设置
     * @returns {Promise<Object>} 系统设置对象
     */
    async getSystemSettings() {
        return await this.storageAdapter.loadTempData('system_settings', this.DEFAULT_SYSTEM_SETTINGS);
    }
    
    /**
     * 更新系统设置
     * @param {Object} settings - 要更新的设置
     * @returns {Promise<boolean>} 是否成功
     */
    async updateSystemSettings(settings) {
        try {
            const currentSettings = await this.getSystemSettings();
            const oldSettings = { ...currentSettings };
            const newSettings = { ...currentSettings, ...settings };
            
            await this.storageAdapter.saveTempData('system_settings', newSettings);
            
            // 发布设置变更事件
            this.eventBus.emit('gameSettingsChanged', {
                oldSettings,
                newSettings,
                changedKeys: Object.keys(settings)
            });
            
            // 发布具体设置变更事件
            for (const [key, value] of Object.entries(settings)) {
                this.eventBus.emit(`gameSetting${key.charAt(0).toUpperCase() + key.slice(1)}Changed`, {
                    oldValue: oldSettings[key],
                    newValue: value
                });
            }
            
            console.log('系统设置已更新:', Object.keys(settings));
            return true;
        } catch (error) {
            console.error('更新系统设置失败:', error);
            return false;
        }
    }
    
    /**
     * 获取特定设置值
     * @param {string} key - 设置键
     * @param {*} defaultValue - 默认值
     * @returns {Promise<*>} 设置值
     */
    async getSetting(key, defaultValue = null) {
        try {
            const settings = await this.getSystemSettings();
            return settings[key] !== undefined ? settings[key] : defaultValue;
        } catch (error) {
            console.error(`获取设置失败 (${key}):`, error);
            return defaultValue;
        }
    }
    
    /**
     * 设置特定设置值
     * @param {string} key - 设置键
     * @param {*} value - 设置值
     * @returns {Promise<boolean>} 是否成功
     */
    async setSetting(key, value) {
        return await this.updateSystemSettings({ [key]: value });
    }
    
    /**
     * 重置系统设置为默认值
     * @returns {Promise<boolean>} 是否成功
     */
    async resetSystemSettings() {
        try {
            await this.storageAdapter.saveTempData('system_settings', this.DEFAULT_SYSTEM_SETTINGS);
            this.eventBus.emit('gameSettingsReset', this.DEFAULT_SYSTEM_SETTINGS);
            
            console.log('系统设置已重置为默认值');
            return true;
        } catch (error) {
            console.error('重置系统设置失败:', error);
            return false;
        }
    }
    
    // ==================== 会话数据相关方法 ====================
    
    /**
     * 获取会话数据
     * @returns {Promise<Object>} 会话数据对象
     */
    async getSessionData() {
        return await this.storageAdapter.loadTempData('session_data', this.DEFAULT_SESSION_DATA);
    }
    
    /**
     * 设置会话数据
     * @param {Object} sessionData - 会话数据
     * @returns {Promise<boolean>} 是否成功
     */
    async setSessionData(sessionData) {
        try {
            await this.storageAdapter.saveTempData('session_data', sessionData);
            this.eventBus.emit('gameSessionDataChanged', sessionData);
            return true;
        } catch (error) {
            console.error('设置会话数据失败:', error);
            return false;
        }
    }
    
    /**
     * 更新游戏时间
     * @param {number} additionalTime - 增加的时间（毫秒）
     * @returns {Promise<boolean>} 是否成功
     */
    async updatePlayTime(additionalTime) {
        try {
            const sessionData = await this.getSessionData();
            sessionData.playTime += additionalTime;
            
            await this.setSessionData(sessionData);
            
            this.eventBus.emit('gamePlayTimeUpdated', {
                additionalTime,
                totalPlayTime: sessionData.playTime
            });
            
            return true;
        } catch (error) {
            console.error('更新游戏时间失败:', error);
            return false;
        }
    }
    
    /**
     * 记录保存时间
     * @returns {Promise<boolean>} 是否成功
     */
    async recordSaveTime() {
        try {
            const sessionData = await this.getSessionData();
            sessionData.lastSave = new Date().toISOString();
            
            await this.setSessionData(sessionData);
            
            this.eventBus.emit('gameSaveTimeRecorded', {
                saveTime: sessionData.lastSave
            });
            
            return true;
        } catch (error) {
            console.error('记录保存时间失败:', error);
            return false;
        }
    }
    
    /**
     * 设置当前位置
     * @param {string} locationName - 位置名称
     * @returns {Promise<boolean>} 是否成功
     */
    async setCurrentLocation(locationName) {
        try {
            const sessionData = await this.getSessionData();
            const oldLocation = sessionData.currentLocation;
            sessionData.currentLocation = locationName;
            
            await this.setSessionData(sessionData);
            
            this.eventBus.emit('gameCurrentLocationChanged', {
                oldLocation,
                newLocation: locationName
            });
            
            return true;
        } catch (error) {
            console.error(`设置当前位置失败 (${locationName}):`, error);
            return false;
        }
    }
    
    /**
     * 获取当前位置
     * @returns {Promise<string|null>} 当前位置名称
     */
    async getCurrentLocation() {
        try {
            const sessionData = await this.getSessionData();
            return sessionData.currentLocation;
        } catch (error) {
            console.error('获取当前位置失败:', error);
            return null;
        }
    }
    
    /**
     * 开始新的游戏会话
     * @returns {Promise<boolean>} 是否成功
     */
    async startNewSession() {
        try {
            const newSessionData = {
                ...this.DEFAULT_SESSION_DATA,
                startTime: new Date().toISOString(),
                playTime: 0
            };
            
            await this.setSessionData(newSessionData);
            
            this.eventBus.emit('gameNewSessionStarted', newSessionData);
            console.log('新游戏会话已开始');
            
            return true;
        } catch (error) {
            console.error('开始新游戏会话失败:', error);
            return false;
        }
    }
    
    /**
     * 结束当前游戏会话
     * @returns {Promise<boolean>} 是否成功
     */
    async endSession() {
        try {
            const sessionData = await this.getSessionData();
            const endTime = new Date().toISOString();
            
            this.eventBus.emit('gameSessionEnded', {
                startTime: sessionData.startTime,
                endTime,
                totalPlayTime: sessionData.playTime
            });
            
            // 重置会话数据
            await this.setSessionData(this.DEFAULT_SESSION_DATA);
            
            console.log('游戏会话已结束');
            return true;
        } catch (error) {
            console.error('结束游戏会话失败:', error);
            return false;
        }
    }
    
    // ==================== 综合状态方法 ====================
    
    /**
     * 获取完整的游戏状态
     * @returns {Promise<Object>} 完整的游戏状态
     */
    async getCompleteGameState() {
        try {
            const [interfaceState, systemSettings, sessionData] = await Promise.all([
                this.getInterfaceState(),
                this.getSystemSettings(),
                this.getSessionData()
            ]);
            
            return {
                interface: interfaceState,
                settings: systemSettings,
                session: sessionData,
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    version: "1.0"
                }
            };
        } catch (error) {
            console.error('获取完整游戏状态失败:', error);
            return null;
        }
    }
    
    /**
     * 验证游戏状态数据完整性
     * @returns {Promise<Object>} 验证结果
     */
    async validateGameState() {
        try {
            const validation = {
                interface: false,
                settings: false,
                session: false,
                errors: []
            };
            
            // 验证界面状态
            const interfaceState = await this.getInterfaceState();
            validation.interface = interfaceState && interfaceState.current;
            if (!validation.interface) {
                validation.errors.push('界面状态数据缺失或无效');
            }
            
            // 验证系统设置
            const systemSettings = await this.getSystemSettings();
            validation.settings = systemSettings && typeof systemSettings === 'object';
            if (!validation.settings) {
                validation.errors.push('系统设置数据缺失或格式错误');
            }
            
            // 验证会话数据
            const sessionData = await this.getSessionData();
            validation.session = sessionData && typeof sessionData === 'object';
            if (!validation.session) {
                validation.errors.push('会话数据缺失或格式错误');
            }
            
            validation.isValid = validation.interface && validation.settings && validation.session;
            
            return validation;
        } catch (error) {
            console.error('验证游戏状态失败:', error);
            return {
                isValid: false,
                errors: ['数据验证过程中发生错误: ' + error.message]
            };
        }
    }
    
    /**
     * 重置游戏状态
     * @param {Object} options - 重置选项
     * @returns {Promise<boolean>} 是否成功
     */
    async resetGameState(options = {}) {
        try {
            const { 
                resetInterface = false, 
                resetSettings = false,
                resetSession = false 
            } = options;
            
            if (resetInterface) {
                await this.storageAdapter.saveTempData('interface_state', this.DEFAULT_INTERFACE_STATE);
                this.eventBus.emit('gameInterfaceStateReset');
            }
            
            if (resetSettings) {
                await this.resetSystemSettings();
            }
            
            if (resetSession) {
                await this.setSessionData(this.DEFAULT_SESSION_DATA);
                this.eventBus.emit('gameSessionReset');
            }
            
            console.log('游戏状态重置完成');
            return true;
        } catch (error) {
            console.error('重置游戏状态失败:', error);
            return false;
        }
    }
}

// 导出类
window.GameStateManager = GameStateManager;