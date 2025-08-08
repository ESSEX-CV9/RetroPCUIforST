// js/modules/desktop/canvasDesktopRenderer.js
/**
 * Canvas桌面渲染器
 * 使用Canvas精确渲染桌面场景，解决CSS定位不准确的问题
 */
class CanvasDesktopRenderer {
    constructor(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.images = {};
        this.loadedImages = 0;
        this.totalImages = 0;
        this.isLoaded = false;
        
        // 标准桌面尺寸（基于原始图片尺寸）
        this.STANDARD_WIDTH = 2816;
        this.STANDARD_HEIGHT = 1536;
        
        // 缩放比例
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        // 物品配置（基于原始图片的绝对坐标）
        this.items = {
            computer: {
                name: 'computer',
                image: './assets/images/room/Computer.png',
                x: 395,     // 左上角X坐标
                y: 339,    // 左上角Y坐标
                width: 904,  // 物品宽度
                height: 742, // 物品高度
                action: 'terminal',
                tooltip: '进入终端系统',
                enabled: true
            },
            map: {
                name: 'map',
                image: './assets/images/room/MAP.png',
                x: 695,
                y: 0,
                width: 1522,
                height: 333,
                action: 'map',
                tooltip: '查看地图',
                enabled: true
            },
            gun: {
                name: 'gun',
                image: './assets/images/room/GUN.png',
                x: 2019,
                y: 939,
                width: 502,
                height: 244,
                action: 'battle',
                tooltip: '武器系统（开发中）',
                enabled: false
            },
            doc1: {
                name: 'doc1',
                image: './assets/images/room/DOC_1.png',
                x: 1625,
                y: 364,
                width: 820,
                height: 510,
                action: 'docs',
                tooltip: '文档系统（开发中）',
                enabled: false
            },
            settings: {
                name: 'settings',
                image: './assets/images/room/DOC_2.png',
                x: 2241,
                y: 599,
                width: 575,
                height: 448,
                action: 'settings',
                tooltip: '游戏设置（开发中）',
                enabled: false
            },
            chair: {
                name: 'chair',
                image: './assets/images/room/Chair.png',
                x: 787,
                y: 1304,
                width: 1213,
                height: 232,
                action: 'home',
                tooltip: '返回主页',
                enabled: true
            }
        };
        
        // 当前悬停的物品
        this.hoveredItem = null;
        this.tooltip = null;
        
        // 事件处理器
        this.onItemClick = null;
        this.onLoadComplete = null;
        
        // 绑定事件
        this.bindEvents();
        
        // 开始加载资源
        this.loadImages();
    }
    
