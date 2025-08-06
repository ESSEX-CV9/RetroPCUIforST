// js/modules/data/dataStorageAdapter.js
/**
 * 数据存储适配器
 * 负责处理ChatLorebook和LocalStorage之间的数据存储逻辑
 */
class DataStorageAdapter {
    constructor(serviceLocator) {
        this.serviceLocator = serviceLocator;
        this.eventBus = serviceLocator.get('eventBus');
        this.storage = serviceLocator.get('storage');
        
        // 数据映射配置
        this.DATA_MAPPING = {
            'player_stats': {
                lorebookEntry: 'player_stats',
                localStorageBackupKey: 'player_stats',
                tempKey: 'temp_player_stats'
            },
            'player_skills': {
                lorebookEntry: 'player_skills',
                localStorageBackupKey: 'player_skills',
                tempKey: 'temp_player_skills'
            },
            'player_identities': {
                lorebookEntry: 'player_identities',
                localStorageBackupKey: 'player_identities',
                tempKey: 'temp_player_identities'
            },
            'world_locations': {
                lorebookEntry: 'world_locations',
                localStorageBackupKey: 'world_locations',
                tempKey: 'temp_world_locations'
            },
            'world_npcs': {
                lorebookEntry: 'world_npcs',
                localStorageBackupKey: 'world_npcs',
                tempKey: 'temp_world_npcs'
            },
            'game_settings': {
                lorebookEntry: 'game_settings',
                localStorageBackupKey: 'game_settings',
                tempKey: 'temp_game_settings'
            },
            'game_session': {
                lorebookEntry: 'game_session',
                localStorageBackupKey: 'game_session',
                tempKey: 'temp_game_session'
            }
        };
        
        // LocalStorage备份总键
        this.BACKUP_STORAGE_KEY = 'coldwarspy_data_backup';
        
        // ChatLorebook可用性状态
        this.isLorebookAvailable = false;
        
        console.log('数据存储适配器已初始化');
    }
    
    /**
     * 初始化存储适配器
     * @returns {Promise<boolean>} 是否成功
     */
    async initialize() {
        try {
            // 检查ChatLorebook可用性
            await this.checkLorebookAvailability();
            console.log('数据存储适配器初始化完成');
            return true;
        } catch (error) {
            console.error('数据存储适配器初始化失败:', error);
            return false;
        }
    }
    
    /**
     * 检查ChatLorebook可用性
     * @returns {Promise<boolean>} 是否可用
     */
    async checkLorebookAvailability() {
        try {
            // 检查全局函数是否存在
            if (typeof getOrCreateChatLorebook === 'function' && 
                typeof getLorebookEntries === 'function' && 
                typeof setLorebookEntries === 'function' && 
                typeof createLorebookEntries === 'function') {
                
                // 尝试确保ChatLorebook存在
                await getOrCreateChatLorebook();
                this.isLorebookAvailable = true;
                console.log('ChatLorebook可用');
                return true;
            } else {
                console.warn('ChatLorebook全局函数不可用，将使用LocalStorage作为主要存储');
                this.isLorebookAvailable = false;
                return false;
            }
        } catch (error) {
            console.warn('ChatLorebook不可用:', error.message, '将使用LocalStorage作为主要存储');
            this.isLorebookAvailable = false;
            return false;
        }
    }
    
