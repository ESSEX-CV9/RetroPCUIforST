// js/main.js - 重构版本

// 初始化游戏
function initializeGame() {
    try {
        console.log("初始化游戏...");
        
        // 0. 首先初始化页面管理器
        if (window.PageManager) {
            console.log("初始化页面管理器...");
            window.PageManager.initialize();
            console.log("页面管理器初始化完成，游戏将从HOME页面开始");
            return; // 页面管理器已接管初始化流程
        }
        
        // 1. 初始化游戏核心（仅在直接访问终端模式时，旧版本兼容）
        window.GameCore.initialize().then(() => {
            console.log("游戏初始化完成（旧版本兼容模式）");
        });
    } catch (error) {
        console.error("游戏初始化失败:", error);
        alert("游戏初始化失败，请查看控制台以获取详细信息。");
    }
}

// 新增：直接初始化游戏核心的函数（用于页面管理器调用）
function initializeGameCore() {
    return new Promise((resolve, reject) => {
        try {
            console.log("初始化游戏核心...");
            
            // 1. 初始化游戏核心（只初始化基础服务）
            window.GameCore.initialize().then(() => {
                console.log("游戏核心初始化完成");
                resolve();
            });
        } catch (error) {
            console.error("游戏核心初始化失败:", error);
            reject(error);
        }
    });
}

// 暴露给页面管理器使用
window.initializeGameCore = initializeGameCore;

// 确保所有依赖文件已加载后再初始化游戏
window.onload = function() {
    // 检查必要组件是否存在
    if (!window.PageManager) {
        console.error("PageManager 未加载。请确保 pageManager.js 文件已正确引入。");
        return;
    }
    
    if (!window.GameCore) {
        console.error("GameCore 未加载。请确保 gameCore.js 文件已正确引入。");
        return;
    }
    
    if (!window.ServiceLocator) {
        console.error("ServiceLocator 未加载。请确保 serviceLocator.js 文件已正确引入。");
        return;
    }
    
    if (!window.DOMUtils) {
        console.warn("DOMUtils 未加载。某些 DOM 操作可能不可用。");
    }
    
    if (!window.StorageUtils) {
        console.warn("StorageUtils 未加载。本地存储功能可能受限。");
    }
    
    // 所有必要组件都已加载，初始化游戏
    initializeGame();
};