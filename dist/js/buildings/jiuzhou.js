// 九州清晏:后湖九岛(禹贡九州意象)+ 主岛寝宫群 + 环岛临水殿 + 曲桥
import * as THREE from 'three';
import { LAYOUT, isleTopY } from '../config.js';
import { hall, corridor } from './hall.js';
import { gableRoof, roofTier, finial } from './roof.js';

export function buildJiuzhou(ctx) {
  const { scene, mats, addCollider } = ctx;
  const J = LAYOUT.jiuzhou;
  const [cx, cz] = J.center;
  const g = new THREE.Group();

  const yMain = isleTopY(cx, cz); // 主岛顶高

  // ---- 主岛寝宫群(圆明园殿 · 天地一家春意象:三进) ----
  // 正殿(歇山黄琉璃)
  const hall1 = new THREE.Group();
  const b1 = new THREE.Mesh(new THREE.BoxGeometry(34, 1.0, 20), mats.marble);
  b1.position.y = yMain + 0.5;
  b1.castShadow = true; b1.receiveShadow = true;
  hall1.add(b1);
  const body1 = new THREE.Mesh(new THREE.BoxGeometry(30, 6.2, 16), mats.brickWall);
  body1.position.y = yMain + 4.1;
  body1.castShadow = true; body1.receiveShadow = true;
  hall1.add(body1);
  // 前廊朱柱一排
  for (let i = 0; i < 9; i++) {
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 6.0, 12), mats.redPaint);
    col.position.set(-13 + i * 3.25, yMain + 4.1, 8.6);
    col.castShadow = true;
    hall1.add(col);
  }
  // 歇山顶(灰瓦卷棚)
  gableRoof(hall1, mats, { x: 0, y: yMain + 7.2, z: 0, w: 30, d: 16, h: 4.2, kind: 'grey', eaveOver: 1.2 });
  hall1.position.set(cx, 0, cz + 22);
  g.add(hall1);

  // 后殿(灰瓦)
  hall(g, mats, { x: cx, z: cz + 2, y: yMain, w: 24, d: 12, wallH: 4.4, roofH: 2.6, kind: 'grey' });
  // 配殿(东西)
  hall(g, mats, { x: cx - 30, z: cz + 12, y: yMain, w: 14, d: 22, wallH: 4.0, roofH: 2.3, kind: 'grey', columns: 5 });
  hall(g, mats, { x: cx + 30, z: cz + 12, y: yMain, w: 14, d: 22, wallH: 4.0, roofH: 2.3, kind: 'grey', columns: 5 });
  // 垂花门(岛门,南向)
  const gate = new THREE.Group();
  const gb = new THREE.Mesh(new THREE.BoxGeometry(9, 0.6, 6), mats.marble);
  gb.position.y = yMain + 0.3;
  gate.add(gb);
  for (const sgn of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.8, 3.6, 0.8), mats.redPaint);
    p.position.set(sgn * 2.6, yMain + 2.4, 0);
    gate.add(p);
  }
  gableRoof(gate, mats, { x: 0, y: yMain + 4.2, z: 0, w: 7.5, d: 5, h: 1.6, kind: 'grey' });
  gate.position.set(cx, 0, cz - 34);
  g.add(gate);

  // ---- 环岛八小岛:亭(攒尖)或小殿 ----
  J.isles.forEach(([ix, iz], k) => {
    const y = isleTopY(ix, iz);
    if (k % 2 === 0) {
      // 攒尖亭
      const pav = new THREE.Group();
      const pb = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 6.8, 0.7, 20), mats.marble);
      pb.position.y = y + 0.35;
      pb.castShadow = true; pb.receiveShadow = true;
      pav.add(pb);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 3.6, 10), mats.redPaint);
        col.position.set(Math.cos(a) * 4.6, y + 2.6, Math.sin(a) * 4.6);
        col.castShadow = true;
        pav.add(col);
      }
      roofTier(pav, mats, { cx: 0, cz: 0, yBase: y + 4.4, rEave: 6.6, rTop: 0.7, h: 3.0, kind: 'grey' });
      finial(pav, mats, 0, y + 7.6, 0, 0.4);
      pav.position.set(ix, 0, iz);
      g.add(pav);
      addCollider({ circle: [ix, iz, 6.4, 7.0], doors: [[0, 0.34]] });
    } else {
      hall(g, mats, { x: ix, z: iz, y, w: 12, d: 9, wallH: 3.6, roofH: 2.0, kind: 'grey' });
      addCollider({ minX: ix - 6.6, maxX: ix + 6.6, minZ: iz - 5.1, maxZ: iz + 5.1 });
    }
  });

  // 岛间曲桥(拱桥意象:低弧,装饰性;漫游走直线桥面)
  const links = [
    [[cx - 62, cz + 30], J.isles[1]], [[J.isles[0], 0], 0],
  ];
  void links;
  const spans = [
    [cx, cz, J.isles[0][0], J.isles[0][1]],
    [J.isles[0][0], J.isles[0][1], J.isles[1][0], J.isles[1][1]],
    [J.isles[1][0], J.isles[1][1], J.isles[2][0], J.isles[2][1]],
    [cx, cz, J.isles[6][0], J.isles[6][1]],
    [J.isles[6][0], J.isles[6][1], J.isles[5][0], J.isles[5][1]],
    [cx, cz, J.isles[3][0], J.isles[3][1]],
    [J.isles[3][0], J.isles[3][1], J.isles[4][0], J.isles[4][1]],
    [J.isles[4][0], J.isles[4][1], J.isles[5][0], J.isles[5][1]],
    [cx, cz, J.isles[7][0], J.isles[7][1]],
    [J.isles[7][0], J.isles[7][1], J.isles[2][0], J.isles[2][1]],
  ];
  for (const [ax, az, bx, bz] of spans) {
    const dx = bx - ax, dz = bz - az;
    const len = Math.hypot(dx, dz);
    if (len < 8) continue;
    const ang = -Math.atan2(dz, dx);
    const ay = isleTopY(ax, az), by = isleTopY(bx, bz);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(len, 0.4, 3.2), mats.marble);
    deck.position.set((ax + bx) / 2, (ay + by) / 2 + 0.9, (az + bz) / 2);
    deck.rotation.y = ang;
    deck.castShadow = true; deck.receiveShadow = true;
    g.add(deck);
    for (const sgn of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.5, 0.18), mats.marbleFine);
      rail.position.set((ax + bx) / 2, (ay + by) / 2 + 1.35, (az + bz) / 2);
      rail.rotation.y = ang;
      rail.translateZ(sgn * 1.45);
      rail.castShadow = true;
      g.add(rail);
    }
  }

  // ---- 主岛临水南岸:牌坊 + 码头 ----
  const wharf = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 8), mats.marble);
  wharf.position.set(cx + 44, 0.7, cz - 40);
  wharf.castShadow = true; wharf.receiveShadow = true;
  g.add(wharf);

  scene.add(g);
  // 碰撞:主岛建筑
  addCollider({ minX: cx - 17.5, maxX: cx + 17.5, minZ: cz + 8, maxZ: cz + 36 });
  addCollider({ minX: cx - 38, maxX: cx - 22, minZ: cz + 1, maxZ: cz + 23 });
  addCollider({ minX: cx + 22, maxX: cx + 38, minZ: cz + 1, maxZ: cz + 23 });
  return { group: g };
}
