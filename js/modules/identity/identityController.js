// js/controllers/identityController.js
class IdentityController {
    constructor(model, view, serviceLocator) {
        this.model = model;
        this.view = view;
        this.serviceLocator = serviceLocator;
        
        // 获取服务
        this.eventBus = serviceLocator.get('eventBus');
        this.interfaceService = serviceLocator.get('interface');
        this.audio = serviceLocator.get('audio');
        this.domUtils = serviceLocator.get('domUtils');
        
        // 追踪可见性状态
        this.isVisible = false;
        this.currentIdentityType = 'cover'; // 用于档案文件区域的默认显示类型 (真实/表面)
        
        // 初始化标记
        this.initialized = false;
        
        // 键盘导航相关属性 - 新的行列导航系统
        this.keyboardNavigationEnabled = false;
        this.currentPage = 'basic'; // 'basic' 或 'disguise'
        this.focusableElements = []; // 保留兼容性
        this.keyboardEventListener = null;
        
        // 新增：行列导航系统
        this.focusRows = []; // 按行分组的焦点元素 [{row: 0, elements: [...]}]
        this.currentRow = 0; // 当前行
        this.currentCol = 0; // 当前列
        
        // 档案显示相关属性（保留用于兼容性，但不再使用分页逻辑）
        
        // 新增：页面状态记忆
        this.lastPageState = {
            page: 'basic', // 最后访问的页面
            focusMemory: null // 最后的焦点状态
        };
        
        // 新增：档案滚动模式状态
        this.fileScrollMode = false;
        this.scrollModeElement = null;
        
        // 新增：按键状态和持续滚动控制
        this.keyStates = {
            ArrowUp: false,
            ArrowDown: false,
            KeyW: false,
            KeyS: false
        };
        this.scrollAnimation = null; // 滚动动画ID
        this.scrollDirection = 0; // 滚动方向：-1向上，1向下，0停止
        this.scrollSpeed = 2; // 基础滚动速度
        this.scrollAcceleration = 1.05; // 滚动加速度
        this.currentScrollSpeed = this.scrollSpeed; // 当前滚动速度
    }
    
    // 初始化控制器
    async initialize() {
        try {
            console.log("初始化身份控制器...");
            
            // 检查是否已经初始化
            if (this.initialized) {
                console.log("身份控制器已经初始化，跳过重复初始化");
                return true;
            }
            
            // 初始化视图
            this.view.initialize();
            
            // 设置model引用
            this.view.setModel(this.model);
            
            // 主动获取当前颜色模式并应用
            this.applyCurrentColorMode();
            
            // 设置事件监听器
            this.setupEventListeners();
            
            // 订阅系统事件
            this.subscribeToEvents();
            
            // 填充表单选择框
            this.populateFormSelects();
            
            // 初始化TUI系统
            this.initializeTUISystem();
            
            // 检查lorebook是否准备好 
            const lorebookController = window.lorebookController;
            if (!lorebookController || !lorebookController.initialized) {
                console.log("lorebookController尚未准备好，将在稍后更新身份显示");
                
                // 添加事件监听，当lorebook初始化完成后更新身份
                if (this.eventBus) {
                    this.eventBus.once('lorebookSystemInitialized', async () => {
                        if (!this.initialized) return; // 如果控制器还没初始化完成，跳过
                        await this.updateIdentityDisplays();
                    });
                }
            } else {
                // 尝试更新身份显示
                await this.updateIdentityDisplays();
            }
            
            // 默认显示基本档案页面
            this.view.showBasicInfoPage();
            
            // 更新档案显示
            await this.switchIdentityView('cover');
            
            // 初始化增强功能
            await this.initializeEnhancedFeatures();
            
            this.initialized = true;
            
            // 设置全局引用以供TUI使用
            window.identityController = this;
            
            console.log("身份控制器初始化完成");
            return true;
        } catch (error) {
            console.error("身份控制器初始化失败:", error);
            return false;
        }
    }
    
    // 新增：主动获取并应用当前颜色模式
    applyCurrentColorMode() {
        // 检查屏幕元素的颜色模式类
        const screen = this.domUtils.get('.screen');
        if (screen) {
            const isAmber = screen.classList.contains('amber-mode');
            this.view.updateColorMode(isAmber);
            console.log(`身份界面应用初始颜色模式: ${isAmber ? '琥珀色' : '绿色'}`);
        }
    }
    
    // 订阅系统事件
    subscribeToEvents() {
        if (this.eventBus) {
            // 监听系统状态变化事件
            this.eventBus.on('systemStateChange', (data) => {
                // 如果系统关闭且身份界面可见，隐藏它
                if (!data.isOn && this.isVisible) {
                    this.hide();
                    
                    // 如果使用interfaceService，更新界面状态
                    if (this.interfaceService) {
                        this.interfaceService.switchTo('terminal');
                    }
                }
            });
            
            // 监听颜色模式变化事件
            this.eventBus.on('colorModeChanged', (isAmber) => {
                this.view.updateColorMode(isAmber);
            });
            
            // 修复：监听身份变更事件，但避免循环调用
            this.eventBus.on('playerIdentityChanged', async (eventData) => {
                console.log(`捕获到 playerIdentityChanged 事件:`, eventData);
                
                // 只有在界面可见时才更新显示，避免不必要的更新
                if (this.isVisible) {
                    // 使用防抖机制，避免频繁更新
                    if (this._identityUpdateTimeout) {
                        clearTimeout(this._identityUpdateTimeout);
                    }
                    
                    this._identityUpdateTimeout = setTimeout(async () => {
                        await this.updateIdentityDisplays();
                        
                        // 如果当前显示的档案文件是变更的类型，也需要特别更新它
                        if (eventData.type === this.currentIdentityType || 
                            (eventData.type === 'disguise' && this.view.disguisePage.style.display !== 'none')) {
                            await this.switchIdentityView(this.currentIdentityType);
                        }
                    }, 100); // 100ms 防抖
                }
            });
        }
    }
    
    // 设置事件监听
    setupEventListeners() {
        // 基础/伪装页面切换按钮
        const basicInfoButton = this.domUtils.get('#basicInfoButton');
        const disguiseButton = this.domUtils.get('#disguiseButton');
        
        if (basicInfoButton) {
            this.domUtils.on(basicInfoButton, 'click', async () => {
                if (this.audio) this.audio.play('functionButton');
                // 统一使用 navigateToPage 方法
                await this.navigateToPage('basic');
            });
        }
        
        if (disguiseButton) {
            this.domUtils.on(disguiseButton, 'click', async () => {
                if (this.audio) this.audio.play('functionButton');
                // 统一使用 navigateToPage 方法
                await this.navigateToPage('disguise');
            });
        }
        
        // 身份类型变更事件
        if (this.view.typeSelect) {
            this.domUtils.on(this.view.typeSelect, 'change', () => {
                this.handleTypeChange();
            });
        }
        
        // 国籍变更事件
        if (this.view.nationalitySelect) {
            this.domUtils.on(this.view.nationalitySelect, 'change', () => {
                this.handleNationalityChange();
            });
        }
        
        // 应用伪装按钮
        if (this.view.applyDisguiseButton) {
            this.domUtils.on(this.view.applyDisguiseButton, 'click', async () => {
                await this.applyDisguise();
                this.view.showCurrentDisguiseView();
            });
        }
        
        // 清除伪装按钮
        if (this.view.clearDisguiseButton) {
            this.domUtils.on(this.view.clearDisguiseButton, 'click', async () => {
                await this.clearDisguise();
                this.view.showCurrentDisguiseView();
            });
        }

        // 添加更改伪装按钮事件
        const editDisguiseButton = this.domUtils.get('#editDisguiseButton');
        if (editDisguiseButton) {
            this.domUtils.on(editDisguiseButton, 'click', () => {
                if (this.audio) this.audio.play('functionButton');
                this.view.showEditDisguiseView();
                // 确保全局引用可用
                window.identityController = this;
            });
        }

        // 添加快捷清除伪装按钮事件
        const quickClearDisguiseButton = this.domUtils.get('#quickClearDisguiseButton');
        if (quickClearDisguiseButton) {
            this.domUtils.on(quickClearDisguiseButton, 'click', async () => {
                if (this.audio) this.audio.play('systemBeep');
                await this.clearDisguise();
            });
        }
        
        // 添加返回当前伪装按钮事件
        const backToCurrentButton = this.domUtils.get('#backToCurrentButton');
        if (backToCurrentButton) {
            this.domUtils.on(backToCurrentButton, 'click', () => {
                if (this.audio) this.audio.play('functionButton');
                this.view.showCurrentDisguiseView();
            });
        }
        
        // 档案文件区域的标签页切换
        this.domUtils.getAll('.file-tab').forEach(tab => {
            this.domUtils.on(tab, 'click', async (e) => {
                const identityType = e.target.getAttribute('data-identity-type');
                await this.switchIdentityView(identityType);
                
                // 更新标签状态
                this.domUtils.getAll('.file-tab').forEach(t => {
                    this.domUtils.removeClass(t, 'active');
                });
                this.domUtils.addClass(e.target, 'active');
                
                // 播放切换音效
                if (this.audio) this.audio.play('functionButton');
            });
        });

        // 档案文件区域点击事件 - 修改为支持鼠标翻页
        const identityFile = this.domUtils.get('#identityFile');
        if (identityFile) {
            this.domUtils.on(identityFile, 'click', async (e) => {
                // 检查是否为翻页点击
                if (this.handleFileAreaClick(e, 'identity')) {
                    return; // 如果是翻页操作，直接返回
                }
                
                // 否则执行原有的身份切换功能
                await this.toggleIdentityFileView();
                
                // 播放切换音效
                if (this.audio) this.audio.play('functionButton');
            });
        }

        // 当前伪装显示区域点击事件 - 修改为支持鼠标翻页
        const currentDisguiseDisplay = this.domUtils.get('#currentDisguiseDisplay');
        if (currentDisguiseDisplay) {
            this.domUtils.on(currentDisguiseDisplay, 'click', (e) => {
                // 检查是否为翻页点击
                if (this.handleFileAreaClick(e, 'disguise')) {
                    return; // 如果是翻页操作，直接返回
                }
                
                // 否则执行原有的编辑切换功能
                this.view.showEditDisguiseView();
                if (this.audio) this.audio.play('functionButton');
            });
        }

        // 设置键盘导航
        this.setupKeyboardNavigation();
    }

