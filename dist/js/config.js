// 全局配置与场景布局(单位:米;+X 东,+Z 北,+Y 上)
// 圆明园巡礼:绮春园宫门(南)→ 福海西岸 → 九州清晏 → 蓬岛瑶台 → 西洋楼(谐奇趣→海晏堂→大水法)

export const CFG = {
  skyRadius: 2600,
  fogPlain: 0.0013,
  camera: { near: 0.5, far: 7000, fov: 55 },
  quality: {
    high: { pixelRatioCap: 2, shadowMap: 2048, shadows: true, bloom: true },
    mid: { pixelRatioCap: 1.5, shadowMap: 1024, shadows: true, bloom: true },
    low: { pixelRatioCap: 1, shadowMap: 0, shadows: false, bloom: false },
  },
};

// ---- 布局 ----
export const LAYOUT = {
  gate: { name: '绮春园宫门', en: 'Qichunyuan Palace Gate', center: [0, -430], w: 46, d: 14, h: 8.2 },
  lake: { name: '福海', en: 'Sea of Happiness', cx: 0, cz: 60, rx: 215, rz: 185 }, // 椭圆湖;水面 y≈0
  penIsland: { name: '蓬岛瑶台', en: 'Fairy Isle', center: [-40, 60], r: 34 },
  jiuzhou: {
    name: '九州清晏', en: 'Nine Isles in Tranquility', center: [0, 350],
    // 主岛 + 八小岛(象征禹贡九州)
    mainR: 62, isles: [
      [-108, 292], [-142, 348], [-118, 408],
      [0, 452], [118, 408],
      [142, 348], [108, 292],
      [-40, 470],
    ], isleR: 24,
  },
  xyl: { name: '西洋楼', en: 'Western Mansions', x: 250, // 建筑带中轴
    xieqiqu: { z: 40, w: 52, d: 20, h: 13 },
    haiyantang: { z: 200, w: 64, d: 26, h: 15 },
    dashuifa: { z: 340, w: 44, d: 18, h: 14 },
    yuanyingguan: { z: 386, w: 34, d: 14, h: 15 },
  },
  // 连岛桥(漫游可走)
  bridges: [
    { name: '九州西桥', x0: -230, z0: 240, x1: -118, z1: 300, w: 7, h: 1.4 },
    { name: '湖东桥', x0: 96, z0: 318, x1: 190, z1: 60, w: 7, h: 1.4 },
    { name: '蓬岛南桥', x0: -20, z0: -40, x1: -40, z1: 28, w: 6, h: 1.4 },
    { name: '南岸甬道', x0: 0, z0: -400, x1: 0, z1: -250, w: 6, h: 1.2 },
    { name: '西洋楼北岸桥', x0: 200, z0: -110, x1: 250, z1: -30, w: 6, h: 1.4 },
  ],
};

// 椭圆湖内(含湖床下沉,漫游者不得涉水)
export function inLake(x, z, shrink = 1) {
  const L = LAYOUT.lake;
  const dx = (x - L.cx) / (L.rx * shrink), dz = (z - L.cz) / (L.rz * shrink);
  return dx * dx + dz * dz < 1;
}

// 岛屿抬升(主岛/小岛/蓬岛:径向缓坡;terrain.js 体块共用)
export const ISLES = [
  { cx: LAYOUT.jiuzhou.center[0], cz: LAYOUT.jiuzhou.center[1], r: LAYOUT.jiuzhou.mainR, h: 1.1 },
  ...LAYOUT.jiuzhou.isles.map(([x, z]) => ({ cx: x, cz: z, r: LAYOUT.jiuzhou.isleR, h: 0.9 })),
  { cx: LAYOUT.penIsland.center[0], cz: LAYOUT.penIsland.center[1], r: LAYOUT.penIsland.r, h: 1.3 },
];
function isleHeight(x, z) {
  for (const s of ISLES) {
    const d = Math.hypot(x - s.cx, z - s.cz);
    if (d < s.r * 0.82) return s.h;
    if (d < s.r) return s.h * (1 - (d - s.r * 0.82) / (s.r * 0.18)) ** 1.4;
  }
  return null;
}
// 岛顶标高(建筑落位用;非岛返回 0)
export function isleTopY(x, z) {
  return isleHeight(x, z) ?? 0;
}
// 连岛桥面
function bridgeHeight(x, z) {
  for (const b of LAYOUT.bridges) {
    const x0 = Math.min(b.x0, b.x1) - b.w / 2, x1 = Math.max(b.x0, b.x1) + b.w / 2;
    const z0 = Math.min(b.z0, b.z1) - b.w / 2, z1 = Math.max(b.z0, b.z1) + b.w / 2;
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return b.h;
  }
  return null;
}

