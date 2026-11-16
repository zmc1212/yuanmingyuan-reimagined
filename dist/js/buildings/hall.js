// 通用殿堂:台基 + 红墙 + 灰瓦/琉璃硬山屋顶(园林建筑体块)
import * as THREE from 'three';
import { columnGeometry } from '../columns.js';
import { gableRoof } from './roof.js';

// 单座殿堂(x,z 中心;w 宽 d 深;wallH 墙高;roofH 屋顶高;kind 瓦色)
export function hall(parent, mats, { x, z, y = 0, w, d, wallH = 4.2, roofH = 2.6, kind = 'grey', columns = 0, base = true }) {
  const grp = new THREE.Group();
  if (base) {
    const baseM = new THREE.Mesh(new THREE.BoxGeometry(w + 2.0, 0.8, d + 2.0), mats.marble);
    baseM.position.y = y + 0.4;
    baseM.castShadow = true; baseM.receiveShadow = true;
    grp.add(baseM);
  }
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, wallH, d), mats.brickWall);
  body.position.y = y + 0.8 + wallH / 2;
  body.castShadow = true; body.receiveShadow = true;
  grp.add(body);
  // 朱红楹柱(四角)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, wallH, 10), mats.redPaint);
    col.position.set(sx * (w / 2 - 0.3), y + 0.8 + wallH / 2, sz * (d / 2 - 0.3));
    col.castShadow = true;
    grp.add(col);
  }
  // 前檐柱列
  if (columns > 1) {
    const colGeo = columnGeometry(wallH + 0.5, Math.min(0.4, w / (columns * 3)));
    const cols = new THREE.InstancedMesh(colGeo, mats.redPaint, columns);
    const _m = new THREE.Matrix4();
    for (let i = 0; i < columns; i++) {
      const t = (i / (columns - 1) - 0.5) * (w - 1.6);
      _m.identity();
      _m.setPosition(t, y + 0.8, d / 2 + 0.4);
      cols.setMatrixAt(i, _m);
    }
    cols.castShadow = true; cols.receiveShadow = true;
    grp.add(cols);
  }
  gableRoof(grp, mats, { x: 0, y: y + 0.8 + wallH, z: 0, w, d, h: roofH, kind });
  grp.position.set(x, 0, z);
  parent.add(grp);
  return grp;
}

// 廊(柱列 + 单坡/双坡长顶)
export function corridor(parent, mats, { x0, z0, x1, z1, w = 5.5, h = 3.4, y = 0, kind = 'grey' }) {
  const dx = x1 - x0, dz = z1 - z0;
  const len = Math.hypot(dx, dz);
  const ang = -Math.atan2(dz, dx);
  const grp = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(len, 0.55, w), mats.marble);
  base.position.y = y + 0.27;
  base.castShadow = true; base.receiveShadow = true;
  grp.add(base);
  const nPairs = Math.max(2, Math.round(len / 4.6));
  const colGeo = columnGeometry(h, 0.26);
  const cols = new THREE.InstancedMesh(colGeo, mats.redPaint, nPairs * 2);
  const _m = new THREE.Matrix4();
  let i = 0;
  for (let k = 0; k < nPairs; k++) {
    const t = (k / (nPairs - 1) - 0.5) * len;
    for (const sgn of [-1, 1]) {
      _m.identity();
      _m.setPosition(t, y + 0.55, sgn * (w / 2 - 0.5));
      cols.setMatrixAt(i++, _m);
    }
  }
  cols.count = i;
  cols.castShadow = true; cols.receiveShadow = true;
  grp.add(cols);
  gableRoof(grp, mats, { x: 0, y: y + 0.55 + h, z: 0, w: len, d: w, h: 1.4, kind });
  grp.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2);
  grp.rotation.y = ang;
  parent.add(grp);
  return grp;
}