    // 初始化TUI系统
    initializeTUISystem() {
        // TUI状态管理
        this.tuiActive = false;
        this.tuiMode = 'main'; // 'main', 'sub', 'confirm'
        this.tuiCategory = null;
        this.tuiIndex = 0;
        
        // 设置TUI事件监听
        this.setupTUIEventListeners();
    }

    // 设置TUI事件监听
    setupTUIEventListeners() {
        // TUI菜单项点击事件
        document.addEventListener('click', (e) => {
            if (!this.tuiActive) return;
            
            const menuItem = e.target.closest('.tui-menu-item');
            if (!menuItem) return;
            
            this.handleTUIItemClick(menuItem);
        });

        // TUI滚轮事件监听
        document.addEventListener('wheel', (e) => {
            if (!this.tuiActive) return;
            
            const tuiEditor = e.target.closest('.tui-disguise-editor');
            if (!tuiEditor) return;
            
            e.preventDefault();
            
            // 根据滚轮方向导航
            const direction = e.deltaY > 0 ? 1 : -1;
            this.navigateTUI(direction);
        }, { passive: false });
    }

    // 处理TUI菜单项点击
    handleTUIItemClick(menuItem) {
        if (menuItem.classList.contains('tui-disabled')) return;
        
        if (this.tuiMode === 'main') {
            const category = menuItem.dataset.category;
            const action = menuItem.dataset.action;
            
            if (category) {
                this.enterTUISubMenu(category);
            } else if (action === 'apply') {
                this.showTUIConfirmPanel();
            } else if (action === 'clear') {
                this.clearTUIDisguise();
            }
        } else if (this.tuiMode === 'sub') {
            const value = menuItem.dataset.value;
            if (value) {
                this.selectTUIValue(value);
            }
        } else if (this.tuiMode === 'confirm') {
            const action = menuItem.dataset.action;
            if (action === 'confirm') {
                this.applyTUIDisguise();
            } else if (action === 'cancel') {
                this.exitTUIConfirm();
            }
        }
    }

    // 进入TUI子菜单
    enterTUISubMenu(category) {
        this.tuiMode = 'sub';
        this.tuiCategory = category;
        this.tuiIndex = 0;
        this.view.renderTUISubMenu(category);
        this.view.showTUIPanel('tuiSubPanel');
        
        // 设置初始焦点
        setTimeout(() => {
            this.setTUIInitialFocus();
        }, 50);
    }

    // 选择TUI值
    selectTUIValue(value) {
        if (!this.tuiCategory) return;
        
        // 更新选择
        this.view.tuiState.selections[this.tuiCategory] = value;
        
        // 如果选择了身份类型，需要更新职能和机构选项
        if (this.tuiCategory === 'type') {
            this.view.tuiState.selections.function = null;
            this.view.tuiState.selections.organization = null;
        } else if (this.tuiCategory === 'nationality') {
            this.view.tuiState.selections.organization = null;
        }
        
        // 返回主菜单
        this.exitTUISubMenu();
    }

    // 退出TUI子菜单
    exitTUISubMenu() {
        this.tuiMode = 'main';
        this.tuiCategory = null;
        this.tuiIndex = 0;
        this.view.renderTUIMainMenu();
        this.view.showTUIPanel('tuiMainPanel');
        
        // 恢复主菜单焦点
        setTimeout(() => {
            this.setTUIInitialFocus();
        }, 50);
    }

    // 显示TUI确认面板
    showTUIConfirmPanel() {
        this.tuiMode = 'confirm';
        this.tuiIndex = 0;
        this.view.renderTUIConfirmPanel();
        this.view.showTUIPanel('tuiConfirmPanel');
        
        // 设置初始焦点
        setTimeout(() => {
            this.setTUIInitialFocus();
        }, 50);
    }

    // 退出TUI确认面板
    exitTUIConfirm() {
        this.tuiMode = 'main';
        this.tuiIndex = 0;
        this.view.renderTUIMainMenu();
        this.view.showTUIPanel('tuiMainPanel');
        
        // 恢复主菜单焦点
        setTimeout(() => {
            this.setTUIInitialFocus();
        }, 50);
    }

    // 应用TUI伪装
    async applyTUIDisguise() {
        try {
            const selections = this.view.getTUISelections();
            console.log('TUI伪装选择:', selections);
            
            // 验证必要的选择
            if (!selections.nationality || !selections.type) {
                console.warn('缺少必要的伪装参数');
                this.view.updateTUIStatus('请设置国籍和身份类型');
                return;
            }
            
            // 同步到传统表单 - 修复联动问题
            // 1) 先设置国籍和类型
            if (this.view.nationalitySelect) this.view.nationalitySelect.value = selections.nationality || '';
            if (this.view.typeSelect) this.view.typeSelect.value = selections.type || '';
            
            // 2) 触发联动，刷新职能和机构下拉框
            this.handleTypeChange();       // 根据新类型刷新职能 + 机构
            this.handleNationalityChange(); // 根据新国籍刷新机构
            
            // 3) 再设置职能和机构（此时两张列表已包含正确选项）
            if (this.view.functionSelect) this.view.functionSelect.value = selections.function || '';
            if (this.view.organizationSelect) this.view.organizationSelect.value = selections.organization || '';
            
            // 使用现有的应用伪装方法
            const result = await this.applyDisguise();
            
            if (result) {
                console.log('TUI伪装应用成功');
                // 退出TUI
                this.exitTUIMode();
            } else {
                console.error('TUI伪装应用失败');
                this.view.updateTUIStatus('应用失败，请重试');
            }
        } catch (error) {
            console.error('TUI伪装应用出错:', error);
            this.view.updateTUIStatus('应用出错，请重试');
        }
    }

    // 清除TUI伪装
    async clearTUIDisguise() {
        await this.clearDisguise();
        this.view.resetTUIState();
        this.exitTUIMode();
    }

    // 进入TUI模式
    enterTUIMode() {
        this.tuiActive = true;
        this.tuiMode = 'main';
        this.tuiIndex = 0;
        
        // 从当前伪装加载数据
        this.loadCurrentDisguiseToTUI();
        
        this.view.renderTUIMainMenu();
        this.view.showTUIPanel('tuiMainPanel');
        
        // 设置初始焦点
        setTimeout(() => {
            this.setTUIInitialFocus();
        }, 50);
    }

    // 退出TUI模式
    exitTUIMode() {
        this.tuiActive = false;
        this.view.showCurrentDisguiseView();
    }

