# 求道的漫漫长路：洞天福地·修行研习

一款将“福地探索 + 洞天寻踪 + 修行研习”结合在一起的轻量 Rouge-lite 原型。前端基于 Vue 3 + Vite（Pinia 状态管理），当前仓库仅包含前端应用。

## 主要玩法

- 福地探索：开放世界探索，寻找洞天，遭遇邪修，偶遇魔界降世，升入更高仙界
- 洞天寻踪：寻觅灵石，收集材料，偶得秘籍，为研习做准备
- 修行研习：提升道行境界，研习强大法器
- 邪修与魔：乱我道心者，皆是魔

## 操作说明

- 福地移动：键盘 ↑ ↓ ← →
- 洞天寻踪：扫雷式找宝箱
- 修行研习：2048 式修炼与合成
- 查看队伍：福地信息面板右上角“⚔️”图标。

## 开发与运行

先决条件：Node.js 18+，npm 10+

常用命令：

```bash
# 启动前端（默认端口 8123）
npm run dev:frontend

# 或同时尝试前端+后端（无后端也可运行，后端脚本失败会被忽略）
npm run dev

# 构建前端产物
npm run build:frontend

# 清理依赖与构建产物
npm run clean
```

目录结构（当前以前端为主）

```
./
├─ frontend/                 # Vue 3 + Vite 前端应用
│  ├─ index.html             # 应用入口 HTML
│  ├─ vite.config.js         # Vite 配置
│  └─ src/
│     ├─ main.js             # 入口脚本，创建应用、挂载 Pinia 与路由
│     ├─ App.vue             # 根组件（含导航、KeepAlive）
│     ├─ style.css           # 全局样式（导航、网格、按钮等）
│     ├─ router/
│     │  └─ index.js         # 路由：/map（福地）、/mining（洞天寻踪）、/alchemy（研习）、/inventory（行囊）
│     ├─ store/
│     │  └─ inventory.js     # Pinia 仓库：矿石入库与配方数据
│     ├─ composables/
│     │  └─ toast.js         # 轻量提示（showToast + toasts 列表）
│     ├─ models/
│     │  └─ ore.js           # 矿种模型/工具（ALL_ORES、ensureOres）
│     └─ views/
│        ├─ MapView.vue      # 福地：活力/天数、战争迷雾、移动/遭遇、队伍弹窗
│        ├─ MiningView.vue   # 洞天：扫雷式采集、随机掉落、自动结算
│        ├─ AlchemyView.vue  # 研习：2048 式合成与经验规则
│        └─ InventoryView.vue# 行囊：库存与总量
├─ package.json              # 工作区/脚本（dev/build 等）
├─ README.md                 # 当前文档
└─ （可选）server/、shared/  # 预留目录（本仓库主要以前端为主）
```

关键模块（简要说明）

- `views/MapView.vue`
  - 视图：福地网格、标题“第N天/活力X/提示”、队伍弹窗
  - 机制：战争迷雾（已探索/当前可见）、活力与换天动画、邪修遭遇、困林入夜、洞天入口 1/16
  - 队伍：求道者数组（name/level/hp/atk/def/mp/spell/artifact），境界名映射（1..16）
- `views/MiningView.vue`
  - 交互：左/右键规则、随机采集数量（1..oreFindMax，默认 100）、自动“仅余矿格”结算
  - 结算：入行囊并显示弹窗，“离开洞天”返回福地；洞天期间顶部导航禁用
- `views/AlchemyView.vue`
  - 玩法：彩虹循环合成；同矿叠加经验、异矿取高；满足配方即“研习成功”
- `store/inventory.js`
  - `inventory` 聚合入库；`recipes/selectedRecipe` 用于研习配方
- `composables/toast.js`
  - `showToast(message, {type, duration})` 与 `toasts` 列表（Map/Mining 共用）
- `models/ore.js`
  - `ALL_ORES`（矿池）、`ensureOres`（规范化矿种）

## 备注与后续计划

- 邪修事件后续将接入事件/战斗系统（当前以 alert 占位）。
- 福地事件、天气/时间加成、道路与更多地形将逐步加入。
- 研习配方与矿种将可配置化，本地化文本完善中。

## 贡献与提交

- 建议使用约定式提交（Conventional Commits），并在标题中标注范围，如 `feat(map)`、`feat(mining)`。
- 对玩法变更请附上简述与必要的截图/录屏。

# TODO

- 福地探索
  + 将行囊分解为行囊与宗门行囊两部分，回到宗门则将行囊中的物材合并到宗门行囊
    * 宗门行囊可以在修行研习页面查看
  + 邪修交战界面
    * 邪修攻击成功则抢夺行囊
    * 攻击邪修成功则有概率获取修炼秘籍、法器、内丹等各种宝物
  + 魔界入口，每天随机出现（是否出现以及在哪里出现都随机）
  + 更多地形，且不同等级的求道者可以通过的地形不同，团队移动时以等级最低求道者为准
  + 森林、山脉等等地形要尽可能连续
- 洞天寻踪
  + 增加宝箱等物件
- 修行研习
  + 没有“核心物件”的是仙丹合成
  + 核心物件为法器的是法器研习
  + 核心物件为人物的是道行修行
  + 根据配方、秘籍等进行研习
