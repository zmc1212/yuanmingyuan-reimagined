# 圆明园 · 重现(Old Summer Palace Reimagined)

基于 **Three.js** 的沉浸式 3D 网页导览:从绮春园宫门入圆明园,沿福海西岸北上九州清晏,湖心访蓬岛瑶台,再东渡西洋楼——谐奇趣、海晏堂十二兽首水力钟、大水法——最后在暮色中升空俯瞰全园。

> 本项目是对 [Getty「Persepolis Reimagined」](https://persepolis.getty.edu/)(Getty × Media.Monks)的**手法致敬复刻**,场景替换为 1860 年毁失前的圆明园盛景;全部场景由代码程序化生成,不含原作与实景的任何美术资产。姊妹项目:`../persepolis-reimagined/`、`../tiantan-reimagined/`。

## 体验流程

1. **夜转日 Preloader** — 场景分帧构建,夜色与浓雾随进度转为黎明
2. **标题序列** — 三行导语渐显 → 「点击进入」
3. **滚动导览(8 章)** — 序章·烟水 / 宫门·晓渡 / 湖岸·柳浪 / 九州清晏 / 蓬岛瑶台 / 谐奇趣 / 海晏堂·水力钟 / 终章·大水法与劫灰;每章竖排标题 + 单字印章 + 历史短文
4. **地图视图(`M`)** — 三园平面图 + 金色游览路线 + 章节热点跳转
5. **自由漫游(`F`)** — WASD + Shift 疾跑;可过宫门、登九州诸岛、穿西洋楼台基,湖床高差挡住涉水
6. **后处理** — bloom、暗角、胶片颗粒贯穿全程

## 场景细节

- **福海**:椭圆湖面涟漪着色器(顶点波动 + 法线扰动太阳耀斑)+ 岸缘石 + 晨雾粒子;湖床 -3m 与岛屿缓坡体块对应 `groundHeight`
- **九州清晏**:主岛寝宫群(灰瓦卷棚歇山 + 朱柱前廊)+ 八座小岛(攒尖亭/小殿)+ 十段曲桥
- **蓬岛瑶台**:湖心假山石岛 + 两层楼阁 + 东西配亭
- **西洋楼**:巴洛克立面(奶油石灰岩砌块 + 壁柱 + 山花 + 拱窗龛);海晏堂大穹顶 + 十二兽首铜像(程序化兽耳/角/吻变体)扇形大阶;大水法三重喷水塔 + 拱门 + 泄瀑壁
- **喷泉**:三处粒子喷泉(谐奇趣/海晏堂/大水法,重力抛物线 + 加色白沫)
- **远山环**:26 座噪声西山(合并单网格);岸柳 / 园柏 / 灌木 / 岸石全部 InstancedMesh

## 运行

```bash
npm ci
npm run build:local          # 生成 dist/js/local.bundle.js(双击入口)
npm run serve                # python -m http.server 8102 --directory dist
# 打开 http://127.0.0.1:8102/ 或直接双击 dist/index.html
```

验收与 QA 截图工具见 [AGENTS.md](AGENTS.md)。

## 技术要点

| 方面 | 实现 |
| --- | --- |
| 渲染 | Three.js 0.170 + WebGL2,ACESFilmic,EffectComposer(bloom/暗角/颗粒/OutputPass) |
| 湖面 | MeshStandardMaterial + onBeforeCompile 注入涟漪(顶点)+ 解析法线扰动(太阳耀斑) |
| 性能 | 植被/岸石 InstancedMesh,远山合并,画质三档自适应 |
| 天光 | 天穹渐变 shader(日盘/辉光/星空),6 个时间状态(含终章「劫灰」余烬色)随章节连续插值 |
| 双入口 | ES 模块 + importmap(HTTP);esbuild IIFE(file://);全程序化 canvas 纹理 |
| QA | `?qa=1&clean=1` 确定性渲染钩子 + CDP 截图/位姿/场景探针(`window.__persepolis`,与姊妹站点共用工具链) |

## 文件地图

```
dist/
├── index.html / style.css     # 入口与 UI(竖排标题/印章/导览轨/地图)
├── vendor/                    # three.module.js + addons
└── js/
    ├── main.js               # 构建编排 → 模式切换 + QA 钩子
    ├── engine.js / postfx.js / preloader.js / tour.js   # 引擎核心(与姊妹站点同源)
    ├── camera-path.js        # 全程 CatmullRom + 章节驻留缓动
    ├── freeroam.js           # 漫游(AABB + 圆形墙体碰撞)
    ├── sky.js / config.js    # 天光状态插值 / 布局与 groundHeight(湖床/岛坡/桥面)
    ├── textures.js           # 灰瓦/琉璃/朱红/汉白玉/巴洛克石灰岩/湖水/青铜/草地
    ├── terrain.js            # 园林地(湖盆下沉)+ 岛屿体块 + 远山环 + 岸柳园柏
    ├── columns.js            # 中国柱式(卷杀柱身/金箍/古镜础)
    ├── map-view.js           # SVG 平面图 + 热点跳转 + 相机标记
    └── buildings/
        ├── roof.js           # 攒尖/硬山屋顶(灰瓦/黄琉璃参数化)+ 宝顶
        ├── hall.js           # 通用殿堂(灰砖墙 + 朱柱)+ 游廊
        ├── water.js          # 湖面着色器 / 岸雾 / 喷泉粒子 / 连岛桥
        ├── gate.js           # 绮春园宫门(城台 + 朝房 + 影壁)
        ├── jiuzhou.js        # 九州清晏九岛 + 寝宫群 + 曲桥
        ├── penisland.js      # 蓬岛瑶台假山仙岛
        └── xiyanglou.js      # 谐奇趣 / 海晏堂十二兽首 / 大水法 / 远瀛观
scripts/                      # build-local.mjs(esbuild IIFE)/ check.mjs(node --check)
qa/                           # gitignored:shot.mjs 截图脚本与产物
```

## 致谢

- **原作**:J. Paul Getty Museum × Media.Monks — [Persepolis Reimagined](https://persepolis.getty.edu/)
- [three.js](https://threejs.org/)(MIT)
- 历史文案参考圆明园公开史料(样式房图档、郎世宁/蒋友仁西洋楼设计记述)
