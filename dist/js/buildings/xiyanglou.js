// 西洋楼:谐奇趣 / 海晏堂(十二兽首水力钟)/ 大水法 / 远瀛观
// 巴洛克立面(奶油石灰岩 + 壁柱 + 山花 + 栏杆)+ 喷泉(与 water.js 同源)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32 } from '../textures.js';
import { LAYOUT } from '../config.js';
import { createFountain } from './water.js';

const XYL_Y = 1.2; // 西洋楼台基高(config.groundHeight 同步)

// ---- 通用巴洛克立面(面向 -X 西侧) ----
function baroqueBlock(parent, mats, { x, z, w, d, h, floors = 3, pediment = true, dome = false }) {
  const grp = new THREE.Group();
  const y0 = XYL_Y;
  // 主楼
  const body = new THREE.Mesh(new THREE.BoxGeometry(d, h, w), mats.baroque);
  body.position.set(x, y0 + h / 2, z);
  body.castShadow = true; body.receiveShadow = true;
  grp.add(body);
  // 台基座
  const stylo = new THREE.Mesh(new THREE.BoxGeometry(d + 2.6, 1.1, w + 2.6), mats.baroqueFine);
  stylo.position.set(x, y0 + 0.55, z);
  stylo.castShadow = true; stylo.receiveShadow = true;
  grp.add(stylo);
  // 西立面壁柱(垂直扁柱)
  const pilGeo = new THREE.BoxGeometry(0.5, h - 1.4, 1.1);
  const pils = [];
  const nPil = Math.max(4, Math.round(w / 4.4));
  for (let i = 0; i <= nPil; i++) {
    const p = pilGeo.clone();
    p.translate(x - d / 2 - 0.35, y0 + (h - 1.4) / 2 + 0.7, z - w / 2 + (i / nPil) * w);
    pils.push(p);
  }
  const pilMesh = new THREE.Mesh(mergeGeometries(pils, false), mats.baroqueFine);
  pilMesh.castShadow = true;
  grp.add(pilMesh);
  // 檐口带(西面出挑)
  const cornice = new THREE.Mesh(new THREE.BoxGeometry(d + 1.2, 0.75, w + 1.2), mats.baroqueFine);
  cornice.position.set(x, y0 + h + 0.35, z);
  cornice.castShadow = true;
  grp.add(cornice);
  // 拱窗(内嵌深色凹龛,西立面)
  const winGeo = new THREE.BoxGeometry(0.5, 2.3, 1.5);
  const wins = [];
  const rows = floors;
  const rnd = mulberry32(Math.round(x * 7 + z));
  for (let r = 0; r < rows; r++) {
    const wy = y0 + 2.2 + r * ((h - 2.6) / rows);
    for (let i = 1; i < nPil; i++) {
      if (rnd() < 0.18) continue;
      const wv = winGeo.clone();
      wv.translate(x - d / 2 - 0.22, wy, z - w / 2 + (i / nPil) * w);
      wins.push(wv);
    }
  }
  if (wins.length) {
    const winMesh = new THREE.Mesh(mergeGeometries(wins, false), mats.brick);
    grp.add(winMesh);
  }
  // 山花(三角楣,西面)
  if (pediment) {
    const shape = new THREE.Shape();
    const pw = Math.min(w * 0.42, 22);
    shape.moveTo(-pw / 2, 0); shape.lineTo(0, 3.4); shape.lineTo(pw / 2, 0); shape.closePath();
    const ped = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 1.3, bevelEnabled: false }),
      mats.baroqueFine,
    );
    ped.rotation.y = -Math.PI / 2;
    ped.position.set(x - d / 2 - 1.3, y0 + h + 0.7, z - pw / 2);
    ped.castShadow = true;
    grp.add(ped);
  }
  // 穹顶(海晏堂)
  if (dome) {
    const dr = Math.min(w, d) * 0.34;
    const domeM = new THREE.Mesh(
      new THREE.SphereGeometry(dr, 26, 16, 0, Math.PI * 2, 0, Math.PI / 2),
      mats.baroqueFine,
    );
    domeM.position.set(x, y0 + h + 0.7, z);
    domeM.castShadow = true;
    grp.add(domeM);
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(dr * 1.05, dr * 1.12, 2.6, 26), mats.baroque);
    drum.position.set(x, y0 + h + 1.9, z);
    drum.castShadow = true;
    grp.add(drum);
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, 2.6, 12), mats.baroqueFine);
    lantern.position.set(x, y0 + h + 2.7 + dr, z);
    grp.add(lantern);
  }
  parent.add(grp);
  return grp;
}

