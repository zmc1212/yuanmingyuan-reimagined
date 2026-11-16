// 水系:福海湖面(涟漪着色器)+ 岸雾 + 喷泉粒子 + 连岛桥
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LAYOUT } from '../config.js';

// ---- 湖面:标准材质 + onBeforeCompile 注入涟漪与法线扰动 ----
export function buildLake(scene, mats) {
  const L = LAYOUT.lake;
  const geo = new THREE.CircleGeometry(1, 96);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mats.water);
  mesh.scale.set(L.rx, 1, L.rz);
  mesh.position.set(L.cx, 0.06, L.cz);
  mesh.receiveShadow = true;
  mesh.userData.noOcclude = true;
  scene.add(mesh);

  const uTime = { value: 0 };
  const wMat = mesh.material;
  wMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTime;
        varying vec3 vWPos;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        transformed.y += sin(position.x * 0.055 + uTime * 1.05) * 0.14
                       + cos(position.z * 0.047 + uTime * 0.8) * 0.11;
        vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform float uTime;
        varying vec3 vWPos;`)
      .replace('#include <normal_fragment_begin>', `#include <normal_fragment_begin>
        {
          float n1 = sin(vWPos.x * 0.42 + uTime * 1.5) * 0.5 + sin(vWPos.z * 0.35 - uTime * 1.1) * 0.5;
          float n2 = cos(vWPos.x * 0.31 - uTime * 0.9) * 0.5 + cos(vWPos.z * 0.27 + uTime * 1.3) * 0.5;
          normal = normalize(normal + vec3(n1 * 0.22, 0.0, n2 * 0.22));
        }`);
  };
  wMat.customProgramCacheKey = () => 'ymy-water';

  // 岸缘石(沿椭圆一圈的压边)
  const edgeGeo = [];
  const N = 128;
  for (let i = 0; i < N; i++) {
    const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
    const am = (a0 + a1) / 2;
    const x0 = L.cx + Math.cos(a0) * (L.rx + 1.1), z0 = L.cz + Math.sin(a0) * (L.rz + 1.1);
    const x1 = L.cx + Math.cos(a1) * (L.rx + 1.1), z1 = L.cz + Math.sin(a1) * (L.rz + 1.1);
    const len = Math.hypot(x1 - x0, z1 - z0);
    const box = new THREE.BoxGeometry(len, 0.5, 1.9);
    box.rotateY(-Math.atan2(z1 - z0, x1 - x0));
    box.translate((x0 + x1) / 2, -0.05, (z0 + z1) / 2);
    void am;
    edgeGeo.push(box);
  }
  const edge = new THREE.Mesh(mergeGeometries(edgeGeo, false), mats.marble);
  edge.castShadow = true; edge.receiveShadow = true;
  edge.userData.noOcclude = true;
  scene.add(edge);

  return { uTime, mesh };
}

// ---- 岸雾(福海晨雾:大颗粒软雾点) ----
export function buildMist(scene) {
  const [c, ctx] = (() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const cc = cv.getContext('2d');
    const g = cc.createRadialGradient(32, 32, 2, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,248,236,0.85)');
    g.addColorStop(1, 'rgba(255,248,236,0)');
    cc.fillStyle = g; cc.fillRect(0, 0, 64, 64);
    return [cv, cc];
  })();
  const mistTex = new THREE.CanvasTexture(c);
  const L = LAYOUT.lake;
  const N = 150;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2;
    const rr = Math.random();
    pos[i * 3] = L.cx + Math.cos(a) * L.rx * 0.92 * rr;
    pos[i * 3 + 1] = 1.2 + Math.random() * 3.4;
    pos[i * 3 + 2] = L.cz + Math.sin(a) * L.rz * 0.92 * rr;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    map: mistTex, color: 0xf6efe0, size: 34, transparent: true, opacity: 0.17,
    depthWrite: false, sizeAttenuation: true,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.userData.noOcclude = true;
  scene.add(pts);
  return pts;
}

// ---- 喷泉(谐奇趣 / 海晏堂 / 大水法) ----
function makeJetTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 32;
  const cc = cv.getContext('2d');
  const g = cc.createRadialGradient(16, 16, 1, 16, 16, 16);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.55, 'rgba(214,238,255,0.5)');
  g.addColorStop(1, 'rgba(214,238,255,0)');
  cc.fillStyle = g; cc.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(cv);
}

let jetTex = null;
export function createFountain(scene, { x, y, z, count = 620, spread = 0.5, power = 7.5, size = 0.8, basin = true, mats }) {
  if (basin && mats) {
    const basinMesh = new THREE.Mesh(new THREE.CylinderGeometry(7.5, 8.2, 1.1, 28), mats.marble);
    basinMesh.position.set(x, y + 0.55, z);
    basinMesh.castShadow = true; basinMesh.receiveShadow = true;
    scene.add(basinMesh);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(7.5, 0.28, 6, 28), mats.marbleFine);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(x, y + 1.2, z);
    rim.castShadow = true;
    scene.add(rim);
  }
  if (!jetTex) jetTex = makeJetTexture();
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) resetDroplet(i);
  function resetDroplet(i) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.5;
    pos[i * 3] = x + Math.cos(a) * r;
    pos[i * 3 + 1] = y + 1.3;
    pos[i * 3 + 2] = z + Math.sin(a) * r;
    const up = power * (0.72 + Math.random() * 0.5);
    const sx = (Math.random() - 0.5) * spread;
    const sz = (Math.random() - 0.5) * spread;
    vel[i * 3] = sx; vel[i * 3 + 1] = up; vel[i * 3 + 2] = sz;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    map: jetTex, color: 0xf2faff, size, transparent: true, opacity: 0.85,
    depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  pts.userData.noOcclude = true;
  scene.add(pts);
  const surfaceY = y + 1.3;
  return {
    update(dt) {
      const p = geo.attributes.position.array;
      for (let i = 0; i < count; i++) {
        vel[i * 3 + 1] -= 9.8 * dt;
        p[i * 3] += vel[i * 3] * dt;
        p[i * 3 + 1] += vel[i * 3 + 1] * dt;
        p[i * 3 + 2] += vel[i * 3 + 2] * dt;
        if (p[i * 3 + 1] < surfaceY) resetDroplet(i);
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}

// ---- 连岛桥(石桥面 + 栏板 + 桥墩;与 config.bridges 一致) ----
export function buildBridges(scene, mats) {
  const g = new THREE.Group();
  for (const b of LAYOUT.bridges) {
    const dx = b.x1 - b.x0, dz = b.z1 - b.z0;
    const len = Math.hypot(dx, dz);
    const ang = -Math.atan2(dz, dx);
    // 桥面
    const deck = new THREE.Mesh(new THREE.BoxGeometry(len, 0.6, b.w), mats.marble);
    deck.position.set((b.x0 + b.x1) / 2, b.h - 0.3, (b.z0 + b.z1) / 2);
    deck.rotation.y = ang;
    deck.castShadow = true; deck.receiveShadow = true;
    g.add(deck);
    // 两侧栏板(望柱省略为矮墙)
    for (const sgn of [-1, 1]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(len, 0.7, 0.24), mats.marbleFine);
      rail.position.set((b.x0 + b.x1) / 2, b.h + 0.35, (b.z0 + b.z1) / 2);
      rail.rotation.y = ang;
      rail.translateZ(sgn * (b.w / 2 - 0.12));
      rail.castShadow = true;
      g.add(rail);
    }
    // 桥墩(仅当桥下水时可见)
    const piers = Math.max(2, Math.round(len / 26));
    for (let k = 1; k < piers; k++) {
      const t = k / piers;
      const px = b.x0 + dx * t, pz = b.z0 + dz * t;
      const pier = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.6, 1.6), mats.brick);
      pier.position.set(px, b.h - 3.1, pz);
      pier.rotation.y = ang;
      g.add(pier);
    }
    // 漫游:桥面行走由 groundHeight(桥面)提供;跌落水侧由湖床高差(>2.4)天然挡住
  }
  scene.add(g);
  return { group: g };
}
