# 圆明园 · 重现(Old Summer Palace Reimagined)— 站点说明

致敬复刻 Getty「Persepolis Reimagined」手法的 Three.js 沉浸式导览,场景为**圆明园(1860 毁失前盛景)**:
夜转日 preloader → 标题序列 → 滚动章节导览(序章·烟水 → 宫门·晓渡 → 湖岸·柳浪 → 九州清晏 → 蓬岛瑶台 → 谐奇趣 → 海晏堂·水力钟 → 终章·大水法与劫灰)→ 地图跳转 → 自由漫游。全部 3D 内容程序化生成,无外部美术资产。

姊妹项目:`../persepolis-reimagined/`、`../tiantan-reimagined/`(同一套引擎与 QA 体系)。

## 启动方式

- **HTTP(推荐)**:项目根目录运行
  `python -m http.server 8102 --bind 127.0.0.1 --directory dist`
  然后访问 `http://127.0.0.1:8102/`。
  **注意**:8102 为本站专用端口;工作区还有并行会话的其它站点(8092 被吉萨站占用),勿混用。
- **双击(file://)**:直接打开 `dist/index.html`,入口为 `dist/js/local.bundle.js`(IIFE 产物)。
- 页面卡住/黑屏:看 DevTools Console/Network;错误屏会给出可操作提示。

## 构建与检查

- `npm ci` — 安装依赖(three 0.170.0 精确锁定 + esbuild)。
- `npm run check` — dist/js 全模块 `node --check`。
- `npm run build:local` — 可复现生成 `dist/js/local.bundle.js`。**改动 dist/js 后必须重新执行**。
- dist/vendor/ 为 three.module.js 与所用 addons 的拷贝,供 HTTP importmap 使用。

## 验收命令

1. HTTP:打开 `http://127.0.0.1:8102/`,应看到夜转日 preloader → 三行导语「点击进入」→ 滚动推进 8 章,`M` 地图跳转,`F` 自由漫游(WASD+Shift),控制台无资源错误。
2. 双击:直接打开 `dist/index.html` 同样验证。
3. 确定性截图:`node qa/shot.mjs "http://127.0.0.1:8102/?qa=1&clean=1" qa/shots/tour "" 1440 900 6000`
   - `?qa=1` 由 `window.__persepolis.render(ms, progress)` 确定性单帧渲染(钩子名与姊妹站点一致);`&clean=1` 隐藏 HUD;
   - 不带 clean 验收 UI(竖排章节标题 + 印章 + 导览轨);`file:///…` 用于双击入口验收;
   - 输出 `console errors: 0` 为通过。另有 `pose:` 模式任意位姿截图、`sceneProbe(x,y,z)` 场景探针、`qa/debug-eval.mjs <url> <expr>` 任意表达式调试。
4. 漫游已无头验证:湖床高差挡涉水(水面不可踏入)、岛屿缓坡登顶、连岛桥面行走、宫门中门洞通行、西洋楼台基。

## 场景取舍

- 福海为椭圆抽象(真实福海更接近方形带堤岛);九州九岛取「禹贡九州」意象简化布局。
- 十二兽首为程序化变体(圆耳/双角/长吻/冠羽四类),不刻画具体生肖五官。
- 终章「劫灰」仅以天光余烬色 + 文案表达,不做焚烧演出。
- 无环境音效、无多语言切换(界面中文,竖排标题 + 单字印章)。