    // 加载当前伪装到TUI
    async loadCurrentDisguiseToTUI() {
        try {
            const disguise = await this.model.getDisguiseIdentity();
            if (disguise) {
                this.view.setTUISelections({
                    nationality: disguise.nationality,
                    type: disguise.type,
                    function: disguise.function,
                    organization: disguise.organization
                });
                
                // 同时更新隐藏表单元素 - 修复联动问题
                // 1) 先设置国籍和类型
                if (this.view.nationalitySelect) this.view.nationalitySelect.value = disguise.nationality || '';
                if (this.view.typeSelect) this.view.typeSelect.value = disguise.type || '';
                
                // 2) 触发联动，刷新职能和机构下拉框
                this.handleTypeChange();       // 根据新类型刷新职能 + 机构
                this.handleNationalityChange(); // 根据新国籍刷新机构
                
                // 3) 再设置职能和机构（此时两张列表已包含正确选项）
                if (this.view.functionSelect) this.view.functionSelect.value = disguise.function || '';
                if (this.view.organizationSelect) this.view.organizationSelect.value = disguise.organization || '';
            } else {
                // 没有伪装时清空选择
                this.view.setTUISelections({
                    nationality: null,
                    type: null,
                    function: null,
                    organization: null
                });
            }
        } catch (error) {
            console.error("加载当前伪装到TUI失败:", error);
        }
    }
    
    // 填充表单选择框
    populateFormSelects() {
        // 填充国籍选择框
        this.view.populateNationalitySelect(this.model.NATIONALITIES);
        
        // 填充类型选择框
        this.view.populateTypeSelect(this.model.IDENTITY_TYPES);
        
        // 初始填充职能选择框
        const initialType = this.model.IDENTITY_TYPES[0]; // 获取第一个类型作为默认
        this.view.populateFunctionSelect(this.model.getFunctionsForType(initialType));
        
        // 初始填充机构选择框
        const initialNationality = this.model.NATIONALITIES[0]; // 获取第一个国籍作为默认
        this.view.populateOrganizationSelect(
            this.model.getOrganizationsForIdentity(initialNationality, initialType)
        );
    }
    
    // 处理类型变更
    handleTypeChange() {
        const selectedType = this.view.typeSelect.value;
        
        // 根据选择的类型更新职能选项
        const functions = this.model.getFunctionsForType(selectedType);
        this.view.populateFunctionSelect(functions);
        
        // 根据选择的国籍和类型更新机构选项
        const selectedNationality = this.view.nationalitySelect.value;
        const organizations = this.model.getOrganizationsForIdentity(selectedNationality, selectedType);
        this.view.populateOrganizationSelect(organizations);
    }
    
    // 处理国籍变更
    handleNationalityChange() {
        const selectedNationality = this.view.nationalitySelect.value;
        const selectedType = this.view.typeSelect.value;
        
        // 更新机构选项
        const organizations = this.model.getOrganizationsForIdentity(selectedNationality, selectedType);
        this.view.populateOrganizationSelect(organizations);
    }
    
    // 应用伪装
    async applyDisguise() {
        try {
            const nationality = this.view.nationalitySelect.value;
            const type = this.view.typeSelect.value;
            const func = this.view.functionSelect.value || null;
            const organization = this.view.organizationSelect.value || null;
            
            // 使用新的带可信度计算的方法
            const result = await this.model.setDisguiseIdentityWithCredibility(nationality, type, func, organization);
            
            if (result) {
                // 获取新的伪装身份和可信度数据
                const newDisguise = await this.model.getDisguiseIdentity();
                
                // 获取可信度数据
                let credibility = null;
                let riskLevel = null;
                try {
                    const identityService = this.serviceLocator.get('identityService');
                    if (identityService) {
                        credibility = await identityService.calculateCurrentDisguiseCredibility();
                        riskLevel = await identityService.getCurrentDisguiseRiskLevel();
                    }
                } catch (error) {
                    console.warn("获取可信度数据失败:", error);
                }
                
                // 更新伪装显示 - 传递可信度数据
                await this.view.updateDisguiseIdentity(newDisguise, credibility, riskLevel);
                
                // 更新可信度显示
                await this.updateCredibilityDisplay();
                
                // 播放音效
                if (this.audio) this.audio.play('systemBeep');
                
                return true;
            }
            return false;
        } catch (error) {
            console.error("应用伪装失败:", error);
            return false;
        }
    }
    
    // 清除伪装
    async clearDisguise() {
        try {
            const result = await this.model.clearDisguise();
            
            if (result) {
                // 更新伪装显示 - 清除时不需要可信度数据
                await this.view.updateDisguiseIdentity(null);
                
                // 播放音效
                if (this.audio) this.audio.play('systemBeep');
                
                return true;
            }
            return false;
        } catch (error) {
            console.error("清除伪装失败:", error);
            return false;
        }
    }
    
    // 更新所有身份显示
    async updateIdentityDisplays() {
        try {
            const realId = await this.model.getRealIdentity();
            const coverId = await this.model.getCoverIdentity();
            const disguiseId = await this.model.getDisguiseIdentity();
            
            this.view.updateRealIdentity(realId);
            this.view.updateCoverIdentity(coverId);

            // 如果有伪装身份，获取可信度数据
            if (disguiseId) {
                let credibility = null;
                let riskLevel = null;
                try {
                    const identityService = this.serviceLocator.get('identityService');
                    if (identityService) {
                        credibility = await identityService.calculateCurrentDisguiseCredibility();
                        riskLevel = await identityService.getCurrentDisguiseRiskLevel();
                    }
                } catch (error) {
                    console.warn("获取可信度数据失败:", error);
                }
                
                await this.view.updateDisguiseIdentity(disguiseId, credibility, riskLevel);
            } else {
                await this.view.updateDisguiseIdentity(null);
            }
            
            if (this.view.basicInfoPage.style.display !== 'none') {
                await this.switchIdentityView(this.currentIdentityType);
            }
            
            // 更新完成后保存状态
            if (this.isVisible) {
                this.saveCurrentState();
            }
            
            return true;
        } catch (error) {
            console.error("更新身份显示失败:", error);
            return false;
        }
    }
        
    // 切换身份界面可见性
    async toggleIdentityView() {
        // 检查系统是否开机
        const systemService = this.serviceLocator.get('system');
        if (!systemService || !systemService.isOperational()) {
            console.log("系统未开机，无法切换到档案视图");
            return false;
        }
        
        // 使用界面服务切换
        if (this.interfaceService) {
            if (this.isVisible) {
                // 如果当前已经显示档案，则切回终端
                this.interfaceService.switchTo('terminal');
            } else {
                // 否则切到档案
                this.interfaceService.switchTo('identity');
            }
            return true;
        }
        
        // 旧的逻辑 (如果 interfaceService 不存在)
        if (this.isVisible) {
            this.hide();
        } else {
            await this.show();
        }
        return this.isVisible;
    }
    
    // 显示身份界面
    async show() {
        // 只有在未显示时才更新显示内容
        if (!this.isVisible) {
            await this.updateIdentityDisplays();
        }
        
        this.view.show();
        this.isVisible = true;
        
        // 启用键盘导航并恢复状态
        this.enableKeyboardNavigationWithStateRestore();
    }
    
    // 隐藏身份界面
    hide() {
        // 停止持续滚动
        this.stopContinuousScroll();
        
        // 如果处于滚动模式，退出
        if (this.fileScrollMode) {
            this.exitFileScrollMode();
        }
        
        this.view.hide();
        this.isVisible = false;
        
        // 禁用键盘导航
        this.disableKeyboardNavigation();
    }

    // 切换档案文件区域显示的身份 (真实身份 vs 表面身份)
    async switchIdentityView(identityTypeSuffix) {
        const identityFile = this.domUtils.get('#identityFile');
        if (!identityFile) return;
        
        this.currentIdentityType = identityTypeSuffix;

        let identityData = null;
        let isSecret = false;
        
        try {
            if (identityTypeSuffix === 'real') {
                identityData = await this.model.getRealIdentity();
                isSecret = true;
            } else {
                identityData = await this.model.getCoverIdentity();
                isSecret = false;
            }
            
            // 使用异步的显示方法
            await this.view.updateFilePageDisplay(identityData, 1, 1, isSecret, identityTypeSuffix);
            
            // 设置国籍特定样式
            if (identityData) {
                // 移除所有国籍类
                this.domUtils.removeClass(identityFile, 'nationality-usa', 'nationality-uk', 'nationality-france', 'nationality-soviet');
                
                // 添加对应国籍类（让CSS处理颜色）
                switch(identityData.nationality) {
                    case "美国": this.domUtils.addClass(identityFile, 'nationality-usa'); break;
                    case "英国": this.domUtils.addClass(identityFile, 'nationality-uk'); break;
                    case "法国": this.domUtils.addClass(identityFile, 'nationality-france'); break;
                    case "苏联": this.domUtils.addClass(identityFile, 'nationality-soviet'); break;
                }
            }
            
            return true;
        } catch (error) {
            console.error(`切换身份视图到 ${identityTypeSuffix} 失败:`, error);
            identityFile.innerHTML = "<p>加载身份信息失败...</p>";
            return false;
        }
    }

