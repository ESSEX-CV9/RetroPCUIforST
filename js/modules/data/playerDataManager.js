// js/modules/data/playerDataManager.js
/**
 * 玩家数据管理器
 * 负责管理玩家的属性、技能、身份等数据
 */
class PlayerDataManager {
    constructor(serviceLocator) {
        this.serviceLocator = serviceLocator;
        this.eventBus = serviceLocator.get('eventBus');
        this.storageAdapter = null; // 将在DataService中设置
        
        // 默认玩家属性
        this.DEFAULT_STATS = {
            "调查能力": 50,
            "伪装技巧": 50,
            "情报分析": 50,
            "社交能力": 50,
            "技术能力": 50
        };
        
        // 默认技能数据
        this.DEFAULT_SKILLS = {
            "轻武器使用": { level: "入门", experience: 0, maxExp: 100 },
            "载具驾驶": { level: "入门", experience: 0, maxExp: 100 },
            "飞机驾驶": { level: "入门", experience: 0, maxExp: 100 },
            "格斗": { level: "入门", experience: 0, maxExp: 100 },
            "潜行": { level: "入门", experience: 0, maxExp: 100 },
            "跟踪": { level: "入门", experience: 0, maxExp: 100 },
            "反跟踪": { level: "入门", experience: 0, maxExp: 100 },
            "IT能力": { level: "入门", experience: 0, maxExp: 100 },
            "解锁能力": { level: "入门", experience: 0, maxExp: 100 },
            "重武器使用": { level: "入门", experience: 0, maxExp: 100 }
        };
        
        // 默认身份数据
        this.DEFAULT_IDENTITIES = {
            real: null,
            cover: null,
            disguise: null
        };
        
        // 默认伪装能力
        this.DEFAULT_DISGUISE_ABILITIES = [];
        
        // 技能等级配置
        this.SKILL_LEVELS = [
            { level: "入门", expRequired: 100 },
            { level: "上手", expRequired: 200 },
            { level: "精通", expRequired: 400 },
            { level: "大师", expRequired: null }
        ];
        
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
     * 初始化玩家数据管理器
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        
        try {
            // 确保玩家数据存在
            await this.ensurePlayerDataExists();
            
            this.initialized = true;
            console.log('玩家数据管理器初始化完成');
            
            // 发布初始化完成事件
            this.eventBus.emit('playerDataManagerInitialized');
        } catch (error) {
            console.error('玩家数据管理器初始化失败:', error);
            throw error;
        }
    }
    
    /**
     * 重置玩家数据到默认值
     * @returns {Promise<boolean>} 是否成功
     */
    async resetToDefaults() {
        try {
            await this.ensurePlayerDataExists();
            return true;
        } catch (error) {
            console.error('重置玩家数据失败:', error);
            return false;
        }
    }
    
    /**
     * 确保玩家数据存在，如不存在则创建默认数据
     * @private
     */
    async ensurePlayerDataExists() {
        // 使用特殊的标记值来检测数据是否真的不存在
        const DATA_NOT_EXISTS = Symbol('DATA_NOT_EXISTS');
        
        // 检查并初始化各项数据
        const stats = await this.storageAdapter.loadPersistentData('player_stats', DATA_NOT_EXISTS);
        if (stats === DATA_NOT_EXISTS) {
            await this.storageAdapter.savePersistentData('player_stats', this.DEFAULT_STATS);
            console.log('创建默认玩家属性');
        }
        
        const skills = await this.storageAdapter.loadPersistentData('player_skills', DATA_NOT_EXISTS);
        if (skills === DATA_NOT_EXISTS) {
            await this.storageAdapter.savePersistentData('player_skills', this.DEFAULT_SKILLS);
            console.log('创建默认玩家技能');
        }
        
        const identities = await this.storageAdapter.loadPersistentData('player_identities', DATA_NOT_EXISTS);
        if (identities === DATA_NOT_EXISTS) {
            await this.storageAdapter.savePersistentData('player_identities', this.DEFAULT_IDENTITIES);
            console.log('创建默认玩家身份');
        }
        
        const disguiseAbilities = await this.storageAdapter.loadPersistentData('player_disguise_abilities', DATA_NOT_EXISTS);
        if (disguiseAbilities === DATA_NOT_EXISTS) {
            await this.storageAdapter.savePersistentData('player_disguise_abilities', this.DEFAULT_DISGUISE_ABILITIES);
            console.log('创建默认伪装能力');
        }
    }
    
