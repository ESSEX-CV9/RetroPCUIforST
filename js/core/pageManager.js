// js/core/pageManager.js
/**
 * 页面管理器
 * 负责管理多个页面之间的切换和导航
 * 支持嵌入式使用和单页面应用架构
 */
class PageManager {
    constructor() {
        this.pages = {};
        this.currentPage = null;
        this.initialized = false;
        this.transitions = {
            slideLeft: 'slide-left',
            slideRight: 'slide-right',
            fadeIn: 'fade-in',
            fadeOut: 'fade-out',
            scaleIn: 'scale-in',
            scaleOut: 'scale-out'
        };
        
        // 页面历史记录
        this.history = [];
        this.maxHistorySize = 10;
        
        // 绑定键盘事件
        this.bindKeyboardEvents();
    }

    /**
     * 初始化页面管理器
     */
    initialize() {
        if (this.initialized) {
            console.log('页面管理器已初始化');
            return;
        }

        console.log('初始化页面管理器...');
        
        // 创建页面容器
        this.createPageContainer();
        
        // 注册默认页面
        this.registerDefaultPages();
        
        // 显示初始页面
        this.showPage('home');
        
        this.initialized = true;
        console.log('页面管理器初始化完成');
    }

    /**
     * 创建页面容器
     */
    createPageContainer() {
        const body = document.body;
        
        // 清空应用根容器而不是整个body（避免删除body中可能存在的CSS链接）
        const appRoot = document.getElementById('appRoot');
        if (appRoot) {
            appRoot.remove();
        }
        
        // 创建页面管理器容器
        const pageManagerContainer = document.createElement('div');
        pageManagerContainer.id = 'pageManagerContainer';
        pageManagerContainer.className = 'page-manager-container';
        
        // 创建页面容器
        const pagesContainer = document.createElement('div');
        pagesContainer.id = 'pagesContainer';
        pagesContainer.className = 'pages-container';
        
        pageManagerContainer.appendChild(pagesContainer);
        body.appendChild(pageManagerContainer);
    }

    /**
     * 注册页面
     * @param {string} name - 页面名称
     * @param {object} config - 页面配置
     */
    registerPage(name, config) {
        this.pages[name] = {
            name,
            element: null,
            controller: null,
            initialized: false,
            ...config
        };
        console.log(`页面 "${name}" 已注册`);
    }

    /**
     * 注册默认页面
     */
    registerDefaultPages() {
        // HOME页面
        this.registerPage('home', {
            title: '冷战间谍 - 主页',
            template: this.getHomePageTemplate(),
            onShow: () => this.initHomePage(),
            onHide: () => this.cleanupHomePage()
        });

        // 游戏选择页面
        this.registerPage('gameSelect', {
            title: '游戏模式选择',
            template: this.getGameSelectPageTemplate(),
            onShow: () => this.initGameSelectPage(),
            onHide: () => this.cleanupGameSelectPage()
        });

        // 终端页面（复古电脑界面）
        this.registerPage('terminal', {
            title: '复古终端系统',
            template: this.getTerminalPageTemplate(),
            onShow: () => this.initTerminalPage(),
            onHide: () => this.cleanupTerminalPage()
        });

        // 战斗页面
        this.registerPage('battle', {
            title: '战斗系统',
            template: this.getBattlePageTemplate(),
            onShow: () => this.initBattlePage(),
            onHide: () => this.cleanupBattlePage()
        });
    }

    /**
     * 显示指定页面
     * @param {string} pageName - 页面名称
     * @param {object} options - 切换选项
     */
    showPage(pageName, options = {}) {
        const page = this.pages[pageName];
        if (!page) {
            console.error(`页面不存在: ${pageName}`);
            return false;
        }

        console.log(`切换到页面: ${pageName}`);
        
        // 记录历史
        if (this.currentPage && this.currentPage !== pageName) {
            this.addToHistory(this.currentPage);
        }

        // 处理覆盖模式
        if (options.overlay) {
            this.showPageAsOverlay(pageName, options);
        } else {
            // 正常模式：隐藏当前页面
        if (this.currentPage) {
            this.hidePage(this.currentPage);
            }
            // 清理任何可能的背景模糊效果
            this.clearBackgroundBlur();
        }

        // 创建页面元素（如果不存在）
        if (!page.element) {
            this.createPageElement(page);
        }

        // 显示新页面
        this.displayPage(page, options);
        
        // 更新当前页面
        this.currentPage = pageName;
        
        // 更新标题
        if (page.title) {
            document.title = page.title;
        }

        return true;
    }

    /**
     * 以覆盖模式显示页面
     * @param {string} pageName - 页面名称
     * @param {object} options - 选项
     */
    showPageAsOverlay(pageName, options) {
        // 给所有已激活的页面（除了即将覆盖的页面）添加模糊效果
        Object.entries(this.pages).forEach(([name, pg]) => {
            if (name !== pageName && pg.element && pg.element.classList.contains('active')) {
                pg.element.classList.add('blurred-background');
            }
        });
    }

    /**
     * 清理背景模糊效果
     */
    clearBackgroundBlur() {
        // 移除所有页面的模糊效果
        Object.values(this.pages).forEach(page => {
            if (page.element) {
                page.element.classList.remove('blurred-background');
            }
        });
    }

    /**
     * 隐藏指定页面
     * @param {string} pageName - 页面名称
     */
    hidePage(pageName) {
        const page = this.pages[pageName];
        if (!page || !page.element) return;

        // 执行页面隐藏回调
        if (page.onHide) {
            page.onHide();
        }

        // 隐藏元素
        page.element.style.removeProperty('display');
        page.element.style.display = 'none';
        page.element.classList.remove('active');
        page.element.classList.remove('overlay-mode');
        page.element.classList.remove('blurred-background');
    }