// 西立面栏杆带(直排宝瓶栏杆简化为矮墙 + 立柱)
function balustrade(parent, mats, { x0, z0, x1, z1, y, h = 1.0 }) {
  const dx = x1 - x0, dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  const ang = -Math.atan2(dz, dx);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(len, h, 0.3), mats.baroqueFine);
  rail.position.set((x0 + x1) / 2, y + h / 2, (z0 + z1) / 2);
  rail.rotation.y = ang;
  rail.castShadow = true;
  parent.add(rail);
  const n = Math.max(2, Math.round(len / 4));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.55, h + 0.45, 0.55), mats.baroqueFine);
    post.position.set(x0 + dx * t, y + (h + 0.45) / 2, z0 + dz * t);
    post.castShadow = true;
    parent.add(post);
  }
}

// ---- 十二兽首铜像(人身兽首,扇形两列) ----
function zodiacHead(parent, mats, x, y, z, seed) {
  const rnd = mulberry32(seed);
  const grp = new THREE.Group();
  // 石座
  const ped = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), mats.baroqueFine);
  ped.position.y = 0.75;
  ped.castShadow = true; ped.receiveShadow = true;
  grp.add(ped);
  // 袍身(褶皱立柱)
  const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.78, 2.5, 12), mats.bronze);
  robe.position.y = 2.75;
  robe.castShadow = true;
  grp.add(robe);
  // 头(球形 + 兽耳/角/吻部变体)
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 12), mats.bronze);
  head.scale.set(1, 0.92, 1.12);
  head.position.y = 4.45;
  head.castShadow = true;
  grp.add(head);
  const kind = Math.floor(rnd() * 4);
  if (kind === 0) { // 圆耳(鼠/兔)
    for (const sgn of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), mats.bronze);
      ear.scale.set(0.5, 1, 0.5);
      ear.position.set(sgn * 0.38, 4.85, 0);
      grp.add(ear);
    }
  } else if (kind === 1) { // 双角(牛/羊/鹿)
    for (const sgn of [-1, 1]) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.7, 6), mats.bronze);
      horn.position.set(sgn * 0.3, 5.0, -0.1);
      horn.rotation.z = sgn * 0.6;
      grp.add(horn);
    }
  } else if (kind === 2) { // 长吻(马/狗)
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.55), mats.bronze);
    snout.position.set(0, 4.35, 0.5);
    grp.add(snout);
  } else { // 冠羽(鸡/龙)
    const crest = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 6), mats.bronze);
    crest.position.set(0, 5.05, 0);
    grp.add(crest);
  }
  // 喷水口(兽口前小盘)
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.2, 8), mats.bronze);
  spout.position.set(0, 4.3, 0.72);
  grp.add(spout);
  grp.position.set(x, y, z);
  parent.add(grp);
}