    // ==================== 玩家属性相关方法 ====================
    
    /**
     * 获取玩家属性
     * @returns {Promise<Object>} 玩家属性对象
     */
    async getStats() {
        return await this.storageAdapter.loadPersistentData('player_stats', this.DEFAULT_STATS);
    }
    
    /**
     * 设置玩家属性
     * @param {Object} stats - 属性对象
     * @returns {Promise<boolean>} 是否成功
     */
    async setStats(stats) {
        try {
            await this.storageAdapter.savePersistentData('player_stats', stats);
            this.eventBus.emit('playerStatsChanged', stats);
            return true;
        } catch (error) {
            console.error('设置玩家属性失败:', error);
            return false;
        }
    }
    
    /**
     * 更新单个属性
     * @param {string} statName - 属性名称
     * @param {number} value - 属性值
     * @returns {Promise<boolean>} 是否成功
     */
    async updateStat(statName, value) {
        try {
            const stats = await this.getStats();
            stats[statName] = value;
            return await this.setStats(stats);
        } catch (error) {
            console.error(`更新属性 ${statName} 失败:`, error);
            return false;
        }
    }
    
    /**
     * 增加属性值
     * @param {string} statName - 属性名称
     * @param {number} increment - 增加的值
     * @returns {Promise<boolean>} 是否成功
     */
    async addStatValue(statName, increment) {
        try {
            const stats = await this.getStats();
            if (stats[statName] !== undefined) {
                stats[statName] = Math.max(0, Math.min(100, stats[statName] + increment));
                await this.setStats(stats);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`增加属性值 ${statName} 失败:`, error);
            return false;
        }
    }
    
    // ==================== 技能相关方法 ====================
    
    /**
     * 获取玩家技能
     * @returns {Promise<Object>} 技能对象
     */
    async getSkills() {
        return await this.storageAdapter.loadPersistentData('player_skills', this.DEFAULT_SKILLS);
    }
    
    /**
     * 设置玩家技能
     * @param {Object} skills - 技能对象
     * @returns {Promise<boolean>} 是否成功
     */
    async setSkills(skills) {
        try {
            await this.storageAdapter.savePersistentData('player_skills', skills);
            this.eventBus.emit('playerSkillsChanged', skills);
            return true;
        } catch (error) {
            console.error('设置玩家技能失败:', error);
            return false;
        }
    }
    
    /**
     * 增加技能经验
     * @param {string} skillName - 技能名称
     * @param {number} exp - 经验值
     * @returns {Promise<boolean>} 是否成功
     */
    async addSkillExp(skillName, exp) {
        try {
            const skills = await this.getSkills();
            
            if (!skills[skillName]) {
                console.warn(`技能 ${skillName} 不存在`);
                return false;
            }
            
            const skill = skills[skillName];
            skill.experience += exp;
            
            // 检查升级
            const upgradeResult = this.checkSkillUpgrade(skill);
            if (upgradeResult.upgraded) {
                skill.level = upgradeResult.newLevel;
                skill.maxExp = upgradeResult.newMaxExp;
                
                // 发布技能升级事件
                this.eventBus.emit('skillUpgraded', {
                    skillName,
                    newLevel: skill.level,
                    experience: skill.experience,
                    expGained: exp
                });
                
                console.log(`技能 ${skillName} 升级到 ${skill.level}`);
            }
            
            await this.setSkills(skills);
            
            // 发布经验获得事件
            this.eventBus.emit('skillExpGained', {
                skillName,
                expGained: exp,
                currentExp: skill.experience,
                currentLevel: skill.level
            });
            
            return true;
        } catch (error) {
            console.error(`增加技能经验失败 (${skillName}):`, error);
            return false;
        }
    }
    
