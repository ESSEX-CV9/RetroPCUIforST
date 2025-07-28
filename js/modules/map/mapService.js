// js/modules/map/mapService.js
/**
 * 地图服务
 * 负责地图相关的业务逻辑
 */
class MapService {
    constructor() {
        console.log("地图服务已初始化");
    }
    
    /**
     * 处理地点进入操作
     * @param {object} selectedLocation - 选中的地点信息
     * @param {boolean} isShowingHidden - 是否显示隐藏信息
     * @param {object} mapModel - 地图模型实例
     * @returns {object} 处理结果
     */
    handleLocationEntry(selectedLocation, isShowingHidden, mapModel) {
        if (!selectedLocation || !mapModel) {
            return {
                success: false,
                error: '缺少必要参数'
            };
        }
        
        // 检查访问权限
        const canAccess = this.checkLocationAccess(selectedLocation, isShowingHidden);
        
        if (!canAccess.hasAccess) {
            return {
                success: false,
                error: `${canAccess.accessType}无法进入: ${selectedLocation.displayName} - 权限不足`,
                accessType: canAccess.accessType
            };
        }
        
        // 更新当前位置
        const updateSuccess = mapModel.setCurrentLocation(selectedLocation.originalName);
        if (!updateSuccess) {
            return {
                success: false,
                error: '更新当前位置失败'
            };
        }
        
        // 构建地点进入事件数据
        const locationEventData = {
            locationName: selectedLocation.displayName,
            realName: selectedLocation.realName,
            hasPublicAccess: selectedLocation.publicAccess,
            hasCovertAccess: selectedLocation.covertAccess,
            isShowingHidden: isShowingHidden,
            accessType: isShowingHidden ? 'covert' : 'public'
        };
        
        return {
            success: true,
            locationEventData: locationEventData,
            accessType: canAccess.accessType,
            message: `${canAccess.accessType}进入地点: ${selectedLocation.displayName}`
        };
    }
    
    /**
     * 检查地点访问权限
     * @param {object} location - 地点信息
     * @param {boolean} isShowingHidden - 是否显示隐藏信息
     * @returns {object} 权限检查结果
     */
    checkLocationAccess(location, isShowingHidden) {
        let canAccess, accessType;
        
        if (isShowingHidden) {
            // 显示暗面信息时，检查秘密身份权限
            canAccess = location.covertAccess;
            accessType = '秘密身份';
        } else {
            // 显示表面信息时，检查公开身份权限
            canAccess = location.publicAccess;
            accessType = '公开身份';
        }
        
        return {
            hasAccess: canAccess,
            accessType: accessType
        };
    }
    
    /**
     * 获取地点的显示状态
     * @param {HTMLElement} locationInfo - 地点信息DOM元素
     * @returns {boolean} 是否显示隐藏信息
     */
    getLocationDisplayState(locationInfo) {
        if (!locationInfo) return false;
        
        const infoFrame = locationInfo.querySelector('#locationInfoFrame');
        return infoFrame?.dataset.showingHidden === 'true';
    }
    
    /**
     * 处理位置更新请求
     * @param {string} locationName - 位置名称
     * @param {object} mapModel - 地图模型实例
     * @returns {boolean} 更新是否成功
     */
    updateCurrentLocation(locationName, mapModel) {
        if (!locationName || !mapModel) {
            console.error('地图服务: 更新位置参数无效');
            return false;
        }
        
        const success = mapModel.setCurrentLocation(locationName);
        if (success) {
            console.log(`地图服务: 当前位置已更新为 ${locationName}`);
        } else {
            console.error(`地图服务: 更新位置失败 - ${locationName} 不存在`);
        }
        
        return success;
    }
    
    /**
     * 获取位置信息
     * @param {string} locationName - 位置名称
     * @param {object} mapModel - 地图模型实例
     * @returns {object|null} 位置信息
     */
    getLocationInfo(locationName, mapModel) {
        if (!locationName || !mapModel) {
            return null;
        }
        
        return mapModel.getLocation(locationName);
    }
    
    /**
     * 验证位置是否可访问
     * @param {string} locationName - 位置名称
     * @param {object} mapModel - 地图模型实例
     * @returns {boolean} 位置是否可见且可访问
     */
    validateLocationAccess(locationName, mapModel) {
        if (!locationName || !mapModel) {
            return false;
        }
        
        const location = mapModel.getLocation(locationName);
        return location && location.isVisible;
    }
}
