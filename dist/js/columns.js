// 中国柱式:朱红大漆圆柱 + 汉白玉柱础 + 金箍柱顶(合并单几何,供 InstancedMesh)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const cache = new Map();

export function columnGeometry(h, r = h * 0.032, style = 'red') {
  const key = `${h}|${r.toFixed(3)}|${style}`;
  if (cache.has(key)) return cache.get(key);
  const parts = [];
  // 柱础(古镜式)
  const base = new THREE.CylinderGeometry(r * 1.6, r * 1.85, h * 0.06, 20);
  base.translate(0, h * 0.03, 0);
  parts.push(base);
  // 柱身(上端略收:卷杀)
  const body = new THREE.CylinderGeometry(r * 0.92, r, h * 0.94, 24, 1, false);
  body.translate(0, h * 0.06 + h * 0.47, 0);
  parts.push(body);
  // 柱顶金箍(torus 沉入柱身顶部)
  const band = new THREE.TorusGeometry(r * 0.94, r * 0.1, 6, 24);
  band.rotateX(Math.PI / 2);
  band.translate(0, h * 0.96, 0);
  parts.push(band);
  const unified = parts.map((g) => (g.index ? g.toNonIndexed() : g));
  const g = mergeGeometries(unified, false);
  g.computeBoundingSphere();
  cache.set(key, g);
  return g;
}

// 柱网布置(圆形阵列)
export function columnRing(parent, mat, { cx, cz, y, r, count, h, colR, rotFaceCenter = false }) {
  const geo = columnGeometry(h, colR);
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    _e.set(0, rotFaceCenter ? -a : 0, 0);
    _q.setFromEuler(_e);
    _m.compose(new THREE.Vector3(x, y, z), _q, new THREE.Vector3(1, 1, 1));
    mesh.setMatrixAt(i, _m);
  }
  mesh.castShadow = true; mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// 石梁(额枋提示:红柱顶部的环形枋)
export function eaveRing(parent, mat, { cx, cz, y, r, h = 0.9, t = 0.5 }) {
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48, 1, true), mat);
  ring.position.set(cx, y, cz);
  ring.castShadow = true; ring.receiveShadow = true;
  parent.add(ring);
  void t;
  return ring;
}