    /**
     * 保存持久化数据
     * @param {string} key - 数据键
     * @param {*} data - 要保存的数据
     * @returns {Promise<boolean>} 是否成功
     */
    async savePersistentData(key, data) {
        const mapping = this.DATA_MAPPING[key];
        if (!mapping) {
            console.error(`未找到数据键映射: ${key}`);
            return false;
        }
        
        let success = false;
        
        try {
            // 优先尝试保存到ChatLorebook
            if (this.isLorebookAvailable) {
                const lorebookSuccess = await this.saveToLorebook(mapping.lorebookEntry, data);
                if (lorebookSuccess) {
                    success = true;
                } else {
                    console.warn(`保存到ChatLorebook失败 (${key})，尝试LocalStorage`);
                }
            }
            
            // 总是保存到LocalStorage作为备份
            const backupSuccess = await this.saveToLocalStorageBackup(key, data);
            if (backupSuccess) {
                success = true;
            }
            
            if (success) {
                // 发布数据保存事件
                if (this.eventBus) {
                    this.eventBus.emit('dataStorageSaved', { key, data });
                }
            }
            
            return success;
        } catch (error) {
            console.error(`保存持久化数据失败 (${key}):`, error);
            return false;
        }
    }
    
    /**
     * 加载持久化数据
     * @param {string} key - 数据键
     * @param {*} defaultValue - 默认值
     * @returns {Promise<*>} 加载的数据或默认值
     */
    async loadPersistentData(key, defaultValue = null) {
        const mapping = this.DATA_MAPPING[key];
        if (!mapping) {
            console.error(`未找到数据键映射: ${key}`);
            return defaultValue;
        }
        
        try {
            // 优先从ChatLorebook加载
            if (this.isLorebookAvailable) {
                const lorebookData = await this.loadFromLorebook(mapping.lorebookEntry);
                if (lorebookData !== null) {
                    return lorebookData;
                } else {
                    console.log(`从ChatLorebook加载数据失败 (${key})，尝试LocalStorage备份`);
                }
            }
            
            // 从LocalStorage备份加载
            const backupData = await this.loadFromLocalStorageBackup(key, defaultValue);
            console.log(`从LocalStorage备份加载数据: ${key}`);
            return backupData;
            
        } catch (error) {
            console.error(`加载持久化数据失败 (${key}):`, error);
            return defaultValue;
        }
    }
    
    /**
     * 保存临时数据（仅存储在LocalStorage）
     * @param {string} key - 数据键
     * @param {*} data - 要保存的数据
     * @returns {Promise<boolean>} 是否成功
     */
    async saveTempData(key, data) {
        const mapping = this.DATA_MAPPING[key];
        if (!mapping) {
            console.error(`未找到数据键映射: ${key}`);
            return false;
        }
        
        try {
            this.storage.save(mapping.tempKey, data);
            return true;
        } catch (error) {
            console.error(`保存临时数据失败 (${key}):`, error);
            return false;
        }
    }
    
    /**
     * 加载临时数据（仅从LocalStorage）
     * @param {string} key - 数据键
     * @param {*} defaultValue - 默认值
     * @returns {*} 加载的数据或默认值
     */
    async loadTempData(key, defaultValue = null) {
        const mapping = this.DATA_MAPPING[key];
        if (!mapping) {
            console.error(`未找到数据键映射: ${key}`);
            return defaultValue;
        }
        
        try {
            return this.storage.load(mapping.tempKey, defaultValue);
        } catch (error) {
            console.error(`加载临时数据失败 (${key}):`, error);
            return defaultValue;
        }
    }
    
    /**
     * 保存数据到ChatLorebook
     * @param {string} entryKey - Lorebook条目键
     * @param {*} data - 要保存的数据
     * @returns {Promise<boolean>} 是否成功
     */
    async saveToLorebook(entryKey, data) {
        try {
            if (!this.isLorebookAvailable) {
                return false;
            }
            
            const jsonData = JSON.stringify(data, null, 2);
            
            // 首先尝试获取现有条目
            const entries = await getLorebookEntries([entryKey]);
            
            if (entries && entries.length > 0) {
                // 更新现有条目
                await setLorebookEntries([{
                    key: entryKey,
                    content: jsonData
                }]);
            } else {
                // 创建新条目
                await createLorebookEntries([{
                    key: entryKey,
                    content: jsonData
                }]);
            }
            
            console.log(`数据已保存到ChatLorebook: ${entryKey}`);
            return true;
        } catch (error) {
            console.error(`保存到ChatLorebook失败 (${entryKey}):`, error);
            return false;
        }
    }
    
