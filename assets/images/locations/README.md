# 地点图片目录

此目录用于存放各个地点的场景图片。

## 路径配置

图片路径现在可以在 `index.html` 文件中配置，找到 `window.locationActionConfig` 对象：

```javascript
window.locationActionConfig = {
    imagePaths: {
        // 地点图片目录 - 可以修改为任意路径
        locationsDir: 'assets/images/locations/',
        // 默认占位图片 - 当找不到地点图片时显示
        placeholder: 'assets/images/placeholder.jpg',
        // 支持的图片格式（按优先级排序）
        supportedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif']
    }
};
```

### 自定义路径示例

如果你想将图片放在不同的目录：

```javascript
window.locationActionConfig = {
    imagePaths: {
        locationsDir: 'custom/path/locations/',     // 自定义图片目录
        placeholder: 'custom/path/default.png',    // 自定义占位图
        supportedFormats: ['png', 'jpg', 'webp']   // 自定义格式优先级
    }
};
```

## 文件命名规则

### 表面/暗面双图片支持
每个地点可以有两张不同的图片，分别对应表面身份和暗面身份的视角：

**表面身份图片**（使用显示名称）：
- `老鹰书店.jpg` - 普通书店的外观
- `苏联大使馆.jpg` - 使馆的正面外观
- `富兰克林公园.jpg` - 公园的日常景象

**暗面身份图片**（使用真实名称）：
- `CIA情报收发站.jpg` - 揭示书店真相后的特工据点
- `KGB华盛顿站点.jpg` - 使馆内部的情报活动
- `情报交换热点.jpg` - 公园的秘密用途

### 命名规则详细说明
支持多种图片格式，系统会根据访问类型自动选择：

- **公开访问**: 使用 `locationName`（显示名称）
- **秘密访问**: 使用 `realName`（真实名称）
- **备用机制**: 如果某种访问类型的图片不存在，会自动尝试另一种

### 示例
```
老鹰书店/
├── 老鹰书店.png          ← 公开访问时显示（普通书店）
└── CIA情报收发站.png      ← 秘密访问时显示（特工据点）

苏联大使馆/
├── 苏联大使馆.jpg         ← 公开访问时显示（外交建筑）
└── KGB华盛顿站点.jpg      ← 秘密访问时显示（情报中心）
```

## 图片要求
- **分辨率**: 建议 800x600 或 1024x768
- **格式**: 支持 JPG、JPEG、PNG、WebP、GIF 等格式
- **优先级**: jpg > jpeg > png > webp > gif（系统按此顺序自动检测）
- **风格**: 80年代复古风格
- **色调**: 可选择冷色调或暖色调
- **处理**: 建议添加适度的对比度和噪点效果

## 备用方案
如果某个地点的图片不存在，系统会自动使用 `assets/images/placeholder.jpg` 作为默认图片。 