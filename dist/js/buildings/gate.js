// 绮春园宫门:城台门座 + 中门/侧门 + 朝房 + 门前广场影壁
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAYOUT } from '../config.js';
import { gableRoof } from './roof.js';

export function buildGate(ctx) {
  const { scene, mats, addCollider } = ctx;
  const G = LAYOUT.gate;
  const [gx, gz] = G.center;
  const g = new THREE.Group();
  const y0 = 0.5; // 门前广场地坪

  // 城台(中门大,两侧掖门小)
  const wallH = G.h;
  const segs = [
    { x0: -G.w / 2, x1: -11.5, w: 0 },
    { x0: -5.5, x1: -3.0, w: 0 },
    { x0: 3.0, x1: 5.5, w: 0 },
    { x0: 11.5, x1: G.w / 2, w: 0 },
  ];
  const boxes = [];
  for (const s of segs) {
    const len = s.x1 - s.x0;
    const b = new THREE.BoxGeometry(len, wallH, G.d);
    b.translate(gx + (s.x0 + s.x1) / 2, y0 + wallH / 2, gz);
    boxes.push(b);
    // 门洞上过梁
    const l = new THREE.BoxGeometry(Math.min(len, 6), 1.6, G.d);
    l.translate(gx + (s.x0 + s.x1) / 2, y0 + wallH - 0.8, gz);
    boxes.push(l);
  }
  const wallMesh = new THREE.Mesh(mergeGeometries(boxes, false), mats.brickWall);
  wallMesh.castShadow = true; wallMesh.receiveShadow = true;
  g.add(wallMesh);
  // 城台顶檐(两坡黄琉璃门楼)
  const gateRoof = new THREE.Group();
  gableRoof(gateRoof, mats, { x: 0, y: 0, z: 0, w: G.w + 4, d: G.d + 2.4, h: 3.8, kind: 'gold' });
  gateRoof.position.set(gx, y0 + wallH + 0.4, gz);
  g.add(gateRoof);
  // 门洞顶亮色平顶(遮挡屋顶暗腔)
  const soffit = new THREE.Mesh(new THREE.BoxGeometry(G.w + 2, 0.3, G.d - 1), mats.brickWall);
  soffit.position.set(gx, y0 + wallH - 0.2, gz);
  g.add(soffit);
  // 门洞暖光
  const lamp = new THREE.PointLight(0xffdfae, 300, 40, 2);
  lamp.position.set(gx, y0 + wallH - 2.5, gz);
  g.add(lamp);
  // 门钉朱门(中门)
  const door = new THREE.Mesh(new THREE.BoxGeometry(9, 6.4, 0.5), mats.redPaint);
  door.position.set(gx, y0 + 3.2, gz + G.d / 2 - 0.5);
  g.add(door);
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(12.6, 1.0, G.d + 0.6), mats.glazeGold);
  lintel.position.set(gx, y0 + wallH - 1.4, gz);
  g.add(lintel);
  // 匾(朱底金字示意)
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(8.5, 2.0, 0.25), mats.goldTrim);
  plaque.position.set(gx, y0 + wallH - 3.1, gz + G.d / 2 + 0.15);
  g.add(plaque);

  // 两侧院墙(东西延伸)
  for (const sgn of [-1, 1]) {
    const wr = new THREE.Mesh(new THREE.BoxGeometry(120, 3.6, 1.6), mats.brickWall);
    wr.position.set(gx + sgn * (G.w / 2 + 60), y0 + 1.8, gz);
    wr.castShadow = true; wr.receiveShadow = true;
    g.add(wr);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(120, 0.42, 2.1), mats.tileGrey);
    cap.position.set(gx + sgn * (G.w / 2 + 60), y0 + 3.85, gz);
    cap.castShadow = true;
    g.add(cap);
  }

  // 朝房(东西各一列)
  const sideY = y0;
  for (const sgn of [-1, 1]) {
    const hall = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(30, 0.7, 12), mats.marble);
    base.position.set(gx + sgn * 52, sideY + 0.35, gz - 14);
    hall.add(base);
    const body = new THREE.Mesh(new THREE.BoxGeometry(28, 3.8, 10), mats.redPaint);
    body.position.set(gx + sgn * 52, sideY + 2.6, gz - 14);
    body.castShadow = true; body.receiveShadow = true;
    hall.add(body);
    gableRoof(hall, mats, { x: gx + sgn * 52, y: sideY + 4.5, z: gz - 14, w: 28, d: 10, h: 2.2, kind: 'grey' });
    g.add(hall);
  }

  // 门前影壁(南侧 30m)
  const screen = new THREE.Mesh(new THREE.BoxGeometry(26, 5.4, 1.4), mats.brickWall);
  screen.position.set(gx, y0 + 2.7, gz - 46);
  screen.castShadow = true; screen.receiveShadow = true;
  g.add(screen);
  const screenCap = new THREE.Mesh(new THREE.BoxGeometry(27.4, 0.5, 2.0), mats.tileGrey);
  screenCap.position.set(gx, y0 + 5.6, gz - 46);
  g.add(screenCap);

  scene.add(g);
  // 碰撞:城台四段(中门洞 9m 宽通行)
  const segs2 = [[-G.w / 2, -11.5], [-5.5, -3.0], [3.0, 5.5], [11.5, G.w / 2]];
  for (const [a, b] of segs2) {
    addCollider({ minX: gx + a - 0.6, maxX: gx + b + 0.6, minZ: gz - G.d / 2 - 0.6, maxZ: gz + G.d / 2 + 0.6 });
  }
  addCollider({ minX: gx - 13, maxX: gx + 13, minZ: gz - 47.4, maxZ: gz - 44.6 }); // 影壁
  return { group: g };
}
