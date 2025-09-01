// js/modules/terminal/terminalController.js
/**
 * 终端模块控制器
 * 负责管理整个终端模块的初始化和协调
 */
class TerminalController {
    constructor(serviceLocator) {
        this.serviceLocator = serviceLocator;
        this.initialized = false;
        this.components = {};
    }

    /**
     * 初始化终端模块
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        console.log("初始化终端模块...");

        try {
            // 1. 初始化接口服务
            const interfaceService = new InterfaceService();
            this.serviceLocator.register('interface', interfaceService);
            this.components.interfaceService = interfaceService;

            // 2. 初始化命令服务
            const commandService = new CommandService(this.serviceLocator);
            this.serviceLocator.register('command', commandService);
            this.components.commandService = commandService;

            // 3. 初始化游戏MVC组件
            const gameModel = new GameModel();
            const gameView = new GameView();
            const gameController = new GameController(gameModel, gameView);

            this.serviceLocator.register('gameModel', gameModel);
            this.serviceLocator.register('gameView', gameView);
            this.serviceLocator.register('gameController', gameController);

            this.components.gameModel = gameModel;
            this.components.gameView = gameView;
            this.components.gameController = gameController;

            // 4. 初始化Lorebook系统
            console.log("初始化世界书系统...");
            const lorebookModel = new LorebookModel(this.serviceLocator);
            const lorebookController = new LorebookController(lorebookModel, this.serviceLocator);

            this.components.lorebookModel = lorebookModel;
            this.components.lorebookController = lorebookController;

            // 初始化Lorebook控制器
            await lorebookController.initialize().catch(error => {
                console.error("世界书控制器初始化失败:", error);
            });

            // 5. 初始化地图MVC
            const mapModel = new MapModel(this.serviceLocator);
            const mapView = new MapView(this.serviceLocator);
            const mapController = new MapController(mapModel, mapView, this.serviceLocator);
            
            this.components.mapModel = mapModel;
            this.components.mapView = mapView;
            this.components.mapController = mapController;

            // 注册到界面服务
            interfaceService.registerController('map', mapController);

            // 6. 初始化身份MVC
            console.log("初始化身份系统...");
            const identityModel = new IdentityModel(this.serviceLocator);
            const identityView = new IdentityView(this.serviceLocator);
            const identityController = new IdentityController(identityModel, identityView, this.serviceLocator);

            this.components.identityModel = identityModel;
            this.components.identityView = identityView;
            this.components.identityController = identityController;

            // 初始化身份控制器
            await identityController.initialize().catch(error => {
                console.error("身份控制器初始化失败:", error);
            });

            // 注册到界面服务
            interfaceService.registerController('identity', identityController);

            // 7. 初始化地点行动MVC
            console.log("初始化地点行动系统...");
            const locationActionModel = new LocationActionModel(this.serviceLocator);
            const locationActionView = new LocationActionView(this.serviceLocator);
            const locationActionController = new LocationActionController(locationActionModel, locationActionView, this.serviceLocator);

            this.components.locationActionModel = locationActionModel;
            this.components.locationActionView = locationActionView;
            this.components.locationActionController = locationActionController;

            // 注册到界面服务
            interfaceService.registerController('locationAction', locationActionController);

            // 初始化地点行动控制器
            await locationActionController.initialize().catch(error => {
                console.error("地点行动控制器初始化失败:", error);
            });

            // 8. 初始化软盘控制器
            const systemStateProvider = this.serviceLocator.get('system') || new SystemStateProvider(gameController.model);
            const floppyController = new FloppyController(systemStateProvider);
            
            // 将软盘控制器引用附加到游戏控制器
            gameController.floppyController = floppyController;
            this.components.floppyController = floppyController;

            // 9. 初始化数据测试命令
            if (window.DataTestCommand) {
                const dataTestCommand = new DataTestCommand(this.serviceLocator);
                dataTestCommand.registerCommands();
                this.components.dataTestCommand = dataTestCommand;
                console.log("数据管理器测试命令已初始化");
            }

            // 10. 设置事件监听
            this.setupEventListeners();

            // 11. 初始化世界书系统
            if (typeof initializeLorebookSystem === 'function') {
                initializeLorebookSystem();
            }

            this.initialized = true;
            console.log("终端模块初始化完成");

            // 尝试恢复界面状态（页面刷新后）
            this.restoreInterfaceState();

        } catch (error) {
            console.error("终端模块初始化失败:", error);
            throw error;
        }
    }

    /**
     * 恢复界面状态
     */
    async restoreInterfaceState() {
        try {
            const storage = this.serviceLocator.get('storage');
            const state = storage?.load('currentInterface');
            const interfaceService = this.components.interfaceService;
            
            if (state && state.interface) {
                console.log(`恢复界面状态: ${state.interface}`);
                
                if (state.interface === 'locationAction') {
                    // 特殊处理：地点行动界面需要恢复状态数据
                    const restored = await this.components.locationActionController.tryRestoreState();
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
                this.components.interfaceService?.switchTo('terminal');
            } catch (fallbackError) {
                console.error('切换到终端界面也失败:', fallbackError);
            }
        }
        
        // 确保F6按钮文本正确初始化为"行动"
        const interfaceService = this.components.interfaceService;
        if (interfaceService && typeof interfaceService.updateActionButtonText === 'function') {
            interfaceService.updateActionButtonText();
        }
    }

    /**
     * 获取组件
     */
    getComponent(name) {
        return this.components[name] || null;
    }

    /**
     * 设置事件监听
     */
    setupEventListeners() {
        const gameController = this.components.gameController;
        const mapController = this.components.mapController;
        const identityController = this.components.identityController;
        const floppyController = this.components.floppyController;

        // 订阅系统电源变化事件
        const eventBus = this.serviceLocator.get('eventBus') || window.EventBus;
        if (eventBus) {
            eventBus.on('systemPowerChange', (isOn) => {
                if (floppyController) {
                    floppyController.handleSystemPowerChange(isOn);
                }
                
                // 每次电源状态变化时保存设置
                if (gameController) {
                    gameController.saveSettings();
                }
                
                // 如果系统关闭，确保地图也隐藏
                if (!isOn && mapController && mapController.model.isVisible) {
                    mapController.model.setVisibility(false);
                    mapController.view.hide();
                }
            });

            // 添加颜色切换事件监听
            eventBus.on('colorModeChanged', (isAmber) => {
                if (mapController) {
                    mapController.view.updateColorMode(isAmber);
                }
                if (identityController) {
                    identityController.updateColorMode(isAmber);
                }
            });
        }
    }

    /**
     * 检查是否已初始化
     */
    isInitialized() {
        return this.initialized;
    }
}
