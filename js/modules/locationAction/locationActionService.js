// js/modules/locationAction/locationActionService.js
/**
 * 地点行动服务
 * 负责AI故事生成等业务逻辑
 */
class LocationActionService {
    constructor() {
        // 故事模板数据库
        this.storyTemplates = {
            '富兰克林公园': {
                public: '你走进公园，春日的阳光透过树叶洒下斑驳的光影。公园里散步的人们看起来都很普通，孩子们在草地上嬉戏，老人坐在长椅上喂鸽子。这里显得如此平静祥和。',
                covert: '你以普通游客的身份进入公园，但敏锐的直觉告诉你这里并不简单。你注意到角落里那个"遛狗"的男子实际上在观察每一个经过的人，喷泉附近的女性似乎在等待什么信号。这个看似平静的公园，实际上是情报交换的热点。'
            },
            
            '苏联大使馆': {
                public: '庄严的红色建筑前，苏联国旗在微风中飘扬。门前的守卫穿着整齐的制服，目光警惕。这里是苏联在美国的外交代表处，充满了冷战时期特有的紧张氛围。普通民众很难接近这里。',
                covert: '你小心翼翼地观察着这座戒备森严的建筑。每一扇窗户后面都可能隐藏着秘密，每一个进出的人员都可能是重要的情报来源。你知道这里是KGB的重要据点，无数机密在这些墙壁内流转。你必须格外小心，任何可疑的举动都可能引来致命的后果。'
            },
            
            '中央情报局总部': {
                public: '高耸的大楼在阳光下显得格外威严，这里是美国情报网络的心脏。建筑周围的安保措施极其严格，普通民众无法靠近。即使是远远观望，也能感受到这里散发出的权威与神秘。',
                covert: '站在CIA总部前，你感受到一种既熟悉又紧张的氛围。这里是你所服务机构的核心，无数任务从这里发起，无数情报在这里汇集。你知道建筑内部的每一个角落都可能关系到国家安全，每一份文件都可能改变世界格局。今天你的到来，又将开启怎样的故事？'
            },
            
            '英国大使馆': {
                public: '典雅的建筑风格体现了英式的庄重与传统。花园中修剪整齐的草坪和精心栽培的玫瑰花彰显着英国文化的精致。这里是英国在美国的外交窗口，代表着两国间的友好关系。',
                covert: '表面上这里是英国的外交机构，但你知道MI6在这里设有秘密办公室。建筑东翼的某些房间对普通外交人员是禁区，地下室据说有通往其他建筑的隐蔽通道。作为盟友，英美间的情报合作在这里秘密进行。'
            },
            
            '地下交易点': {
                public: '这里看起来就是一个普通的废弃仓库区，铁丝网围栏破旧，到处都是"禁止入内"的标志。没有什么特别的，只是一个被遗忘的工业区角落。',
                covert: '表面的荒废只是完美的伪装。你知道这里是情报和武器交易的秘密场所，只有掌握"北极熊"暗号的人才能进入真正的核心区域。仓库内的某些集装箱实际上是通往地下空间的入口，那里进行着见不得光的交易。'
            }
        };
        
        // 默认模板
        this.defaultTemplates = {
            public: '你来到了这个地方。周围的环境让你感到既好奇又谨慎，这里似乎隐藏着一些不为人知的秘密。',
            covert: '作为训练有素的特工，你敏锐地感察到这个地方的不寻常之处。每一个细节都可能蕴含着重要信息，你必须保持高度警觉。'
        };
        
        console.log("地点行动服务已初始化");
    }
    
    /**
     * 生成地点故事
     * @param {object} locationData - 地点数据
     * @returns {Promise<string>} 生成的故事文本
     */
    async generateLocationStory(locationData) {
        try {
            console.log("开始生成故事:", locationData?.locationName, locationData?.accessType);
            
            // 模拟AI生成的延迟
            await this.simulateAIDelay();
            
            // 获取故事模板
            const story = this.getStoryTemplate(locationData);
            
            // 添加访问类型信息
            const accessInfo = this.generateAccessInfo(locationData);
            
            // 组合完整故事
            const fullStory = `${story}\n\n${accessInfo}`;
            
            console.log("故事生成完成");
            return fullStory;
            
        } catch (error) {
            console.error("故事生成失败:", error);
            return "故事生成过程中发生错误，请稍后重试。";
        }
    }
    
    /**
     * 获取故事模板
     * @param {object} locationData - 地点数据
     * @returns {string} 故事文本
     */
    getStoryTemplate(locationData) {
        if (!locationData || !locationData.locationName) {
            return this.defaultTemplates.public;
        }
        
        const locationTemplates = this.storyTemplates[locationData.locationName];
        if (!locationTemplates) {
            // 如果没有找到特定地点的模板，使用默认模板
            const accessType = locationData.accessType === 'covert' ? 'covert' : 'public';
            return this.defaultTemplates[accessType];
        }
        
        // 根据访问类型选择合适的模板
        if (locationData.accessType === 'covert' && locationTemplates.covert) {
            return locationTemplates.covert;
        } else if (locationTemplates.public) {
            return locationTemplates.public;
        } else {
            return this.defaultTemplates.public;
        }
    }
    