    /**
     * 检查技能升级
     * @private
     * @param {Object} skill - 技能对象
     * @returns {Object} 升级结果
     */
    checkSkillUpgrade(skill) {
        for (let i = 0; i < this.SKILL_LEVELS.length; i++) {
            const levelInfo = this.SKILL_LEVELS[i];
            if (skill.level === levelInfo.level && levelInfo.expRequired) {
                if (skill.experience >= levelInfo.expRequired && i < this.SKILL_LEVELS.length - 1) {
                    return {
                        upgraded: true,
                        newLevel: this.SKILL_LEVELS[i + 1].level,
                        newMaxExp: this.SKILL_LEVELS[i + 1].expRequired
                    };
                }
            }
        }
        
        return { upgraded: false };
    }
    
    /**
     * 获取技能等级信息
     * @param {string} skillName - 技能名称
     * @returns {Promise<Object|null>} 技能信息
     */
    async getSkillInfo(skillName) {
        try {
            const skills = await this.getSkills();
            return skills[skillName] || null;
        } catch (error) {
            console.error(`获取技能信息失败 (${skillName}):`, error);
            return null;
        }
    }
    
    // ==================== 身份相关方法 ====================
    
    /**
     * 获取玩家身份
     * @returns {Promise<Object>} 身份对象
     */
    async getIdentities() {
        return await this.storageAdapter.loadPersistentData('player_identities', this.DEFAULT_IDENTITIES);
    }
    
    /**
     * 设置特定类型的身份
     * @param {string} type - 身份类型 (real/cover/disguise)
     * @param {Object} identityData - 身份数据
     * @returns {Promise<boolean>} 是否成功
     */
    async setIdentity(type, identityData) {
        try {
            const identities = await this.getIdentities();
            identities[type] = identityData;
            
            await this.storageAdapter.savePersistentData('player_identities', identities);
            
            this.eventBus.emit('playerIdentityChanged', { 
                type, 
                identityData,
                allIdentities: identities
            });
            
            console.log(`${type} 身份已更新`);
            return true;
        } catch (error) {
            console.error(`设置 ${type} 身份失败:`, error);
            return false;
        }
    }
    
    /**
     * 获取特定类型的身份
     * @param {string} type - 身份类型 (real/cover/disguise)
     * @returns {Promise<Object|null>} 身份数据
     */
    async getIdentity(type) {
        try {
            const identities = await this.getIdentities();
            return identities[type] || null;
        } catch (error) {
            console.error(`获取 ${type} 身份失败:`, error);
            return null;
        }
    }
    
    /**
     * 清除伪装身份
     * @returns {Promise<boolean>} 是否成功
     */
    async clearDisguise() {
        try {
            const result = await this.setIdentity('disguise', null);
            if (result) {
                this.eventBus.emit('disguiseCleared');
                console.log('伪装身份已清除');
            }
            return result;
        } catch (error) {
            console.error('清除伪装身份失败:', error);
            return false;
        }
    }
    
    // ==================== 伪装能力相关方法 ====================
    
    /**
     * 获取伪装能力
     * @returns {Promise<Array>} 伪装能力数组
     */
    async getDisguiseAbilities() {
        return await this.storageAdapter.loadPersistentData('player_disguise_abilities', this.DEFAULT_DISGUISE_ABILITIES);
    }
    
    /**
     * 设置伪装能力
     * @param {Array} abilities - 伪装能力数组
     * @returns {Promise<boolean>} 是否成功
     */
    async setDisguiseAbilities(abilities) {
        try {
            await this.storageAdapter.savePersistentData('player_disguise_abilities', abilities);
            this.eventBus.emit('playerDisguiseAbilitiesChanged', abilities);
            return true;
        } catch (error) {
            console.error('设置伪装能力失败:', error);
            return false;
        }
    }
    
