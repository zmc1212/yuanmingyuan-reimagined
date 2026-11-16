// 蓬岛瑶台:湖心石岛 + 三殿一亭(李思训仙山楼阁画意)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mulberry32 } from '../textures.js';
import { LAYOUT } from '../config.js';
import { hall } from './hall.js';
import { roofTier, finial } from './roof.js';

export function buildPenIsland(ctx) {
  const { scene, mats, addCollider } = ctx;
  const P = LAYOUT.penIsland;
  const [cx, cz] = P.center;
  const y = 1.3; // isleTopY
  const g = new THREE.Group();

  // 假山石基座(乱石堆叠)
  const rnd = mulberry32(617);
  const rocks = [];
  for (let i = 0; i < 26; i++) {
    const a = rnd() * Math.PI * 2;
    const rr = P.r * (0.62 + rnd() * 0.35);
    const rock = new THREE.DodecahedronGeometry(1, 0);
    const sc = 3 + rnd() * 5;
    rock.scale(sc, sc * (0.5 + rnd() * 0.4), sc);
    rock.rotateY(rnd() * Math.PI);
    rock.translate(cx + Math.cos(a) * rr, y - 0.6 + rnd() * 1.4, cz + Math.sin(a) * rr);
    rocks.push(rock);
  }
  const rockMesh = new THREE.Mesh(mergeGeometries(rocks, false), mats.rock);
  rockMesh.castShadow = true; rockMesh.receiveShadow = true;
  g.add(rockMesh);

  // 岛心平台
  const plat = new THREE.Mesh(new THREE.CylinderGeometry(P.r * 0.6, P.r * 0.7, 1.0, 24), mats.marble);
  plat.position.set(cx, y + 0.3, cz);
  plat.castShadow = true; plat.receiveShadow = true;
  g.add(plat);
  const yP = y + 0.8;

  // 中殿(两层楼阁意象)
  const mid = new THREE.Group();
  const mb = new THREE.Mesh(new THREE.BoxGeometry(18, 5.2, 11), mats.redPaint);
  mb.position.y = yP + 2.6;
  mb.castShadow = true; mb.receiveShadow = true;
  mid.add(mb);
  // 平坐栏杆环(二层)
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(9.6, 9.6, 0.8, 24, 1, true), mats.marbleFine);
  rail.position.y = yP + 5.6;
  mid.add(rail);
  const mUp = new THREE.Mesh(new THREE.BoxGeometry(13, 3.8, 8), mats.redPaint);
  mUp.position.y = yP + 7.5;
  mUp.castShadow = true; mUp.receiveShadow = true;
  mid.add(mUp);
  roofTier(mid, mats, { cx: 0, cz: 0, yBase: yP + 9.4, rEave: 10.5, rTop: 2.6, h: 3.6, kind: 'grey' });
  finial(mid, mats, 0, yP + 13.2, 0, 0.5);
  mid.position.set(cx, 0, cz - 4);
  g.add(mid);

  // 东西配亭(攒尖)
  for (const sgn of [-1, 1]) {
    const pav = new THREE.Group();
    const pb = new THREE.Mesh(new THREE.CylinderGeometry(5.4, 5.9, 0.6, 18), mats.marble);
    pb.position.y = yP + 0.3;
    pav.add(pb);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 3.2, 10), mats.redPaint);
      col.position.set(cx + sgn * 17 + Math.cos(a) * 3.8, yP + 2.4, cz + 6 + Math.sin(a) * 3.8);
      col.castShadow = true;
      g.add(col);
    }
    roofTier(pav, mats, { cx: cx + sgn * 17, cz: cz + 6, yBase: yP + 4.0, rEave: 5.4, rTop: 0.6, h: 2.6, kind: 'grey' });
    finial(pav, mats, cx + sgn * 17, yP + 6.8, cz + 6, 0.32);
    g.add(pav);
  }

  // 北小殿
  hall(g, mats, { x: cx, z: cz + 16, y: yP, w: 11, d: 8, wallH: 3.4, roofH: 1.9, kind: 'grey' });

  // 岛上老柏两株
  for (const sgn of [-1, 1]) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 6.0, 8), mats.bark);
    trunk.position.set(cx + sgn * 12, yP + 3.0, cz + 14);
    trunk.castShadow = true;
    g.add(trunk);
    const crown = new THREE.Mesh(new THREE.SphereGeometry(2.4, 7, 6), mats.pine);
    crown.scale.set(1, 1.4, 1);
    crown.position.set(cx + sgn * 12, yP + 7.6, cz + 14);
    crown.castShadow = true;
    g.add(crown);
  }

  scene.add(g);
  addCollider({ circle: [cx, cz - 4, 9.2, 10.0], doors: [[Math.PI / 2, 0.3]] }); // 中殿
  addCollider({ minX: cx - 15.5, maxX: cx - 11.5, minZ: cz + 12, maxZ: cz + 20 });
  addCollider({ minX: cx + 11.5, maxX: cx + 15.5, minZ: cz + 12, maxZ: cz + 20 });
  return { group: g };
}