    /**
     * 显示页面
     * @param {object} page - 页面对象
     * @param {object} options - 显示选项
     */
    displayPage(page, options = {}) {
        const { transition = 'fadeIn', duration = 300, overlay = false } = options;

        // 显示元素
        page.element.style.display = 'block';
        
        // 如果是覆盖模式，添加覆盖样式
        if (overlay) {
            page.element.classList.add('overlay-mode');
        } else {
            page.element.classList.remove('overlay-mode');
        }
        
        // 添加过渡动画
        if (transition && this.transitions[transition]) {
            page.element.classList.add(this.transitions[transition]);
            setTimeout(() => {
                page.element.classList.remove(this.transitions[transition]);
            }, duration);
        }

        page.element.classList.add('active');

        // 执行页面显示回调
        if (page.onShow) {
            page.onShow();
        }
    }

    /**
     * 创建页面元素
     * @param {object} page - 页面对象
     */
    createPageElement(page) {
        const pagesContainer = document.getElementById('pagesContainer');
        if (!pagesContainer) {
            console.error('页面容器不存在');
            return;
        }

        const pageElement = document.createElement('div');
        pageElement.id = `${page.name}Page`;
        pageElement.className = `page ${page.name}-page`;
        pageElement.style.display = 'none';

        if (page.template) {
            pageElement.innerHTML = page.template;
        }

        pagesContainer.appendChild(pageElement);
        page.element = pageElement;
    }

    /**
     * 返回上一页
     */
    goBack() {
        if (this.history.length > 0) {
            const previousPage = this.history.pop();
            this.showPage(previousPage, { transition: 'slideRight' });
        }
    }

    /**
     * 添加到历史记录
     * @param {string} pageName - 页面名称
     */
    addToHistory(pageName) {
        this.history.push(pageName);
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
    }