export function plainHeight(x, z) { return null; } // 占位:地形在 terrain.js 中定义(园林近景压平)

// 平面高度(自由漫游):湖床 -3(挡涉水)+ 岛屿缓坡 + 桥面 + 平地
export function groundHeight(x, z, plainFn) {
  if (inLake(x, z, 0.985)) return -3;          // 湖床(漫游挡水)
  const bh = bridgeHeight(x, z);
  if (bh !== null) return bh;
  const ih = isleHeight(x, z);
  if (ih !== null) return ih;
  // 西洋楼台基带(x 235~265, z 0~400 抬高 1.2)
  if (x > 233 && x < 268 && z > -20 && z < 405) return 1.2;
  // 宫门前广场
  const G = LAYOUT.gate;
  if (Math.abs(x - G.center[0]) < 90 && Math.abs(z - G.center[1]) < 70) return 0.5;
  return plainFn ? plainFn(x, z) : 0;
}

// 时间状态预设(园林天光;终章为「劫灰」余烬色)
export const DAY_STATES = {
  night: {
    az: 200, el: 40, sunColor: 0x8fa7d8, sunIntensity: 0.22,
    hemiSky: 0x2a3555, hemiGround: 0x1a1a22, hemiIntensity: 0.5, amb: 0.12,
    fogColor: 0x0d1420, fogDensity: 0.0026,
    top: 0x060a18, horizon: 0x1a2536, sunGlow: 0.12, stars: 1.0, exposure: 1.0,
  },
  dawn: {
    az: 235, el: 12, sunColor: 0xffc49a, sunIntensity: 1.6,
    hemiSky: 0xa8b4cc, hemiGround: 0x5c6455, hemiIntensity: 0.72, amb: 0.26,
    fogColor: 0xe8d2ba, fogDensity: 0.0018,
    top: 0x8698bc, horizon: 0xf2d2ac, sunGlow: 0.72, stars: 0.04, exposure: 1.05,
  },
  morning: {
    az: 200, el: 33, sunColor: 0xfff2dc, sunIntensity: 2.7,
    hemiSky: 0xbcd4e8, hemiGround: 0x7c8a62, hemiIntensity: 0.85, amb: 0.3,
    fogColor: 0xeee8d4, fogDensity: 0.0011,
    top: 0x8aa8d4, horizon: 0xf4e6c6, sunGlow: 0.5, stars: 0.0, exposure: 1.05,
  },
  noon: {
    az: 170, el: 61, sunColor: 0xffffff, sunIntensity: 3.1,
    hemiSky: 0xd2e4f2, hemiGround: 0x889470, hemiIntensity: 0.9, amb: 0.34,
    fogColor: 0xf0eee2, fogDensity: 0.0008,
    top: 0x7ea8de, horizon: 0xeae6d2, sunGlow: 0.32, stars: 0.0, exposure: 1.02,
  },
  golden: {
    az: 258, el: 21, sunColor: 0xffd9a0, sunIntensity: 2.8,
    hemiSky: 0xc6d4e4, hemiGround: 0x8e8c60, hemiIntensity: 0.85, amb: 0.3,
    fogColor: 0xf4e4c4, fogDensity: 0.001,
    top: 0x92a6ce, horizon: 0xf8dcae, sunGlow: 0.62, stars: 0.0, exposure: 1.06,
  },
  ember: {
    az: 292, el: 9, sunColor: 0xd89a72, sunIntensity: 1.7,
    hemiSky: 0x9c8878, hemiGround: 0x5c4a3c, hemiIntensity: 0.62, amb: 0.22,
    fogColor: 0xb09478, fogDensity: 0.0008,
    top: 0x6a6a72, horizon: 0xc89868, sunGlow: 0.72, stars: 0.0, exposure: 1.1,
  },
};
