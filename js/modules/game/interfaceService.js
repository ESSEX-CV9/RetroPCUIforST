// js/services/interfaceService.js
/**
 * 界面服务
 * 管理不同界面之间的切换和交互
 */
class InterfaceService {
    constructor() {
        // 所有可用界面
        this.interfaces = {
            terminal: {
                element: document.getElementById('terminal'),
                controller: null
            },
            map: {
                element: document.getElementById('mapInterface'),
                controller: null
            },
            identity: {
                element: document.getElementById('statusInterface'),
                controller: null
            },
            locationAction: {
                element: document.getElementById('locationActionInterface'),
                controller: null
            }
        };
        
        // 当前活动界面
        this.activeInterface = 'terminal';
        
        // 绑定功能按钮
        this.bindFunctionButtons();
        
        // 绑定键盘快捷键
        this.bindKeyboardShortcuts();
        
        // 订阅事件
        this.subscribeToEvents();
    }
    
    /**
     * 注册界面控制器
     * @param {string} interfaceName - 界面名称
     * @param {object} controller - 控制器实例
     */
    registerController(interfaceName, controller) {
        if (this.interfaces[interfaceName]) {
            this.interfaces[interfaceName].controller = controller;
            console.log(`已注册 ${interfaceName} 控制器`);
        } else {
            console.warn(`未知界面: ${interfaceName}`);
        }
    }
    
    /**
     * 绑定功能按钮
     */
    bindFunctionButtons() {
        // 获取DOM元素
        const dom = window.DOMUtils;
        const f1Button = dom.get('#fnButton1');
        const f2Button = dom.get('#fnButton2');
        const f5Button = dom.get('#fnButton5');
        const f6Button = dom.get('#fnButton6');
        
        // 终端按钮
        if (f1Button) {
            f1Button.textContent = '终端';
            dom.on(f1Button, 'click', () => {
                this.handleButtonClick('terminal');
            });
        }
        
        // 档案按钮
        if (f2Button) {
            f2Button.textContent = '档案';
            dom.on(f2Button, 'click', () => {
                this.handleButtonClick('identity');
            });
        }
        
        // 地图按钮
        if (f5Button) {
            f5Button.textContent = '地图';
            dom.on(f5Button, 'click', () => {
                this.handleButtonClick('map');
            });
        }
        
        // 行动按钮
        if (f6Button) {
            // 固定显示"行动"
            f6Button.textContent = '行动';
            dom.on(f6Button, 'click', () => {
                this.handleActionButton();
            });
        }
    }
    
    /**
     * 处理按钮点击
     * @param {string} interfaceName - 界面名称
     */
    handleButtonClick(interfaceName) {
        // 播放按钮音效
        const audio = window.ServiceLocator.get('audio');
        if (audio) {
            audio.play('functionButton');
        }
        
        // 检查系统是否可操作
        const gameCore = window.GameCore;
        if (gameCore && gameCore.isSystemOperational()) {
            this.switchTo(interfaceName);
        }
    }
    
    /**
     * 绑定键盘快捷键
     */
    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 只有在系统运行时才响应快捷键
            const gameCore = window.GameCore;
            if (!gameCore || !gameCore.isSystemOperational()) return;
            