    // 点击档案文件时，在真实身份和表面身份之间切换
    async toggleIdentityFileView() {
        const newType = (this.currentIdentityType === 'cover') ? 'real' : 'cover';
        await this.switchIdentityView(newType);

        // 更新标签页的激活状态
        this.domUtils.getAll('.file-tab').forEach(t => {
            this.domUtils.removeClass(t, 'active');
        });
        
        const activeTab = this.domUtils.get(`.file-tab[data-identity-type="${newType}"]`);
        if (activeTab) {
            this.domUtils.addClass(activeTab, 'active');
        }
    }
    
    // 检查身份是否被识破
    async checkIdentityBlown(detectionRate) {
        try {
            const isBlown = await this.model.checkDisguiseDetection(detectionRate);
            
            if (isBlown) {
                // 伪装被识破，恢复表面身份
                await this.model.blowDisguise();
                return true;
            }
            return false;
        } catch (error) {
            console.error("检查身份是否被识破失败:", error);
            return false;
        }
    }
    
    // 设置颜色模式
    updateColorMode(isAmber) {
        this.view.updateColorMode(isAmber);
    }

    // F2按钮调用的方法
    async showHideIdentityView() {
        return await this.toggleIdentityView();
    }

    // 设置键盘导航系统
    setupKeyboardNavigation() {
        // 移除之前的事件监听器（如果存在）
        if (this.keyboardEventListener) {
            document.removeEventListener('keydown', this.keyboardEventListener, true);
        }
        if (this.keyupEventListener) {
            document.removeEventListener('keyup', this.keyupEventListener, true);
        }

        // 创建绑定到当前实例的事件处理器
        this.keyboardEventListener = (e) => {
            this.handleKeyDown(e);
        };
        
        this.keyupEventListener = (e) => {
            this.handleKeyUp(e);
        };

        // 绑定事件
        document.addEventListener('keydown', this.keyboardEventListener, true);
        document.addEventListener('keyup', this.keyupEventListener, true);
        
        console.log('键盘事件监听器已设置');
    }

    // 处理键盘导航 - 重构为行列导航
    handleKeyDown(e) {
        if (!this.isVisible || !this.keyboardNavigationEnabled) return;
        
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // 如果当前处于TUI模式，优先处理TUI键盘事件
        if (this.tuiActive) {
            this.handleTUIKeyDown(e);
            return;
        }
        
        // 处理持续滚动的按键
        if (this.fileScrollMode && this.isScrollKey(e.code)) {
            e.preventDefault();
            
            // 防止重复处理（按住时的重复事件）
            if (e.repeat) return;
            
            // 如果按键状态发生变化，更新状态并开始滚动
            if (!this.keyStates[e.code]) {
                this.keyStates[e.code] = true;
                this.updateScrollDirection();
                
                console.log(`按键按下: ${e.code}, 当前方向: ${this.scrollDirection}`);
                
                // 如果之前没有滚动，开始新的滚动
                if (!this.scrollAnimation) {
                    this.startContinuousScroll();
                    console.log('开始新的滚动动画');
                }
            }
            return;
        }
        
        // 防止重复触发（按住按键时）
        if (e.repeat) return;
        
        switch (e.key) {
            case 'F1':
                return;
                
            case 'q':
            case 'Q':
                e.preventDefault();
                this.quickNavigateToPage('basic');
                break;
            case 'e':
            case 'E':
                e.preventDefault();
                this.quickNavigateToPage('disguise');
                break;
            
            // 上下键：行间导航（非滚动模式）或滚动（滚动模式）
            case 'w':
            case 'W':
            case 'ArrowUp':
                e.preventDefault();
                if (!this.fileScrollMode) {
                    this.navigateRow(-1);
                }
                break;
            case 's':
            case 'S':
            case 'ArrowDown':
                e.preventDefault();
                if (!this.fileScrollMode) {
                    this.navigateRow(1);
                }
                break;
            
            // 左右键：在滚动模式和正常模式下有不同行为
            case 'a':
            case 'A':
            case 'ArrowLeft':
                e.preventDefault();
                if (this.fileScrollMode) {
                    // 滚动模式下：退出滚动模式
                    this.exitFileScrollMode();
                    if (this.audio) this.audio.play('functionButton');
                } else {
                    // 正常模式下：列间导航
                    this.navigateLeftRight(-1);
                }
                break;
            case 'd':
            case 'D':
            case 'ArrowRight':
                e.preventDefault();
                if (this.fileScrollMode) {
                    // 滚动模式下：不做任何操作（或者可以添加其他功能）
                    // 保持在滚动模式中
                } else {
                    // 正常模式下：检查是否在档案区域，如果是则进入滚动模式
                    const currentElement = this.getCurrentFocusElement();
                    if (currentElement && (currentElement.type === 'identity-file' || currentElement.type === 'disguise-display')) {
                        // 在档案区域，进入滚动模式
                        this.enterFileScrollMode(currentElement.element);
                        if (this.audio) this.audio.play('functionButton');
                    } else {
                        // 不在档案区域，正常的列间导航
                        this.navigateLeftRight(1);
                    }
                }
                break;
            
            case ' ':
                e.preventDefault();
                this.activateCurrentElement();
                break;
            case 'Enter':
                e.preventDefault();
                this.confirmCurrentElement();
                break;
            case 'Escape':
                e.preventDefault();
                this.handleEscape();
                break;
            
            default:
                return;
        }
    }

    // 处理TUI模式的键盘事件
    handleTUIKeyDown(e) {
        e.preventDefault();
        
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.navigateTUI(-1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                this.navigateTUI(1);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
            case 'Enter':
                this.activateTUIItem();
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
            case 'Escape':
                this.backTUI();
                break;
            case 'Tab':
                this.fastSwitchTUICategory();
                break;
            case 'A':
            case 'a':
                if (this.tuiMode === 'main') {
                    this.showTUIConfirmPanel();
                }
                break;
            case 'C':
            case 'c':
                if (this.tuiMode === 'main') {
                    this.clearTUIDisguise();
                }
                break;
            default:
                return;
        }
        
        if (this.audio) this.audio.play('functionButton');
    }

    // TUI导航
    navigateTUI(direction) {
        const panel = this.getCurrentTUIPanel();
        if (!panel) return;
        
        const items = panel.querySelectorAll('.tui-menu-item:not(.tui-disabled)');
        if (items.length === 0) return;
        
        // 移除当前选择
        items.forEach(item => item.classList.remove('tui-selected'));
        
        // 计算新索引
        this.tuiIndex += direction;
        if (this.tuiIndex < 0) this.tuiIndex = items.length - 1;
        if (this.tuiIndex >= items.length) this.tuiIndex = 0;
        
        // 设置新选择
        items[this.tuiIndex].classList.add('tui-selected');
        
        // 滚动到焦点项
        this.scrollTUIToFocus(items[this.tuiIndex], panel);
    }

    // 激活TUI项目
    activateTUIItem() {
        const panel = this.getCurrentTUIPanel();
        if (!panel) return;
        
        const items = panel.querySelectorAll('.tui-menu-item:not(.tui-disabled)');
        if (this.tuiIndex >= 0 && this.tuiIndex < items.length) {
            this.handleTUIItemClick(items[this.tuiIndex]);
        }
    }

    // TUI返回操作
    backTUI() {
        if (this.tuiMode === 'sub') {
            this.exitTUISubMenu();
        } else if (this.tuiMode === 'confirm') {
            this.exitTUIConfirm();
        } else {
            this.exitTUIMode();
        }
    }

    // 快速切换TUI分类
    fastSwitchTUICategory() {
        if (this.tuiMode !== 'main') return;
        
        const categories = ['nationality', 'type', 'function', 'organization'];
        let nextCategory = null;
        
        // 找到当前选择的分类的下一个
        const panel = this.getCurrentTUIPanel();
        const items = panel.querySelectorAll('.tui-menu-item[data-category]');
        
        for (let i = 0; i < items.length; i++) {
            if (i === this.tuiIndex) {
                const currentCategory = items[i].dataset.category;
                const currentIndex = categories.indexOf(currentCategory);
                const nextIndex = (currentIndex + 1) % categories.length;
                nextCategory = categories[nextIndex];
                break;
            }
        }
        
        if (nextCategory) {
            this.enterTUISubMenu(nextCategory);
        }
    }

