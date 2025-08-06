// js/modules/data/dataTestCommand.js
/**
 * 数据管理器测试命令
 * 用于测试和演示数据管理器功能
 */
class DataTestCommand {
    constructor(serviceLocator) {
        this.serviceLocator = serviceLocator;
        this.dataService = serviceLocator.get('data');
        this.eventBus = serviceLocator.get('eventBus');
    }
    
    /**
     * 注册测试命令
     */
    registerCommands() {
        const commandService = this.serviceLocator.get('command');
        
        if (commandService && commandService.registerCommand) {
            // 注册数据管理器测试命令
            commandService.registerCommand('datatest', this.handleDataTestCommand.bind(this), {
                description: '数据管理器功能测试',
                usage: 'datatest [player|world|state|save|validate]',
                category: 'debug',
                examples: ['datatest help', 'datatest player', 'datatest world']
            });
            
            // 注册数据状态查看命令
            commandService.registerCommand('datastatus', this.handleDataStatusCommand.bind(this), {
                description: '查看数据管理器状态',
                usage: 'datastatus',
                category: 'debug'
            });
            
            console.log('数据管理器测试命令已注册');
        }
    }
    
    /**
     * 处理datatest命令
     * @param {string} args - 命令参数
     * @param {object} context - 命令执行上下文
     * @returns {object} 命令执行结果
     */
    async handleDataTestCommand(args, context) {
        try {
            const parts = args.trim().split(' ');
            const subcommand = parts[0] || 'help';
            const subArgs = parts.slice(1);
            
            const result = await this.executeTestCommand(subcommand, subArgs);
            return {
                success: true,
                message: result
            };
        } catch (error) {
            console.error('数据测试命令执行失败:', error);
            return {
                success: false,
                message: `命令执行失败: ${error.message}`
            };
        }
    }
    
    /**
     * 处理datastatus命令
     * @param {string} args - 命令参数
     * @param {object} context - 命令执行上下文
     * @returns {object} 命令执行结果
     */
    async handleDataStatusCommand(args, context) {
        console.log('datastatus命令被调用');
        try {
            if (!this.dataService) {
                console.error('DataService不可用');
                return {
                    success: false,
                    message: '数据服务不可用，请检查初始化状态'
                };
            }
            
            console.log('开始获取数据状态...');
            const result = await this.showDataStatus();
            console.log('数据状态获取完成，结果长度:', result.length);
            
            return {
                success: true,
                message: result
            };
        } catch (error) {
            console.error('数据状态查看失败:', error);
            return {
                success: false,
                message: `状态查看失败: ${error.message}`
            };
        }
    }
    
    /**
     * 执行测试命令
     */
    async executeTestCommand(subcommand, args) {
        try {
            switch (subcommand) {
                case 'player':
                    return await this.testPlayerData(args);
                case 'world':
                    return await this.testWorldData(args);
                case 'state':
                    return await this.testGameState(args);
                case 'save':
                    return await this.testSaveData();
                case 'validate':
                    return await this.testValidateData();
                case 'reset':
                    return await this.testResetData(args);
                default:
                    return this.showTestHelp();
            }
        } catch (error) {
            return `命令执行失败: ${error.message}`;
        }
    }
    
    /**
     * 测试玩家数据功能
     */
    async testPlayerData(args) {
        const action = args[0] || 'show';
        
        switch (action) {
            case 'show':
                const stats = await this.dataService.player.getStats();
                const skills = await this.dataService.player.getSkills();
                return `玩家属性: ${JSON.stringify(stats, null, 2)}\n\n技能前三项: ${JSON.stringify(Object.fromEntries(Object.entries(skills).slice(0, 3)), null, 2)}`;
                
            case 'addexp':
                const skillName = args[1] || '轻武器使用';
                const exp = parseInt(args[2]) || 25;
                const result = await this.dataService.player.addSkillExp(skillName, exp);
                return result ? `成功为 ${skillName} 增加 ${exp} 经验` : `增加经验失败`;
                
            case 'setstat':
                const statName = args[1] || '调查能力';
                const value = parseInt(args[2]) || 75;
                const success = await this.dataService.player.updateStat(statName, value);
                return success ? `成功设置 ${statName} 为 ${value}` : `设置属性失败`;
                
            default:
                return `玩家数据测试用法:\ndatatest player show - 显示玩家数据\ndatatest player addexp [技能名] [经验值] - 增加技能经验\ndatatest player setstat [属性名] [值] - 设置属性值`;
        }
    }
    
    /**
     * 测试世界数据功能
     */
    async testWorldData(args) {
        const action = args[0] || 'show';
        
        switch (action) {
            case 'show':
                const locations = await this.dataService.world.getLocationStates();
                const npcs = await this.dataService.world.getNpcRelations();
                return `地点状态 (前3个): ${JSON.stringify(Object.fromEntries(Object.entries(locations).slice(0, 3)), null, 2)}\n\nNPC关系: ${JSON.stringify(npcs, null, 2)}`;
                
            case 'unlock':
                const locationName = args[1] || '老鹰书店';
                const accessType = args[2] || 'covertAccess';
                const unlockResult = await this.dataService.world.setLocationState(locationName, accessType, true);
                return unlockResult ? `成功解锁 ${locationName} 的 ${accessType}` : `解锁失败`;
                
            case 'npc':
                const npcId = args[1] || 'npc_001';
                const trustChange = parseInt(args[2]) || 10;
                const npcResult = await this.dataService.world.updateNpcTrust(npcId, trustChange);
                return npcResult ? `成功更新 ${npcId} 信任度 +${trustChange}` : `更新NPC信任度失败`;
                
            default:
                return `世界数据测试用法:\ndatatest world show - 显示世界数据\ndatatest world unlock [地点名] [权限类型] - 解锁地点权限\ndatatest world npc [NPC_ID] [信任度变化] - 更新NPC信任度`;
        }
    }
    
