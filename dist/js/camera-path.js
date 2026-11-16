// 相机导览 v2:轨道摄影机模型(对标原版连续性)
// - 位置:全章节关键帧链成一条 CatmullRom(centripetal) 曲线,按弧长均匀推进(恒速,无接缝变速)
// - 驻留:速度权重在每章中段形成平滑"鼓包",滚动进度 P → 弧长 s 的映射单调且 C1 连续
// - 视线:look = mix(路径前视点, 章节兴趣点 POI, w)——沿路平滑,到驻留点才转头看向主体,章间零甩头
// - 救援:地形贴地下限 + 碰撞体水平推出(兜底,正常关键帧不应触发)
import * as THREE from 'three';
import { CHAPTERS } from './chapters.js';
import { lerpState } from './sky.js';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);

export function buildTourPath() {
  // 位置曲线
  const posPts = CHAPTERS.flatMap((c) => c.kfs.map((kf) => new THREE.Vector3(...kf.p)));
  const posCurve = new THREE.CatmullRomCurve3(posPts, false, 'centripetal');
  posCurve.arcLengthDivisions = 800;
  const totalLen = posCurve.getLength();

  // 章节 → 弧长边界:精细采样,定位每个关键帧的真实弧长分数
  const K = posPts.length;
  const U = 800;
  const arcPts = [];
  for (let i = 0; i <= U; i++) arcPts.push(posCurve.getPointAt(i / U));
  const knotArc = [];
  let cursor = 0;
  for (let k = 0; k < K; k++) {
    let best = cursor, bestD = Infinity;
    for (let i = cursor; i <= U; i++) {
      const d = arcPts[i].distanceToSquared(posPts[k]);
      if (d < bestD) { bestD = d; best = i; }
    }
    knotArc.push(best / U);
    cursor = best;
  }
  const boundsS = []; // 每章 [s0, s1],s = 弧长分数
  let knot = 0;
  CHAPTERS.forEach((c) => {
    const s0 = knotArc[knot];
    knot += c.kfs.length;
    boundsS.push([s0, knotArc[knot - 1]]);
  });

  // 章节转头时机(弧长域):poiAt ∈ (0,1],默认 0.42;POI 与驻留窗口都以它为中心
  const midsS = boundsS.map(([a, b], i) => a + (b - a) * (CHAPTERS[i].poiAt ?? 0.42));
  const pois = CHAPTERS.map((c) => new THREE.Vector3(...(c.poi || c.kfs[0].p)));

  // 驻留权重(弧长域):每章中部一个平滑鼓包 → 相机在 POI 处放慢
  const halfW = boundsS.map(([a, b]) => (b - a) * 0.30);
  const dwellW = (s) => {
    let w = 1;
    for (let i = 0; i < boundsS.length; i++) {
      const d = Math.abs(s - midsS[i]) / Math.max(halfW[i], 1e-5);
      if (d < 1) w += 1.5 * Math.pow(0.5 + 0.5 * Math.cos(d * Math.PI), 2);
    }
    return w;
  };

  // P → s:ds/dP = 1/dwellW,数值积分(单调、C1)
  const NS = 2048;
  const raw = new Float64Array(NS + 1);
  const step = 1 / NS;
  for (let i = 0; i < NS; i++) {
    const s = Math.min(1, raw[i]);
    raw[i + 1] = raw[i] + (step / dwellW(s)) * (1 + 1e-9);
  }
  // 归一化:P∈[0,1] 均匀铺满整条弧长(否则后期章节被挤进末尾几个百分点)
  const norm = raw[NS] || 1;
  const sAtP = new Float64Array(NS + 1);
  for (let i = 0; i <= NS; i++) sAtP[i] = Math.min(1, raw[i] / norm);
  const P2s = (P) => {
    const x = clamp01(P) * NS;
    const i = Math.min(NS - 1, Math.floor(x));
    return sAtP[i] + (sAtP[i + 1] - sAtP[i]) * (x - i);
  };

  // 章节中点对应的 P 值(QA:chapterProgress)
  const midP = [];
  for (let i = 0; i < NS && midP.length < midsS.length; ) {
    // 找 sAtP 越过 midsS[i] 的 P
    while (i < NS && sAtP[i] < midsS[midP.length]) i++;
    midP.push(i / NS);
  }

  // FOV 连续曲线:以章节中点为控制点的一维 CatmullRom
  const fovPts = CHAPTERS.map((c) => c.fov ?? 55);
  const fovCurve = new THREE.CatmullRomCurve3(
    fovPts.map((f, i) => new THREE.Vector3(midsS[i], f, 0)),
    false,
    'catmullrom',
    0.5,
  );
  const fovAt = (s) => {
    const f = new THREE.Vector3();
    fovCurve.getPoint(clamp01(s), f);
    return f.y;
  };

  // POI 权重(弧长域):章节中部平滑抬升
  const poiW = (s) => {
    for (let i = 0; i < boundsS.length; i++) {
      const [a, b] = boundsS[i];
      const c = midsS[i];
      const half = (b - a) * 0.30;
      const d = Math.abs(s - c) / Math.max(half, 1e-5);
      if (d < 1) return Math.pow(0.5 + 0.5 * Math.cos(d * Math.PI), 1.6);
    }
    return 0;
  };
  const chapterAtS = (s) => {
    for (let i = 0; i < boundsS.length; i++) if (s <= boundsS[i][1] + 1e-9) return i;
    return boundsS.length - 1;
  };

  return { posCurve, boundsS, midsS, pois, fovAt, poiW, chapterAtS, P2s, totalLen, midP, knotArc };
}

