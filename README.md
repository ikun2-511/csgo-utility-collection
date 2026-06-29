# CS:GO 道具合集

竞技地图道具投掷指南网站，从 Dust2 开始，持续更新更多地图。

## 在线预览

访问 [GitHub Pages 链接](https://你的用户名.github.io/csgo-utility-collection/) 查看效果

## 本地运行

直接用浏览器打开 `index.html` 即可，无需安装任何依赖。

```bash
# 方法一：直接双击 index.html
# 方法二：使用命令行
cd csgo-utility-collection
start index.html  # Windows
open index.html   # macOS
```

## 项目结构

```
csgo-utility-collection/
├── index.html              # 首页（地图选择）
├── dust2.html              # Dust2 道具页
├── css/
│   └── style.css           # 样式文件
├── js/
│   └── app.js              # 交互逻辑
├── data/
│   └── dust2.json          # Dust2 道具数据
└── images/
    └── dust2/
        ├── dust2-overview.svg   # 地图占位图
        └── *.jpg                # 道具截图（待添加）
```

## 如何添加新道具

编辑 `data/dust2.json`，在 `spots` 数组中添加新条目：

```json
{
  "id": "smoke-新道具id",
  "name": "道具名称",
  "nameEn": "English Name",
  "type": "smoke",           // smoke / flash / molotov / he
  "difficulty": 2,           // 1-3，数字越大越难
  "position": { "x": 50, "y": 50 },  // 在地图上的百分比位置
  "description": "道具说明",
  "lineup": {
    "stand": "站位描述",
    "aim": "瞄点描述",
    "throw": "投掷方式"
  },
  "images": {
    "lineup": "images/dust2/xxx-lineup.jpg",   // 站位/瞄点截图
    "result": "images/dust2/xxx-result.jpg"     // 效果图
  },
  "tags": ["标签1", "标签2"]
}
```

## 如何替换地图图片

1. 下载一张 Dust2 俯视图（推荐 1600x1000 分辨率）
2. 将图片命名为 `dust2-overview.jpg`
3. 放到 `images/dust2/` 目录
4. 在 `dust2.html` 中将 `dust2-overview.svg` 改为 `dust2-overview.jpg`

推荐图片来源：
- [CS:GO 官方地图](https://counter-strike.fandom.com/wiki/Dust_II)
- 社区制作的高清俯视图

## 如何添加新地图

1. 在 `images/` 下创建新地图目录
2. 在 `data/` 下创建新的 JSON 数据文件
3. 复制 `dust2.html` 并修改引用
4. 在 `index.html` 中添加新地图卡片

## 部署到 GitHub Pages

1. 在 GitHub 创建新仓库
2. 将代码推送到仓库
3. 进入仓库 Settings → Pages
4. Source 选择 `main` 分支
5. 等待几分钟即可访问

## 道具类型说明

| 类型 | 颜色 | 图标 | 用途 |
|------|------|------|------|
| 烟雾弹 | 蓝色 | 烟 | 封锁视野 |
| 闪光弹 | 黄色 | 闪 | 闪白敌人 |
| 燃烧弹 | 橙色 | 火 | 逼出躲藏敌人 |
| HE手雷 | 红色 | 雷 | 造成伤害 |

## 贡献

欢迎提交 PR 补充道具点位！请确保：
- 道具信息准确
- 坐标位置正确
- 包含必要的截图