    // 获取当前TUI面板
    getCurrentTUIPanel() {
        if (this.tuiMode === 'main') {
            return this.view.domUtils.get('#tuiMainPanel');
        } else if (this.tuiMode === 'sub') {
            return this.view.domUtils.get('#tuiSubPanel');
        } else if (this.tuiMode === 'confirm') {
            return this.view.domUtils.get('#tuiConfirmPanel');
        }
        return null;
    }

    // 滚动TUI面板使焦点项可见
    scrollTUIToFocus(focusItem, panel) {
        if (!focusItem || !panel) return;
        
        const panelRect = panel.getBoundingClientRect();
        const itemRect = focusItem.getBoundingClientRect();
        
        // 检查项目是否在可视区域内
        const isVisible = itemRect.top >= panelRect.top && itemRect.bottom <= panelRect.bottom;
        
        if (!isVisible) {
            // 计算需要滚动的距离
            const panelScrollTop = panel.scrollTop;
            const itemOffsetTop = focusItem.offsetTop;
            const panelHeight = panel.clientHeight;
            const itemHeight = focusItem.offsetHeight;
            
            let newScrollTop;
            
            if (itemRect.top < panelRect.top) {
                // 项目在可视区域上方，滚动到顶部
                newScrollTop = itemOffsetTop - 10; // 留10px边距
            } else {
                // 项目在可视区域下方，滚动到底部
                newScrollTop = itemOffsetTop - panelHeight + itemHeight + 10; // 留10px边距
            }
            
            // 平滑滚动
            panel.scrollTo({
                top: Math.max(0, newScrollTop),
                behavior: 'smooth'
            });
                 }
     }

    // 设置TUI初始焦点
    setTUIInitialFocus() {
        const panel = this.getCurrentTUIPanel();
        if (!panel) return;
        
        const items = panel.querySelectorAll('.tui-menu-item:not(.tui-disabled)');
        if (items.length === 0) return;
        
        // 移除所有选择状态
        items.forEach(item => item.classList.remove('tui-selected'));
        
        // 确保索引在有效范围内
        if (this.tuiIndex >= items.length) {
            this.tuiIndex = 0;
        }
        
        // 设置当前项为选中状态
        if (items[this.tuiIndex]) {
            items[this.tuiIndex].classList.add('tui-selected');
            this.scrollTUIToFocus(items[this.tuiIndex], panel);
        }
    }

    // 行间导航（上下键）
    navigateRow(direction) {
        if (this.focusRows.length === 0) return;
        
        // 正常的行间导航逻辑（滚动模式下不会调用到这里）
        const newRow = this.currentRow + direction;
        
        if (newRow >= 0 && newRow < this.focusRows.length) {
            this.currentRow = newRow;
            
            const currentRowElements = this.focusRows[this.currentRow].elements;
            if (this.currentCol >= currentRowElements.length) {
                this.currentCol = Math.max(0, currentRowElements.length - 1);
            }
            
            this.updateFocus();
        }
    }

    // 左右导航（左右键）
    navigateLeftRight(direction) {
        if (this.focusRows.length === 0) return;
        
        const currentRowData = this.focusRows[this.currentRow];
        if (!currentRowData) return;
        
        // 普通的列间导航
        const newCol = this.currentCol + direction;
        const elements = currentRowData.elements;
        
        if (newCol >= 0 && newCol < elements.length) {
            this.currentCol = newCol;
            this.updateFocus();
        }
    }

    // 更新焦点显示
    updateFocus() {
        // 如果处于滚动模式，不更新焦点
        if (this.fileScrollMode) return;
        
        // 清除所有焦点
        this.view.clearAllFocus();
        
        // 设置新焦点
        if (this.currentRow >= 0 && this.currentRow < this.focusRows.length) {
            const currentRowData = this.focusRows[this.currentRow];
            const elements = currentRowData.elements;
            
            if (this.currentCol >= 0 && this.currentCol < elements.length) {
                const currentElement = elements[this.currentCol];
                this.view.setFocus(currentElement.element, currentElement.type);
                
                console.log(`焦点: 行${this.currentRow} 列${this.currentCol} ${currentElement.type}`);
            }
        }
    }

    // 获取当前焦点元素
    getCurrentFocusElement() {
        if (this.currentRow >= 0 && this.currentRow < this.focusRows.length) {
            const currentRowData = this.focusRows[this.currentRow];
            const elements = currentRowData.elements;
            
            if (this.currentCol >= 0 && this.currentCol < elements.length) {
                return elements[this.currentCol];
            }
        }
        return null;
    }

    // 初始化行列焦点结构
    initializeFocusableElements() {
        this.focusRows = [];
        
        console.log(`初始化行列焦点，当前页面: ${this.currentPage}`);
        
        if (this.currentPage === 'basic') {
            this.initializeBasicPageFocus();
        } else if (this.currentPage === 'disguise') {
            this.initializeDisguisePageFocus();
        }
        
        // 重置焦点位置
        this.currentRow = 0;
        this.currentCol = 0;
        
        console.log(`焦点行初始化完成: ${this.focusRows.length} 行`);
    }

    // 初始化基本档案页面焦点
    initializeBasicPageFocus() {
        // 第1行：档案文件区域
        const identityFile = this.domUtils.get('#identityFile');
        if (identityFile) {
            this.focusRows.push({
                row: 0,
                elements: [{ element: identityFile, type: 'identity-file' }]
            });
        }
        
        // 第2行：导航按钮
        const basicInfoButton = this.domUtils.get('#basicInfoButton');
        const disguiseButton = this.domUtils.get('#disguiseButton');
        const navButtons = [];
        
        if (basicInfoButton) navButtons.push({ element: basicInfoButton, type: 'nav-button' });
        if (disguiseButton) navButtons.push({ element: disguiseButton, type: 'nav-button' });
        
        if (navButtons.length > 0) {
            this.focusRows.push({
                row: 1,
                pageNavigation: null,
                elements: navButtons
            });
        }
    }

    // 初始化伪装页面焦点
    initializeDisguisePageFocus() {
        let rowIndex = 0;
        
        // 第1行：操作按钮（清除伪装、更改伪装）
        const editDisguiseButton = this.domUtils.get('#editDisguiseButton');
        const quickClearButton = this.domUtils.get('#quickClearDisguiseButton');
        const backButton = this.domUtils.get('#backToCurrentButton');
        
        const actionButtons = [];
        if (quickClearButton && quickClearButton.style.display !== 'none') {
            actionButtons.push({ element: quickClearButton, type: 'action-button' });
        }
        if (editDisguiseButton && editDisguiseButton.style.display !== 'none') {
            actionButtons.push({ element: editDisguiseButton, type: 'action-button' });
        }
        if (backButton && backButton.style.display !== 'none') {
            actionButtons.push({ element: backButton, type: 'action-button' });
        }
        
        if (actionButtons.length > 0) {
            this.focusRows.push({
                row: rowIndex++,
                pageNavigation: null,
                elements: actionButtons
            });
        }
        
        // 第2行：伪装档案区域
        const currentDisguiseDisplay = this.domUtils.get('#currentDisguiseDisplay');
        if (currentDisguiseDisplay) {
            this.focusRows.push({
                row: rowIndex++,
                elements: [{ element: currentDisguiseDisplay, type: 'disguise-display' }]
            });
        }
        
        // 第3行：导航按钮
        const basicInfoButton = this.domUtils.get('#basicInfoButton');
        const disguiseButton = this.domUtils.get('#disguiseButton');
        const navButtons = [];
        
        if (basicInfoButton) navButtons.push({ element: basicInfoButton, type: 'nav-button' });
        if (disguiseButton) navButtons.push({ element: disguiseButton, type: 'nav-button' });
        
        if (navButtons.length > 0) {
            this.focusRows.push({
                row: rowIndex++,
                pageNavigation: null,
                elements: navButtons
            });
        }
    }

