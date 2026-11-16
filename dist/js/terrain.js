// 地形:园林草地(福海湖盆下沉)+ 远山环 + 岸柳 / 岛柏 / 灌木;输出 plainHeight
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32 } from './textures.js';
import { LAYOUT, inLake, ISLES } from './config.js';

// 基础起伏(园林近景压平;湖盆下沉)
export function plainHeight(x, z) {
  let h = (Math.sin(x * 0.011 + 4.7) + Math.cos(z * 0.013 + 1.3)) * 0.5
        + Math.sin(x * 0.0035 + z * 0.0041) * 0.9;
  // 建筑带压平
  const fades = [
    { x: 0, z: -430, r: 130 },   // 宫门
    { x: -230, z: 40, r: 120 },  // 西岸带
    { x: 0, z: 360, r: 130 },    // 九州
    { x: -40, z: 60, r: 80 },    // 蓬岛
    { x: 250, z: 200, r: 150 },  // 西洋楼
  ];
  for (const f of fades) {
    const d = Math.hypot(x - f.x, z - f.z);
    const k = Math.min(1, Math.max(0, (d - f.r * 0.55) / (f.r * 0.45)));
    h *= k;
  }
  // 湖盆:椭缘向 -3 下沉(水面 0 由 water.js 提供)
  const L = LAYOUT.lake;
  const dx = (x - L.cx) / (L.rx + 26), dz = (z - L.cz) / (L.rz + 26);
  const e = dx * dx + dz * dz;
  if (e < 1.21) {
    const t = Math.min(1, Math.max(0, (1.1 - e) / 0.75));
    h = h * (1 - t) + -3.2 * t;
  }
  return h;
}

export function buildTerrain(scene, mats) {
  const SIZE = 4600, SEG = 150;
  const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const cA = new THREE.Color(0x8e9068), cB = new THREE.Color(0x82845e), cC = new THREE.Color(0x5e6e4c), cShore = new THREE.Color(0xa89a72);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const y = plainHeight(x, z);
    pos.setY(i, y);
    const patch = (Math.sin(x * 0.02 + 2.1) + Math.cos(z * 0.017 + 0.7)) * 0.5;
    tmp.copy(cA).lerp(cB, (patch + 1) * 0.5);
    // 湖岸沙滩色
    const L = LAYOUT.lake;
    const dx = (x - L.cx) / (L.rx + 22), dz = (z - L.cz) / (L.rz + 22);
    const e = dx * dx + dz * dz;
    if (e > 0.72 && e < 1.05) tmp.lerp(cShore, 0.5);
    // 深草色(远离建筑)
    const far = Math.min(1, Math.max(0, (Math.hypot(x, z - 60) - 320) / 500));
    tmp.lerp(cC, far * 0.5);
    colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, mats.garden);
  ground.receiveShadow = true;
  ground.userData.noOcclude = true;
  scene.add(ground);

  buildHills(scene, mats);
  buildIslandMounds(scene, mats);
  buildVegetation(scene, mats);
  return { ground };
}

// 岛屿体块(福海中的九州诸岛与蓬岛:草坡馒头 + 沙岸环,与 groundHeight 的 isleHeight 对应)
function buildIslandMounds(scene, mats) {
  const moundMat = new THREE.MeshStandardMaterial({ color: 0x878a62, roughness: 1 });
  const sandMat = new THREE.MeshStandardMaterial({ color: 0xa89a72, roughness: 1 });
  for (const s of ISLES) {
    const mound = new THREE.Mesh(new THREE.CylinderGeometry(s.r * 0.78, s.r * 1.02, s.h + 3.6, 36), moundMat);
    mound.position.set(s.cx, s.h / 2 - 3.2, s.cz);
    mound.receiveShadow = true; mound.castShadow = true;
    mound.userData.noOcclude = true;
    scene.add(mound);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(s.r * 0.79, s.r * 0.79, 0.24, 36), moundMat);
    cap.position.set(s.cx, s.h + 0.06, s.cz);
    cap.receiveShadow = true;
    cap.userData.noOcclude = true;
    scene.add(cap);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(s.r * 0.9, 0.9, 6, 40), sandMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(s.cx, 0.15, s.cz);
    rim.receiveShadow = true;
    rim.userData.noOcclude = true;
    scene.add(rim);
  }
}