    /**
     * 从ChatLorebook加载数据
     * @param {string} entryKey - Lorebook条目键
     * @returns {Promise<*>} 加载的数据或null
     */
    async loadFromLorebook(entryKey) {
        try {
            if (!this.isLorebookAvailable) {
                return null;
            }
            
            const entries = await getLorebookEntries([entryKey]);
            
            if (entries && entries.length > 0) {
                const entry = entries[0];
                if (entry && entry.content) {
                    return JSON.parse(entry.content);
                }
            }
            
            return null;
        } catch (error) {
            console.error(`从ChatLorebook加载失败 (${entryKey}):`, error);
            return null;
        }
    }
    
    /**
     * 保存数据到LocalStorage备份
     * @param {string} key - 数据键
     * @param {*} data - 要保存的数据
     * @returns {Promise<boolean>} 是否成功
     */
    async saveToLocalStorageBackup(key, data) {
        try {
            // 获取现有备份数据
            let backupData = this.storage.load(this.BACKUP_STORAGE_KEY, {});
            
            // 更新特定键的数据
            backupData[key] = data;
            
            // 保存回LocalStorage
            this.storage.save(this.BACKUP_STORAGE_KEY, backupData);
            
            console.log(`数据已保存到LocalStorage备份: ${key}`);
            return true;
        } catch (error) {
            console.error(`保存到LocalStorage备份失败 (${key}):`, error);
            return false;
        }
    }
    
    /**
     * 从LocalStorage备份加载数据
     * @param {string} key - 数据键
     * @param {*} defaultValue - 默认值
     * @returns {*} 加载的数据或默认值
     */
    async loadFromLocalStorageBackup(key, defaultValue = null) {
        try {
            const backupData = this.storage.load(this.BACKUP_STORAGE_KEY, {});
            return backupData[key] !== undefined ? backupData[key] : defaultValue;
        } catch (error) {
            console.error(`从LocalStorage备份加载失败 (${key}):`, error);
            return defaultValue;
        }
    }
    
    /**
     * 清除特定键的所有数据
     * @param {string} key - 数据键
     * @returns {Promise<boolean>} 是否成功
     */
    async clearData(key) {
        const mapping = this.DATA_MAPPING[key];
        if (!mapping) {
            console.error(`未找到数据键映射: ${key}`);
            return false;
        }
        
        let success = false;
        
        try {
            // 清除ChatLorebook数据
            if (this.isLorebookAvailable) {
                try {
                    await setLorebookEntries([{
                        key: mapping.lorebookEntry,
                        content: ''
                    }]);
                    success = true;
                } catch (error) {
                    console.warn(`清除ChatLorebook数据失败 (${key}):`, error);
                }
            }
            
            // 清除LocalStorage备份
            let backupData = this.storage.load(this.BACKUP_STORAGE_KEY, {});
            delete backupData[key];
            this.storage.save(this.BACKUP_STORAGE_KEY, backupData);
            
            // 清除临时数据
            this.storage.remove(mapping.tempKey);
            
            success = true;
            console.log(`已清除所有数据: ${key}`);
            
            return success;
        } catch (error) {
            console.error(`清除数据失败 (${key}):`, error);
            return false;
        }
    }
    
    /**
     * 获取存储状态信息
     * @returns {Object} 存储状态
     */
    getStorageStatus() {
        return {
            lorebookAvailable: this.isLorebookAvailable,
            dataMapping: Object.keys(this.DATA_MAPPING),
            backupStorageKey: this.BACKUP_STORAGE_KEY
        };
    }
    
    /**
     * 重新连接存储系统
     * @returns {Promise<boolean>} 是否成功
     */
    async reconnect() {
        console.log('重新连接存储系统...');
        return await this.checkLorebookAvailability();
    }
}

// 导出类
window.DataStorageAdapter = DataStorageAdapter;