    // 修改激活元素方法
    async activateCurrentElement() {
        const currentElement = this.getCurrentFocusElement();
        if (!currentElement) return;
        
        // 保存当前焦点信息
        const focusMemory = this.saveFocusMemory();
        
        switch (currentElement.type) {
            case 'identity-file':
                await this.toggleIdentityFileView();
                // 操作后恢复焦点到相同位置
                setTimeout(() => {
                    this.restoreFocusFromMemory(focusMemory, this.currentPage);
                }, 50);
                if (this.audio) this.audio.play('functionButton');
                break;
            case 'disguise-display':
                this.view.showEditDisguiseView();
                // 重新初始化焦点（因为界面发生了变化）
                setTimeout(() => {
                    this.initializeFocusableElements();
                    // 对于进入编辑模式，焦点可以移到第一个操作按钮
                    this.currentRow = 0;
                    this.currentCol = 0;
                    this.updateFocus();
                }, 50);
                if (this.audio) this.audio.play('functionButton');
                break;
        }
    }

    // 修改确认元素方法
    async confirmCurrentElement() {
        const currentElement = this.getCurrentFocusElement();
        if (!currentElement) return;
        
        // 如果当前选中的是档案区域，进入滚动模式
        // 注意：现在可以通过 Enter 键或右方向键/D键进入滚动模式
        if (currentElement.type === 'identity-file' || currentElement.type === 'disguise-display') {
            this.enterFileScrollMode(currentElement.element);
            if (this.audio) this.audio.play('functionButton');
            return;
        }
        
        // 保存当前焦点信息
        const focusMemory = this.saveFocusMemory();
        
        switch (currentElement.type) {
            case 'nav-button':
                const buttonId = currentElement.element.id;
                if (buttonId === 'basicInfoButton') {
                    await this.navigateToPage('basic');
                } else if (buttonId === 'disguiseButton') {
                    await this.navigateToPage('disguise');
                } else {
                    currentElement.element.click();
                    setTimeout(() => {
                        this.initializeFocusableElements();
                        this.restoreFocusFromMemory(focusMemory, this.currentPage);
                    }, 100);
                }
                break;
            case 'action-button':
                currentElement.element.click();
                setTimeout(() => {
                    this.initializeFocusableElements();
                    this.restoreFocusFromMemory(focusMemory, this.currentPage);
                }, 100);
                break;
            default:
                await this.activateCurrentElement();
                break;
        }
    }

    // 修改页面导航方法，实现焦点停留
    async navigateToPage(page) {
        if (this.currentPage === page) return;
        
        // 如果当前处于滚动模式，先退出
        if (this.fileScrollMode) {
            this.exitFileScrollMode();
        }
        
        const previousPage = this.currentPage;
        
        // 记录当前焦点元素的信息，用于页面切换后恢复
        const focusMemory = this.saveFocusMemory();
        
        this.currentPage = page;
        
        if (page === 'basic') {
            this.view.showBasicInfoPage();
            this.currentIdentityType = 'cover';
            await this.switchIdentityView('cover');
        } else if (page === 'disguise') {
            this.view.showDisguisePage();
            this.view.showCurrentDisguiseView();
            await this.updateDisguiseFilePageDisplay();
        }
        
        // 延迟初始化行列焦点并恢复焦点位置
        setTimeout(() => {
            this.initializeFocusableElements();
            this.restoreFocusFromMemory(focusMemory, page);
            console.log(`页面切换: ${previousPage} -> ${page}, 焦点已恢复`);
        }, 50);
        
        if (this.audio) this.audio.play('functionButton');
    }

    // 保存当前焦点信息
    saveFocusMemory() {
        const currentElement = this.getCurrentFocusElement();
        if (!currentElement) {
            return {
                type: null,
                elementId: null,
                row: this.currentRow,
                col: this.currentCol
            };
        }
        
        const elementId = currentElement.element.id || null;
        
        return {
            type: currentElement.type,
            elementId: elementId,
            row: this.currentRow,
            col: this.currentCol
        };
    }

    // 从焦点记忆中恢复焦点位置
    restoreFocusFromMemory(focusMemory, targetPage) {
        if (!focusMemory) {
            // 如果没有焦点记忆，默认设置到第一个元素
            this.currentRow = 0;
            this.currentCol = 0;
            this.updateFocus();
            return;
        }
        
        // 优先级1: 如果有具体的元素ID（通常是按钮），尝试找到它
        if (focusMemory.elementId) {
            const targetPosition = this.findElementInFocusRows(focusMemory.elementId);
            if (targetPosition) {
                this.currentRow = targetPosition.row;
                this.currentCol = targetPosition.col;
                this.updateFocus();
                console.log(`焦点恢复到元素: ${focusMemory.elementId} (行${this.currentRow} 列${this.currentCol})`);
                return;
            }
        }
        
        // 优先级2: 根据元素类型找到合适的位置
        const targetPosition = this.findSimilarElementPosition(focusMemory.type, targetPage);
        if (targetPosition) {
            this.currentRow = targetPosition.row;
            this.currentCol = targetPosition.col;
            this.updateFocus();
            console.log(`焦点恢复到类似元素: ${focusMemory.type} (行${this.currentRow} 列${this.currentCol})`);
            return;
        }
        
        // 优先级3: 尝试保持在相同的行列位置
        if (focusMemory.row < this.focusRows.length) {
            const targetRow = Math.min(focusMemory.row, this.focusRows.length - 1);
            const targetCol = Math.min(focusMemory.col, this.focusRows[targetRow].elements.length - 1);
            
            this.currentRow = targetRow;
            this.currentCol = Math.max(0, targetCol);
            this.updateFocus();
            console.log(`焦点恢复到位置: 行${this.currentRow} 列${this.currentCol}`);
            return;
        }
        
        // 最后的默认选项：设置到第一个元素
        this.currentRow = 0;
        this.currentCol = 0;
        this.updateFocus();
        console.log(`焦点恢复到默认位置: 行${this.currentRow} 列${this.currentCol}`);
    }

    // 在焦点行中查找指定ID的元素
    findElementInFocusRows(elementId) {
        for (let row = 0; row < this.focusRows.length; row++) {
            const elements = this.focusRows[row].elements;
            for (let col = 0; col < elements.length; col++) {
                if (elements[col].element.id === elementId) {
                    return { row, col };
                }
            }
        }
        return null;
    }

    // 根据元素类型找到合适的位置
    findSimilarElementPosition(elementType, targetPage) {
        if (!elementType) return null;
        
        // 特殊处理：导航按钮类型
        if (elementType === 'nav-button') {
            // 在新页面中，尝试找到对应的按钮
            if (targetPage === 'basic') {
                // 切换到基本档案页，尝试找到基本档案按钮
                return this.findElementInFocusRows('basicInfoButton');
            } else if (targetPage === 'disguise') {
                // 切换到伪装系统页，尝试找到伪装系统按钮
                return this.findElementInFocusRows('disguiseButton');
            }
        }
        
        // 其他类型：找到第一个相同类型的元素
        for (let row = 0; row < this.focusRows.length; row++) {
            const elements = this.focusRows[row].elements;
            for (let col = 0; col < elements.length; col++) {
                if (elements[col].type === elementType) {
                    return { row, col };
                }
            }
        }
        
        return null;
    }

    // 档案翻页方法保持不变，但去掉焦点重新设置
    async navigateFilePage(direction) {
        const newPage = this.currentFilePage + direction;
        
        if (newPage >= 1 && newPage <= this.totalFilePages) {
            this.currentFilePage = newPage;
            await this.updateFilePageDisplay();
            if (this.audio) this.audio.play('functionButton');
        }
    }

    async navigateDisguiseFilePage(direction) {
        const newPage = this.currentDisguiseFilePage + direction;
        
        if (newPage >= 1 && newPage <= this.totalDisguiseFilePages) {
            this.currentDisguiseFilePage = newPage;
            await this.updateDisguiseFilePageDisplay();
            if (this.audio) this.audio.play('functionButton');
        }
    }

    // 启用键盘导航
    enableKeyboardNavigation() {
        this.keyboardNavigationEnabled = true;
        this.initializeFocusableElements();
        this.updateFocus();
        console.log("身份系统: 行列键盘导航已启用");
    }

    // 禁用键盘导航
    disableKeyboardNavigation() {
        this.keyboardNavigationEnabled = false;
        
        // 停止持续滚动
        this.stopContinuousScroll();
        
        // 重置按键状态
        Object.keys(this.keyStates).forEach(key => {
            this.keyStates[key] = false;
        });
        this.scrollDirection = 0;
        
        // 移除事件监听器
        if (this.keyboardEventListener) {
            document.removeEventListener('keydown', this.keyboardEventListener, true);
        }
        if (this.keyupEventListener) {
            document.removeEventListener('keyup', this.keyupEventListener, true);
        }
        
        this.view.clearAllFocus();
        console.log("身份系统: 键盘导航已禁用，滚动状态已重置");
    }

