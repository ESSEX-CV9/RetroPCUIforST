// js/modules/locationAction/locationActionModel.js
/**
 * 地点行动数据模型
 * 负责管理地点行动的状态和数据
 */
class LocationActionModel {
    constructor(serviceLocator) {
        // 依赖注入
        this.serviceLocator = serviceLocator || window.ServiceLocator;
        this.eventBus = this.serviceLocator?.get('eventBus') || window.EventBus || EventBus;
        this.storage = this.serviceLocator?.get('storage') || window.StorageUtils;
        
        // 当前状态
        this.isVisible = false;
        this.currentLocation = null;
        this.currentStory = '';
        this.isLoading = false;
        
        console.log("地点行动数据模型已初始化");
    }
    
    /**
     * 设置当前地点
     * @param {object} locationData - 地点数据
     */
    setCurrentLocation(locationData) {
        this.currentLocation = locationData;
        this.eventBus.emit('locationAction.locationChanged', locationData);
        console.log("设置当前地点:", locationData?.locationName);
    }
    
    /**
     * 获取当前地点
     * @returns {object|null} 当前地点数据
     */
    getCurrentLocation() {
        return this.currentLocation;
    }
    
    /**
     * 设置界面可见性
     * @param {boolean} visible - 是否可见
     */
    setVisibility(visible) {
        this.isVisible = visible;
        this.eventBus.emit('locationAction.visibilityChanged', visible);
    }
    
    /**
     * 获取界面可见性
     * @returns {boolean} 是否可见
     */
    getVisibility() {
        return this.isVisible;
    }
    
    /**
     * 设置故事内容
     * @param {string} story - 故事文本
     */
    setStory(story) {
        this.currentStory = story;
        this.eventBus.emit('locationAction.storyChanged', story);
    }
    
    /**
     * 获取故事内容
     * @returns {string} 故事文本
     */
    getStory() {
        return this.currentStory;
    }
    
    /**
     * 设置加载状态
     * @param {boolean} loading - 是否正在加载
     */
    setLoading(loading) {
        this.isLoading = loading;
        this.eventBus.emit('locationAction.loadingChanged', loading);
    }
    
    /**
     * 获取加载状态
     * @returns {boolean} 是否正在加载
     */
    getLoading() {
        return this.isLoading;
    }
    
    /**
     * 获取场景图片路径（支持表面/暗面不同图片）
     * @returns {Promise<string>} 图片路径
     */
    async getSceneImagePath() {
        if (!this.currentLocation) {
            return 'assets/images/placeholder.jpg';
        }
        
        // 获取地点行动服务
        const locationActionService = this.serviceLocator?.get('locationAction');
        if (locationActionService && typeof locationActionService.getLocationImagePath === 'function') {
            return await locationActionService.getLocationImagePath(this.currentLocation);
        }
        
        // 如果服务不可用，根据访问类型使用对应的名称并使用配置的路径
        const imageName = this.currentLocation.accessType === 'covert' 
            ? this.currentLocation.realName 
            : this.currentLocation.locationName;
            
        // 获取配置路径
        const config = window.locationActionConfig?.imagePaths;
        const locationsDir = config?.locationsDir || 'assets/images/locations/';
        
        return `${locationsDir}${imageName}.jpg`;
    }
    
    /**
     * 重置模型状态
     */
    reset() {
        this.currentLocation = null;
        this.currentStory = '';
        this.isLoading = false;
        this.isVisible = false;
        console.log("地点行动模型状态已重置");
    }
} 