// ---- 谐奇趣 ----
export function buildXieqiqu(ctx) {
  const { scene, mats, addCollider, fountains } = ctx;
  const C = LAYOUT.xyl.xieqiqu;
  const x = LAYOUT.xyl.x, z = C.z;
  const g = new THREE.Group();

  baroqueBlock(g, mats, { x: x + 8, z, w: C.w, d: C.d, h: C.h, floors: 3, pediment: true });
  // 两侧八角楼厅
  for (const sgn of [-1, 1]) {
    const oct = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.6, 9.5, 8), mats.baroque);
    oct.position.set(x + 8, XYL_Y + 4.75, z + sgn * (C.w / 2 + 9));
    oct.castShadow = true; oct.receiveShadow = true;
    g.add(oct);
    const octRoof = new THREE.Mesh(
      new THREE.ConeGeometry(8.4, 4.6, 8),
      mats.tileGrey,
    );
    octRoof.position.set(x + 8, XYL_Y + 11.8, z + sgn * (C.w / 2 + 9));
    octRoof.rotation.y = Math.PI / 8;
    octRoof.castShadow = true;
    g.add(octRoof);
  }
  // 西面弧形喷泉坪
  const plaza = new THREE.Mesh(new THREE.CylinderGeometry(14, 15, 0.8, 28, 1, false, Math.PI * 0.75, Math.PI * 1.5), mats.marble);
  plaza.position.set(x - 18, XYL_Y + 0.4, z);
  plaza.receiveShadow = true; plaza.castShadow = true;
  g.add(plaza);
  balustrade(g, mats, { x0: x - 30, z0: z - 10, x1: x - 30, z1: z + 10, y: XYL_Y + 0.8 });
  // 喷泉
  fountains.push(createFountain(scene, { x: x - 18, y: XYL_Y + 0.8, z, count: 520, power: 6.5, spread: 0.42, mats }));

  scene.add(g);
  addCollider({ minX: x - 5, maxX: x + 21, minZ: z - C.w / 2 - 1.5, maxZ: z + C.w / 2 + 1.5 });
  return { group: g };
}

// ---- 海晏堂(大穹顶 + 十二兽首扇形阶) ----
export function buildHaiyantang(ctx) {
  const { scene, mats, addCollider, fountains } = ctx;
  const C = LAYOUT.xyl.haiyantang;
  const x = LAYOUT.xyl.x, z = C.z;
  const g = new THREE.Group();

  baroqueBlock(g, mats, { x: x + 10, z, w: C.w, d: C.d, h: C.h, floors: 2, pediment: true, dome: true });
  // 西面前庭(扇形大台阶,十二兽首两列)
  const steps = [];
  for (let k = 0; k < 6; k++) {
    const wdt = 26 + k * 3.4;
    const st = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.55, wdt), mats.baroqueFine);
    st.position.set(x - 12 - k * 2.4, XYL_Y + 1.05 - k * 0.18, z);
    st.receiveShadow = true; st.castShadow = true;
    steps.push(st);
    g.add(st);
    void wdt;
  }
  // 兽首列(两列,沿台阶两侧弧线)
  for (let i = 0; i < 12; i++) {
    const col = i % 2; // 0 左列 1 右列
    const row = Math.floor(i / 2); // 0..5
    const zx = x - 14.5 - row * 3.1;
    const zz = z + (col === 0 ? -1 : 1) * (5.2 + row * 1.85);
    zodiacHead(g, mats, zx, XYL_Y + 1.1 - row * 0.18, zz, 101 + i);
  }
  // 大喷泉池(西端)
  fountains.push(createFountain(scene, { x: x - 30, y: XYL_Y + 0.4, z, count: 720, power: 8.5, spread: 0.55, mats }));
  balustrade(g, mats, { x0: x - 36, z0: z - 13, x1: x - 36, z1: z + 13, y: XYL_Y + 0.8 });
  // 堂前东西配楼(八字形)
  for (const sgn of [-1, 1]) {
    baroqueBlock(g, mats, { x: x + 2, z: z + sgn * (C.w / 2 + 10), w: 20, d: 14, h: 9, floors: 2, pediment: false });
  }

  scene.add(g);
  addCollider({ minX: x, maxX: x + 27, minZ: z - C.w / 2 - 1.5, maxZ: z + C.w / 2 + 1.5 });
  addCollider({ minX: x - 9, maxX: x + 9, minZ: z - C.w / 2 - 20, maxZ: z - C.w / 2 - 2 });
  addCollider({ minX: x - 9, maxX: x + 9, minZ: z + C.w / 2 + 2, maxZ: z + C.w / 2 + 20 });
  return { group: g };
}

