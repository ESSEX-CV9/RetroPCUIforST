// js/core/gameCore.js
/**
 * 游戏核心类 - 中央协调器
 * 负责游戏组件的初始化、注册和管理
 */
class GameCore {
    constructor() {
        this.components = {};
        this.initialized = false;
        this.initPromise = null;
    }

    /**
     * 注册组件到游戏核心
     * @param {string} name - 组件名称
     * @param {object} component - 组件实例
     * @returns {object} 返回注册的组件
     */
    registerComponent(name, component) {
        if (this.components[name]) {
            console.warn(`组件 "${name}" 已存在，将被覆盖`);
        }
        this.components[name] = component;
        return component;
    }

    /**
     * 获取已注册的组件
     * @param {string} name - 组件名称
     * @returns {object|null} 组件实例或null
     */
    getComponent(name) {
        return this.components[name] || null;
    }

    /**
     * 初始化游戏核心和所有必要组件
     * @returns {Promise} 初始化完成的Promise
     */
    initialize() {
        if (this.initialized) {
            return Promise.resolve(this);
        }

        if (this.initPromise) {
            return this.initPromise;
        }

        this.initPromise = new Promise(async (resolve) => {
            try {
                console.log("初始化游戏核心...");

                // 1. 获取服务定位器
                const serviceLocator = window.ServiceLocator;
                
                // 2. 先注册工具类服务
                const domUtils = window.DOMUtils || new DOMUtils();
                serviceLocator.register('domUtils', domUtils);
                
                const storageUtils = window.StorageUtils || new StorageUtils();
                serviceLocator.register('storage', storageUtils);
                
                // 3. 注册核心服务
                serviceLocator.register('eventBus', EventBus);
                
                // 4. 初始化数据管理服务（在其他服务之前）
                console.log("初始化数据管理服务...");
                const dataService = new DataService(serviceLocator);
                serviceLocator.register('data', dataService);
                this.registerComponent('dataService', dataService);
                
                // 数据服务初始化（异步）
                await dataService.initialize();
                
                // 5. 初始化系统服务
                const systemService = new SystemService();
                serviceLocator.register('system', systemService);
                this.registerComponent('systemService', systemService);



                // 6. 初始化音频服务 - 修改部分开始
                const audioService = new AudioService();
                serviceLocator.register('audio', audioService);
                this.registerComponent('audioService', audioService);
                


                // 7. 初始化基础服务（只保留核心业务服务）
                
                // 初始化Lorebook服务
                const lorebookService = new LorebookService();
                serviceLocator.register('lorebook', lorebookService);
                this.registerComponent('lorebookService', lorebookService);

                // 初始化NPC聊天服务
                const npcChatService = new NpcChatService();
                serviceLocator.register('npcChat', npcChatService);
                this.registerComponent('npcChatService', npcChatService);

                // 初始化地图服务
                const mapService = new MapService();
                serviceLocator.register('map', mapService);
                this.registerComponent('mapService', mapService);

                // 初始化身份服务
                const identityService = new IdentityService();
                serviceLocator.register('identity', identityService);
                this.registerComponent('identityService', identityService);

                // 初始化地点行动服务
                const locationActionService = new LocationActionService();
                serviceLocator.register('locationAction', locationActionService);
                this.registerComponent('locationActionService', locationActionService);

                console.log("游戏核心初始化完成");
                this.initialized = true;

                // 发布初始化完成事件
                const eventBus = serviceLocator.get('eventBus');
                if (eventBus) {
                    eventBus.emit('gameCoreInitialized', this);
                }
                

                
                resolve(this);
            } catch (error) {
                console.error("游戏核心初始化失败:", error);
                // 即使初始化失败，也解析Promise，但记录错误
                resolve(this);
            }
        });

        return this.initPromise;
    }

    /**
     * 检查系统是否可操作
     * @returns {boolean} 系统是否可操作
     */
    isSystemOperational() {
        const gameModel = this.getComponent('gameModel');
        if (!gameModel) return false;

        return gameModel.isOn && 
               gameModel.getSystemState() === gameModel.SystemState.POWERED_ON;
    }
}

// 创建全局单例
window.GameCore = new GameCore();