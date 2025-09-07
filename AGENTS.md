# 交互要求

- 使用中文交互

# 项目说明

本项目是一款游戏，前端基于 VUE.js，后端基于 Node.js。

本游戏分为两部分，一部分类似扫雷，但寻找的是矿石而非地雷，只有有限次翻开格子查看是否是矿石的机会（类似扫雷游戏中右键标记地雷，而非左键点开空地），且如果是左键点击遇到矿石，则矿石碎裂并消耗一次打开矿石的机会；左键点击遇到空地，则和扫雷一样翻开周围空地或显示周围一圈有多少矿石；右键点击遇到矿石则成功采集矿石并消耗一次打开矿石的机会；右键点击遇到空地则直接消耗一次打开矿石的机会，且和扫雷一样翻开周围空地或显示周围一圈有多少矿石。如果操作之后打开矿石的机会用完，则本回合结束，所有采集到的矿石都仿佛仓库。强调：矿石共有五种，每次是随机出现。

游戏的第二部分，是利用仓库中的各种矿石来进行“炼药”，规则和 2048 一样，但用的是彩虹的颜色，两个赤合成一个橙，两个橙合成一个黄，以此类推，最后两个紫合成一个赤，构成一个循环。另一方面，每个格子除了有自己的颜色，格子中也放着一块矿石，初始状态下每块矿石的“经验值”为 1，而在颜色合并升级时，如果两个格子里的矿石是同一种矿石，则合并成同类矿石，经验值为两块矿石经验值的和；而如果两个格子里的矿石是不同的矿石，则保留经验值最大的那块矿石。游戏开始的时候，会根据玩家所选的“配方”来放入矿石，这些矿石会在游戏进行过程中随机出现在新出现的格子中。而游戏结果，是要让当前容器中的矿石的经验值，都超过配方所要求的值。比如配方要求 A 矿石经验值不小于 10，B 矿石经验值不小于 20，那么在进行若干次游戏后，容器内必须有至少一块 A 矿石的经验值不小于 10，至少一块 B 矿石的经验值不小于 20。当这点达成后，炼药就成功了，就可以合成配方指定的道具。

# 代码仓库指南

## 项目结构和模块组织

- `frontend/` Vue 3 + Vite 应用
  - `src/components/`, `src/views/`, `src/composables/`
  - `src/game/` 领域: `minefield/` (网格规则, 矿石随机数生成), `alchemy/` (类似 2048 的合并, 彩虹循环)
  - `assets/` 静态文件
- `server/` Node.js (Express/Fastify)
  - `src/api/` 路由, `src/services/`, `src/game/` 共享规则 (纯函数, 无 I/O)
- `shared/` 跨包代码: 常量, 类型, 可设定种子的随机数生成器, 合成配方模型
- `tests/` 单元/集成测试 (镜像功能布局); `e2e/` Playwright 端到端测试规范
- `docs/` 规则, 配方, 和设计笔记

## 构建、测试和开发命令

- 根工作区 (npm):
  - `npm run dev` 同时运行前端和后端
  - `npm run dev -w frontend` 运行 Vue 开发服务器; `npm run dev -w server` 运行带热更新的 API
  - `npm run build -w frontend` SPA 构建; `npm run build -w server` 编译/打包服务器
  - `npm run test:unit -w frontend` 运行 Vitest; `npm run test -w server` 运行 Jest/Vitest
  - `npm run test:e2e` 运行 Playwright; `npm run lint -ws` 对所有包进行代码检查; `npm run format -ws` 对所有包进行格式化

## 代码风格和命名约定

- JavaScript (在可行的情况下优先使用 TypeScript)。2 空格缩进, LF 换行符, 分号, 单引号。
- Vue 单文件组件 (SFC) 的文件名和组件名: 帕斯卡命名法 (PascalCase) (例如, `MineGrid.vue`)。
- 变量/函数使用驼峰命名法 (camelCase); 常量使用大写蛇形命名法 (UPPER_SNAKE_CASE); 文件夹使用短横线命名法 (kebab-case)。
- 工具: ESLint + @vue/eslint-config, Prettier; Stylelint 用于 CSS。

## 测试指南

- 前端: Vitest + Vue Test Utils (`src/**/__tests__/*.(spec|test).ts`)。
- 后端: Jest/Vitest + Supertest (`server/tests/**/*.spec.ts`)。
- 端到端 (E2E): 在 `e2e/` 目录中针对开发服务器运行 Playwright。
- 测试覆盖率 ≥ 80%。使用可设定种子的随机数生成器进行确定性的雷区测试。测试彩虹循环的合并规则和矿石经验值逻辑 (同种矿石求和, 不同矿石保留最大值)。

## 提交与拉取请求指南

- 遵循约定式提交 (Conventional Commits): `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`。
- 拉取请求 (PR) 需包含: 清晰的范围, 关联的 issue (例如 `Closes #123`), 游戏玩法的截图/GIF, 以及更新后的测试/文档/配方。
- 注明影响的领域: `[minefield]`, `[alchemy]`, 或 `[shared]`。

## 安全与配置技巧

- 不要提交密钥。前端环境变量必须以 `VITE_` 开头。为服务器和前端提供 `.env.example` 文件。
- 校验 API 输入; 将 CORS 限制在已知的开发源。将配方文件置于版本控制之下 (例如, `server/src/data/recipes/*.json`)。