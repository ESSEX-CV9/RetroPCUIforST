// js/modules/data/worldDataManager.js
/**
 * 世界数据管理器
 * 负责管理地图状态、地点解锁状态、NPC关系等世界相关数据
 */
class WorldDataManager {
    constructor(serviceLocator) {
        this.serviceLocator = serviceLocator;
        this.eventBus = serviceLocator.get('eventBus');
        this.storageAdapter = null; // 将在DataService中设置
        
        // 默认地点状态结构
        this.DEFAULT_LOCATION_STATE = {
            isVisible: true,
            publicAccess: false,
            covertAccess: false,
            knowsHidden: false,
            disguiseRevealed: false
        };
        
        // 默认NPC关系结构
        this.DEFAULT_NPC_RELATION = {
            trust: 50,      // 信任度 (0-100)
            suspicion: 0,   // 怀疑度 (0-100)
            relationship: "neutral", // 关系状态
            lastMet: null,  // 最后见面时间
            interactions: 0, // 互动次数
            notes: ""       // 备注
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
     * 初始化世界数据管理器
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        
        try {
            // 确保世界数据存在
            await this.ensureWorldDataExists();
            
            this.initialized = true;
            console.log('世界数据管理器初始化完成');
            
            // 发布初始化完成事件
            this.eventBus.emit('worldDataManagerInitialized');
        } catch (error) {
            console.error('世界数据管理器初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 确保世界数据存在，如不存在则创建默认数据
     * @private
     */
    async ensureWorldDataExists() {
        // 使用特殊的标记值来检测数据是否真的不存在
        const DATA_NOT_EXISTS = Symbol('DATA_NOT_EXISTS');
        
        // 检查并初始化地点数据
        const locations = await this.storageAdapter.loadPersistentData('world_locations', DATA_NOT_EXISTS);
        if (locations === DATA_NOT_EXISTS) {
            const defaultLocations = this.createDefaultLocationStates();
            await this.storageAdapter.savePersistentData('world_locations', defaultLocations);
            console.log('创建默认地点状态数据，初始化了', Object.keys(defaultLocations).length, '个地点');
        }
        
        // 检查并初始化NPC数据
        const npcs = await this.storageAdapter.loadPersistentData('world_npcs', DATA_NOT_EXISTS);
        if (npcs === DATA_NOT_EXISTS) {
            await this.storageAdapter.savePersistentData('world_npcs', {});
            console.log('创建默认NPC关系数据');
        }
    }
    
    /**
     * 创建默认的地点状态数据
     * 基于MapModel中定义的地点列表
     * @returns {Object} 默认地点状态对象
     */
    createDefaultLocationStates() {
        // 从MapModel获取默认地点定义
        const defaultLocationDefinitions = {
            "富兰克林公园": {
                publicAccess: true,
                covertAccess: true,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            },
            "国家安全局总部": {
                publicAccess: false,
                covertAccess: false,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            },
            "中央情报局总部": {
                publicAccess: false,
                covertAccess: false,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            },
            "NSA DC办公室": {
                publicAccess: false,
                covertAccess: false,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            },
            "苏联大使馆": {
                publicAccess: false,
                covertAccess: false,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            },
            "法国大使馆": {
                publicAccess: false,
                covertAccess: false,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            },
            "英国大使馆": {
                publicAccess: false,
                covertAccess: false,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            },
            "地下交易点": {
                publicAccess: false,
                covertAccess: false,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            },
            "柯楠牙医诊所": {
                publicAccess: true,
                covertAccess: false,
                isVisible: false,
                knowsHidden: false,
                disguiseRevealed: false
            },
            "老鹰书店": {
                publicAccess: true,
                covertAccess: false,
                isVisible: true,
                knowsHidden: true,
                disguiseRevealed: true
            },
            "国会大厦": {
                publicAccess: true,
                covertAccess: false,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            },
            "国家档案馆": {
                publicAccess: true,
                covertAccess: false,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            },
            "华盛顿纪念碑": {
                publicAccess: true,
                covertAccess: false,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            },
            "红宝石酒吧": {
                publicAccess: true,
                covertAccess: false,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            },
            "林肯纪念堂": {
                publicAccess: true,
                covertAccess: true,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            },
            "全视眼照相馆": {
                publicAccess: true,
                covertAccess: false,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: false
            },
            "白宫": {
                publicAccess: false,
                covertAccess: false,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            },
            "阿灵顿国家公墓": {
                publicAccess: true,
                covertAccess: true,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            },
            "五角大楼": {
                publicAccess: false,
                covertAccess: false,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            },
            "华盛顿国家机场": {
                publicAccess: true,
                covertAccess: false,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            },
            "陆军海军乡村俱乐部": {
                publicAccess: false,
                covertAccess: false,
                isVisible: true,
                knowsHidden: false,
                disguiseRevealed: null
            }
        };
        
        const defaultLocations = {};
        
        // 为每个地点创建完整的状态对象
        for (const [locationName, locationProps] of Object.entries(defaultLocationDefinitions)) {
            defaultLocations[locationName] = {
                ...this.DEFAULT_LOCATION_STATE,
                ...locationProps
            };
        }
        
        return defaultLocations;
    }
    
    // ==================== 地点相关方法 ====================
    
    /**
     * 获取所有地点状态
     * @returns {Promise<Object>} 地点状态对象
     */
    async getLocationStates() {
        return await this.storageAdapter.loadPersistentData('world_locations', {});
    }
    
    /**
     * 获取特定地点的状态
     * @param {string} locationName - 地点名称
     * @returns {Promise<Object>} 地点状态
     */
    async getLocationState(locationName) {
        try {
            const locations = await this.getLocationStates();
            return locations[locationName] || { ...this.DEFAULT_LOCATION_STATE };
        } catch (error) {
            console.error(`获取地点状态失败 (${locationName}):`, error);
            return { ...this.DEFAULT_LOCATION_STATE };
        }
    }
    
    /**
     * 设置地点的特定属性
     * @param {string} locationName - 地点名称
     * @param {string} property - 属性名称
     * @param {*} value - 属性值
     * @returns {Promise<boolean>} 是否成功
     */
    async setLocationState(locationName, property, value) {
        try {
            const locations = await this.getLocationStates();
            
            if (!locations[locationName]) {
                locations[locationName] = { ...this.DEFAULT_LOCATION_STATE };
            }
            
            const oldValue = locations[locationName][property];
            locations[locationName][property] = value;
            
            await this.storageAdapter.savePersistentData('world_locations', locations);
            
            // 发布地点状态变更事件
            this.eventBus.emit('worldLocationStateChanged', {
                locationName,
                property,
                oldValue,
                newValue: value,
                locationState: locations[locationName]
            });
            
            console.log(`地点 ${locationName} 的 ${property} 已更新为 ${value}`);
            return true;
        } catch (error) {
            console.error(`设置地点状态失败 (${locationName}.${property}):`, error);
            return false;
        }
    }
    
    /**
     * 批量设置地点状态
     * @param {string} locationName - 地点名称
     * @param {Object} stateData - 状态数据对象
     * @returns {Promise<boolean>} 是否成功
     */
    async setLocationStates(locationName, stateData) {
        try {
            const locations = await this.getLocationStates();
            
            if (!locations[locationName]) {
                locations[locationName] = { ...this.DEFAULT_LOCATION_STATE };
            }
            
            const oldState = { ...locations[locationName] };
            Object.assign(locations[locationName], stateData);
            
            await this.storageAdapter.savePersistentData('world_locations', locations);
            
            // 发布地点状态批量变更事件
            this.eventBus.emit('worldLocationStatesChanged', {
                locationName,
                oldState,
                newState: locations[locationName],
                changedProperties: Object.keys(stateData)
            });
            
            console.log(`地点 ${locationName} 状态已批量更新`);
            return true;
        } catch (error) {
            console.error(`批量设置地点状态失败 (${locationName}):`, error);
            return false;
        }
    }
    
    /**
     * 设置地点可见性
     * @param {string} locationName - 地点名称
     * @param {boolean} isVisible - 是否可见
     * @returns {Promise<boolean>} 是否成功
     */
    async setLocationVisibility(locationName, isVisible) {
        return await this.setLocationState(locationName, 'isVisible', isVisible);
    }
    
    /**
     * 设置地点公开访问权限
     * @param {string} locationName - 地点名称
     * @param {boolean} hasAccess - 是否有访问权限
     * @returns {Promise<boolean>} 是否成功
     */
    async setLocationPublicAccess(locationName, hasAccess) {
        return await this.setLocationState(locationName, 'publicAccess', hasAccess);
    }
    
    /**
     * 设置地点秘密访问权限
     * @param {string} locationName - 地点名称
     * @param {boolean} hasAccess - 是否有访问权限
     * @returns {Promise<boolean>} 是否成功
     */
    async setLocationCovertAccess(locationName, hasAccess) {
        return await this.setLocationState(locationName, 'covertAccess', hasAccess);
    }
    
    /**
     * 解锁地点隐藏信息
     * @param {string} locationName - 地点名称
     * @param {boolean} knows - 是否知道隐藏信息
     * @returns {Promise<boolean>} 是否成功
     */
    async setLocationHiddenKnowledge(locationName, knows) {
        const result = await this.setLocationState(locationName, 'knowsHidden', knows);
        if (result && knows) {
            this.eventBus.emit('locationHiddenInfoUnlocked', { locationName });
        }
        return result;
    }
    
    /**
     * 揭露地点伪装
     * @param {string} locationName - 地点名称
     * @param {boolean} revealed - 是否已揭露
     * @returns {Promise<boolean>} 是否成功
     */
    async setLocationDisguiseRevealed(locationName, revealed) {
        const result = await this.setLocationState(locationName, 'disguiseRevealed', revealed);
        if (result && revealed) {
            this.eventBus.emit('locationDisguiseRevealed', { locationName });
        }
        return result;
    }
    
    /**
     * 检查地点是否有公开访问权限
     * @param {string} locationName - 地点名称
     * @returns {Promise<boolean>} 是否有权限
     */
    async hasLocationPublicAccess(locationName) {
        const state = await this.getLocationState(locationName);
        return state.publicAccess;
    }
    
    /**
     * 检查地点是否有秘密访问权限
     * @param {string} locationName - 地点名称
     * @returns {Promise<boolean>} 是否有权限
     */
    async hasLocationCovertAccess(locationName) {
        const state = await this.getLocationState(locationName);
        return state.covertAccess;
    }
    
    /**
     * 检查是否知道地点隐藏信息
     * @param {string} locationName - 地点名称
     * @returns {Promise<boolean>} 是否知道
     */
    async knowsLocationHidden(locationName) {
        const state = await this.getLocationState(locationName);
        return state.knowsHidden;
    }
    
    /**
     * 检查地点伪装是否已揭露
     * @param {string} locationName - 地点名称
     * @returns {Promise<boolean>} 是否已揭露
     */
    async isLocationDisguiseRevealed(locationName) {
        const state = await this.getLocationState(locationName);
        return state.disguiseRevealed;
    }
    
    // ==================== NPC关系相关方法 ====================
    
    /**
     * 获取所有NPC关系
     * @returns {Promise<Object>} NPC关系对象
     */
    async getNpcRelations() {
        return await this.storageAdapter.loadPersistentData('world_npcs', {});
    }
    
    /**
     * 获取特定NPC的关系数据
     * @param {string} npcId - NPC ID
     * @returns {Promise<Object>} NPC关系数据
     */
    async getNpcRelation(npcId) {
        try {
            const npcs = await this.getNpcRelations();
            return npcs[npcId] || { ...this.DEFAULT_NPC_RELATION };
        } catch (error) {
            console.error(`获取NPC关系失败 (${npcId}):`, error);
            return { ...this.DEFAULT_NPC_RELATION };
        }
    }
    
    /**
     * 设置NPC关系数据
     * @param {string} npcId - NPC ID
     * @param {Object} relationData - 关系数据
     * @returns {Promise<boolean>} 是否成功
     */
    async setNpcRelation(npcId, relationData) {
        try {
            const npcs = await this.getNpcRelations();
            
            if (!npcs[npcId]) {
                npcs[npcId] = { ...this.DEFAULT_NPC_RELATION };
            }
            
            const oldRelation = { ...npcs[npcId] };
            Object.assign(npcs[npcId], relationData);
            
            await this.storageAdapter.savePersistentData('world_npcs', npcs);
            
            // 发布NPC关系变更事件
            this.eventBus.emit('worldNpcRelationChanged', {
                npcId,
                oldRelation,
                newRelation: npcs[npcId]
            });
            
            console.log(`NPC ${npcId} 关系数据已更新`);
            return true;
        } catch (error) {
            console.error(`设置NPC关系失败 (${npcId}):`, error);
            return false;
        }
    }
    
    /**
     * 更新NPC信任度
     * @param {string} npcId - NPC ID
     * @param {number} trustChange - 信任度变化
     * @returns {Promise<boolean>} 是否成功
     */
    async updateNpcTrust(npcId, trustChange) {
        try {
            const relation = await this.getNpcRelation(npcId);
            relation.trust = Math.max(0, Math.min(100, relation.trust + trustChange));
            
            const result = await this.setNpcRelation(npcId, relation);
            if (result) {
                this.eventBus.emit('npcTrustChanged', {
                    npcId,
                    trustChange,
                    newTrust: relation.trust
                });
            }
            return result;
        } catch (error) {
            console.error(`更新NPC信任度失败 (${npcId}):`, error);
            return false;
        }
    }
    
    /**
     * 更新NPC怀疑度
     * @param {string} npcId - NPC ID
     * @param {number} suspicionChange - 怀疑度变化
     * @returns {Promise<boolean>} 是否成功
     */
    async updateNpcSuspicion(npcId, suspicionChange) {
        try {
            const relation = await this.getNpcRelation(npcId);
            relation.suspicion = Math.max(0, Math.min(100, relation.suspicion + suspicionChange));
            
            const result = await this.setNpcRelation(npcId, relation);
            if (result) {
                this.eventBus.emit('npcSuspicionChanged', {
                    npcId,
                    suspicionChange,
                    newSuspicion: relation.suspicion
                });
            }
            return result;
        } catch (error) {
            console.error(`更新NPC怀疑度失败 (${npcId}):`, error);
            return false;
        }
    }
    
    /**
     * 记录与NPC的互动
     * @param {string} npcId - NPC ID
     * @param {Object} interactionData - 互动数据
     * @returns {Promise<boolean>} 是否成功
     */
    async recordNpcInteraction(npcId, interactionData = {}) {
        try {
            const relation = await this.getNpcRelation(npcId);
            relation.interactions += 1;
            relation.lastMet = new Date().toISOString();
            
            // 应用互动数据
            if (interactionData.trustChange) {
                relation.trust = Math.max(0, Math.min(100, relation.trust + interactionData.trustChange));
            }
            if (interactionData.suspicionChange) {
                relation.suspicion = Math.max(0, Math.min(100, relation.suspicion + interactionData.suspicionChange));
            }
            if (interactionData.relationship) {
                relation.relationship = interactionData.relationship;
            }
            if (interactionData.notes) {
                relation.notes = interactionData.notes;
            }
            
            const result = await this.setNpcRelation(npcId, relation);
            if (result) {
                this.eventBus.emit('npcInteractionRecorded', {
                    npcId,
                    interactionData,
                    newRelation: relation
                });
            }
            return result;
        } catch (error) {
            console.error(`记录NPC互动失败 (${npcId}):`, error);
            return false;
        }
    }
    
    /**
     * 设置NPC关系状态
     * @param {string} npcId - NPC ID
     * @param {string} relationship - 关系状态
     * @returns {Promise<boolean>} 是否成功
     */
    async setNpcRelationship(npcId, relationship) {
        try {
            const relation = await this.getNpcRelation(npcId);
            const oldRelationship = relation.relationship;
            relation.relationship = relationship;
            
            const result = await this.setNpcRelation(npcId, relation);
            if (result) {
                this.eventBus.emit('npcRelationshipChanged', {
                    npcId,
                    oldRelationship,
                    newRelationship: relationship
                });
            }
            return result;
        } catch (error) {
            console.error(`设置NPC关系状态失败 (${npcId}):`, error);
            return false;
        }
    }
    
    // ==================== 综合数据方法 ====================
    
    /**
     * 获取完整的世界数据
     * @returns {Promise<Object>} 完整的世界数据
     */
    async getCompleteWorldData() {
        try {
            const [locations, npcs] = await Promise.all([
                this.getLocationStates(),
                this.getNpcRelations()
            ]);
            
            return {
                locations,
                npcs,
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    version: "1.0"
                }
            };
        } catch (error) {
            console.error('获取完整世界数据失败:', error);
            return null;
        }
    }
    
    /**
     * 验证世界数据完整性
     * @returns {Promise<Object>} 验证结果
     */
    async validateWorldData() {
        try {
            const validation = {
                locations: false,
                npcs: false,
                errors: []
            };
            
            // 验证地点数据
            const locations = await this.getLocationStates();
            validation.locations = locations && typeof locations === 'object';
            if (!validation.locations) {
                validation.errors.push('地点状态数据缺失或格式错误');
            }
            
            // 验证NPC数据
            const npcs = await this.getNpcRelations();
            validation.npcs = npcs && typeof npcs === 'object';
            if (!validation.npcs) {
                validation.errors.push('NPC关系数据缺失或格式错误');
            }
            
            validation.isValid = validation.locations && validation.npcs;
            
            return validation;
        } catch (error) {
            console.error('验证世界数据失败:', error);
            return {
                isValid: false,
                errors: ['数据验证过程中发生错误: ' + error.message]
            };
        }
    }
    
    /**
     * 重置世界数据
     * @param {Object} options - 重置选项
     * @returns {Promise<boolean>} 是否成功
     */
    async resetWorldData(options = {}) {
        try {
            const { 
                resetLocations = false, 
                resetNpcs = false,
                keepVisible = true 
            } = options;
            
            if (resetLocations) {
                const currentLocations = await this.getLocationStates();
                const newLocations = {};
                
                if (keepVisible) {
                    // 保留可见性设置，重置其他状态
                    for (const [name, state] of Object.entries(currentLocations)) {
                        newLocations[name] = {
                            ...this.DEFAULT_LOCATION_STATE,
                            isVisible: state.isVisible
                        };
                    }
                } else {
                    // 完全重置
                    // newLocations 保持为空对象
                }
                
                await this.storageAdapter.savePersistentData('world_locations', newLocations);
                this.eventBus.emit('worldLocationsReset', { keepVisible });
            }
            
            if (resetNpcs) {
                await this.storageAdapter.savePersistentData('world_npcs', {});
                this.eventBus.emit('worldNpcsReset');
            }
            
            console.log('世界数据重置完成');
            return true;
        } catch (error) {
            console.error('重置世界数据失败:', error);
            return false;
        }
    }
}

// 导出类
window.WorldDataManager = WorldDataManager;