    /**
     * 绑定键盘事件
     */
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            // ESC键返回上一页（仅在非终端页面）
            if (e.key === 'Escape' && this.currentPage !== 'terminal') {
                e.preventDefault();
                this.goBack();
            }
        });
    }

    /**
     * 获取HOME页面模板
     */
    getHomePageTemplate() {
        return `
            <div class="home-container">
                <div class="home-header">
                    <div class="game-logo">
                        <h1>华府谍影</h1>
                        <div class="game-subtitle">Cold War Spy</div>
                    </div>
                    <div class="version-info">v1.0.0 Alpha</div>
                </div>
                
                <div class="home-content">
                    <div class="main-menu">
                        <button class="menu-button start-game-btn">
                            <span class="button-icon">▶</span>
                            <span class="button-text">开始游戏</span>
                        </button>
                        
                        <button class="menu-button settings-btn">
                            <span class="button-icon">⚙</span>
                            <span class="button-text">游戏设置</span>
                        </button>
                        
                        <button class="menu-button identity-setup-btn">
                            <span class="button-icon">👤</span>
                            <span class="button-text">身份档案</span>
                        </button>
                        
                        <button class="menu-button help-btn">
                            <span class="button-icon">?</span>
                            <span class="button-text">游戏帮助</span>
                        </button>
                    </div>
                </div>
                
                <div class="home-footer">
                    <div class="copyright">© 2025 华府谍影游戏项目</div>
                    <div class="DEV-info">由ESSEX CV9 开发</div>
                </div>
            </div>
        `;
    }

    /**
     * 获取终端页面模板
     */
    getTerminalPageTemplate() {
        return `
            <div class="computer-wrapper">
                <div class="computer-case">
                    <div class="screen-container">
                        <!-- 主终端区域 -->
                        <div class="main-terminal-area">
                            <div class="screen">
                                <!-- 终端界面 -->
                                <div class="terminal" id="terminal">
                                    <div class="output" id="output"></div>
                                    <div class="prompt">
                                        <span class="prompt-symbol">></span>
                                        <input type="text" id="commandInput" spellcheck="false" autocomplete="off">
                                        <span class="cursor" id="cursor"></span>
                                    </div>
                    </div>
                    
                                <!-- 地图界面 -->
                                <div class="map-interface" id="mapInterface" style="display: none;">
                                    <div class="map-header">
                                        <div class="map-title">地理信息系统 v1.0</div>
                                        <div class="map-status">加密连接: 已启用</div>
                                    </div>
                                    <div class="map-content" id="mapContent">
                                        <!-- 地图内容将在JavaScript中动态生成 -->
                                    </div>
                                    <div class="map-footer">
                                        <div class="map-current-location">当前位置: <span id="mapCurrentLocation">未知</span></div>
                                        <div class="map-info">按 F1 返回终端</div>
                                    </div>
                        </div>
                        
                                <!-- 档案界面 -->
                                <div class="status-interface" id="statusInterface" style="display: none;">
                                    <div class="status-header"></div>
                                    <div class="status-content">
                                        </div>
                                    <div class="status-footer"></div>
                        </div>
                        
                                <!-- 地点行动界面 -->
                                <div class="location-action-interface" id="locationActionInterface" style="display: none;">
                                    <div class="location-action-container">
                                        <!-- 上半部分：地点图片 -->
                                        <div class="location-action-scene">
                                            <div class="tui-frame scene-frame">
                                                <div class="tui-title">地点视觉</div>
                                                <div class="scene-image-container">
                                                    <img id="locationSceneImage" class="scene-image" alt="地点场景" />
                                                    <div class="scene-info-overlay">
                                                        <div class="scene-location-name" id="sceneLocationName">地点名称</div>
                                                    </div>
                                                </div>
                                            </div>
                        </div>
                        
                                        <!-- 下半部分：故事文字 -->
                                        <div class="location-action-story">
                                            <div class="tui-frame story-frame">
                                                <div class="tui-title">行动报告</div>
                                                <div class="story-content" id="locationStoryContent">
                                                    <p>正在加载地点信息...</p>
                                                </div>
                        </div>
                    </div>
                </div>
                
                                    <!-- 底部提示栏 -->
                                    <div class="location-action-footer">
                                        <div class="tui-hint-bar">
                                            ESC: 返回地图 | F1: 返回终端
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 功能按钮区域 - 两列，每列4个 -->
                        <div class="buttons-panel">
                            <div class="buttons-column">
                                <div id="fnButton1" class="function-button">终端</div>
                                <div id="fnButton2" class="function-button">F2</div>
                                <div id="fnButton3" class="function-button">F3</div>
                                <div id="fnButton4" class="function-button">F4</div>
                            </div>
                            <div class="buttons-column">
                                <div id="fnButton5" class="function-button">地图</div>
                                <div id="fnButton6" class="function-button">F6</div>
                                <div id="fnButton7" class="function-button">F7</div>
                                <div id="fnButton8" class="function-button">F8</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="control-panel">
                        <div class="power-button" id="powerButton">POWER</div>
                        <div class="color-toggle-container">
                            <div class="color-toggle" id="colorToggle">
                                <div class="toggle-slider"></div>
                            </div>
                            <div class="color-toggle-label">COLOR</div>
                        </div>
                        <div class="status-lights">
                            <div class="status-light" id="diskLight"></div>
                            <div class="status-light" id="networkLight"></div>
                        </div>
                    </div>
                </div>
                
                <!-- 软盘驱动器区域 -->
                <div class="floppy-drives-container">
                    <!-- A: 驱动器 (永久插入) -->
                    <div class="drive-container">
                        <div class="floppy-drive drive-a">
                            <!-- 软盘插入口 -->
                            <div class="floppy-slot disk-inserted">
                                <!-- 软盘边缘 -->
                                <div class="floppy-disk">
                                    <svg viewBox="0 0 170 5" xmlns="http://www.w3.org/2000/svg">
                                        <!-- 软盘外壳主体 -->
                                        <rect x="0" y="0" width="170" height="5" fill="#222" stroke="#333" stroke-width="0.2"/>
                                        
                                        <!-- 中央读写窗口 -->
                                        <rect x="35" y="1" width="100" height="3" fill="#111" stroke="none"/>
                                        
                                        <!-- 左右导向边缘 -->
                                        <rect x="5" y="1" width="25" height="3" fill="#2a2a2a" stroke="none"/>
                                        <rect x="140" y="1" width="25" height="3" fill="#2a2a2a" stroke="none"/>
                                        
                                        <!-- 中央金属滑片 -->
                                        <rect x="70" y="1.5" width="30" height="2" fill="#444" stroke="none"/>
                                        
                                        <!-- 左侧标记 -->
                                        <circle cx="20" cy="2.5" r="1" fill="#333" stroke="none"/>
                                        
                                        <!-- 高光效果 -->
                                        <rect x="0" y="0" width="170" height="2.5" fill="url(#floppyGradientA)" opacity="0.15"/>
                                        
                                        <!-- 渐变定义 -->
                                        <defs>
                                            <linearGradient id="floppyGradientA" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stop-color="#fff" stop-opacity="0.3"/>
                                                <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>
                                
                                <!-- 插入指示三角形 -->
                                <div class="insert-indicator"></div>
                                
                                <!-- 插入口SVG细节 -->
                                <svg class="slot-detail" viewBox="0 0 180 10" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0" y="0" width="180" height="10" fill="none" stroke="#444" stroke-width="0.5" rx="1" />
                                    <line x1="0" y1="1" x2="180" y2="1" stroke="#111" stroke-width="0.5" />
                                    <line x1="0" y1="9" x2="180" y2="9" stroke="#333" stroke-width="0.5" />
                                </svg>
                            </div>
                            
                            <!-- 弹出按钮 -->
                            <div class="eject-button disabled">
                                <div class="eject-arrow"></div>
                            </div>
                            
                            <!-- 驱动器指示灯 -->
                            <div class="drive-light active"></div>
                            
                            <!-- 驱动器标签 -->
                            <div class="drive-label">A:</div>
                            
                            <!-- 驱动器前面板纹理 -->
                            <div class="drive-texture"></div>
                        </div>
                    </div>
                    
                    <!-- B: 驱动器 (可交互) -->
                    <div class="drive-container">
                        <div class="floppy-drive drive-b">
                            <!-- 软盘插入口 -->
                            <div class="floppy-slot" id="floppySlotB">
                                <!-- 软盘边缘 -->
                                <div class="floppy-disk" id="floppyDiskB">
                                    <svg viewBox="0 0 170 5" xmlns="http://www.w3.org/2000/svg">
                                        <!-- 软盘外壳主体 -->
                                        <rect x="0" y="0" width="170" height="5" fill="#222" stroke="#333" stroke-width="0.2"/>
                                        
                                        <!-- 中央读写窗口 -->
                                        <rect x="35" y="1" width="100" height="3" fill="#111" stroke="none"/>
                                        
                                        <!-- 左右导向边缘 -->
                                        <rect x="5" y="1" width="25" height="3" fill="#2a2a2a" stroke="none"/>
                                        <rect x="140" y="1" width="25" height="3" fill="#2a2a2a" stroke="none"/>
                                        
                                        <!-- 中央金属滑片 -->
                                        <rect x="70" y="1.5" width="30" height="2" fill="#444" stroke="none"/>
                                        
                                        <!-- 左侧标记 -->
                                        <circle cx="20" cy="2.5" r="1" fill="#333" stroke="none"/>
                                        
                                        <!-- 高光效果 -->
                                        <rect x="0" y="0" width="170" height="2.5" fill="url(#floppyGradientB)" opacity="0.15"/>
                                        
                                        <!-- 渐变定义 -->
                                        <defs>
                                            <linearGradient id="floppyGradientB" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stop-color="#fff" stop-opacity="0.3"/>
                                                <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </div>
                                
                                <!-- 插入指示三角形 -->
                                <div class="insert-indicator"></div>
                                
                                <!-- 插入口SVG细节 -->
                                <svg class="slot-detail" viewBox="0 0 180 10" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="0" y="0" width="180" height="10" fill="none" stroke="#444" stroke-width="0.5" rx="1" />
                                    <line x1="0" y1="1" x2="180" y2="1" stroke="#111" stroke-width="0.5" />
                                    <line x1="0" y1="9" x2="180" y2="9" stroke="#333" stroke-width="0.5" />
                                </svg>
                            </div>
                            
                            <!-- 弹出按钮 -->
                            <div class="eject-button disabled" id="ejectButtonB">
                                <div class="eject-arrow"></div>
                            </div>
                            
                            <!-- 驱动器指示灯 -->
                            <div class="drive-light" id="driveLightB"></div>
                            
                            <!-- 驱动器标签 -->
                            <div class="drive-label">B:</div>
                            
                            <!-- 驱动器前面板纹理 -->
                            <div class="drive-texture"></div>
                        </div>
                    
                        <!-- 完整的软盘 SVG - 只显示上半部分 -->
                        <div class="full-floppy init-hidden" id="fullFloppyB">
                            <svg viewBox="0 0 180 140" xmlns="http://www.w3.org/2000/svg">
                                <!-- 软盘主体 -->
                                <rect x="10" y="10" width="160" height="120" rx="3" fill="#222" stroke="#444" stroke-width="1"/>
                                
                                <!-- 软盘标签区域 -->
                                <rect x="20" y="15" width="140" height="30" fill="#1a1a1a" stroke="#333" stroke-width="0.5"/>
                                
                                <!-- 标签文字 -->
                                <text x="90" y="35" font-family="monospace" font-size="14" font-weight="bold" fill="#0071c5" text-anchor="middle">新消息</text>
                                
                                <!-- 读写窗口 -->
                                <rect x="20" y="55" width="140" height="15" fill="#111" stroke="#333" stroke-width="0.5"/>
                                
                                <!-- 中心金属部分 -->
                                <circle cx="90" cy="95" r="10" fill="#333" stroke="#444" stroke-width="0.5"/>
                                <circle cx="90" cy="95" r="3" fill="#222" stroke="#333" stroke-width="0.5"/>
                                
                                <!-- 防写保护缺口 -->
                                <rect x="150" y="60" width="10" height="15" fill="#111" stroke="#333" stroke-width="0.5"/>
                                
                                <!-- 边缘高光 -->
                                <rect x="10" y="10" width="160" height="60" fill="url(#fullDiskGradient)" opacity="0.1"/>
                                
                                <!-- 渐变定义 -->
                                <defs>
                                    <linearGradient id="fullDiskGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stop-color="#fff" stop-opacity="0.5"/>
                                        <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 获取游戏选择页面模板
     */
    getGameSelectPageTemplate() {
        return `
            <div class="canvas-game-select">
                <!-- Canvas桌面容器 -->
                <div class="canvas-desktop-container">
                    <canvas id="desktopCanvas" class="desktop-canvas"></canvas>
                </div>
                
                <!-- 加载遮罩层 -->
                <div class="desktop-loading" id="desktopLoading">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">正在加载桌面环境...</div>
                </div>
            </div>
        `;
    }

    /**
     * 获取战斗页面模板
     */
    getBattlePageTemplate() {
        return `
            <div class="battle-container">
                <div class="battle-stage">
                    <div class="battle-actors">
                        <div class="actor player">
                            <div class="actor-name" id="battlePlayerName">PLAYER</div>
                            <div class="hp-bar"><div class="hp-fill" id="battlePlayerHP"></div></div>
                            <div class="actor-stats" id="battlePlayerStats"></div>
                            <div class="actor-sprite" id="battlePlayerSprite"></div>
                        </div>
                        <div class="actor enemy">
                            <div class="actor-name" id="battleEnemyName">ENEMY</div>
                            <div class="hp-bar"><div class="hp-fill" id="battleEnemyHP"></div></div>
                            <div class="actor-stats" id="battleEnemyStats"></div>
                            <div class="actor-sprite" id="battleEnemySprite"></div>
                        </div>
                    </div>
                    <div class="battle-float" id="battleFloat"></div>
                    <div class="action-menu hidden" id="battleActionMenu">
                        <button data-action="attack">攻击 (A)</button>
                        <button data-action="item">物品 (I)</button>
                        <button data-action="reload">换弹 (R)</button>
                    </div>
                </div>
                <div class="battle-hud">
                    <div class="hud-left">
                        <div class="hud-line" id="hudPlayerLine"></div>
                    </div>
                    <div class="hud-center">
                        <div class="items" id="battleItems"></div>
                    </div>
                    <div class="hud-right">
                        <div class="log" id="battleLog"></div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 初始化HOME页面
     */
    initHomePage() {
        console.log('初始化HOME页面');
        
        // 绑定按钮事件
        const startGameBtn = document.querySelector('.start-game-btn');
        const settingsBtn = document.querySelector('.settings-btn');
        const identitySetupBtn = document.querySelector('.identity-setup-btn');
        const helpBtn = document.querySelector('.help-btn');
        
        if (startGameBtn) {
            startGameBtn.addEventListener('click', () => {
                this.showPage('gameSelect', { transition: 'fadeIn', duration: 200 });
            });
        }
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                alert('游戏设置功能即将推出');
            });
        }
        
        if (identitySetupBtn) {
            identitySetupBtn.addEventListener('click', () => {
                alert('身份档案设置功能即将推出');
            });
        }
        
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                alert('游戏帮助功能即将推出');
            });
        }
    }

    /**
     * 清理HOME页面
     */
    cleanupHomePage() {
        console.log('清理HOME页面');
    }

    /**
     * 初始化游戏选择页面
     */
    initGameSelectPage() {
        console.log('初始化Canvas桌面游戏选择页面');
        
        // 获取Canvas元素
        const canvas = document.getElementById('desktopCanvas');
        if (!canvas) {
            console.error('找不到桌面Canvas元素');
            return;
        }
        
        // 创建Canvas渲染器
        this.canvasRenderer = new CanvasDesktopRenderer(canvas);
        
        // 设置事件处理器
        this.canvasRenderer.onItemClick = (action, item) => {
            console.log(`Canvas物品点击: ${action}`);
            this.handleDesktopItemClick(action);
        };
        
        this.canvasRenderer.onLoadComplete = () => {
            console.log('Canvas桌面加载完成');
        // 隐藏加载遮罩
        setTimeout(() => {
            const loading = document.getElementById('desktopLoading');
            if (loading) {
                loading.classList.add('hidden');
            }
            }, 500);
        };
    }

    /**
     * 清理游戏选择页面
     */
    cleanupGameSelectPage() {
        console.log('清理Canvas桌面游戏选择页面');
        
        // 清理Canvas渲染器
        if (this.canvasRenderer) {
            this.canvasRenderer.destroy();
            this.canvasRenderer = null;
        }
    }

    /**
     * 初始化战斗页面
     */
    initBattlePage() {
        console.log('初始化战斗页面');

        // 懒加载一次服务与控制器（简化落地：放在PageManager内）
        if (!this.battleService) {
            this.battleService = {
                clamp: (n, min, max) => Math.max(min, Math.min(max, n)),
                computeDamage(attacker, defender) {
                    const ap = attacker.ap || 0;
                    const armor = defender.armor || 0;
                    const atk = attacker.atk || 0;
                    let multiplier = 1 - 0.1 * (armor - ap);
                    multiplier = this.clamp(multiplier, 0, 2);
                    let dmg = Math.floor(atk * multiplier);
                    return Math.max(0, dmg);
                }
            };
        }

        // 模型
        if (!this.battleModel) {
            this.battleModel = {
                state: null,
                createDefaultCombat() {
                    return {
                        round: 1,
                        turn: 'player',
                        isEnded: false,
                        log: [],
                        player: { name: 'AGENT', atk: 20, ap: 3, armor: 2, hp: 100, maxHp: 100, ammo: 6, ammoMax: 6, items: [{ id: 'medkit', name: '急救包', stacks: 1 }, { id: 'mag', name: '弹匣', stacks: 1 }] },
                        enemy: { name: 'GUARD', atk: 12, ap: 2, armor: 4, hp: 80, maxHp: 80, ammo: 4, ammoMax: 4, items: [] }
                    };
                },
                setState(s) { this.state = s; },
                getState() { return this.state; }
            };
        }

        // 视图
        const qs = (sel) => document.querySelector(sel);
        const logEl = qs('#battleLog');
        const itemsEl = qs('#battleItems');
        const floatEl = qs('#battleFloat');
        const actionMenu = qs('#battleActionMenu');
        const hpP = qs('#battlePlayerHP');
        const hpE = qs('#battleEnemyHP');
        const nameP = qs('#battlePlayerName');
        const nameE = qs('#battleEnemyName');
        const statsP = qs('#battlePlayerStats');
        const statsE = qs('#battleEnemyStats');

        const view = this.battleView = {
            renderAll(state) {
                nameP.textContent = state.player.name;
                nameE.textContent = state.enemy.name;
                this.updateHPBars(state);
                statsP.textContent = `ATK ${state.player.atk} | 穿甲 ${state.player.ap} | 护甲 ${state.player.armor} | 弹药 ${state.player.ammo}/${state.player.ammoMax}`;
                statsE.textContent = `ATK ${state.enemy.atk} | 穿甲 ${state.enemy.ap} | 护甲 ${state.enemy.armor} | 弹药 ${state.enemy.ammo}/${state.enemy.ammoMax}`;
                this.renderItems(state.player.items || []);
            },
            updateHPBars(state) {
                const p = Math.max(0, Math.min(100, Math.round((state.player.hp / state.player.maxHp) * 100)));
                const e = Math.max(0, Math.min(100, Math.round((state.enemy.hp / state.enemy.maxHp) * 100)));
                hpP.style.width = p + '%';
                hpE.style.width = e + '%';
            },
            renderItems(items) {
                itemsEl.innerHTML = '';
                items.forEach((it, idx) => {
                    const el = document.createElement('div');
                    el.className = 'item';
                    el.dataset.index = String(idx);
                    el.textContent = `${it.name} x${it.stacks}`;
                    itemsEl.appendChild(el);
                });
            },
            log(text) {
                const line = document.createElement('div');
                line.textContent = text;
                logEl.appendChild(line);
                logEl.scrollTop = logEl.scrollHeight;
            },
            floatText(text) {
                floatEl.textContent = text;
                floatEl.style.opacity = '1';
                setTimeout(() => { floatEl.style.opacity = '0'; }, 600);
            },
            showMenu(show) {
                actionMenu.classList.toggle('hidden', !show);
            }
        };

        // 控制器
        const service = this.battleService;
        const model = this.battleModel;
        const controller = this.battleController = {
            async start() {
                const s = model.createDefaultCombat();
                model.setState(s);
                view.renderAll(s);
                view.log('战斗开始');
                view.showMenu(true);
                this.bindUI();
            },
            bindUI() {
                // 菜单按钮
                actionMenu.onclick = (e) => {
                    const btn = e.target.closest('button');
                    if (!btn) return;
                    const act = btn.dataset.action;
                    if (act === 'attack') this.playerAttack();
                    if (act === 'reload') this.playerReload();
                    if (act === 'item') this.playerUseItemPrompt();
                };
                // 物品点击
                itemsEl.onclick = (e) => {
                    const it = e.target.closest('.item');
                    if (!it) return;
                    const idx = Number(it.dataset.index);
                    this.playerUseItem(idx);
                };
                // 快捷键
                this.keyHandler = (e) => {
                    if (e.key === 'a' || e.key === 'A') this.playerAttack();
                    if (e.key === 'r' || e.key === 'R') this.playerReload();
                    if (e.key === 'i' || e.key === 'I') this.playerUseItemPrompt();
                    if (e.key === 'Escape') view.showMenu(true);
                };
                document.addEventListener('keydown', this.keyHandler);
            },
            unbindUI() {
                if (this.keyHandler) document.removeEventListener('keydown', this.keyHandler);
                actionMenu.onclick = null;
                itemsEl.onclick = null;
            },
            endIfNeeded() {
                const s = model.getState();
                if (s.player.hp <= 0 || s.enemy.hp <= 0) {
                    s.isEnded = true;
                    view.showMenu(false);
                    const result = s.player.hp > 0 ? '胜利' : '失败';
                    view.log(`战斗结束：${result}`);
                    return true;
                }
                return false;
            },
            nextTurn(to) {
                const s = model.getState();
                s.turn = to;
                if (to === 'player') {
                    s.round += 1;
                    view.log(`第 ${s.round} 回合`);
                    view.showMenu(true);
                }
            },
            playerAttack() {
                const s = model.getState();
                if (s.isEnded || s.turn !== 'player') return;
                if (s.player.ammo <= 0) { view.log('弹药不足，请换弹'); view.showMenu(true); return; }
                s.player.ammo -= 1;
                const dmg = service.computeDamage(s.player, s.enemy);
                s.enemy.hp = Math.max(0, s.enemy.hp - dmg);
                view.floatText(`-${dmg}`);
                view.log(`你对 ${s.enemy.name} 造成 ${dmg} 伤害`);
                view.renderAll(s);
                if (this.endIfNeeded()) return;
                view.showMenu(false);
                setTimeout(() => this.enemyAct(), 550);
            },
            playerReload() {
                const s = model.getState();
                if (s.isEnded || s.turn !== 'player') return;
                if (s.player.ammo >= s.player.ammoMax) { view.log('弹药已满'); return; }
                s.player.ammo = s.player.ammoMax;
                view.log('你更换了弹匣');
                view.renderAll(s);
                view.showMenu(false);
                setTimeout(() => this.enemyAct(), 400);
            },
            playerUseItemPrompt() {
                const s = model.getState();
                if (!s.player.items || s.player.items.length === 0) { view.log('没有可用物品'); return; }
                view.log('点击下方物品以使用');
                view.showMenu(false);
            },
            playerUseItem(idx) {
                const s = model.getState();
                if (s.isEnded || s.turn !== 'player') return;
                const it = s.player.items[idx];
                if (!it || it.stacks <= 0) { view.log('物品不可用'); return; }
                if (it.id === 'medkit') {
                    const heal = 20;
                    s.player.hp = Math.min(s.player.maxHp, s.player.hp + heal);
                    view.log(`你使用急救包，回复 ${heal} HP`);
                } else if (it.id === 'mag') {
                    s.player.ammo = s.player.ammoMax;
                    view.log('你使用弹匣，弹药已装填');
                } else {
                    view.log('未知物品');
                    return;
                }
                it.stacks -= 1;
                if (it.stacks <= 0) s.player.items.splice(idx, 1);
                view.renderAll(s);
                if (this.endIfNeeded()) return;
                setTimeout(() => this.enemyAct(), 400);
            },
            enemyAct() {
                const s = model.getState();
                if (s.isEnded) return;
                this.nextTurn('enemy');
                // 简单AI：有弹药则攻击，否则换弹；低血用物品（无物品则忽略）
                let acted = false;
                if (s.enemy.hp <= Math.floor(s.enemy.maxHp * 0.3)) {
                    // 无恢复物品，跳过
                }
                if (!acted) {
                    if (s.enemy.ammo > 0) {
                        s.enemy.ammo -= 1;
                        const dmg = service.computeDamage(s.enemy, s.player);
                        s.player.hp = Math.max(0, s.player.hp - dmg);
                        view.floatText(`-${dmg}`);
                        view.log(`${s.enemy.name} 对你造成 ${dmg} 伤害`);
                        view.renderAll(s);
                        if (this.endIfNeeded()) return;
                    } else {
                        s.enemy.ammo = s.enemy.ammoMax;
                        view.log(`${s.enemy.name} 更换了弹匣`);
                        view.renderAll(s);
                    }
                }
                this.nextTurn('player');
            }
        };

        controller.start();
    }

    /** 清理战斗页面 */
    cleanupBattlePage() {
        if (this.battleController && this.battleController.unbindUI) {
            this.battleController.unbindUI();
        }
    }



    /**
     * 处理桌面物品点击
     */
    handleDesktopItemClick(action) {
        console.log(`桌面物品点击: ${action}`);
        
        // 播放点击音效
        if (window.ServiceLocator) {
            const audio = window.ServiceLocator.get('audio');
            if (audio) {
                audio.play('crtButton');
            }
        }
        
        switch (action) {
            case 'terminal':
                this.enterTerminalMode();
                break;
            case 'battle':
                // 从DOC_2(设置)按钮进入的战斗页面
                if (!this.pages.battle) {
                    console.warn('战斗页面未注册，暂以提示代替');
                    alert('战斗系统正在开发中，敬请期待！');
                } else {
                    this.showPage('battle', { transition: 'scaleIn' });
                }
                break;
            case 'map':
                // 直接进入地图模式
                this.enterMapMode();
                break;
            case 'docs':
            case 'settings':
                alert('该功能正在开发中，敬请期待！');
                break;
            case 'equipment':
                alert('装备管理功能正在开发中，敬请期待！');
                break;
            case 'home':
                this.showPage('home', { transition: 'slideRight' });
                break;
            default:
                console.warn(`未知的桌面操作: ${action}`);
        }
    }

    /**
     * 进入地图模式
     */
    async enterMapMode() {
        try {
            // 以覆盖模式显示终端页面，保持游戏选择页面在背景
            this.showPage('terminal', { transition: 'scaleIn', overlay: true });

            // 略等一帧，确保终端DOM已挂载
            await new Promise((r) => setTimeout(r, 50));

            // 确保游戏核心已初始化
            if (window.initializeGameCore && (!window.GameCore || !window.GameCore.initialized)) {
                console.log('初始化游戏核心...');
                await window.initializeGameCore();
            }

            // 确保系统已开机
            if (window.gameController && !window.gameController.model.isOn) {
                console.log('自动开机系统以进入地图...');
                window.gameController.powerOn();
                await this.waitForSystemBoot(8000); // 最多等待8秒
            } else {
                // 已经开机，稍作等待以确保界面服务就绪
                await new Promise((r) => setTimeout(r, 150));
            }

            // 直接切换到地图界面（优先走界面服务）
            const interfaceService = window.ServiceLocator && window.ServiceLocator.get('interface');
            if (interfaceService && typeof interfaceService.switchTo === 'function') {
                interfaceService.switchTo('map');
            } else if (window.EventBus) {
                // 回退：发布运行地图事件
                window.EventBus.emit('runProgram', { program: 'map' });
            }
        } catch (error) {
            console.error('进入地图模式失败:', error);
            alert('进入地图模式失败，请查看控制台了解详情');
        }
    }

    /**
     * 进入终端模式
     */
    async enterTerminalMode() {
        console.log('进入终端模式...');
        
        try {
            // 以覆盖模式显示终端页面，保持游戏选择页面在背景
            this.showPage('terminal', { transition: 'scaleIn', overlay: true });
            
            // 等待DOM渲染完成后再初始化游戏核心
            setTimeout(async () => {
            if (window.initializeGameCore) {
                if (window.GameCore && !window.GameCore.initialized) {
                    console.log('初始化游戏核心...');
                    await window.initializeGameCore();
                }
            } else {
                console.error('initializeGameCore函数不可用');
            }
            }, 100); // 给DOM一些时间来渲染
            
        } catch (error) {
            console.error('进入终端模式失败:', error);
            alert('进入终端模式失败，请查看控制台了解详情');
        }
    }

    /**
     * 初始化终端页面
     */
    initTerminalPage() {
        console.log('初始化终端页面');
        
        // 添加退出按钮
        this.addExitButton();
        
        // 绑定退出事件
        this.bindTerminalExitEvents();
        
        // 添加点击外部区域退出功能
        this.addClickOutsideExit();
        
        // 确保游戏系统开机
        setTimeout(() => {
            if (window.gameController) {
                // 如果系统未开机，自动开机
                if (!window.gameController.model.isOn) {
                    console.log('自动开机系统...');
                    window.gameController.powerOn();
                }
            }
        }, 500);
    }

    /**
     * 清理终端页面
     */
    cleanupTerminalPage() {
        console.log('清理终端页面');
        
        // 移除退出按钮（为下次进入做准备）
        const exitButton = document.getElementById('terminalExitButton');
        if (exitButton) {
            exitButton.remove();
        }
        
        // 移除点击外部区域退出功能
        this.removeClickOutsideExit();
    }

    /**
     * 获取当前页面
     */
    getCurrentPage() {
        return this.currentPage;
    }

    /**
     * 检查页面是否存在
     */
    hasPage(pageName) {
        return !!this.pages[pageName];
    }

    /**
     * 添加退出按钮到终端页面
     */
    addExitButton() {
        const terminalPage = document.getElementById('terminalPage');
        if (!terminalPage) {
            console.error('找不到终端页面元素');
            return;
        }

        // 检查是否已经存在退出按钮
        if (document.getElementById('terminalExitButton')) {
            return;
        }

        // 找到电脑外壳上的电源按钮
        const powerButton = document.getElementById('powerButton');
        if (!powerButton) {
            console.error('找不到 powerButton，无法插入退出按钮');
            return;
        }

        // 检查是否已经有按钮组包装器
        let powerButtonsGroup = powerButton.parentElement.querySelector('.power-buttons-group');
        if (!powerButtonsGroup) {
            // 创建按钮组包装器
            powerButtonsGroup = document.createElement('div');
            powerButtonsGroup.className = 'power-buttons-group';
            
            // 将电源按钮移动到组内
            powerButton.parentElement.insertBefore(powerButtonsGroup, powerButton);
            powerButtonsGroup.appendChild(powerButton);
        }

        // 创建退出按钮
        const exitButton = document.createElement('div');
        exitButton.id = 'terminalExitButton';
        exitButton.className = 'power-button exit-button';
        exitButton.innerHTML = 'EXIT';

        // 将退出按钮添加到按钮组内
        powerButtonsGroup.appendChild(exitButton);
    }

    /**
     * 绑定终端退出事件
     */
    bindTerminalExitEvents() {
        // 绑定退出按钮事件
        const exitButton = document.getElementById('terminalExitButton');
        if (exitButton) {
            exitButton.addEventListener('click', () => {
                this.exitTerminal(false, true); // 直接退出，不关机
            });
        }

        // 监听系统关机事件
        if (window.EventBus) {
            window.EventBus.on('systemPowerChange', (isOn) => {
                if (!isOn && this.currentPage === 'terminal') {
                    console.log('系统关机，退出终端');
                    // 延迟一下让关机动画播放完再退出
                    setTimeout(() => {
                        this.showPage('gameSelect', { transition: 'fadeIn' });
                    }, 500);
                }
            });
        }

        // 监听自定义退出事件（用于exit命令）
        if (window.EventBus) {
            window.EventBus.on('exitTerminal', () => {
                this.exitTerminal(false, true); // exit命令也直接退出，不关机
            });
        }
    }

    /**
     * 退出终端
     * @param {boolean} skipPowerOff - 是否跳过关机操作（当系统已经关机时）
     * @param {boolean} directExit - 是否直接退出（用于EXIT按钮）
     */
    exitTerminal(skipPowerOff = false, directExit = false) {
        console.log('退出终端模式');
        
        // 播放退出音效（如果有）
        if (window.ServiceLocator) {
            const audio = window.ServiceLocator.get('audio');
            if (audio) {
                audio.play('crtOff');
            }
        }

        if (directExit) {
            // 直接退出，不关机
            console.log('直接退出终端，保持系统运行状态');
            this.showPage('gameSelect', { transition: 'fadeIn' });
            return;
        }

        // 确保系统关机（如果需要的话）
        if (!skipPowerOff && window.gameController && window.gameController.model.isOn) {
            console.log('关闭系统...');
            try {
                window.gameController.powerOff();
            } catch (error) {
                console.error('关机时出错:', error);
                // 即使关机出错也要退出
                this.showPage('gameSelect', { transition: 'fadeIn' });
                return;
            }
        }

        // 延迟一下再切换页面，让关机动画播放完
        const delay = skipPowerOff ? 200 : 500;
        setTimeout(() => {
            this.showPage('gameSelect', { transition: 'fadeIn' });
        }, delay);
    }

    /**
     * 添加点击外部区域退出功能
     */
    addClickOutsideExit() {
        const terminalPage = document.getElementById('terminalPage');
        if (!terminalPage) {
            console.error('找不到终端页面元素');
            return;
        }

        // 移除之前的点击监听器（如果存在）
        if (this.outsideClickHandler) {
            terminalPage.removeEventListener('click', this.outsideClickHandler);
        }

        // 创建点击处理器
        this.outsideClickHandler = (event) => {
            // 查找电脑主体元素
            const computerWrapper = event.target.closest('.computer-wrapper');
            
            // 如果点击的不是电脑主体内部，则退出
            if (!computerWrapper) {
                console.log('点击外部区域，退出终端');
                this.exitTerminal(false, true); // 直接退出，不关机
            }
        };

        // 添加点击监听器
        terminalPage.addEventListener('click', this.outsideClickHandler);
    }

    /**
     * 移除点击外部区域退出功能
     */
    removeClickOutsideExit() {
        const terminalPage = document.getElementById('terminalPage');
        if (terminalPage && this.outsideClickHandler) {
            terminalPage.removeEventListener('click', this.outsideClickHandler);
            this.outsideClickHandler = null;
        }
    }

    /**
     * 等待系统启动完成事件
     * @param {number} timeoutMs 超时时间
     */
    waitForSystemBoot(timeoutMs = 5000) {
        return new Promise((resolve) => {
            try {
                const bus = (window.ServiceLocator && window.ServiceLocator.get('eventBus')) || window.EventBus;
                let settled = false;

                // 如果已经是开机完成状态，直接返回
                if (window.gameController && window.gameController.model && window.gameController.model.isOn) {
                    return resolve();
                }

                const timer = setTimeout(() => {
                    if (!settled) {
                        settled = true;
                        resolve();
                    }
                }, timeoutMs);

                if (bus && typeof bus.once === 'function') {
                    bus.once('systemBootComplete', () => {
                        if (!settled) {
                            settled = true;
                            clearTimeout(timer);
                            resolve();
                        }
                    });
                } else if (bus && typeof bus.on === 'function') {
                    const handler = () => {
                        if (!settled) {
                            settled = true;
                            clearTimeout(timer);
                            if (bus && typeof bus.off === 'function') bus.off('systemBootComplete', handler);
                            resolve();
                        }
                    };
                    bus.on('systemBootComplete', handler);
                } else {
                    // 无事件总线，直接继续
                    resolve();
                }
            } catch (e) {
                resolve();
            }
        });
    }
}

// 创建全局实例
window.PageManager = new PageManager();