    /**
     * 加载所有图片资源
     */
    async loadImages() {
        const imagesToLoad = [
            { name: 'background', src: './assets/images/room/Desk_base.png' },
            ...Object.values(this.items).map(item => ({ name: item.name, src: item.image }))
        ];
        
        this.totalImages = imagesToLoad.length;
        this.loadedImages = 0;
        
        console.log(`开始加载 ${this.totalImages} 张桌面图片...`);
        
        const loadPromises = imagesToLoad.map(imageInfo => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.images[imageInfo.name] = img;
                    this.loadedImages++;
                    console.log(`已加载: ${imageInfo.src} (${this.loadedImages}/${this.totalImages})`);
                    
                    if (this.loadedImages === this.totalImages) {
                        this.isLoaded = true;
                        console.log('所有桌面图片加载完成');
                        this.resize();
                        this.render();
                        if (this.onLoadComplete) {
                            this.onLoadComplete();
                        }
                    }
                    resolve();
                };
                img.onerror = () => {
                    console.error(`图片加载失败: ${imageInfo.src}`);
                    reject(new Error(`Failed to load ${imageInfo.src}`));
                };
                img.src = imageInfo.src;
            });
        });
        
        try {
            await Promise.all(loadPromises);
        } catch (error) {
            console.error('图片加载过程中出现错误:', error);
        }
    }
    
    /**
     * 调整Canvas尺寸并重新计算缩放
     */
    resize() {
        const container = this.canvas.parentElement;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // 计算缩放比例，保持宽高比
        const scaleX = containerWidth / this.STANDARD_WIDTH;
        const scaleY = containerHeight / this.STANDARD_HEIGHT;
        this.scale = Math.min(scaleX, scaleY);
        
        // 计算实际Canvas尺寸
        const canvasWidth = this.STANDARD_WIDTH * this.scale;
        const canvasHeight = this.STANDARD_HEIGHT * this.scale;
        
        // 设置Canvas尺寸
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        
        // 设置Canvas样式尺寸
        this.canvas.style.width = `${canvasWidth}px`;
        this.canvas.style.height = `${canvasHeight}px`;
        
        // 计算居中偏移
        this.offsetX = (containerWidth - canvasWidth) / 2;
        this.offsetY = (containerHeight - canvasHeight) / 2;
        
        // 设置Canvas位置
        this.canvas.style.left = `${this.offsetX}px`;
        this.canvas.style.top = `${this.offsetY}px`;
        
        console.log(`Canvas调整尺寸: ${canvasWidth}x${canvasHeight}, 缩放: ${this.scale.toFixed(3)}`);
        
        if (this.isLoaded) {
            this.render();
        }
    }
    
    /**
     * 渲染整个桌面场景
     */
    render() {
        if (!this.isLoaded) return;
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 保存上下文状态
        this.ctx.save();
        
        // 应用缩放
        this.ctx.scale(this.scale, this.scale);
        
        // 渲染背景
        if (this.images.background) {
            this.ctx.drawImage(this.images.background, 0, 0, this.STANDARD_WIDTH, this.STANDARD_HEIGHT);
        }
        
        // 渲染所有物品
        Object.values(this.items).forEach(item => {
            if (!this.images[item.name]) return;
            // 为每个物品单独保存/恢复一次上下文，保证状态平衡
            this.ctx.save();
            
            const filters = [];
            if (this.hoveredItem === item) {
                this.ctx.shadowColor = item.enabled ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 0, 0, 0.5)';
                this.ctx.shadowBlur = 20;
                filters.push('brightness(1.2)');
            }
            if (!item.enabled) {
                filters.push('grayscale(100%)', 'brightness(0.7)');
            }
            if (filters.length) {
                this.ctx.filter = filters.join(' ');
            }
            
            this.ctx.drawImage(
                this.images[item.name],
                item.x,
                item.y,
                item.width,
                item.height
            );
            
            this.ctx.restore();
        });
        
        // 恢复上下文状态
        this.ctx.restore();
    }
    
    /**
     * 绑定事件处理器
     */
    bindEvents() {
        // 鼠标移动事件
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.scale;
            const y = (e.clientY - rect.top) / this.scale;
            
            const hoveredItem = this.getItemAt(x, y);
            
            if (hoveredItem !== this.hoveredItem) {
                this.hoveredItem = hoveredItem;
                this.updateCursor();
                this.render();
                this.updateTooltip(e, hoveredItem);
            } else if (hoveredItem) {
                this.updateTooltip(e, hoveredItem);
            }
        });
        
        // 鼠标点击事件
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.scale;
            const y = (e.clientY - rect.top) / this.scale;
            
            const clickedItem = this.getItemAt(x, y);
            
            if (clickedItem && clickedItem.enabled && this.onItemClick) {
                this.onItemClick(clickedItem.action, clickedItem);
            }
        });
        
        // 鼠标离开事件
        this.canvas.addEventListener('mouseleave', () => {
            if (this.hoveredItem) {
                this.hoveredItem = null;
                this.updateCursor();
                this.render();
                this.hideTooltip();
            }
        });
        
        // 窗口大小变化事件
        window.addEventListener('resize', () => {
            this.resize();
        });
    }
    
    /**
     * 获取指定坐标下的物品
     */
    getItemAt(x, y) {
        // 从后往前遍历，确保上层物品优先
        const itemArray = Object.values(this.items);
        for (let i = itemArray.length - 1; i >= 0; i--) {
            const item = itemArray[i];
            if (x >= item.x && x <= item.x + item.width &&
                y >= item.y && y <= item.y + item.height) {
                return item;
            }
        }
        return null;
    }
    
    /**
     * 更新鼠标指针样式
     */
    updateCursor() {
        if (this.hoveredItem && this.hoveredItem.enabled) {
            this.canvas.style.cursor = 'pointer';
        } else if (this.hoveredItem && !this.hoveredItem.enabled) {
            this.canvas.style.cursor = 'not-allowed';
        } else {
            this.canvas.style.cursor = 'default';
        }
    }
    
    /**
     * 显示/更新提示框
     */
    updateTooltip(event, item) {
        if (!item || !item.tooltip) {
            this.hideTooltip();
            return;
        }
        
        if (!this.tooltip) {
            this.tooltip = document.createElement('div');
            this.tooltip.className = 'canvas-tooltip';
            this.tooltip.style.cssText = `
                position: fixed;
                background: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-family: 'Courier New', monospace;
                z-index: 10000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
                border: 1px solid #333;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            `;
            document.body.appendChild(this.tooltip);
        }
        
        this.tooltip.textContent = item.tooltip;
        this.tooltip.style.left = `${event.clientX + 10}px`;
        this.tooltip.style.top = `${event.clientY - 30}px`;
        this.tooltip.style.opacity = '1';
    }
    
    /**
     * 隐藏提示框
     */
    hideTooltip() {
        if (this.tooltip) {
            this.tooltip.style.opacity = '0';
        }
    }
    
    /**
     * 设置物品启用状态
     */
    setItemEnabled(itemName, enabled) {
        if (this.items[itemName]) {
            this.items[itemName].enabled = enabled;
            if (this.isLoaded) {
                this.render();
            }
        }
    }
    
    /**
     * 销毁渲染器，清理资源
     */
    destroy() {
        // 移除事件监听器
        window.removeEventListener('resize', this.resize);
        
        // 清理提示框
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
        
        // 清理图片资源
        this.images = {};
        this.isLoaded = false;
    }
}

// 导出类
window.CanvasDesktopRenderer = CanvasDesktopRenderer;