    // 处理Escape键
    handleEscape() {
        // 如果处于档案滚动模式，退出滚动模式
        // 注意：现在可以通过 Esc 键或左方向键/A键退出滚动模式
        if (this.fileScrollMode) {
            this.exitFileScrollMode();
            if (this.audio) this.audio.play('functionButton');
            return;
        }
        
        // 原有的Escape处理逻辑
        const editView = this.domUtils.get('#disguiseEditView');
        if (editView && editView.style.display !== 'none') {
            this.view.showCurrentDisguiseView();
            this.initializeFocusableElements();
            this.updateFocus();
            if (this.audio) this.audio.play('functionButton');
        }
    }

    // 更新档案页面显示
    async updateFilePageDisplay() {
        if (this.currentPage !== 'basic') return;
        
        // 获取当前身份数据
        let identityData = null;
        let isSecret = false;
        
        try {
            if (this.currentIdentityType === 'real') {
                identityData = await this.model.getRealIdentity();
                isSecret = true;
            } else {
                identityData = await this.model.getCoverIdentity();
                isSecret = false;
            }
            
            // 更新档案显示
            this.view.updateFilePageDisplay(identityData, 1, 1, isSecret, this.currentIdentityType);
            
        } catch (error) {
            console.error(`更新档案页面显示失败:`, error);
        }
    }

    // 更新伪装档案页面显示
    async updateDisguiseFilePageDisplay() {
        if (this.currentPage !== 'disguise') return;
        
        try {
            const disguiseData = await this.model.getDisguiseIdentity();
            
            // 使用与基本档案相同的显示逻辑
            this.view.updateDisguiseFilePageDisplay(disguiseData, 1, 1);
            
        } catch (error) {
            console.error(`更新伪装档案页面显示失败:`, error);
        }
    }

    // 修改界面显示回调，实现智能焦点恢复
    onInterfaceShown() {
        // 当通过interface service显示身份界面时调用
        this.isVisible = true;
        
        // 延迟启用键盘导航，确保界面完全显示
        setTimeout(() => {
            this.enableKeyboardNavigationWithStateRestore();
        }, 100);
        
        console.log("身份界面已显示，键盘导航已启用");
    }

    // 修改界面隐藏回调，保存当前状态
    onInterfaceHidden() {
        // 保存当前页面状态和焦点信息
        this.saveCurrentState();
        
        // 当通过interface service隐藏身份界面时调用
        this.isVisible = false;
        this.disableKeyboardNavigation();
        console.log("身份界面已隐藏，状态已保存，键盘导航已禁用");
    }

    // 保存当前页面状态
    saveCurrentState() {
        this.lastPageState = {
            page: this.currentPage,
            focusMemory: this.saveFocusMemory(),
            identityType: this.currentIdentityType
        };
        
        console.log(`保存页面状态: ${this.lastPageState.page}, 焦点: 行${this.currentRow} 列${this.currentCol}`);
    }

    // 启用键盘导航并恢复状态
    enableKeyboardNavigationWithStateRestore() {
        this.keyboardNavigationEnabled = true;
        
        // 恢复到上次的页面状态
        this.restoreLastPageState();
        
        console.log("身份系统: 键盘导航已启用，页面状态已恢复");
    }

    // 恢复上次的页面状态
    async restoreLastPageState() {
        const targetPage = this.lastPageState.page || 'basic';
        
        // 如果当前页面与目标页面不同，先切换页面
        if (this.currentPage !== targetPage) {
            this.currentPage = targetPage;
            
            if (targetPage === 'basic') {
                this.view.showBasicInfoPage();
                // 恢复身份类型
                this.currentIdentityType = this.lastPageState.identityType || 'cover';
                await this.switchIdentityView(this.currentIdentityType);
            } else if (targetPage === 'disguise') {
                this.view.showDisguisePage();
                this.view.showCurrentDisguiseView();
                await this.updateDisguiseFilePageDisplay();
            }
        }
        
        // 初始化焦点结构
        this.initializeFocusableElements();
        
        // 根据页面类型设置焦点到档案区域
        this.setFocusToFileArea(targetPage);
    }

    // 设置焦点到档案区域
    setFocusToFileArea(page) {
        if (this.focusRows.length === 0) {
            console.log("没有可聚焦元素，跳过焦点设置");
            return;
        }
        
        if (page === 'basic') {
            // 基本档案页：焦点设置到档案文件区域（通常是第一行）
            const fileRowIndex = this.findFileRowIndex('identity');
            if (fileRowIndex !== -1) {
                this.currentRow = fileRowIndex;
                this.currentCol = 0;
                this.updateFocus();
                console.log(`焦点设置到基本档案区域: 行${this.currentRow}`);
                return;
            }
        } else if (page === 'disguise') {
            // 伪装系统页：焦点设置到伪装档案区域
            const disguiseRowIndex = this.findFileRowIndex('disguise');
            if (disguiseRowIndex !== -1) {
                this.currentRow = disguiseRowIndex;
                this.currentCol = 0;
                this.updateFocus();
                console.log(`焦点设置到伪装档案区域: 行${this.currentRow}`);
                return;
            }
        }
        
        // 如果找不到档案区域，设置到第一个元素
        this.currentRow = 0;
        this.currentCol = 0;
        this.updateFocus();
        console.log(`焦点设置到默认位置: 行${this.currentRow} 列${this.currentCol}`);
    }

    // 查找档案行的索引
    findFileRowIndex(fileType) {
        for (let i = 0; i < this.focusRows.length; i++) {
            const rowData = this.focusRows[i];
            if (rowData.pageNavigation === fileType) {
                return i;
            }
        }
        return -1;
    }

    // 修改原有的启用键盘导航方法（用于内部页面切换）
    enableKeyboardNavigation() {
        this.keyboardNavigationEnabled = true;
        this.initializeFocusableElements();
        this.updateFocus();
        console.log("身份系统: 键盘导航已启用（内部切换）");
    }

    // 修改快速切换方法，更新页面状态记忆
    async quickNavigateToPage(page) {
        const previousPage = this.currentPage;
        this.currentPage = page;
        
        if (page === 'basic') {
            this.view.showBasicInfoPage();
            this.currentIdentityType = 'cover';
            this.currentFilePage = 1;
            await this.switchIdentityView('cover');
        } else if (page === 'disguise') {
            this.view.showDisguisePage();
            this.currentDisguiseFilePage = 1;
            this.view.showCurrentDisguiseView();
            await this.updateDisguiseFilePageDisplay();
        }
        
        setTimeout(() => {
            this.initializeFocusableElements();
            // Q/E键切换：焦点到档案区域
            this.setFocusToFileArea(page);
            console.log(`快速切换: ${previousPage} -> ${page}, 焦点设置到档案区域`);
        }, 50);
        
        if (this.audio) this.audio.play('functionButton');
    }

    // 新增：处理档案区域点击事件
    handleFileAreaClick(event, fileType) {
        const element = event.currentTarget;
        const rect = element.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const elementWidth = rect.width;
        
        // 计算点击位置的比例
        const clickRatio = clickX / elementWidth;
        
        // 左四分之一区域：向左翻页
        if (clickRatio <= 0.25) {
            this.handleMousePageNavigation(fileType, -1);
            return true; // 返回true表示已处理翻页
        }
        // 右四分之一区域：向右翻页
        else if (clickRatio >= 0.75) {
            this.handleMousePageNavigation(fileType, 1);
            return true; // 返回true表示已处理翻页
        }
        
        // 中间区域：不处理，让原有功能执行
        return false;
    }

    // 新增：处理鼠标翻页导航
    async handleMousePageNavigation(fileType, direction) {
        // 确保在正确的页面上
        if (fileType === 'identity' && this.currentPage !== 'basic') {
            return;
        }
        if (fileType === 'disguise' && this.currentPage !== 'disguise') {
            return;
        }
        
        // 执行对应的翻页操作
        if (fileType === 'identity') {
            await this.navigateFilePage(direction);
        } else if (fileType === 'disguise') {
            await this.navigateDisguiseFilePage(direction);
        }
        
        console.log(`鼠标翻页: ${fileType} ${direction > 0 ? '下一页' : '上一页'}`);
    }

