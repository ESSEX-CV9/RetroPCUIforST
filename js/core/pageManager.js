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
                alert('战斗系统正在开发中，敬请期待！');
                break;
            case 'map':
                // 直接进入地图模式
                this.enterMapMode();
                break;
            case 'docs':
            case 'settings':
                alert('该功能正在开发中，敬请期待！');
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
            // 确保游戏核心已初始化
            if (window.initializeGameCore) {
                if (window.GameCore && !window.GameCore.initialized) {
                    console.log('初始化游戏核心...');
                    await window.initializeGameCore();
                }
            }
            
            // 切换到终端页面
            this.showPage('terminal', { transition: 'scaleIn' });
            
            // 等待终端初始化完成后打开地图
            setTimeout(() => {
                if (window.gameController && window.gameController.model.isOn) {
                    // 触发地图程序运行
                    if (window.EventBus) {
                        window.EventBus.emit('runProgram', { program: 'map' });
                    }
                }
            }, 1500);
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