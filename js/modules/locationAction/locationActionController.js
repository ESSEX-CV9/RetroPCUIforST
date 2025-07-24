// js/modules/locationAction/locationActionController.js
/**
 * 地点行动控制器
 * 负责业务逻辑和事件处理
 */
class LocationActionController {
    constructor(model, view, serviceLocator) {
        this.model = model;
        this.view = view;
        this.serviceLocator = serviceLocator || window.ServiceLocator;
        
        // 获取依赖服务
        this.eventBus = this.serviceLocator?.get('eventBus') || window.EventBus || EventBus;
        this.interfaceService = this.serviceLocator?.get('interface');
        this.locationActionService = this.serviceLocator?.get('locationAction');
        this.audio = this.serviceLocator?.get('audio') || window.audioManager;
        this.domUtils = this.serviceLocator?.get('domUtils') || window.DOMUtils;
        
        // 控制器状态
        this.isInitialized = false;
        
        // 绑定事件
        this.bindEvents();
        
        console.log("地点行动控制器已初始化");
    }
    
    /**
     * 初始化控制器
     * @returns {Promise} 初始化Promise
     */
    async initialize() {
        try {
            console.log("初始化地点行动控制器...");
            
            // 检查依赖
            this.checkDependencies();
            
            // 设置初始状态
            this.model.reset();
            this.view.clear();
            
            this.isInitialized = true;
            console.log("地点行动控制器初始化完成");
            
            return Promise.resolve();
        } catch (error) {
            console.error("地点行动控制器初始化失败:", error);
            return Promise.reject(error);
        }
    }
    
    /**
     * 检查依赖是否可用
     */
    checkDependencies() {
        if (!this.model) {
            throw new Error("地点行动模型未提供");
        }
        if (!this.view) {
            throw new Error("地点行动视图未提供");
        }
        if (!this.locationActionService) {
            console.warn("地点行动服务未找到");
        }
        if (!this.interfaceService) {
            console.warn("界面服务未找到");
        }
    }
    
    /**
     * 绑定事件处理程序
     */
    bindEvents() {
        // 监听地点进入事件
        this.eventBus.on('locationEntered', (locationData) => {
            this.handleLocationEntered(locationData);
        });
        
        // 监听键盘事件
        this.domUtils?.on(document, 'keydown', (e) => {
            this.handleKeyDown(e);
        });
        
        // 监听模型状态变化
        this.eventBus.on('locationAction.visibilityChanged', (visible) => {
            this.handleVisibilityChanged(visible);
        });
        
        this.eventBus.on('locationAction.loadingChanged', (loading) => {
            this.handleLoadingChanged(loading);
        });
        
        console.log("地点行动控制器事件绑定完成");
    }
    
        /**
     * 处理地点进入事件
     * @param {object} locationData - 地点数据
     */
    async handleLocationEntered(locationData) {
        try {
            console.log('进入地点行动模式:', locationData?.locationName);
            
            // 验证数据
            if (!locationData || !locationData.locationName) {
                console.error('无效的地点数据:', locationData);
                return;
            }
            
            // 播放切换音效
            if (this.audio) {
                this.audio.play('screenSwitch');
            }
            
            // 设置当前地点
            this.model.setCurrentLocation(locationData);
            this.model.setVisibility(true);
            
            // 保存状态到localStorage以支持页面刷新
            this.saveLocationActionState(locationData);
            
            // 切换到地点行动界面
            if (this.interfaceService) {
                this.interfaceService.switchTo('locationAction');
            } else {
                // 如果界面服务不可用，直接显示界面
                this.view.setVisibility(true);
            }
            
            // 显示地点信息
            await this.view.showLocation(locationData);
            
            // 开始生成故事
            await this.generateAndDisplayStory(locationData);
            
        } catch (error) {
            console.error('处理地点进入失败:', error);
            this.view.showError('无法加载地点信息，请重试。');
        }
    }
    
    /**
     * 生成并显示故事
     * @param {object} locationData - 地点数据
     */
    async generateAndDisplayStory(locationData) {
        try {
            // 设置加载状态
            this.model.setLoading(true);
            this.view.showLoading();
            
            // 生成故事
            if (this.locationActionService) {
                const story = await this.locationActionService.generateLocationStory(locationData);
                this.model.setStory(story);
                this.view.updateStory(story);
            } else {
                // 如果服务不可用，使用默认故事
                const defaultStory = this.generateDefaultStory(locationData);
                this.model.setStory(defaultStory);
                this.view.updateStory(defaultStory);
            }
            
            // 清除加载状态
            this.model.setLoading(false);
            this.view.hideLoading();
            
        } catch (error) {
            console.error('故事生成失败:', error);
            this.model.setLoading(false);
            this.view.showError('故事生成失败，请重试。');
        }
    }
    
    /**
     * 生成默认故事（当服务不可用时）
     * @param {object} locationData - 地点数据
     * @returns {string} 默认故事文本
     */
    generateDefaultStory(locationData) {
        const isCovert = locationData.accessType === 'covert';
        const locationName = locationData.locationName || '未知地点';
        
        let story = `你来到了${locationName}。`;
        
        if (isCovert) {
            story += '\n\n[秘密行动模式]\n作为训练有素的特工，你敏锐地观察着周围的一切，寻找可能的线索和威胁。';
        } else {
            story += '\n\n[公开访问模式]\n你以普通访客的身份进入这里，需要保持低调避免引起注意。';
        }
        
        return story;
    }
    
