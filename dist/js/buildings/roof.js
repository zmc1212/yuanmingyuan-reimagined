// 屋顶构件:曲面攒尖/庑殿顶(参数化材质)+ 两坡硬山 + 正吻 + 宝顶
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { tileGreyTexture, glazeGoldTexture } from '../textures.js';

const bez = (a, b, c, t) => (1 - t) * (1 - t) * a + 2 * (1 - t) * t * b + t * t * c;

const roofMats = new Map();
function roofMaterial(rEave, h, kind) {
  const key = `${Math.round(rEave)}|${Math.round(h)}|${kind}`;
  if (roofMats.has(key)) return roofMats.get(key);
  const map = kind === 'gold' ? glazeGoldTexture() : tileGreyTexture();
  map.repeat.set(Math.max(6, Math.round(rEave * 0.66)), Math.max(2, Math.round(h * 0.5)));
  map.needsUpdate = true;
  const m = new THREE.MeshStandardMaterial({
    map, roughness: 0.55, metalness: 0.04, side: THREE.DoubleSide,
    emissive: 0x1a1a14, emissiveIntensity: 0.5,
  });
  roofMats.set(key, m);
  return m;
}

// 单层曲面锥顶(rEave 檐口半径 → rTop 顶半径,h 竖高)
export function conicalRoof({ rEave, rTop, h, flare = 0.16 }) {
  const pts = [];
  const N = 14;
  const midR = rEave * 0.52 + rTop * 0.48;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    let x = bez(rEave, midR, rTop, t);
    let y = bez(0, h * 0.66, h, t);
    if (t < 0.16) y -= flare * (0.16 - t) / 0.16 * h * 0.09;
    pts.push(new THREE.Vector2(Math.max(x, 0.04), y));
  }
  return new THREE.LatheGeometry(pts, 56);
}

// 攒尖一重檐(屋面 + 灰瓦;脊端宝顶可选)
export function roofTier(parent, mats, { cx, cz, yBase, rEave, rTop, h, kind = 'grey' }) {
  const mesh = new THREE.Mesh(conicalRoof({ rEave, rTop, h }), roofMaterial(rEave, h, kind));
  mesh.position.set(cx, yBase, cz);
  mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// 硬山/歇山两坡屋面(垂直于 depth 方向;ExtrudeGeometry 沿宽度挤出)
export function gableRoof(parent, mats, { x, y, z, w, d, h, kind = 'grey', ridgeOver = 0.8, eaveOver = 0.7 }) {
  const profile = new THREE.Shape();
  profile.moveTo(-d / 2 - eaveOver, 0);
  profile.lineTo(0, h);
  profile.lineTo(d / 2 + eaveOver, 0);
  profile.lineTo(d / 2 + eaveOver, -0.32);
  profile.lineTo(-d / 2 - eaveOver, -0.32);
  profile.closePath();
  const geo = new THREE.ExtrudeGeometry(profile, { depth: w + ridgeOver * 2, bevelEnabled: false });
  geo.translate(-(w + ridgeOver * 2) / 2, 0, 0);
  const mesh = new THREE.Mesh(geo, roofMaterial(w, h, kind));
  mesh.position.set(x, y, z);
  mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh);
  // 正脊
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(w + ridgeOver * 2, 0.3, 0.5), roofMaterial(w, h, kind));
  ridge.position.set(x, y + h + 0.12, z);
  ridge.castShadow = true;
  parent.add(ridge);
  return mesh;
}

// 宝顶(须弥座 + 火珠 + 尖)
export function finial(parent, mats, x, y, z, scale = 1) {
  const base = new THREE.CylinderGeometry(0.85, 1.25, 1.7, 16);
  base.translate(0, 0.85, 0);
  const ball = new THREE.SphereGeometry(1.3, 18, 14);
  ball.translate(0, 2.55, 0);
  const spike = new THREE.ConeGeometry(0.32, 1.5, 12);
  spike.translate(0, 4.05, 0);
  const g = mergeGeometries([base, ball, spike].map((p) => (p.index ? p.toNonIndexed() : p)), false);
  const m = new THREE.Mesh(g, mats.goldTrim);
  m.position.set(x, y, z);
  m.scale.setScalar(scale);
  m.castShadow = true;
  parent.add(m);
  return m;
}