    /**
     * 测试游戏状态功能
     */
    async testGameState(args) {
        const action = args[0] || 'show';
        
        switch (action) {
            case 'show':
                const interfaceState = await this.dataService.gameState.getInterfaceState();
                const settings = await this.dataService.gameState.getSystemSettings();
                const session = await this.dataService.gameState.getSessionData();
                return `界面状态: ${JSON.stringify(interfaceState, null, 2)}\n\n系统设置: ${JSON.stringify(settings, null, 2)}\n\n会话数据: ${JSON.stringify(session, null, 2)}`;
                
            case 'interface':
                const newInterface = args[1] || 'map';
                const interfaceResult = await this.dataService.gameState.setCurrentInterface(newInterface);
                return interfaceResult ? `成功切换界面到 ${newInterface}` : `切换界面失败`;
                
            case 'setting':
                const settingKey = args[1] || 'colorMode';
                const settingValue = args[2] || 'amber';
                const settingResult = await this.dataService.gameState.setSetting(settingKey, settingValue);
                return settingResult ? `成功设置 ${settingKey} 为 ${settingValue}` : `设置失败`;
                
            default:
                return `游戏状态测试用法:\ndatatest state show - 显示状态数据\ndatatest state interface [界面名] - 切换界面\ndatatest state setting [设置名] [值] - 更新设置`;
        }
    }
    
    /**
     * 测试保存数据功能
     */
    async testSaveData() {
        const result = await this.dataService.saveAllData();
        if (result.success) {
            return `数据保存成功！\n世界书保存: ${JSON.stringify(result.player, null, 2)}\n本地备份: ${JSON.stringify(result.world, null, 2)}`;
        } else {
            return `数据保存失败: ${result.errors.join(', ')}`;
        }
    }
    
    /**
     * 测试验证数据功能
     */
    async testValidateData() {
        const validation = await this.dataService.validateAllData();
        if (validation.overall) {
            return `数据验证通过 ✓\n玩家数据: ${validation.results.player.isValid ? '✓' : '✗'}\n世界数据: ${validation.results.world.isValid ? '✓' : '✗'}\n游戏状态: ${validation.results.gameState.isValid ? '✓' : '✗'}`;
        } else {
            return `数据验证失败 ✗\n错误: ${validation.errors.join('\n')}`;
        }
    }
    
    /**
     * 测试重置数据功能
     */
    async testResetData(args) {
        const type = args[0] || 'help';
        
        switch (type) {
            case 'player':
                const playerResult = await this.dataService.resetAllData({ resetPlayer: true });
                return playerResult ? '玩家数据重置成功' : '玩家数据重置失败';
                
            case 'world':
                const worldResult = await this.dataService.resetAllData({ resetWorld: true });
                return worldResult ? '世界数据重置成功' : '世界数据重置失败';
                
            case 'state':
                const stateResult = await this.dataService.resetAllData({ resetGameState: true });
                return stateResult ? '游戏状态重置成功' : '游戏状态重置失败';
                
            default:
                return `重置数据用法:\ndatatest reset player - 重置玩家数据\ndatatest reset world - 重置世界数据\ndatatest reset state - 重置游戏状态`;
        }
    }
    
    /**
     * 显示数据管理器状态
     */
    async showDataStatus() {
        const status = this.dataService.getServiceStatus();
        const snapshot = await this.dataService.getGameDataSnapshot();
        
        return `数据管理器状态:
初始化状态: ${status.initialized ? '✓' : '✗'}
存储状态: 
  - 世界书可用: ${status.storage.lorebookAvailable ? '✓' : '✗'}
  - 本地存储可用: ${status.storage.hasLocalStorage ? '✓' : '✗'}
  - 世界书ID: ${status.storage.chatLorebookId || '未连接'}
自动保存: ${status.autoSave.enabled ? '✓' : '✗'} (间隔: ${status.autoSave.interval / 1000}秒)
数据变更:
  - 上次保存: ${status.changes.lastSave || '从未保存'}
  - 待处理变更: ${status.changes.pendingChanges ? '是' : '否'}
  - 变更次数: ${status.changes.changeCount}

快照时间: ${snapshot?.metadata?.snapshotTime || '无'}`;
    }
    
    /**
     * 显示测试帮助
     */
    showTestHelp() {
        return `数据管理器测试命令:
datatest player - 测试玩家数据功能
datatest world - 测试世界数据功能  
datatest state - 测试游戏状态功能
datatest save - 测试保存功能
datatest validate - 测试验证功能
datatest reset - 测试重置功能

datastatus - 查看数据管理器状态

示例:
datatest player addexp 轻武器使用 50
datatest world unlock 老鹰书店 covertAccess
datatest state interface map`;
    }
}

// 导出类
window.DataTestCommand = DataTestCommand;