    /**
     * 处理键盘事件
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyDown(e) {
        // 只在界面可见时处理键盘事件
        if (!this.model.getVisibility()) {
            return;
        }
        
        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                this.returnToMap();
                break;
            
            case 'F1':
                // 快捷键返回终端
                e.preventDefault();
                this.returnToTerminal();
                break;
                
            default:
                // 其他键暂不处理
                break;
        }
    }
    
    /**
     * 处理可见性变化
     * @param {boolean} visible - 是否可见
     */
    handleVisibilityChanged(visible) {
        console.log('地点行动界面可见性变化:', visible);
        
        if (!visible) {
            // 界面隐藏时清理资源
            this.cleanup();
        }
    }
    
    /**
     * 处理加载状态变化
     * @param {boolean} loading - 是否正在加载
     */
    handleLoadingChanged(loading) {
        console.log('地点行动加载状态变化:', loading);
        
        if (loading) {
            this.view.showLoading();
        } else {
            this.view.hideLoading();
        }
    }
    
    /**
     * 返回地图
     */
    returnToMap() {
        console.log('返回地图界面');
        
        // 播放音效
        if (this.audio) {
            this.audio.play('crt-button');
        }
        
        // 清除保存的状态
        this.clearLocationActionState();
        
        // 更新模型状态
        this.model.setVisibility(false);
        
        // 切换界面
        if (this.interfaceService) {
            this.interfaceService.switchTo('map');
        } else {
            // 如果界面服务不可用，直接隐藏界面
            this.view.setVisibility(false);
        }
    }
    
    /**
     * 返回终端
     */
    returnToTerminal() {
        console.log('返回终端界面');
        
        // 播放音效
        if (this.audio) {
            this.audio.play('crt-button');
        }
        
        // 清除保存的状态
        this.clearLocationActionState();
        
        // 更新模型状态
        this.model.setVisibility(false);
        
        // 切换界面
        if (this.interfaceService) {
            this.interfaceService.switchTo('terminal');
        }
    }
    
    /**
     * 清理资源
     */
    cleanup() {
        console.log('清理地点行动资源');
        
        // 清空视图
        this.view.clear();
        
        // 重置模型
        this.model.reset();
    }
    
    /**
     * 销毁控制器
     */
    destroy() {
        console.log('销毁地点行动控制器');
        
        // 清理资源
        this.cleanup();
        
        // 移除事件监听
        this.eventBus.off('locationEntered');
        this.eventBus.off('locationAction.visibilityChanged');
        this.eventBus.off('locationAction.loadingChanged');
        
        this.isInitialized = false;
    }
    
    /**
     * 保存地点行动状态到localStorage
     * @param {object} locationData - 地点数据
     */
    saveLocationActionState(locationData) {
        try {
            const state = {
                interface: 'locationAction',
                locationData: locationData,
                timestamp: Date.now()
            };
            
            const storage = this.serviceLocator?.get('storage') || window.StorageUtils;
            if (storage) {
                storage.save('currentInterface', state);
                console.log('地点行动状态已保存');
            }
        } catch (error) {
            console.error('保存地点行动状态失败:', error);
        }
    }
    
    /**
     * 清除保存的地点行动状态
     */
    clearLocationActionState() {
        try {
            const storage = this.serviceLocator?.get('storage') || window.StorageUtils;
            if (storage) {
                storage.remove('currentInterface');
                console.log('地点行动状态已清除');
                
                // 通知界面服务更新按钮状态
                this.eventBus.emit('locationActionStateCleared');
            }
        } catch (error) {
            console.error('清除地点行动状态失败:', error);
        }
    }
    
    /**
     * 从localStorage恢复地点行动状态
     * @returns {object|null} 保存的状态数据
     */
    restoreLocationActionState() {
        try {
            const storage = this.serviceLocator?.get('storage') || window.StorageUtils;
            if (storage) {
                const state = storage.load('currentInterface');
                if (state && state.interface === 'locationAction' && state.locationData) {
                    // 检查状态是否过期（从配置中获取过期时间）
                    const config = window.locationActionConfig?.story;
                    const expiration = config?.stateExpiration || (24 * 60 * 60 * 1000);
                    const isExpired = (Date.now() - state.timestamp) > expiration;
                    if (!isExpired) {
                        console.log('恢复地点行动状态:', state.locationData.locationName);
                        return state;
                    } else {
                        console.log('地点行动状态已过期，清除');
                        this.clearLocationActionState();
                    }
                }
            }
        } catch (error) {
            console.error('恢复地点行动状态失败:', error);
        }
        return null;
    }
    
    /**
     * 尝试恢复界面状态（页面刷新后调用）
     */
    async tryRestoreState() {
        const savedState = this.restoreLocationActionState();
        if (savedState && savedState.locationData) {
            console.log('页面刷新后恢复地点行动界面');
            
            // 直接恢复到地点行动界面，不播放音效
            this.model.setCurrentLocation(savedState.locationData);
            this.model.setVisibility(true);
            
            // 切换界面
            if (this.interfaceService) {
                this.interfaceService.switchTo('locationAction');
            } else {
                this.view.setVisibility(true);
            }
            
            // 显示地点信息和故事
            await this.view.showLocation(savedState.locationData);
            await this.generateAndDisplayStory(savedState.locationData);
            
            return true;
        }
        return false;
    }
} 