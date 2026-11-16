// 地图视图:SVG 俯视示意图(福海/九州/西洋楼、导览路线、章节跳转、相机标记)
import { LAYOUT } from './config.js';
import { CHAPTERS } from './chapters.js';

const VW = 560, VH = 400, SC = 0.26, CZ = -10;
const wx = (x) => VW / 2 + x * SC;
const wz = (z) => VH / 2 - (z - CZ) * SC;

export function buildMapSvg(root, { onJump }) {
  const ns = 'http://www.w3.org/2000/svg';
  root.innerHTML = '';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${VW} ${VH}`);
  svg.classList.add('map-svg');

  const rect = (x, z, w, d, cls) => {
    const r = document.createElementNS(ns, 'rect');
    r.setAttribute('x', wx(x - w / 2)); r.setAttribute('y', wz(z + d / 2));
    r.setAttribute('width', w * SC); r.setAttribute('height', d * SC);
    r.setAttribute('class', cls);
    svg.appendChild(r);
    return r;
  };
  const circle = (x, z, r, cls) => {
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', wx(x)); c.setAttribute('cy', wz(z));
    c.setAttribute('r', r * SC);
    c.setAttribute('class', cls);
    svg.appendChild(c);
    return c;
  };
  const label = (x, z, text, cls = 'map-label') => {
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', wx(x)); t.setAttribute('y', wz(z) + 4);
    t.setAttribute('class', cls);
    t.textContent = text;
    svg.appendChild(t);
    return t;
  };

  // 福海
  const lake = document.createElementNS(ns, 'ellipse');
  lake.setAttribute('cx', wx(LAYOUT.lake.cx));
  lake.setAttribute('cy', wz(LAYOUT.lake.cz));
  lake.setAttribute('rx', LAYOUT.lake.rx * SC);
  lake.setAttribute('ry', LAYOUT.lake.rz * SC);
  lake.setAttribute('class', 'map-water');
  svg.appendChild(lake);
  label(LAYOUT.lake.cx - 150, LAYOUT.lake.cz, '福海');

  // 绮春园宫门 + 影壁
  rect(LAYOUT.gate.center[0], LAYOUT.gate.center[1], 46, 14, 'map-wall');
  rect(LAYOUT.gate.center[0], LAYOUT.gate.center[1] - 46, 26, 4, 'map-wall');

  // 九州主岛 + 八小岛
  circle(LAYOUT.jiuzhou.center[0], LAYOUT.jiuzhou.center[1], LAYOUT.jiuzhou.mainR, 'map-land');
  for (const [ix, iz] of LAYOUT.jiuzhou.isles) circle(ix, iz, LAYOUT.jiuzhou.isleR * 0.7, 'map-land');
  circle(LAYOUT.jiuzhou.center[0], LAYOUT.jiuzhou.center[1] + 22, 16, 'map-bldg');
  label(0, 330, '九州清晏');

  // 蓬岛瑶台
  circle(LAYOUT.penIsland.center[0], LAYOUT.penIsland.center[1], LAYOUT.penIsland.r, 'map-land');
  circle(LAYOUT.penIsland.center[0], LAYOUT.penIsland.center[1] - 4, 9, 'map-bldg');
  label(LAYOUT.penIsland.center[0], LAYOUT.penIsland.center[1] + 26, '蓬岛瑶台');

  // 西洋楼带
  const X = LAYOUT.xyl.x;
  rect(X + 8, LAYOUT.xyl.xieqiqu.z, 20, LAYOUT.xyl.xieqiqu.w, 'map-bldg');
  rect(X + 10, LAYOUT.xyl.haiyantang.z, 26, LAYOUT.xyl.haiyantang.w, 'map-bldg');
  rect(X, LAYOUT.xyl.dashuifa.z, 18, 22, 'map-bldg');
  rect(X + 6, LAYOUT.xyl.yuanyingguan.z, 14, LAYOUT.xyl.yuanyingguan.w, 'map-bldg');
  label(X + 60, LAYOUT.xyl.haiyantang.z, '西洋楼');

  // 连岛桥
  for (const b of LAYOUT.bridges) {
    const ln = document.createElementNS(ns, 'line');
    ln.setAttribute('x1', wx(b.x0)); ln.setAttribute('y1', wz(b.z0));
    ln.setAttribute('x2', wx(b.x1)); ln.setAttribute('y2', wz(b.z1));
    ln.setAttribute('class', 'map-bridge');
    svg.appendChild(ln);
  }

  // 导览路线
  const route = document.createElementNS(ns, 'polyline');
  const pts = [];
  CHAPTERS.forEach((c) => c.kfs.forEach((kf) => pts.push(`${wx(kf.p[0])},${wz(kf.p[2])}`)));
  route.setAttribute('points', pts.join(' '));
  route.setAttribute('class', 'map-route');
  svg.appendChild(route);

  // 章节热点
  const HOT = [
    { i: 0, x: 420, z: -520 }, { i: 1, x: 40, z: -430 }, { i: 2, x: -240, z: 40 },
    { i: 3, x: 0, z: 352 }, { i: 4, x: -40, z: 60 }, { i: 5, x: 210, z: 40 },
    { i: 6, x: 208, z: 200 }, { i: 7, x: 215, z: 345 },
  ];
  const hotEls = [];
  for (const h of HOT) {
    const gEl = document.createElementNS(ns, 'g');
    gEl.setAttribute('class', 'map-hot');
    gEl.addEventListener('click', () => onJump(h.i));
    const c = document.createElementNS(ns, 'circle');
    c.setAttribute('cx', wx(h.x)); c.setAttribute('cy', wz(h.z)); c.setAttribute('r', 11);
    gEl.appendChild(c);
    const t = document.createElementNS(ns, 'text');
    t.setAttribute('x', wx(h.x)); t.setAttribute('y', wz(h.z) - 15);
    t.setAttribute('text-anchor', 'middle');
    t.textContent = CHAPTERS[h.i].title.split(' · ')[0];
    gEl.appendChild(t);
    svg.appendChild(gEl);
    hotEls.push(gEl);
  }

  // 相机标记
  const marker = document.createElementNS(ns, 'g');
  const mk = document.createElementNS(ns, 'circle');
  mk.setAttribute('r', 5);
  mk.setAttribute('class', 'map-marker');
  marker.appendChild(mk);
  svg.appendChild(marker);

  root.appendChild(svg);
  return {
    svg, marker,
    update(camX, camZ, chapterIndex) {
      mk.setAttribute('cx', wx(Math.max(-1050, Math.min(1050, camX))));
      mk.setAttribute('cy', wz(Math.max(-730, Math.min(700, camZ))));
      hotEls.forEach((el, i) => el.classList.toggle('active', i === chapterIndex));
    },
  };
}
