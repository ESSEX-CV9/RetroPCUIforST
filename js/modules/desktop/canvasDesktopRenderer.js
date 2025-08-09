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
        this.videos = {};
        this.loadedImages = 0;
        this.totalImages = 0;
        this.loadedVideos = 0;
        this.totalVideos = 0;
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
                image: 'http://localhost:5500/assets/images/room/Computer.png',
                x: 395,     // 左上角X坐标
                y: 339,    // 左上角Y坐标
                width: 904,  // 物品宽度
                height: 742, // 物品高度
                action: 'terminal',
                tooltip: '进入终端系统',
                enabled: true,
                // 标签形变（可按需微调）
                labelTransform: {
                    offsetX: -100,
                    offsetY: -180,
                    rotationDeg: -8,
                    skewXDeg: -5,
                    skewYDeg: 0,
                    scaleX: 2,
                    scaleY: 2
                },
                // 视频配置
                video: {
                    src: 'http://localhost:5500/assets/images/room/Screen.MP4',
                    x: 445,      // 视频在电脑屏幕内的相对位置X (需手动调整)
                    y: 410,      // 视频在电脑屏幕内的相对位置Y (需手动调整)
                    width: 350,  // 视频宽度 (需手动调整)
                    height: 250, // 视频高度 (需手动调整)
                    rotation: -7  // 旋转角度 (度) (需手动调整)
                }
            },
            map: {
                name: 'map',
                image: 'http://localhost:5500/assets/images/room/MAP.png',
                x: 695,
                y: 0,
                width: 1522,
                height: 333,
                action: 'map',
                tooltip: '查看地图',
                enabled: true,
                labelTransform: {
                    offsetX: 10,
                    offsetY: 12,
                    rotationDeg: 0,
                    skewXDeg: 0,
                    skewYDeg: 0,
                    scaleX: 1.6,
                    scaleY: 1.6
                }
            },
            gun: {
                name: 'gun',
                image: 'http://localhost:5500/assets/images/room/GUN.png',
                x: 2019,
                y: 939,
                width: 502,
                height: 244,
                action: 'battle',
                tooltip: '武器系统（开发中）',
                enabled: false,
                labelTransform: {
                    offsetX: 0,
                    offsetY: 128,
                    rotationDeg: 14,
                    skewXDeg: 0,
                    skewYDeg: 0,
                    scaleX: 2,
                    scaleY: 2
                }
            },
            doc1: {
                name: 'doc1',
                image: 'http://localhost:5500/assets/images/room/DOC_1.png',
                x: 1625,
                y: 364,
                width: 820,
                height: 510,
                action: 'docs',
                tooltip: '文档系统（开发中）',
                enabled: false,
                labelTransform: {
                    offsetX: 0,
                    offsetY: 0,
                    rotationDeg: 0,
                    skewXDeg: 0,
                    skewYDeg: 0,
                    scaleX: 1.6,
                    scaleY: 1.6
                }
            },
            settings: {
                name: 'settings',
                image: 'http://localhost:5500/assets/images/room/DOC_2.png',
                x: 2241,
                y: 599,
                width: 575,
                height: 448,
                action: 'settings',
                tooltip: '游戏设置（开发中）',
                enabled: false,
                labelTransform: {
                    offsetX: 0,
                    offsetY: 0,
                    rotationDeg: 0,
                    skewXDeg: 0,
                    skewYDeg: 0,
                    scaleX: 1.6,
                    scaleY: 1.6
                }
            },
            chair: {
                name: 'chair',
                image: 'http://localhost:5500/assets/images/room/Chair.png',
                x: 787,
                y: 1304,
                width: 1213,
                height: 232,
                action: 'home',
                tooltip: '返回主页',
                enabled: true,
                labelTransform: {
                    offsetX: 0,
                    offsetY: -10,
                    rotationDeg: 0,
                    skewXDeg: 0,
                    skewYDeg: 0,
                    scaleX: 2,
                    scaleY: 2
                }
            }
        };
        
        // 常驻标签配置
        this.showPersistentLabels = true;
        this.labelStyle = {
            fontFamily: "'VT323', monospace", // 与全局 zpix 字体一致
            baseFontSize: 28,
            minFontSize: 14,
            paddingX: 12,
            paddingY: 6,
            bgColorEnabled: 'rgba(0, 0, 0, 0.6)',
            bgColorDisabled: 'rgba(0, 0, 0, 0.5)',
            textColorEnabled: '#00ff88',
            textColorDisabled: '#888888',
            borderColorEnabled: 'rgba(0, 255, 136, 0.6)',
            borderColorDisabled: 'rgba(255, 255, 255, 0.2)',
            borderWidth: 1,
            borderRadius: 6,
            maxLabelWidthRatio: 0.8
        };
        
        // 标签动画配置
        this.labelAnimation = {
            enabled: true,
            // 垂直轻微浮动（像素，基于未缩放坐标）
            floatAmplitude: 10,
            floatSpeed: 1.1,
            // 辉光强度脉冲
            glowEnabled: true,
            glowBlur: 12,
            glowMinAlpha: 0.15,
            glowMaxAlpha: 0.45,
            glowSpeed: 1.0
        };
        
        // 动画起始时间
        this._animStart = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        
        // 当前悬停的物品
        this.hoveredItem = null;
        this.tooltip = null;

        // 标签命中区域缓存（每帧更新）
        this.labelHitAreas = {};
        // 悬停状态（区分是否悬在标签上）
        this.hoverState = { itemName: null, overLabel: false };
        
        // 事件处理器
        this.onItemClick = null;
        this.onLoadComplete = null;
        
        // 动画循环ID
        this.animationId = null;
        
        // 绑定事件
        this.bindEvents();
        
        // 开始加载资源
        this.loadImages();
    }
    
    /**
     * 加载所有图片和视频资源
     */
    async loadImages() {
        const imagesToLoad = [
            { name: 'background', src: 'http://localhost:5500/assets/images/room/Desk_base.png' },
            ...Object.values(this.items).map(item => ({ name: item.name, src: item.image }))
        ];
        
        // 收集需要加载的视频
        const videosToLoad = Object.values(this.items)
            .filter(item => item.video)
            .map(item => ({ name: item.name, src: item.video.src }));
        
        this.totalImages = imagesToLoad.length;
        this.totalVideos = videosToLoad.length;
        this.loadedImages = 0;
        this.loadedVideos = 0;
        
        console.log(`开始加载 ${this.totalImages} 张桌面图片和 ${this.totalVideos} 个视频...`);
        
        const loadPromises = imagesToLoad.map(imageInfo => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.images[imageInfo.name] = img;
                    this.loadedImages++;
                    console.log(`已加载图片: ${imageInfo.src} (${this.loadedImages}/${this.totalImages})`);
                    
                    this.checkLoadComplete();
                    resolve();
                };
                img.onerror = () => {
                    console.error(`图片加载失败: ${imageInfo.src}`);
                    reject(new Error(`Failed to load ${imageInfo.src}`));
                };
                img.src = imageInfo.src;
            });
        });
        
        // 视频加载
        const videoLoadPromises = videosToLoad.map(videoInfo => {
            return new Promise((resolve, reject) => {
                const video = document.createElement('video');
                video.muted = true;
                video.loop = true;
                video.autoplay = true;
                video.playsInline = true;
                
                video.addEventListener('loadeddata', () => {
                    this.videos[videoInfo.name] = video;
                    this.loadedVideos++;
                    console.log(`已加载视频: ${videoInfo.src} (${this.loadedVideos}/${this.totalVideos})`);
                    
                    // 开始播放视频
                    video.play().catch(e => console.warn('视频自动播放失败:', e));
                    
                    this.checkLoadComplete();
                    resolve();
                });
                
                video.addEventListener('error', () => {
                    console.error(`视频加载失败: ${videoInfo.src}`);
                    this.loadedVideos++; // 即使失败也要增加计数，避免卡住
                    this.checkLoadComplete();
                    reject(new Error(`Failed to load ${videoInfo.src}`));
                });
                
                video.src = videoInfo.src;
                video.load();
            });
        });
        
        try {
            await Promise.all([...loadPromises, ...videoLoadPromises]);
        } catch (error) {
            console.error('资源加载过程中出现错误:', error);
        }
    }
    
    /**
     * 检查所有资源是否加载完成
     */
    checkLoadComplete() {
        if (this.loadedImages === this.totalImages && this.loadedVideos === this.totalVideos) {
            this.isLoaded = true;
            console.log('所有桌面资源加载完成');
            this.resize();
            this.startAnimation();
            if (this.onLoadComplete) {
                this.onLoadComplete();
            }
        }
    }
    
    /**
     * 开始动画循环（用于视频渲染）
     */
    startAnimation() {
        const animate = () => {
            this.render();
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }
    
    /**
     * 停止动画循环
     */
    stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
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
            
            // 先绘制视频（作为背景层）
            if (item.video && this.videos[item.name]) {
                this.drawItemVideo(item);
            }
            
            // 再绘制物品图片（前景层）
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
            
            // 绘制物品图片
            this.ctx.drawImage(
                this.images[item.name],
                item.x,
                item.y,
                item.width,
                item.height
            );
            
            this.ctx.restore();
        });
        
        // 绘制常驻标签（位于每个物品几何中心）
        const t = ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - this._animStart) / 1000;
        if (this.showPersistentLabels) {
            this.drawItemLabels(t);
        }
        
        // 恢复上下文状态
        this.ctx.restore();
    }
    
    /**
     * 绘制物品上的视频
     * @param {object} item - 物品对象
     */
    drawItemVideo(item) {
        const video = this.videos[item.name];
        const videoConfig = item.video;
        
        this.ctx.save();
        
        // 计算视频在画布上的位置（相对于物品的绝对位置）
        const videoX = videoConfig.x;
        const videoY = videoConfig.y;
        
        // 如果有旋转，先移动到旋转中心
        if (videoConfig.rotation) {
            const centerX = videoX + videoConfig.width / 2;
            const centerY = videoY + videoConfig.height / 2;
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate((videoConfig.rotation * Math.PI) / 180);
            this.ctx.translate(-centerX, -centerY);
        }
        
        // 第一层：绘制辉光效果（背景光晕）
        this.drawVideoGlow(videoX, videoY, videoConfig.width, videoConfig.height);
        
        // 第二层：绘制主视频内容（降低饱和度）
        this.ctx.filter = 'saturate(0.4) brightness(0.75)'; // 降低饱和度到60%，稍微降低亮度
        this.ctx.drawImage(
            video,
            videoX,
            videoY,
            videoConfig.width,
            videoConfig.height
        );
        this.ctx.filter = 'none'; // 重置滤镜
        
        // 第三层：前景辉光效果（屏幕反射）
        this.drawVideoForegroundGlow(videoX, videoY, videoConfig.width, videoConfig.height);
        
        this.ctx.restore();
    }
    
    /**
     * 绘制视频背景辉光效果
     */
    drawVideoGlow(x, y, width, height) {
        const glowSize = 15;
        const glowColor = 'rgba(100, 150, 255, 0.3)'; // 蓝色辉光
        
        // 创建径向渐变
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const maxRadius = Math.max(width, height) / 2 + glowSize;
        
        const gradient = this.ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, maxRadius
        );
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(0.7, 'rgba(100, 150, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(100, 150, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(
            x - glowSize, 
            y - glowSize, 
            width + glowSize * 2, 
            height + glowSize * 2
        );
    }
    
    /**
     * 绘制视频前景辉光效果
     */
    drawVideoForegroundGlow(x, y, width, height) {
        // 添加微妙的屏幕反射效果
        const glowGradient = this.ctx.createLinearGradient(x, y, x, y + height);
        glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        glowGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.05)');
        glowGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0)');
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
        
        this.ctx.fillStyle = glowGradient;
        this.ctx.fillRect(x, y, width, height);
        
        // 添加边缘高光
        this.ctx.strokeStyle = 'rgba(150, 200, 255, 0.4)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x, y, width, height);
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
            
            const target = this.getHoverTargetAt(x, y);
            const newHoveredItem = target ? target.item : null;
            const overLabel = !!(target && target.type === 'label');
            const hoverChanged = (newHoveredItem !== this.hoveredItem) || (overLabel !== this.hoverState.overLabel);

            if (hoverChanged) {
                this.hoveredItem = newHoveredItem;
                this.hoverState = { itemName: newHoveredItem ? newHoveredItem.name : null, overLabel };
                this.updateCursor();
                this.render();
                if (newHoveredItem) this.updateTooltip(e, newHoveredItem); else this.hideTooltip();
            } else if (newHoveredItem) {
                // 更新 tooltip 跟随位置
                this.updateTooltip(e, newHoveredItem);
            }
        });
        
        // 鼠标点击事件
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.scale;
            const y = (e.clientY - rect.top) / this.scale;
            
            const target = this.getHoverTargetAt(x, y);
            const clickedItem = target ? target.item : null;
            if (clickedItem && clickedItem.enabled && this.onItemClick) {
                this.onItemClick(clickedItem.action, clickedItem);
            }
        });
        
        // 鼠标离开事件
        this.canvas.addEventListener('mouseleave', () => {
            if (this.hoveredItem) {
                this.hoveredItem = null;
                this.hoverState = { itemName: null, overLabel: false };
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
     * 获取悬停目标：优先检测标签命中，其次检测底层物品
     */
    getHoverTargetAt(x, y) {
        // 先检测标签 AABB，再进行多边形精确判定
        for (const [name, area] of Object.entries(this.labelHitAreas)) {
            if (!area || !area.aabb) continue;
            const aabb = area.aabb;
            if (this.isPointInAABB(x, y, aabb)) {
                if (area.points && this.isPointInPolygon(x, y, area.points)) {
                    return { type: 'label', item: area.item };
                }
                // 退化情况下仅用 AABB
                return { type: 'label', item: area.item };
            }
        }
        // 否则回退到物品矩形
        const item = this.getItemAt(x, y);
        return item ? { type: 'item', item } : null;
    }

    isPointInAABB(x, y, aabb) {
        return x >= aabb.minX && x <= aabb.maxX && y >= aabb.minY && y <= aabb.maxY;
    }

    isPointInPolygon(x, y, points) {
        // 射线法
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i].x, yi = points[i].y;
            const xj = points[j].x, yj = points[j].y;
            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
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
                font-family: 'VT323', monospace;
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
        // 停止动画循环
        this.stopAnimation();
        
        // 移除事件监听器
        window.removeEventListener('resize', this.resize);
        
        // 清理提示框
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
        
        // 清理视频资源
        Object.values(this.videos).forEach(video => {
            video.pause();
            video.src = '';
            video.load();
        });
        this.videos = {};
        
        // 清理图片资源
        this.images = {};
        this.isLoaded = false;
    }

    // 绘制所有物品的常驻标签（带动画时间）
    drawItemLabels(t) {
        const entries = Object.values(this.items);
        for (let i = 0; i < entries.length; i++) {
            const item = entries[i];
            const text = item.label || item.tooltip;
            if (!text) continue;
            this.drawLabelAtCenter(item, text, item.enabled !== false, t, i);
        }
    }

    // 在物品中心绘制标签（带圆角底板、动画与仿透视变换）
    drawLabelAtCenter(item, text, isEnabled, t = 0, index = 0) {
        const { paddingX, paddingY, baseFontSize, minFontSize, fontFamily, borderRadius, borderWidth,
                bgColorEnabled, bgColorDisabled, textColorEnabled, textColorDisabled,
                borderColorEnabled, borderColorDisabled, maxLabelWidthRatio } = this.labelStyle;
        const anim = this.labelAnimation;

        // 字体适配（根据可用宽度缩放）
        const maxTextWidth = item.width * maxLabelWidthRatio;
        const fontSize = this.fitFontSizeToWidth(text, maxTextWidth, baseFontSize, minFontSize, fontFamily);
        
        // 设置字体与对齐
        this.ctx.font = `${fontSize}px ${fontFamily}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        // 测量文本尺寸
        const textWidth = this.ctx.measureText(text).width;
        const textHeight = fontSize; // 近似
        const boxWidth = textWidth + paddingX * 2;
        const boxHeight = textHeight + paddingY * 2;

        // 颜色
        const bgColor = isEnabled ? bgColorEnabled : bgColorDisabled;
        const textColor = isEnabled ? textColorEnabled : textColorDisabled;
        const borderColor = isEnabled ? borderColorEnabled : borderColorDisabled;

        // 物品中心
        const centerX = item.x + item.width / 2;
        const centerY = item.y + item.height / 2;

        // 动画浮动与辉光脉冲
        const phase = index * 0.9; // 让不同标签相位不同
        const floatOffsetY = (anim.enabled ? Math.sin(t * anim.floatSpeed + phase) * anim.floatAmplitude : 0);
        const glowAlpha = (anim.enabled && anim.glowEnabled)
            ? (anim.glowMinAlpha + (Math.sin(t * anim.glowSpeed + phase) + 1) / 2 * (anim.glowMaxAlpha - anim.glowMinAlpha))
            : 0;

        // 每标签变换（位移/旋转/倾斜模拟透视）
        const lt = item.labelTransform || {};
        const offsetX = lt.offsetX || 0;
        const offsetY = lt.offsetY || 0;
        const rotationDeg = lt.rotationDeg || 0;
        let scaleX = (lt.scaleX == null ? 1 : lt.scaleX);
        let scaleY = (lt.scaleY == null ? 1 : lt.scaleY);
        const skewXDeg = lt.skewXDeg || 0; // 通过倾斜模拟透视
        const skewYDeg = lt.skewYDeg || 0;
 
        // 悬浮在标签或按钮图片上时的额外高亮效果
        const isHoveredItem = !!(this.hoverState && this.hoverState.itemName === item.name);
        const isHoveredLabel = !!(this.hoverState && this.hoverState.itemName === item.name && this.hoverState.overLabel);
        const isHoveredActive = isHoveredItem || isHoveredLabel;
        if (isHoveredActive) {
            scaleX *= 1.06;
            scaleY *= 1.06;
        }

        // 保存上下文，应用复合变换（以标签中心为锚点0,0）
        this.ctx.save();
        this.ctx.translate(centerX + offsetX, centerY + offsetY + floatOffsetY);
        if (rotationDeg) this.ctx.rotate(this.degToRad(rotationDeg));
        if (scaleX !== 1 || scaleY !== 1) this.ctx.scale(scaleX, scaleY);
        if (skewXDeg) this.ctx.transform(1, 0, Math.tan(this.degToRad(skewXDeg)), 1, 0, 0);
        if (skewYDeg) this.ctx.transform(1, Math.tan(this.degToRad(skewYDeg)), 0, 1, 0, 0);

        // 半透明底板（带可选辉光）
        if (anim.enabled && anim.glowEnabled && (glowAlpha > 0 || isHoveredActive) && isEnabled) {
            this.ctx.shadowBlur = anim.glowBlur + (isHoveredActive ? 6 : 0);
            this.ctx.shadowColor = `rgba(0, 255, 160, ${(Math.max(glowAlpha, 0.35 * (isHoveredActive ? 1 : 0))).toFixed(3)})`;
        } else {
            this.ctx.shadowBlur = 0;
        }

        // 底板路径（以当前变换坐标为中心绘制）
        const rectX = -boxWidth / 2;
        const rectY = -boxHeight / 2;
        this.drawRoundedRect(rectX, rectY, boxWidth, boxHeight, borderRadius);
        this.ctx.fillStyle = bgColor;
        this.ctx.fill();

        // 边框
        if (borderWidth > 0) {
            this.ctx.lineWidth = borderWidth + (isHoveredActive ? 1 : 0);
            this.ctx.strokeStyle = isHoveredActive ? 'rgba(0, 255, 200, 0.9)' : borderColor;
            this.ctx.stroke();
        }

        // 文本
        this.ctx.fillStyle = textColor;
        this.ctx.fillText(text, 0, 0);

        // 记录标签命中区域（记录当前帧的最终形态，包含悬浮放大）
        const matrix = this.composeTransformMatrix(centerX + offsetX, centerY + offsetY + floatOffsetY, rotationDeg, scaleX, scaleY, skewXDeg, skewYDeg);
        const localCorners = [
            { x: -boxWidth / 2, y: -boxHeight / 2 },
            { x:  boxWidth / 2, y: -boxHeight / 2 },
            { x:  boxWidth / 2, y:  boxHeight / 2 },
            { x: -boxWidth / 2, y:  boxHeight / 2 }
        ];
        const worldPoints = localCorners.map(p => this.applyMatrixToPoint(matrix, p.x, p.y));
        const aabb = {
            minX: Math.min(...worldPoints.map(p => p.x)),
            minY: Math.min(...worldPoints.map(p => p.y)),
            maxX: Math.max(...worldPoints.map(p => p.x)),
            maxY: Math.max(...worldPoints.map(p => p.y))
        };
        this.labelHitAreas[item.name] = { points: worldPoints, aabb, item };

        // 还原上下文
        this.ctx.restore();
    }

    // 使字体适配最大宽度
    fitFontSizeToWidth(text, maxWidth, baseSize, minSize, fontFamily) {
        let size = baseSize;
        this.ctx.font = `${size}px ${fontFamily}`;
        let width = this.ctx.measureText(text).width;
        while (width > maxWidth && size > minSize) {
            size -= 1;
            this.ctx.font = `${size}px ${fontFamily}`;
            width = this.ctx.measureText(text).width;
        }
        return size;
    }

    // 绘制圆角矩形路径
    drawRoundedRect(x, y, width, height, radius) {
        const r = Math.min(radius, width / 2, height / 2);
        this.ctx.beginPath();
        this.ctx.moveTo(x + r, y);
        this.ctx.lineTo(x + width - r, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        this.ctx.lineTo(x + width, y + height - r);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        this.ctx.lineTo(x + r, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        this.ctx.lineTo(x, y + r);
        this.ctx.quadraticCurveTo(x, y, x + r, y);
        // 注意：仅创建路径，填充/描边在调用处完成
    }

    // 角度转弧度
    degToRad(deg) {
        return (deg * Math.PI) / 180;
    }

    // 组合 2D 变换矩阵（与 Canvas 应用顺序一致）：T * R * S * SkX * SkY
    composeTransformMatrix(tx, ty, rotationDeg, scaleX, scaleY, skewXDeg, skewYDeg) {
        const toRad = (deg) => (deg * Math.PI) / 180;
        const cos = Math.cos(this.degToRad(rotationDeg || 0));
        const sin = Math.sin(this.degToRad(rotationDeg || 0));

        const mTranslate = { a: 1, b: 0, c: 0, d: 1, e: tx, f: ty };
        const mRotate    = { a: cos, b: sin, c: -sin, d: cos, e: 0, f: 0 };
        const mScale     = { a: scaleX || 1, b: 0, c: 0, d: scaleY || 1, e: 0, f: 0 };
        const mSkewX     = { a: 1, b: 0, c: Math.tan(toRad(skewXDeg || 0)), d: 1, e: 0, f: 0 };
        const mSkewY     = { a: 1, b: Math.tan(toRad(skewYDeg || 0)), c: 0, d: 1, e: 0, f: 0 };

        // M = T * R * S * SkX * SkY
        let M = this.multiplyMatrix(mTranslate, mRotate);
        M = this.multiplyMatrix(M, mScale);
        M = this.multiplyMatrix(M, mSkewX);
        M = this.multiplyMatrix(M, mSkewY);
        return M;
    }

    multiplyMatrix(m1, m2) {
        return {
            a: m1.a * m2.a + m1.c * m2.b,
            b: m1.b * m2.a + m1.d * m2.b,
            c: m1.a * m2.c + m1.c * m2.d,
            d: m1.b * m2.c + m1.d * m2.d,
            e: m1.a * m2.e + m1.c * m2.f + m1.e,
            f: m1.b * m2.e + m1.d * m2.f + m1.f
        };
    }

    applyMatrixToPoint(m, x, y) {
        return { x: m.a * x + m.c * y + m.e, y: m.b * x + m.d * y + m.f };
    }
}

// 导出类
window.CanvasDesktopRenderer = CanvasDesktopRenderer;