    /**
     * 生成访问类型信息
     * @param {object} locationData - 地点数据  
     * @returns {string} 访问信息文本
     */
    generateAccessInfo(locationData) {
        if (!locationData) {
            return '[访问信息] 未知访问模式';
        }
        
        if (locationData.accessType === 'covert') {
            return '[秘密行动模式]\n你正以秘密特工的身份执行任务。保持警觉，任何细微的异常都可能是重要线索。';
        } else {
            return '[公开访问模式]\n你以普通访客的身份进入这里。记住保持低调，避免引起不必要的注意。';
        }
    }
    
    /**
     * 模拟AI生成延迟
     * @returns {Promise} 延迟Promise
     */
    async simulateAIDelay() {
        // 从配置中获取延迟范围
        const config = this.getStoryConfig();
        const delay = config.minDelay + Math.random() * (config.maxDelay - config.minDelay);
        return new Promise(resolve => setTimeout(resolve, delay));
    }
    
    /**
     * 添加新的故事模板
     * @param {string} locationName - 地点名称
     * @param {object} templates - 模板对象 {public: string, covert: string}
     */
    addStoryTemplate(locationName, templates) {
        this.storyTemplates[locationName] = templates;
        console.log(`为地点 "${locationName}" 添加了新的故事模板`);
    }
    
    /**
     * 获取所有可用的地点模板列表
     * @returns {Array<string>} 地点名称列表
     */
    getAvailableLocations() {
        return Object.keys(this.storyTemplates);
    }
    
    /**
     * 获取图片配置
     * @returns {object} 图片配置对象
     */
    getImageConfig() {
        // 从全局配置中获取，如果不存在则使用默认配置
        const globalConfig = window.locationActionConfig?.imagePaths;
        return {
            locationsDir: globalConfig?.locationsDir || 'assets/images/locations/',
            placeholder: globalConfig?.placeholder || 'assets/images/placeholder.jpg',
            supportedFormats: globalConfig?.supportedFormats || ['jpg', 'jpeg', 'png', 'webp', 'gif']
        };
    }
    
    /**
     * 获取故事配置
     * @returns {object} 故事配置对象
     */
    getStoryConfig() {
        // 从全局配置中获取，如果不存在则使用默认配置
        const globalConfig = window.locationActionConfig?.story;
        return {
            minDelay: globalConfig?.minDelay || 1500,
            maxDelay: globalConfig?.maxDelay || 3500,
            stateExpiration: globalConfig?.stateExpiration || (24 * 60 * 60 * 1000)
        };
    }
    
    /**
     * 获取地点图片路径（支持表面/暗面不同图片）
     * @param {object} locationData - 完整的地点数据
     * @returns {Promise<string>} 图片路径
     */
    async getLocationImagePath(locationData) {
        // 获取配置
        const config = this.getImageConfig();
        
        if (!locationData) {
            return config.placeholder;
        }
        
        // 根据访问类型确定使用哪个名称
        let imageName;
        if (locationData.accessType === 'covert') {
            // 秘密访问：使用真实名称
            imageName = locationData.realName;
            console.log(`秘密访问模式，寻找图片: ${imageName}`);
        } else {
            // 公开访问：使用显示名称
            imageName = locationData.locationName;
            console.log(`公开访问模式，寻找图片: ${imageName}`);
        }
        
        if (!imageName) {
            return config.placeholder;
        }
        
        // 使用配置的图片格式和目录
        const basePath = `${config.locationsDir}${imageName}`;
        
        // 尝试每种格式
        for (const format of config.supportedFormats) {
            const imagePath = `${basePath}.${format}`;
            try {
                // 检查图片是否存在（通过尝试加载）
                const exists = await this.checkImageExists(imagePath);
                if (exists) {
                    console.log(`找到地点图片: ${imagePath}`);
                    return imagePath;
                }
            } catch (error) {
                // 继续尝试下一种格式
                continue;
            }
        }
        
        // 如果没有找到对应的图片，尝试备用方案
        const fallbackName = locationData.accessType === 'covert' ? locationData.locationName : locationData.realName;
        if (fallbackName && fallbackName !== imageName) {
            console.log(`未找到${imageName}的图片，尝试备用名称: ${fallbackName}`);
            const fallbackPath = await this.tryFindImageByName(fallbackName);
            if (fallbackPath !== config.placeholder) {
                return fallbackPath;
            }
        }
        
        // 如果都没有找到，返回默认占位图
        console.warn(`未找到地点"${imageName}"的图片，使用默认占位图`);
        return config.placeholder;
    }
    
    /**
     * 根据名称尝试查找图片（辅助方法）
     * @param {string} imageName - 图片名称
     * @returns {Promise<string>} 图片路径
     */
    async tryFindImageByName(imageName) {
        // 获取配置
        const config = this.getImageConfig();
        
        if (!imageName) {
            return config.placeholder;
        }
        
        const basePath = `${config.locationsDir}${imageName}`;
        
        for (const format of config.supportedFormats) {
            const imagePath = `${basePath}.${format}`;
            try {
                const exists = await this.checkImageExists(imagePath);
                if (exists) {
                    return imagePath;
                }
            } catch (error) {
                continue;
            }
        }
        
        return config.placeholder;
    }
    
    /**
     * 检查图片是否存在
     * @param {string} imagePath - 图片路径
     * @returns {Promise<boolean>} 图片是否存在
     */
    checkImageExists(imagePath) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = imagePath;
        });
    }
} 