            switch (e.key) {
                case 'F1':
                    e.preventDefault();
                    this.switchTo('terminal');
                    break;
                case 'F2':
                    e.preventDefault();
                    this.switchTo('identity');
                    break;
                case 'F5':
                    e.preventDefault();
                    this.switchTo('map');
                    break;
                case 'F6':
                    e.preventDefault();
                    this.handleActionButton();
                    break;
            }
        });
    }
    
    /**
     * 订阅事件
     */
    subscribeToEvents() {
        const eventBus = window.ServiceLocator.get('eventBus');
        if (eventBus) {
            eventBus.on('runProgram', (data) => {
                if (data && data.program === 'map') {
                    this.switchTo('map');
                }
            });
            
            eventBus.on('testModeChanged', (isTestMode) => {
                this.isTestMode = isTestMode;
            });
            
            // 监听地点行动相关事件（按钮文本已固定，无需更新）
            eventBus.on('locationEntered', () => {
                // 按钮文本固定为"行动"，无需动态更新
            });
            
            eventBus.on('locationActionStateCleared', () => {
                // 按钮文本固定为"行动"，无需动态更新
            });
        }
    }
    
    /**
     * 切换到指定界面
     * @param {string} interfaceName - 界面名称
     * @returns {boolean} 是否成功切换
     */
    switchTo(interfaceName) {
        // 确保界面存在
        if (!this.interfaces[interfaceName]) {
            console.error(`界面不存在: ${interfaceName}`);
            return false;
        }
        
        // 如果已经是当前界面，不做任何操作
        if (this.activeInterface === interfaceName) {
            return true;
        }
        
        console.log(`切换界面: ${this.activeInterface} -> ${interfaceName}`);
        
        // 获取当前和目标界面对象
        const currentInterface = this.interfaces[this.activeInterface];
        const targetInterface = this.interfaces[interfaceName];
        
        // 获取DOM工具
        const dom = window.DOMUtils;
        
        // 使用闪烁效果(如果不在测试模式)
        const switchFunction = () => {
            // 1. 先隐藏当前界面元素
            if (currentInterface.element) {
                dom.toggle(currentInterface.element, false);
            }
            
            // 2. 特殊状态更新 - 隐藏当前界面
            if (this.activeInterface === 'map' && currentInterface.controller) {
                // 使用控制器的模型设置可见性
                if (currentInterface.controller.model && typeof currentInterface.controller.model.setVisibility === 'function') {
                    currentInterface.controller.model.setVisibility(false);
                }
            } else if (this.activeInterface === 'locationAction' && currentInterface.controller) {
                // 隐藏地点行动界面但不清除状态（支持暂时离开后快速返回）
                if (currentInterface.controller.model && typeof currentInterface.controller.model.setVisibility === 'function') {
                    currentInterface.controller.model.setVisibility(false);
                }
                // 注释掉自动清除状态的代码，改为保持状态以支持快速返回
                // if (typeof currentInterface.controller.clearLocationActionState === 'function') {
                //     currentInterface.controller.clearLocationActionState();
                // }
                console.log('地点行动界面已隐藏，状态保持以便快速返回');
            } else if (this.activeInterface === 'identity' && window.identityController) {
                // 调用身份控制器的隐藏回调
                if (typeof window.identityController.onInterfaceHidden === 'function') {
                    window.identityController.onInterfaceHidden();
                } else {
                    window.identityController.isVisible = false;
                }
            }
            
            // 3. 更新当前活动界面记录
            this.activeInterface = interfaceName;

            // 3.1 持久化当前界面到 localStorage，供刷新时恢复
            try {
                const storage = window.ServiceLocator.get('storage') || window.StorageUtils;
                if (storage) {
                    storage.save('currentInterface', {
                        interface: interfaceName,
                        timestamp: Date.now()
                    });
                }
            } catch (error) {
                console.error('保存当前界面到 localStorage 失败:', error);
            }
            
            // 4. 显示目标界面元素
            if (targetInterface.element) {
                dom.toggle(targetInterface.element, true, 'flex');
            }
            
            // 5. 特殊状态更新和视图刷新 - 显示目标界面
            if (interfaceName === 'map' && targetInterface.controller) {
                // 更新地图状态 - 使用控制器的模型设置可见性
                if (targetInterface.controller.model && typeof targetInterface.controller.model.setVisibility === 'function') {
                    targetInterface.controller.model.setVisibility(true);
                }
                
                // 触发地图渲染
                targetInterface.controller.renderMap();
            } else if (interfaceName === 'identity' && window.identityController) {
                // 调用身份控制器的显示回调
                if (typeof window.identityController.onInterfaceShown === 'function') {
                    window.identityController.onInterfaceShown();
                } else {
                    window.identityController.isVisible = true;
                }
                
                // 刷新身份显示
                window.identityController.updateIdentityDisplays();
            } else if (interfaceName === 'locationAction' && targetInterface.controller) {
                // 地点行动界面特殊处理
                if (targetInterface.controller.model && typeof targetInterface.controller.model.setVisibility === 'function') {
                    targetInterface.controller.model.setVisibility(true);
                }
            } else if (interfaceName === 'terminal') {
                // 终端界面特殊处理 - 聚焦到输入框
                setTimeout(() => {
                    const commandInput = dom.get('#commandInput');
                    if (commandInput && !commandInput.disabled) {
                        commandInput.focus();
                    }
                }, 100);
            }
            
            // 6. 确保切换到非地图界面时，地图模型状态正确更新
            if (interfaceName !== 'map' && window.mapController && window.mapController.model) {
                // 切换到非地图界面时，确保地图模型可见性为false
                if (typeof window.mapController.model.setVisibility === 'function') {
                    window.mapController.model.setVisibility(false);
                }
            }
        };
        
        // 应用切换效果
        if (!this.isTestMode) {
            this.flickerScreen(switchFunction);
        } else {
            switchFunction();
        }
        
        // 保存设置
        if (window.gameController) {
            window.gameController.saveSettings();
        }
        
        // 按钮文本已固定为"行动"，无需更新
        
        return true;
    }
    
    /**
     * 屏幕闪烁效果
     * @param {Function} callback - 回调函数
     */
    flickerScreen(callback) {
        const dom = window.DOMUtils;
        const screenElement = dom.get('.screen');
        
        // 播放切换音效
        const audio = window.ServiceLocator.get('audio');
        if (audio) {
            audio.play('screenSwitch');
        }
        
        dom.addClass(screenElement, 'screen-flicker');
        
        setTimeout(() => {
            dom.removeClass(screenElement, 'screen-flicker');
            if (callback) callback();
        }, 75);
    }
    
    /**
     * 获取当前活动界面
     * @returns {string} 当前界面名称
     */
    getActiveInterface() {
        return this.activeInterface;
    }
    
    /**
     * 处理行动按钮点击
     */
    handleActionButton() {
        // 播放按钮音效
        const audio = window.ServiceLocator.get('audio');
        if (audio) {
            audio.play('functionButton');
        }
        
        // 检查系统是否可操作
        const gameCore = window.GameCore;
        if (!gameCore || !gameCore.isSystemOperational()) {
            return;
        }
        
        // 新的优先级逻辑：
        // 1. 首先检查地图是否有当前位置
        const mapModel = this.getMapModel();
        const currentLocation = mapModel?.getCurrentLocation();
        
        if (currentLocation && currentLocation.name && mapModel.isLocationVisible(currentLocation.name)) {
            // 2. 如果有当前位置，直接进入该位置的行动界面
            console.log('F6按钮: 直接进入当前地点', currentLocation.name);
            this.enterLocationDirectly(currentLocation.name);
        } else if (this.hasLocationActionState()) {
            // 3. 如果没有当前位置但有保存状态，恢复状态
            console.log('F6按钮: 恢复地点行动界面');
            this.restoreLocationAction();
        } else {
            // 4. 都没有，跳转到地图让用户选择
            console.log('F6按钮: 跳转到地图界面');
            this.switchTo('map');
            
            // 显示提示信息（可选）
            setTimeout(() => {
                console.log('提示: 请在地图中选择一个地点进入行动模式');
            }, 500);
        }
    }
    
    /**
     * 检查是否有可恢复的地点行动状态
     * @returns {boolean} 是否有可恢复状态
     */
    hasLocationActionState() {
        try {
            const storage = window.ServiceLocator.get('storage') || window.StorageUtils;
            if (!storage) return false;
            
            const state = storage.load('currentInterface');
            if (state && state.interface === 'locationAction' && state.locationData) {
                // 检查状态是否过期
                const config = window.locationActionConfig?.story;
                const expiration = config?.stateExpiration || (24 * 60 * 60 * 1000);
                const isExpired = (Date.now() - state.timestamp) > expiration;
                return !isExpired;
            }
            return false;
        } catch (error) {
            console.error('检查地点行动状态失败:', error);
            return false;
        }
    }
    
    /**
     * 恢复地点行动界面
     */
    async restoreLocationAction() {
        try {
            const locationActionController = this.interfaces.locationAction?.controller;
            if (locationActionController && typeof locationActionController.tryRestoreState === 'function') {
                const restored = await locationActionController.tryRestoreState();
                if (!restored) {
                    // 恢复失败，跳转到地图
                    console.log('地点行动状态恢复失败，跳转到地图');
                    this.switchTo('map');
                }
            } else {
                // 控制器不可用，跳转到地图
                console.log('地点行动控制器不可用，跳转到地图');
                this.switchTo('map');
            }
        } catch (error) {
            console.error('恢复地点行动界面失败:', error);
            this.switchTo('map');
        }
    }
    
    /**
     * 更新行动按钮文本
     */
    updateActionButtonText() {
        const dom = window.DOMUtils;
        const f6Button = dom.get('#fnButton6');
        
        if (f6Button) {
            // 固定显示"行动"
            f6Button.textContent = '行动';
        }
    }
    
    /**
     * 获取地图模型的辅助方法
     * @returns {object|null} 地图模型实例
     */
    getMapModel() {
        const gameCore = window.GameCore;
        return gameCore?.getComponent('mapModel');
    }
    
    /**
     * 直接进入指定地点的行动界面
     * @param {string} locationName - 地点名称
     */
    enterLocationDirectly(locationName) {
        const mapModel = this.getMapModel();
        if (!mapModel) {
            console.error('无法获取地图模型');
            return;
        }
        
        const location = mapModel.getLocation(locationName);
        if (!location) {
            console.error(`地点不存在: ${locationName}`);
            return;
        }
        
        // 构建地点数据 - 使用地图模型的 getSelectedLocation 格式
        mapModel.selectLocation(locationName);
        const selectedLocation = mapModel.getSelectedLocation();
        
        if (!selectedLocation) {
            console.error(`无法选择地点: ${locationName}`);
            return;
        }
        
        // 构建符合 locationEntered 事件格式的数据
        const locationEventData = {
            locationName: selectedLocation.displayName,
            realName: selectedLocation.realName,
            hasPublicAccess: selectedLocation.publicAccess,
            hasCovertAccess: selectedLocation.covertAccess,
            isShowingHidden: false, // 默认显示公开信息
            accessType: 'public' // 默认公开访问
        };
        
        // 发布进入地点事件
        const eventBus = window.ServiceLocator.get('eventBus');
        if (eventBus) {
            eventBus.emit('locationEntered', locationEventData);
        } else {
            console.error('无法获取事件总线');
        }
    }
}