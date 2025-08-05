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

        this.initPromise = new Promise((resolve) => {
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
                
                // 4. 初始化系统服务
                const systemService = new SystemService();
                serviceLocator.register('system', systemService);
                this.registerComponent('systemService', systemService);

                // 初始化指令行服务
                const commandService = new CommandService(serviceLocator);
                serviceLocator.register('command', commandService);
                this.registerComponent('commandService', commandService);

                // 5. 初始化音频服务 - 修改部分开始
                const audioService = new AudioService();
                serviceLocator.register('audio', audioService);
                this.registerComponent('audioService', audioService);
                
                // 添加向后兼容支持和过渡警告
                if (!window.audioManager) {
                    console.warn('注意: 直接访问 window.audioManager 已废弃，请使用 ServiceLocator.get("audio")');
                    Object.defineProperty(window, 'audioManager', {
                        get: function() {
                            console.warn('警告: window.audioManager 已废弃，请使用 ServiceLocator.get("audio")');
                            return audioService;
                        },
                        configurable: true
                    });
                }

                // 6. 初始化接口服务
                const interfaceService = new InterfaceService();
                serviceLocator.register('interface', interfaceService);
                this.registerComponent('interfaceService', interfaceService);

                // 7. 初始化MVC组件
                const gameModel = new GameModel();
                const gameView = new GameView();
                const gameController = new GameController(gameModel, gameView);

                // 注册为组件
                this.registerComponent('gameModel', gameModel);
                this.registerComponent('gameView', gameView);
                this.registerComponent('gameController', gameController);

                // 同时注册为服务
                serviceLocator.register('gameModel', gameModel);
                serviceLocator.register('gameView', gameView);
                serviceLocator.register('gameController', gameController);

                // 为向后兼容保留全局引用
                window.gameController = gameController;

                // 8. 初始化Lorebook系统
                console.log("初始化世界书系统...");
                const lorebookModel = new LorebookModel(serviceLocator);
                const lorebookController = new LorebookController(lorebookModel, serviceLocator);

                this.registerComponent('lorebookModel', lorebookModel);
                this.registerComponent('lorebookController', lorebookController);

                // 初始化Lorebook服务
                const lorebookService = new LorebookService();
                serviceLocator.register('lorebook', lorebookService);
                this.registerComponent('lorebookService', lorebookService)

                // 为向后兼容保留全局引用
                window.lorebookController = lorebookController;

                // 初始化Lorebook控制器
                lorebookController.initialize().catch(error => {
                    console.error("世界书控制器初始化失败:", error);
                });

                // 9. 初始化NPC聊天服务
                const npcChatService = new NpcChatService();
                serviceLocator.register('npcChat', npcChatService);
                this.registerComponent('npcChatService', npcChatService);
                
                // 10. 初始化地图MVC
                const mapModel = new MapModel(serviceLocator);
                const mapView = new MapView(serviceLocator);
                const mapController = new MapController(mapModel, mapView, serviceLocator);
                
                this.registerComponent('mapModel', mapModel);
                this.registerComponent('mapView', mapView);
                this.registerComponent('mapController', mapController);

                // 初始化地图服务
                const mapService = new MapService();
                serviceLocator.register('map', mapService);
                this.registerComponent('mapService', mapService);

                // 为向后兼容保留全局引用
                window.mapController = mapController;
                
                // 注册到界面服务
                interfaceService.registerController('map', mapController);

                // 11. 初始化身份MVC
                console.log("初始化身份系统...");
                const identityModel = new IdentityModel(serviceLocator);
                const identityView = new IdentityView(serviceLocator);
                const identityController = new IdentityController(identityModel, identityView, serviceLocator);

                // 注册为组件
                this.registerComponent('identityModel', identityModel);
                this.registerComponent('identityView', identityView);
                this.registerComponent('identityController', identityController);

                // 注册为服务 - 注意:不要注册控制器为服务
                // serviceLocator.register('identityController', identityController);

                // 为向后兼容保留全局引用
                window.identityController = identityController;

                // 初始化身份控制器
                identityController.initialize().catch(error => {
                    console.error("身份控制器初始化失败:", error);
                });

                // 初始化并注册身份服务
                const identityService = new IdentityService();
                serviceLocator.register('identity', identityService);
                this.registerComponent('identityService', identityService);

                // 注册到界面服务
                interfaceService.registerController('identity', identityController);

                // 12. 初始化地点行动MVC
                console.log("初始化地点行动系统...");
                const locationActionModel = new LocationActionModel(serviceLocator);
                const locationActionView = new LocationActionView(serviceLocator);
                const locationActionController = new LocationActionController(locationActionModel, locationActionView, serviceLocator);

                // 注册为组件
                this.registerComponent('locationActionModel', locationActionModel);
                this.registerComponent('locationActionView', locationActionView);
                this.registerComponent('locationActionController', locationActionController);

                // 初始化地点行动服务
                const locationActionService = new LocationActionService();
                serviceLocator.register('locationAction', locationActionService);
                this.registerComponent('locationActionService', locationActionService);

                // 注册到界面服务
                interfaceService.registerController('locationAction', locationActionController);

                // 初始化地点行动控制器
                locationActionController.initialize().catch(error => {
                    console.error("地点行动控制器初始化失败:", error);
                });

                console.log("游戏核心初始化完成");
                this.initialized = true;
                
                // 尝试恢复界面状态（页面刷新后）
                setTimeout(async () => {
                    try {
                        // 检查当前界面记录并恢复到对应界面
                        try {
                            const storage = serviceLocator.get('storage');
                            const state = storage?.load('currentInterface');
                            
                            if (state && state.interface) {
                                console.log(`恢复界面状态: ${state.interface}`);
                                
                                if (state.interface === 'locationAction') {
                                    // 特殊处理：地点行动界面需要恢复状态数据
                                    const restored = await locationActionController.tryRestoreState();
                                    if (!restored) {
                                        console.log("未找到需要恢复的地点行动状态，切换到终端");
                                        interfaceService.switchTo('terminal');
                                    }
                                } else if (state.interface === 'map' || state.interface === 'identity' || state.interface === 'terminal') {
                                    // 其他界面直接切换
                                    interfaceService.switchTo(state.interface);
                                } else {
                                    console.log(`未知界面类型: ${state.interface}，默认切换到终端`);
                                    interfaceService.switchTo('terminal');
                                }
                            } else {
                                console.log("未找到界面状态记录，默认切换到终端");
                                interfaceService.switchTo('terminal');
                            }
                        } catch (e) {
                            console.error('恢复界面状态失败:', e);
                            // 发生错误时默认切换到终端
                            try {
                                interfaceService.switchTo('terminal');
                            } catch (fallbackError) {
                                console.error('切换到终端界面也失败:', fallbackError);
                            }
                        }
                        
                        // 确保F6按钮文本正确初始化为"行动"
                        if (interfaceService && typeof interfaceService.updateActionButtonText === 'function') {
                            interfaceService.updateActionButtonText();
                        }
                    } catch (error) {
                        console.error("恢复界面状态失败:", error);
                    }
                }, 100); // 延迟100ms确保所有组件都已初始化

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