    /**
     * 添加伪装能力
     * @param {string} abilityId - 能力ID
     * @returns {Promise<boolean>} 是否成功
     */
    async addDisguiseAbility(abilityId) {
        try {
            const abilities = await this.getDisguiseAbilities();
            if (!abilities.includes(abilityId)) {
                abilities.push(abilityId);
                await this.setDisguiseAbilities(abilities);
                
                this.eventBus.emit('disguiseAbilityAdded', { abilityId, abilities });
                console.log(`伪装能力 ${abilityId} 已添加`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`添加伪装能力失败 (${abilityId}):`, error);
            return false;
        }
    }
    
    /**
     * 移除伪装能力
     * @param {string} abilityId - 能力ID
     * @returns {Promise<boolean>} 是否成功
     */
    async removeDisguiseAbility(abilityId) {
        try {
            const abilities = await this.getDisguiseAbilities();
            const index = abilities.indexOf(abilityId);
            if (index !== -1) {
                abilities.splice(index, 1);
                await this.setDisguiseAbilities(abilities);
                
                this.eventBus.emit('disguiseAbilityRemoved', { abilityId, abilities });
                console.log(`伪装能力 ${abilityId} 已移除`);
                return true;
            }
            return false;
        } catch (error) {
            console.error(`移除伪装能力失败 (${abilityId}):`, error);
            return false;
        }
    }
    
    /**
     * 切换伪装能力状态
     * @param {string} abilityId - 能力ID
     * @returns {Promise<boolean>} 是否成功
     */
    async toggleDisguiseAbility(abilityId) {
        try {
            const abilities = await this.getDisguiseAbilities();
            const hasAbility = abilities.includes(abilityId);
            
            if (hasAbility) {
                return await this.removeDisguiseAbility(abilityId);
            } else {
                return await this.addDisguiseAbility(abilityId);
            }
        } catch (error) {
            console.error(`切换伪装能力失败 (${abilityId}):`, error);
            return false;
        }
    }
    
    // ==================== 综合数据方法 ====================
    
    /**
     * 获取完整的玩家数据
     * @returns {Promise<Object>} 完整的玩家数据
     */
    async getCompletePlayerData() {
        try {
            const [stats, skills, identities, disguiseAbilities] = await Promise.all([
                this.getStats(),
                this.getSkills(),
                this.getIdentities(),
                this.getDisguiseAbilities()
            ]);
            
            return {
                stats,
                skills,
                identities,
                disguiseAbilities,
                metadata: {
                    lastUpdated: new Date().toISOString(),
                    version: "1.0"
                }
            };
        } catch (error) {
            console.error('获取完整玩家数据失败:', error);
            return null;
        }
    }
    
    /**
     * 验证数据完整性
     * @returns {Promise<Object>} 验证结果
     */
    async validatePlayerData() {
        try {
            const validation = {
                stats: false,
                skills: false,
                identities: false,
                disguiseAbilities: false,
                errors: []
            };
            
            // 验证属性
            const stats = await this.getStats();
            validation.stats = stats && Object.keys(stats).length > 0;
            if (!validation.stats) {
                validation.errors.push('玩家属性数据缺失或为空');
            }
            
            // 验证技能
            const skills = await this.getSkills();
            validation.skills = skills && Object.keys(skills).length > 0;
            if (!validation.skills) {
                validation.errors.push('玩家技能数据缺失或为空');
            }
            
            // 验证身份
            const identities = await this.getIdentities();
            validation.identities = identities && typeof identities === 'object';
            if (!validation.identities) {
                validation.errors.push('玩家身份数据缺失或格式错误');
            }
            
            // 验证伪装能力
            const disguiseAbilities = await this.getDisguiseAbilities();
            validation.disguiseAbilities = Array.isArray(disguiseAbilities);
            if (!validation.disguiseAbilities) {
                validation.errors.push('伪装能力数据格式错误');
            }
            
            validation.isValid = validation.stats && validation.skills && 
                               validation.identities && validation.disguiseAbilities;
            
            return validation;
        } catch (error) {
            console.error('验证玩家数据失败:', error);
            return {
                isValid: false,
                errors: ['数据验证过程中发生错误: ' + error.message]
            };
        }
    }
}

// 导出类
window.PlayerDataManager = PlayerDataManager;