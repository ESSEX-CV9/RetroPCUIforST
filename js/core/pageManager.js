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
        
        // 创建主页面容器，包装现有内容
        const existingContent = body.innerHTML;
        body.innerHTML = '';
        
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
        
        // 将原有内容移动到终端页面
        const terminalPage = document.createElement('div');
        terminalPage.id = 'terminalPage';
        terminalPage.className = 'page terminal-page';
        terminalPage.style.display = 'none';
        terminalPage.innerHTML = existingContent;
        
        pagesContainer.appendChild(terminalPage);
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
            element: document.getElementById('terminalPage'),
            onShow: () => this.initTerminalPage(),
            onHide: () => this.cleanupTerminalPage()
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

        // 隐藏当前页面
        if (this.currentPage) {
            this.hidePage(this.currentPage);
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
        // 先清除可能遗留的行内 display，再设置为 none，确保优先级正确
        page.element.style.removeProperty('display');
        page.element.style.display = 'none';
        page.element.classList.remove('active');
    }

    /**
     * 显示页面
     * @param {object} page - 页面对象
     * @param {object} options - 显示选项
     */
    displayPage(page, options = {}) {
        const { transition = 'fadeIn', duration = 300 } = options;

        // 显示元素
        page.element.style.display = 'block';
        
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
     * 获取游戏选择页面模板 - POV房间视角
     */
    getGameSelectPageTemplate() {
        return `
            <div class="room-pov-container">
                <!-- 顶部控制栏 -->
                <div class="room-header">
                    <button class="back-button">← 返回主页</button>
                    <div class="room-title">特工安全屋</div>
                    <div class="room-subtitle">选择你的行动方式</div>
                </div>
                
                <!-- 主要房间视角区域 -->
                <div class="room-view">
                    <!-- 桌面背景 -->
                    <div class="desk-surface">
                        <!-- 左上区域：老式电脑 -->
                        <div class="interactive-area computer-area" data-action="terminal">
                            <div class="area-placeholder computer-placeholder">
                                <div class="placeholder-frame">
                                    <div class="placeholder-icon">🖥️</div>
                                    <div class="placeholder-title">复古终端</div>
                                    <div class="placeholder-subtitle">访问情报网络</div>
                                </div>
                                <!-- 电脑屏幕发光效果 -->
                                <div class="screen-glow"></div>
                                <!-- 悬停提示 -->
                                <div class="hover-tooltip">点击启动终端系统</div>
                            </div>
                        </div>
                        
                        <!-- 右上区域：文件堆 -->
                        <div class="interactive-area files-area" data-action="files">
                            <div class="area-placeholder files-placeholder">
                                <div class="placeholder-frame">
                                    <div class="placeholder-icon">📁</div>
                                    <div class="placeholder-title">机密档案</div>
                                    <div class="placeholder-subtitle">查阅情报文件</div>
                                </div>
                                <!-- 文件堆叠效果 -->
                                <div class="files-stack">
                                    <div class="file-layer layer-1"></div>
                                    <div class="file-layer layer-2"></div>
                                    <div class="file-layer layer-3"></div>
                                </div>
                                <!-- 悬停提示 -->
                                <div class="hover-tooltip">点击查看档案（开发中）</div>
                            </div>
                        </div>
                        
                        <!-- 中下区域：外出道具 -->
                        <div class="interactive-area action-area" data-action="field">
                            <div class="area-placeholder action-placeholder">
                                <div class="placeholder-frame">
                                    <div class="placeholder-icon">🗺️</div>
                                    <div class="placeholder-title">外勤装备</div>
                                    <div class="placeholder-subtitle">执行实地任务</div>
                                </div>
                                <!-- 道具散布效果 -->
                                <div class="equipment-items">
                                    <div class="equipment-item map-item">🗺️</div>
                                    <div class="equipment-item key-item">🔑</div>
                                    <div class="equipment-item id-item">🆔</div>
                                </div>
                                <!-- 悬停提示 -->
                                <div class="hover-tooltip">点击开始外勤行动</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 房间环境细节 -->
                    <div class="room-ambient">
                        <!-- 桌面边缘阴影 -->
                        <div class="desk-shadow"></div>
                        <!-- 环境光效 -->
                        <div class="ambient-light"></div>
                    </div>
                </div>
                
                <!-- 底部功能栏 -->
                <div class="room-footer">
                    <button class="utility-btn settings-btn">⚙️ 设置</button>
                    <button class="utility-btn help-btn">❓ 帮助</button>
                    <button class="utility-btn exit-btn">🚪 退出游戏</button>
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
                this.showPage('gameSelect', { transition: 'slideLeft' });
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
     * 初始化游戏选择页面 - POV房间界面
     */
    initGameSelectPage() {
        console.log('初始化POV房间界面');
        
        // 绑定返回按钮
        const backButton = document.querySelector('.back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.showPage('home', { transition: 'slideRight' });
            });
        }
        
        // 绑定交互区域事件
        this.bindInteractiveAreas();
        
        // 绑定底部功能按钮
        this.bindUtilityButtons();
        
        // 初始化房间环境效果
        this.initRoomEffects();
    }
    
    /**
     * 绑定交互区域事件
     */
    bindInteractiveAreas() {
        const interactiveAreas = document.querySelectorAll('.interactive-area');
        
        interactiveAreas.forEach(area => {
            const action = area.dataset.action;
            
            // 添加悬停效果
            area.addEventListener('mouseenter', () => {
                area.classList.add('hovered');
                // 播放悬停音效（如果有）
                if (window.ServiceLocator) {
                    const audio = window.ServiceLocator.get('audio');
                    if (audio) {
                        audio.play('hover', 0.3); // 低音量悬停音效
                    }
                }
            });
            
            area.addEventListener('mouseleave', () => {
                area.classList.remove('hovered');
            });
            
            // 添加点击事件
            area.addEventListener('click', () => {
                this.handleAreaClick(action, area);
            });
        });
    }
    
    /**
     * 处理区域点击事件
     */
    handleAreaClick(action, element) {
        // 添加点击动画
        element.classList.add('clicked');
        setTimeout(() => {
            element.classList.remove('clicked');
        }, 200);
        
        // 播放点击音效
        if (window.ServiceLocator) {
            const audio = window.ServiceLocator.get('audio');
            if (audio) {
                audio.play('click');
            }
        }
        
        switch (action) {
            case 'terminal':
                console.log('启动终端模式');
                this.enterTerminalMode();
                break;
                
            case 'files':
                console.log('访问档案系统（开发中）');
                this.showDevelopmentMessage('档案系统');
                break;
                
            case 'field':
                console.log('开始外勤行动');
                this.enterFieldActionMode();
                break;
                
            default:
                console.warn('未知的交互区域:', action);
        }
    }
    
    /**
     * 绑定底部功能按钮
     */
    bindUtilityButtons() {
        // 设置按钮
        const settingsBtn = document.querySelector('.settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showDevelopmentMessage('游戏设置');
            });
        }
        
        // 帮助按钮
        const helpBtn = document.querySelector('.help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                this.showGameHelp();
            });
        }
        
        // 退出按钮
        const exitBtn = document.querySelector('.exit-btn');
        if (exitBtn) {
            exitBtn.addEventListener('click', () => {
                this.confirmExit();
            });
        }
    }
    
    /**
     * 初始化房间环境效果
     */
    initRoomEffects() {
        // 为电脑区域添加屏幕发光动画
        const computerArea = document.querySelector('.computer-area');
        if (computerArea) {
            setInterval(() => {
                const glow = computerArea.querySelector('.screen-glow');
                if (glow) {
                    glow.style.opacity = Math.random() * 0.3 + 0.1;
                }
            }, 2000 + Math.random() * 3000);
        }
        
        // 为文件区域添加微风效果
        const filesArea = document.querySelector('.files-area');
        if (filesArea) {
            setInterval(() => {
                const layers = filesArea.querySelectorAll('.file-layer');
                layers.forEach((layer, index) => {
                    setTimeout(() => {
                        layer.style.transform = `translateY(${Math.sin(Date.now() / 1000 + index) * 2}px)`;
                    }, index * 100);
                });
            }, 100);
        }
    }
    
    /**
     * 进入外勤行动模式
     */
    enterFieldActionMode() {
        // 这里将来连接到新的外勤行动系统
        console.log('外勤行动模式（待开发）');
        this.showDevelopmentMessage('外勤行动系统', '这个功能正在开发中，敬请期待！\n\n将包含：\n- 城市地图探索\n- 实时任务系统\n- 装备管理\n- 潜行与战斗');
    }
    
    /**
     * 显示开发中功能提示
     */
    showDevelopmentMessage(featureName, details = '') {
        const message = details || `${featureName}功能正在开发中，敬请期待！`;
        
        // 创建自定义提示框
        const overlay = document.createElement('div');
        overlay.className = 'dev-message-overlay';
        overlay.innerHTML = `
            <div class="dev-message-box">
                <div class="dev-message-header">
                    <h3>🚧 开发中</h3>
                    <button class="dev-message-close">×</button>
                </div>
                <div class="dev-message-content">
                    <p>${message}</p>
                </div>
                <div class="dev-message-footer">
                    <button class="dev-message-ok">了解</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 绑定关闭事件
        const closeBtn = overlay.querySelector('.dev-message-close');
        const okBtn = overlay.querySelector('.dev-message-ok');
        
        const closeMessage = () => {
            overlay.remove();
        };
        
        closeBtn.addEventListener('click', closeMessage);
        okBtn.addEventListener('click', closeMessage);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeMessage();
        });
    }
    
    /**
     * 显示游戏帮助
     */
    showGameHelp() {
        const helpContent = `
            <strong>华府谍影 - 游戏帮助</strong><br><br>
            
            <strong>🖥️ 复古终端</strong><br>
            经典的冷战时代计算机体验，使用命令行操作：<br>
            • help - 查看可用命令<br>
            • datastatus - 查看数据状态<br>
            • run map - 运行地图程序<br><br>
            
            <strong>📁 机密档案</strong><br>
            查阅情报文件和人物档案（开发中）<br><br>
            
            <strong>🗺️ 外勤装备</strong><br>
            执行实地间谍任务（开发中）<br><br>
            
            <strong>操作提示：</strong><br>
            • 鼠标悬停查看详细信息<br>
            • 点击不同区域进入对应模式<br>
            • ESC键返回上级菜单
        `;
        
        this.showDevelopmentMessage('游戏帮助', helpContent);
    }
    
    /**
     * 确认退出游戏
     */
    confirmExit() {
        const confirmed = confirm('确定要退出华府谍影吗？\n\n未保存的进度可能会丢失。');
        if (confirmed) {
            // 这里可以添加保存游戏状态的逻辑
            window.close() || (window.location.href = 'about:blank');
        }
    }

    /**
     * 清理游戏选择页面
     */
    cleanupGameSelectPage() {
        console.log('清理游戏选择页面');
    }

    /**
     * 进入终端模式
     */
    async enterTerminalMode() {
        console.log('进入终端模式...');
        
        try {
            // 确保游戏核心已初始化
            if (window.initializeGameCore) {
                if (window.GameCore && !window.GameCore.initialized) {
                    console.log('初始化游戏核心...');
                    await window.initializeGameCore();
                }
            } else {
                console.error('initializeGameCore函数不可用');
                return;
            }
            
            // 切换到终端页面
            this.showPage('terminal', { transition: 'scaleIn' });
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
                        this.showPage('gameSelect', { transition: 'scaleOut' });
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
            this.showPage('gameSelect', { transition: 'scaleOut' });
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
                this.showPage('gameSelect', { transition: 'scaleOut' });
                return;
            }
        }

        // 延迟一下再切换页面，让关机动画播放完
        const delay = skipPowerOff ? 200 : 500;
        setTimeout(() => {
            this.showPage('gameSelect', { transition: 'scaleOut' });
        }, delay);
    }
}

// 创建全局实例
window.PageManager = new PageManager();