const _pos = new THREE.Vector3();
const _look = new THREE.Vector3();
const _ahead = new THREE.Vector3();
const _side = new THREE.Vector3();
const _UP = new THREE.Vector3(0, 1, 0);

export class TourCamera {
  // opts: { groundHeight, colliders }
  constructor(path, camera, opts = {}) {
    this.path = path;
    this.camera = camera;
    this.chapterIndex = 0;
    this.state = null;
    this.t = 0;
    this.leadArc = 0.018; // 前视距离(弧长分数)
    this.groundHeight = opts.groundHeight || null;
    this.colliders = opts.colliders || [];
  }

  chapterAt(P) {
    const s = this.path.P2s(P);
    return this.path.chapterAtS(s);
  }

  progressOfChapter(i) {
    const [a] = this.path.boundsS[i];
    return a + 1e-4;
  }

  // 纯采样:返回 {pos, look, fov, chapterIndex};不触碰相机
  sample(P, t = this.t) {
    const { posCurve, P2s, pois, poiW, fovAt, chapterAtS, boundsS } = this.path;
    const s = P2s(P);
    const idx = chapterAtS(s);

    posCurve.getPointAt(clamp01(s), _pos);
    // 前视点(沿路径前方)
    posCurve.getPointAt(clamp01(s + this.leadArc), _ahead);
    // 兴趣点
    const poi = pois[idx];
    const w = poiW(s);

    _look.copy(_ahead).lerp(poi, w);
    const aheadOut = _ahead.clone();

    // 轻微手持感(POI 驻留时更明显,快速移动时收敛)
    const swayAmp = 0.22 + 0.18 * w;
    _side.subVectors(_look, _pos).cross(_UP).normalize();
    _pos.addScaledVector(_side, Math.sin(t * 0.31) * swayAmp * 0.35);
    _pos.y += Math.sin(t * 0.47) * swayAmp * 0.16;
    _look.addScaledVector(_UP, Math.sin(t * 0.23) * 0.3);

    // 救援:贴地下限
    if (this.groundHeight) {
      const gh = this.groundHeight(_pos.x, _pos.z);
      const minY = gh + 1.5;
      if (_pos.y < minY) _pos.y = minY;
    }
    // 救援:碰撞体水平推出
    this._pushOut(_pos);

    const ch = CHAPTERS[idx];
    const wOut = poiW(s);
    const fov = fovAt(s);

    // 光照状态:章间插值
    const prev = CHAPTERS[Math.max(0, idx - 1)].day;
    const cur = ch.day;
    const [a, b] = boundsS[idx];
    const tl = clamp01((s - a) / Math.max(b - a, 1e-6));
    const tDay = idx === 0 ? Math.min(1, tl * 2) : THREE.MathUtils.smoothstep(tl, 0.15, 0.9);
    const state = lerpState(prev, cur, tDay, this.state || {});

    return { pos: _pos.clone(), look: _look.clone(), ahead: aheadOut, fov, state, chapterIndex: idx, tl, poiW: wOut };
  }

  _pushOut(p) {
    // 只推"薄墙"(厚度 < 3.4m:院墙/门洞墙)——厚建筑体块不参与,
    // 巡游相机穿门洞、越矮墙由关键帧保证,地面由贴地下限保证。
    const y = p.y;
    for (const c of this.colliders) {
      if (c.circle) {
        if (c.circle[3] - c.circle[2] >= 3.4) continue;
        const [cx, cz, r0, r1] = c.circle;
        const d = Math.hypot(p.x - cx, p.z - cz);
        if (d > r0 - 0.9 && d < r1 + 0.9) {
          const target = d < (r0 + r1) / 2 ? r0 - 1.0 : r1 + 1.0;
          const k = target / Math.max(d, 1e-4);
          p.x = cx + (p.x - cx) * k;
          p.z = cz + (p.z - cz) * k;
        }
        continue;
      }
      const w = Math.min(c.maxX - c.minX, c.maxZ - c.minZ);
      if (w >= 3.4) continue;
      const e = 0.9;
      if (p.x > c.minX - e && p.x < c.maxX + e && p.z > c.minZ - e && p.z < c.maxZ + e) {
        const pushX = Math.min(p.x - (c.minX - e), (c.maxX + e) - p.x);
        const pushZ = Math.min(p.z - (c.minZ - e), (c.maxZ + e) - p.z);
        if (pushX <= pushZ) p.x += (p.x - (c.minX + c.maxX) / 2 >= 0 ? pushX : -pushX);
        else p.z += (p.z - (c.minZ + c.maxZ) / 2 >= 0 ? pushZ : -pushZ);
      }
    }
  }

  update(P, dt) {
    this.t += dt;
    const r = this.sample(P);
    const cam = this.camera;
    cam.position.copy(r.pos);
    cam.up.set(0, 1, 0);
    cam.lookAt(r.look);
    cam.fov = r.fov;
    cam.updateProjectionMatrix();
    this.state = r.state;
    if (r.chapterIndex !== this.chapterIndex) {
      this.chapterIndex = r.chapterIndex;
      return r.chapterIndex;
    }
    return -1;
  }
}