// ---- 大水法(三重喷水塔 + 拱门屏风) + 远瀛观 ----
export function buildDashuifa(ctx) {
  const { scene, mats, addCollider, fountains } = ctx;
  const C = LAYOUT.xyl.dashuifa;
  const x = LAYOUT.xyl.x, z = C.z;
  const g = new THREE.Group();

  // 屏风拱门(两方柱 + 半圆拱)
  const py1 = new THREE.Mesh(new THREE.BoxGeometry(4, 12, 4), mats.baroque);
  py1.position.set(x - 4, XYL_Y + 6, z - 7);
  py1.castShadow = true; py1.receiveShadow = true;
  g.add(py1);
  const py2 = py1.clone();
  py2.position.z = z + 7;
  g.add(py2);
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(7, 1.5, 10, 24, Math.PI),
    mats.baroqueFine,
  );
  arch.rotation.y = Math.PI / 2;
  arch.position.set(x - 4, XYL_Y + 12, z);
  arch.castShadow = true;
  g.add(arch);
  // 拱内小塔(三重喷水塔意象)
  for (let k = 0; k < 3; k++) {
    const tier = new THREE.Mesh(new THREE.CylinderGeometry(2.4 - k * 0.6, 2.8 - k * 0.6, 1.2, 12), mats.baroqueFine);
    tier.position.set(x - 4, XYL_Y + 1.2 + k * 3.2, z);
    tier.castShadow = true;
    g.add(tier);
  }
  // 狮子头泄瀑壁(东侧)
  const back = new THREE.Mesh(new THREE.BoxGeometry(3, 9, 18), mats.baroque);
  back.position.set(x - 0.5, XYL_Y + 4.5, z);
  back.castShadow = true; back.receiveShadow = true;
  g.add(back);
  // 蓄水池(西侧阶梯池)
  for (let k = 0; k < 3; k++) {
    const pool = new THREE.Mesh(new THREE.BoxGeometry(9 - k * 2.2, 0.6, 26 - k * 5), mats.marble);
    pool.position.set(x - 12 - k * 4, XYL_Y + 0.9 + k * 0.9, z);
    pool.receiveShadow = true;
    g.add(pool);
  }
  // 水幕喷泉(大水法正面)
  fountains.push(createFountain(scene, { x: x - 13, y: XYL_Y + 0.6, z, count: 640, power: 7.2, spread: 0.5, mats }));
  fountains.push(createFountain(scene, { x: x - 12.5, y: XYL_Y + 2.4, z: z - 6, count: 320, power: 5.2, spread: 0.3, size: 0.45, mats, basin: false }));
  fountains.push(createFountain(scene, { x: x - 12.5, y: XYL_Y + 2.4, z: z + 6, count: 320, power: 5.2, spread: 0.3, size: 0.45, mats, basin: false }));

  // 远瀛观(北侧立面)
  const Y = LAYOUT.xyl.yuanyingguan;
  baroqueBlock(g, mats, { x: x + 6, z: Y.z, w: Y.w, d: Y.d, h: Y.h, floors: 2, pediment: true });
  balustrade(g, mats, { x0: x - 6, z0: Y.z - Y.w / 2, x1: x - 6, z1: Y.z + Y.w / 2, y: XYL_Y + 0.8 });

  scene.add(g);
  addCollider({ minX: x - 6.5, maxX: x + 1, minZ: z - 9.5, maxZ: z + 9.5 });
  addCollider({ minX: x - 2, maxX: x + 14, minZ: Y.z - Y.w / 2 - 1.5, maxZ: Y.z + Y.w / 2 + 1.5 });
  return { group: g };
}
