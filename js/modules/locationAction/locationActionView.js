// js/modules/locationAction/locationActionView.js
/**
 * 地点行动视图
 * 负责DOM操作和界面渲染
 */
class LocationActionView {
    constructor(serviceLocator) {
        // 依赖注入
        this.serviceLocator = serviceLocator || window.ServiceLocator;
        this.domUtils = this.serviceLocator?.get('domUtils') || window.DOMUtils;
        this.eventBus = this.serviceLocator?.get('eventBus') || window.EventBus || EventBus;
        
        // 获取界面元素
        this.interface = this.domUtils.get('#locationActionInterface');
        this.sceneImage = this.domUtils.get('#locationSceneImage');
        this.locationName = this.domUtils.get('#sceneLocationName');
        this.storyContent = this.domUtils.get('#locationStoryContent');
        
        // 初始化检查
        this.checkElements();
        
        console.log("地点行动视图已初始化");
    }
    
    /**
     * 检查关键DOM元素是否存在
     */
    checkElements() {
        if (!this.interface) {
            console.error("地点行动界面元素未找到: #locationActionInterface");
        }
        if (!this.sceneImage) {
            console.error("场景图片元素未找到: #locationSceneImage");
        }
        if (!this.locationName) {
            console.error("地点名称元素未找到: #sceneLocationName");
        }
        if (!this.storyContent) {
            console.error("故事内容元素未找到: #locationStoryContent");
        }
    }
    
    /**
     * 显示地点场景
     * @param {object} locationData - 地点数据
     */
    async showLocation(locationData) {
        console.log("显示地点场景:", locationData?.locationName);
        
        // 更新地点名称
        if (this.locationName && locationData) {
            this.locationName.textContent = locationData.locationName || '未知地点';
        }
        
        // 更新场景图片
        if (this.sceneImage && locationData) {
            try {
                // 获取地点行动服务来检测图片格式
                const locationActionService = this.serviceLocator?.get('locationAction');
                let imagePath;
                
                if (locationActionService && typeof locationActionService.getLocationImagePath === 'function') {
                    // 使用服务检测最佳图片格式（传入完整的locationData）
                    imagePath = await locationActionService.getLocationImagePath(locationData);
                } else {
                    // 如果服务不可用，根据访问类型选择图片名称并使用配置的路径
                    const imageName = locationData.accessType === 'covert' 
                        ? locationData.realName 
                        : locationData.locationName;
                    
                    // 获取配置路径
                    const config = window.locationActionConfig?.imagePaths;
                    const locationsDir = config?.locationsDir || 'assets/images/locations/';
                    
                    imagePath = `${locationsDir}${imageName}.jpg`;
                }
                
                this.sceneImage.src = imagePath;
                this.sceneImage.alt = `${locationData.locationName}场景`;
                
                // 处理图片加载错误
                this.sceneImage.onerror = () => {
                    console.warn(`场景图片加载失败: ${imagePath}`);
                    // 使用配置的默认占位图
                    const config = window.locationActionConfig?.imagePaths;
                    const placeholder = config?.placeholder || 'assets/images/placeholder.jpg';
                    this.sceneImage.src = placeholder;
                };
                
            } catch (error) {
                console.error('加载地点图片时出错:', error);
                // 使用配置的默认占位图
                const config = window.locationActionConfig?.imagePaths;
                const placeholder = config?.placeholder || 'assets/images/placeholder.jpg';
                this.sceneImage.src = placeholder;
            }
        }
    }
    
    /**
     * 更新故事内容
     * @param {string} storyText - 故事文本
     */
    updateStory(storyText) {
        if (this.storyContent) {
            // 清除加载样式
            this.domUtils.removeClass(this.storyContent, 'story-loading');
            
            // 更新内容
            this.storyContent.textContent = storyText || '暂无故事内容';
            
            // 滚动到顶部
            this.storyContent.scrollTop = 0;
            
            console.log("故事内容已更新");
        }
    }
    
    /**
     * 显示加载状态
     */
    showLoading() {
        if (this.storyContent) {
            this.domUtils.addClass(this.storyContent, 'story-loading');
            this.storyContent.innerHTML = '<div class="story-loading-text">正在生成故事内容</div>';
            console.log("显示加载状态");
        }
    }
    
    /**
     * 隐藏加载状态
     */
    hideLoading() {
        if (this.storyContent) {
            this.domUtils.removeClass(this.storyContent, 'story-loading');
            console.log("隐藏加载状态");
        }
    }
    
    /**
     * 显示错误信息
     * @param {string} errorMessage - 错误信息
     */
    showError(errorMessage) {
        if (this.storyContent) {
            this.hideLoading();
            this.storyContent.innerHTML = `<div class="story-error">错误: ${errorMessage}</div>`;
            console.error("显示错误信息:", errorMessage);
        }
    }
    
    /**
     * 清空界面内容
     */
    clear() {
        if (this.locationName) {
            this.locationName.textContent = '';
        }
        
        if (this.sceneImage) {
            this.sceneImage.src = '';
            this.sceneImage.alt = '';
        }
        
        if (this.storyContent) {
            this.storyContent.textContent = '';
            this.hideLoading();
        }
        
        console.log("界面内容已清空");
    }
    
    /**
     * 设置界面可见性
     * @param {boolean} visible - 是否可见
     */
    setVisibility(visible) {
        if (this.interface) {
            this.domUtils.toggle(this.interface, visible, 'flex');
        }
    }
    
    /**
     * 获取界面可见性
     * @returns {boolean} 是否可见
     */
    getVisibility() {
        if (this.interface) {
            return this.interface.style.display !== 'none';
        }
        return false;
    }
} 