// 远山环(西山 / 玉泉山意象:噪声圆锥,合并为单一网格)
function hillGeometry(seed) {
  const rnd = mulberry32(seed);
  const parts = [];
  const peaks = 26;
  for (let i = 0; i < peaks; i++) {
    const a = (i / peaks) * Math.PI * 2 + rnd() * 0.2;
    const R = 1680 + rnd() * 380;
    const x = Math.cos(a) * R, z = Math.sin(a) * R;
    const h = 130 + rnd() * 240;
    const r = h * (1.3 + rnd() * 0.7);
    const cone = new THREE.ConeGeometry(r, h, 9, 3);
    const p = cone.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const px = p.getX(k), py = p.getY(k), pz = p.getZ(k);
      const n = Math.sin(px * 0.06 + i) * Math.cos(pz * 0.05 + i * 2.1);
      p.setX(k, px + n * r * 0.12);
      p.setZ(k, pz + n * r * 0.1);
      if (py > 0 && py < h * 0.5) p.setY(k, py + n * h * 0.08);
    }
    cone.computeVertexNormals();
    cone.translate(x, h / 2 - 12, z);
    parts.push(cone);
  }
  return mergeGeometries(parts, false);
}

function buildHills(scene, mats) {
  const hillMat = new THREE.MeshStandardMaterial({ color: 0x6c7858, roughness: 1 });
  const hills = new THREE.Mesh(hillGeometry(517), hillMat);
  hills.receiveShadow = false;
  hills.userData.noOcclude = true;
  scene.add(hills);
}

// ---- 植被 ----
function willowGeometry(seed = 88) {
  const rnd = mulberry32(seed);
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.42, 0.72, 6.5, 8);
  trunk.translate(0, 3.2, 0);
  parts.push(trunk);
  // 下垂宽冠:三层压扁椭球,柳色偏黄绿
  const clumps = [
    { y: 7.4, r: 5.2, sy: 0.5 }, { y: 5.9, r: 6.0, sy: 0.42 }, { y: 4.6, r: 5.0, sy: 0.38 },
  ];
  for (const c of clumps) {
    const s = new THREE.SphereGeometry(c.r * (0.85 + rnd() * 0.3), 8, 6);
    s.scale(1, c.sy, 1);
    s.translate((rnd() - 0.5) * 1.6, c.y, (rnd() - 0.5) * 1.6);
    parts.push(s);
  }
  return mergeGeometries(parts);
}

function pineGeometry(seed = 88) {
  const rnd = mulberry32(seed);
  const parts = [];
  const trunk = new THREE.CylinderGeometry(0.5, 0.9, 5.4, 8);
  trunk.translate(0, 2.7, 0);
  parts.push(trunk);
  const clumps = 9;
  let y = 4.8;
  for (let i = 0; i < clumps; i++) {
    const r = 2.6 * (1 - (i / clumps) * 0.62) * (0.85 + rnd() * 0.3);
    const h = 1.5 + rnd() * 0.9;
    const dx = (rnd() - 0.5) * 1.1, dz = (rnd() - 0.5) * 1.1;
    const clump = new THREE.SphereGeometry(r, 7, 6);
    clump.scale(1, h / (2 * r), 1);
    clump.translate(dx, y + h * 0.4, dz);
    parts.push(clump);
    y += 1.15 + rnd() * 0.5;
  }
  return mergeGeometries(parts);
}

function shrubGeometry(seed = 199) {
  const g = new THREE.SphereGeometry(1, 7, 6);
  const p = g.attributes.position;
  const rnd = mulberry32(seed);
  for (let i = 0; i < p.count; i++) {
    p.setXYZ(i, p.getX(i) * (0.75 + rnd() * 0.5), p.getY(i) * 0.6 * (0.75 + rnd() * 0.5), p.getZ(i) * (0.75 + rnd() * 0.5));
  }
  g.computeVertexNormals();
  return g;
}