    // 新增：进入档案滚动模式
    enterFileScrollMode(element) {
        this.fileScrollMode = true;
        this.scrollModeElement = element;
        
        // 确定当前档案类型并激活对应指示器
        const elementId = element.id;
        let fileType;
        
        if (elementId === 'identityFile') {
            fileType = 'identity-file';
        } else if (elementId === 'currentDisguiseDisplay') {
            fileType = 'disguise-display';
        }
        
        if (fileType) {
            this.view.setScrollModeIndicator(fileType, true);
        }
        
        // 保持正常的焦点样式
        this.view.clearAllFocus();
        this.view.setFocus(element, fileType);
        
        console.log('进入档案滚动模式');
    }

    // 新增：退出档案滚动模式
    exitFileScrollMode() {
        console.log('正在退出文件滚动模式...');
        
        // 停止持续滚动
        this.stopContinuousScroll();
        
        // 重置所有按键状态
        Object.keys(this.keyStates).forEach(key => {
            this.keyStates[key] = false;
        });
        this.scrollDirection = 0;
        
        console.log('按键状态已重置:', this.keyStates);
        
        // 获取当前滚动元素的类型
        let fileType;
        if (this.scrollModeElement) {
            const elementId = this.scrollModeElement.id;
            
            if (elementId === 'identityFile') {
                fileType = 'identity-file';
            } else if (elementId === 'currentDisguiseDisplay') {
                fileType = 'disguise-display';
            }
            
            // 关闭对应的指示器
            if (fileType) {
                this.view.setScrollModeIndicator(fileType, false);
            }
        }
        
        this.fileScrollMode = false;
        this.scrollModeElement = null;
        
        // 恢复正常焦点
        this.updateFocus();
        
        console.log('退出档案滚动模式完成');
    }

    // 新增辅助方法
    isScrollKey(code) {
        return ['ArrowUp', 'ArrowDown', 'KeyW', 'KeyS'].includes(code);
    }

    updateScrollDirection() {
        let direction = 0;
        
        // 检查向上的按键
        if (this.keyStates.ArrowUp || this.keyStates.KeyW) {
            direction -= 1;
        }
        
        // 检查向下的按键
        if (this.keyStates.ArrowDown || this.keyStates.KeyS) {
            direction += 1;
        }
        
        const oldDirection = this.scrollDirection;
        this.scrollDirection = direction;
        
        if (oldDirection !== direction) {
            console.log(`滚动方向变化: ${oldDirection} -> ${direction}`);
            console.log('当前按键状态:', this.keyStates);
        }
    }

    startContinuousScroll() {
        // 如果已经在滚动中，不重新启动
        if (this.scrollAnimation) {
            console.log('滚动动画已在运行中');
            return;
        }
        
        // 重置滚动速度
        this.currentScrollSpeed = this.scrollSpeed;
        
        console.log('启动持续滚动动画');
        
        const scroll = () => {
            // 检查是否应该继续滚动
            if (this.scrollDirection === 0 || !this.fileScrollMode || !this.scrollModeElement) {
                console.log('滚动条件不满足，停止滚动');
                this.stopContinuousScroll();
                return;
            }
            
            // 执行滚动
            this.scrollModeElement.scrollBy({
                top: this.currentScrollSpeed * this.scrollDirection,
                behavior: 'auto'
            });
            
            // 逐渐增加滚动速度（加速效果）
            this.currentScrollSpeed = Math.min(
                this.currentScrollSpeed * this.scrollAcceleration,
                this.scrollSpeed * 3 // 最大速度限制
            );
            
            // 继续动画
            this.scrollAnimation = requestAnimationFrame(scroll);
        };
        
        // 启动滚动循环
        this.scrollAnimation = requestAnimationFrame(scroll);
    }

    stopContinuousScroll() {
        if (this.scrollAnimation) {
            cancelAnimationFrame(this.scrollAnimation);
            this.scrollAnimation = null;
            console.log('滚动动画已停止');
        }
        this.currentScrollSpeed = this.scrollSpeed;
    }

    // 修复1: 添加缺失的 handleKeyUp 方法
    handleKeyUp(e) {
        if (!this.isVisible || !this.keyboardNavigationEnabled) return;
        
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // 处理滚动按键的释放
        if (this.fileScrollMode && this.isScrollKey(e.code)) {
            e.preventDefault();
            
            if (this.keyStates[e.code]) {
                this.keyStates[e.code] = false;
                this.updateScrollDirection();
                
                console.log(`按键释放: ${e.code}, 当前方向: ${this.scrollDirection}`);
                
                // 如果没有按键按下，停止滚动
                if (this.scrollDirection === 0) {
                    this.stopContinuousScroll();
                    console.log('所有滚动按键已释放，停止滚动');
                }
            }
        }
    }

    // 新增：伪装能力词条相关方法

    /**
     * 处理伪装能力词条的切换
     * @param {string} abilityId 能力词条ID
     */
    async handleDisguiseAbilityToggle(abilityId) {
        try {
            const identityService = this.serviceLocator.get('identityService');
            if (!identityService) {
                console.error("无法获取身份服务");
                return false;
            }

            const success = await identityService.toggleDisguiseAbility(abilityId);
            
            if (success) {
                // 更新UI显示
                await this.updateDisguiseAbilitiesDisplay();
                
                // 如果当前有伪装身份，更新可信度显示
                const disguiseIdentity = await this.model.getDisguiseIdentity();
                if (disguiseIdentity) {
                    await this.updateCredibilityDisplay();
                }
                
                // 播放音效
                if (this.audio) this.audio.play('functionButton');
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error("切换伪装能力词条失败:", error);
            return false;
        }
    }

    /**
     * 更新伪装能力词条显示
     */
    async updateDisguiseAbilitiesDisplay() {
        try {
            const identityService = this.serviceLocator.get('identityService');
            if (!identityService) return;

            const userAbilities = await identityService.getDisguiseAbilities();
            const availableAbilities = identityService.getAvailableDisguiseAbilities();
            
            // 通知视图更新显示
            if (this.view.updateDisguiseAbilitiesDisplay) {
                this.view.updateDisguiseAbilitiesDisplay(userAbilities, availableAbilities);
            }
        } catch (error) {
            console.error("更新伪装能力词条显示失败:", error);
        }
    }

    /**
     * 更新可信度显示
     */
    async updateCredibilityDisplay() {
        try {
            const identityService = this.serviceLocator.get('identityService');
            if (!identityService) return;

            const credibility = await identityService.calculateCurrentDisguiseCredibility();
            const riskLevel = await identityService.getCurrentDisguiseRiskLevel();
            
            // 通知视图更新可信度显示
            if (this.view.updateCredibilityDisplay) {
                this.view.updateCredibilityDisplay(credibility, riskLevel);
            }
        } catch (error) {
            console.error("更新可信度显示失败:", error);
        }
    }

    /**
     * 初始化伪装能力词条事件监听器
     */
    setupDisguiseAbilityEventListeners() {
        // 监听伪装能力更新事件
        if (this.eventBus) {
            this.eventBus.on('disguiseAbilitiesUpdated', async (eventData) => {
                console.log("检测到伪装能力词条更新:", eventData.abilities);
                await this.updateDisguiseAbilitiesDisplay();
            });

            this.eventBus.on('disguiseCredibilityUpdated', async (eventData) => {
                console.log("检测到伪装可信度更新:", eventData.credibility);
                if (this.view.updateCredibilityDisplay) {
                    this.view.updateCredibilityDisplay(eventData.credibility, eventData.riskLevel);
                }
            });
        }
    }

    /**
     * 扩展现有的初始化方法以包含新功能
     */
    async initializeEnhancedFeatures() {
        try {
            // 设置伪装能力词条事件监听器
            this.setupDisguiseAbilityEventListeners();
            
            // 初始化伪装能力词条显示
            await this.updateDisguiseAbilitiesDisplay();
            
            // 如果当前有伪装身份，初始化可信度显示
            const disguiseIdentity = await this.model.getDisguiseIdentity();
            if (disguiseIdentity) {
                await this.updateCredibilityDisplay();
            }
            
            console.log("增强功能初始化完成");
        } catch (error) {
            console.error("增强功能初始化失败:", error);
        }
    }

    /**
     * 扩展现有的updateIdentityDisplays方法
     */
    async updateIdentityDisplaysEnhanced() {
        // 调用原有的更新方法
        const result = await this.updateIdentityDisplays();
        
        if (result) {
            try {
                // 更新伪装能力词条显示
                await this.updateDisguiseAbilitiesDisplay();
                
                // 更新可信度显示
                const disguiseIdentity = await this.model.getDisguiseIdentity();
                if (disguiseIdentity) {
                    await this.updateCredibilityDisplay();
                }
            } catch (error) {
                console.warn("更新增强显示功能失败:", error);
            }
        }
        
        return result;
    }
}