function rockGeometry(seed = 311) {
  const g = new THREE.DodecahedronGeometry(1, 0);
  const p = g.attributes.position;
  const rnd = mulberry32(seed);
  for (let i = 0; i < p.count; i++) {
    const k = 0.7 + rnd() * 0.6;
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.72, p.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
}

function scatterInstanced(scene, geo, mat, count, seed, place) {
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), pv = new THREE.Vector3();
  const rnd = mulberry32(seed);
  let placed = 0, guard = 0;
  while (placed < count && guard < count * 40) {
    guard++;
    const x = (rnd() - 0.5) * 3200, z = (rnd() - 0.5) * 3200 + 20;
    if (Math.abs(x) > 1550 || Math.abs(z - 20) > 1550) continue;
    const pt = place(x, z, rnd);
    if (!pt) continue;
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * Math.PI * 2);
    s.set(pt.s, pt.s, pt.s);
    pv.set(x, pt.y, z);
    m.compose(pv, q, s);
    mesh.setMatrixAt(placed++, m);
  }
  mesh.count = placed;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// 保留区(建筑与巡礼带不种树)
function inReserve(x, z) {
  if (Math.hypot(x, z + 430) < 130) return true;        // 宫门
  if (Math.abs(x + 230) < 46 && z > -330 && z < 250) return true; // 西岸带
  if (Math.hypot(x, z - 360) < 130) return true;        // 九州
  if (Math.hypot(x + 40, z - 60) < 70) return true;     // 蓬岛
  if (x > 195 && x < 290 && z > -30 && z < 410) return true; // 西洋楼
  if (inLake(x, z, 0.92)) return true;                  // 湖面
  return false;
}

function buildVegetation(scene, mats) {
  // 岸柳(福海沿椭圆边缘成排)
  const L = LAYOUT.lake;
  const willow = willowGeometry();
  const N_W = 86;
  const willows = new THREE.InstancedMesh(willow, mats.willow, N_W);
  {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    const rnd = mulberry32(211);
    let i = 0, guard = 0;
    while (i < N_W && guard < N_W * 30) {
      guard++;
      const a = rnd() * Math.PI * 2;
      const off = 12 + rnd() * 26;
      const x = L.cx + Math.cos(a) * (L.rx + off);
      const z = L.cz + Math.sin(a) * (L.rz + off);
      if (inReserve(x, z)) continue;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * Math.PI * 2);
      const sc = 0.9 + rnd() * 0.7;
      s.set(sc, sc, sc);
      m.compose(new THREE.Vector3(x, plainHeight(x, z) - 0.1, z), q, s);
      willows.setMatrixAt(i++, m);
    }
    willows.count = i;
  }
  willows.castShadow = true; willows.receiveShadow = true;
  scene.add(willows);

  // 园柏(岛上与园地)
  scatterInstanced(scene, pineGeometry(), mats.pine, 280, 51, (x, z, rnd) => {
    if (inReserve(x, z)) return null;
    const y = plainHeight(x, z);
    if (y < -1.2) return null;
    if (rnd() < 0.68) return { y: y - 0.15, s: 0.9 + rnd() * 1.5 };
    return null;
  });
  // 灌木
  scatterInstanced(scene, shrubGeometry(), mats.shrub, 260, 77, (x, z, rnd) => {
    if (inReserve(x, z)) return null;
    const y = plainHeight(x, z);
    if (y < -1.2) return null;
    return { y: y - 0.1, s: 0.8 + rnd() * 1.6 };
  });
  // 岸石(假山叠石意象,沿湖缘)
  scatterInstanced(scene, rockGeometry(), mats.rock, 110, 313, (x, z, rnd) => {
    if (!inLake(x, z, 0.99)) {
      // 只在湖缘外圈 0~26m 内
      const Lx = LAYOUT.lake;
      const dx = (x - Lx.cx) / (Lx.rx + 26), dz = (z - Lx.cz) / (Lx.rz + 26);
      const e = dx * dx + dz * dz;
      if (e < 0.86 || e > 1.0) return null;
    } else return null;
    const y = plainHeight(x, z);
    if (y < -1.4) return null;
    return { y, s: 0.7 + rnd() * 2.0 };
  });
}
