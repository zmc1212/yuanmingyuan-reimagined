// 程序化 canvas 纹理(圆明园材质:灰瓦 / 朱红 / 汉白玉 / 巴洛克石灰岩 / 园林草地 / 铜兽首)
import * as THREE from 'three';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function tex(c, { repeat = 1 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function speckle(ctx, w, h, rnd, n, amp) {
  for (let i = 0; i < n; i++) {
    const x = rnd() * w, y = rnd() * h, s = 1 + rnd() * 2;
    const v = (rnd() - 0.5) * amp;
    ctx.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v)})`;
    ctx.fillRect(x, y, s, s);
  }
}

function shade(hex, l) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(l);
  return '#' + c.getHexString();
}

// 灰瓦(筒瓦垄条纹;园林建筑多为灰瓦合瓦)
export function tileGreyTexture({ size = 256, seed = 3, base = '#6e6e68' } = {}) {
  const [c, ctx] = canvas(size, size);
  const rnd = mulberry32(seed);
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  const ridges = 16, rw = size / ridges;
  for (let i = 0; i < ridges; i++) {
    ctx.fillStyle = shade(base, 1.3);
    ctx.fillRect(i * rw + rw * 0.18, 0, rw * 0.28, size);
    ctx.fillStyle = shade(base, 0.68);
    ctx.fillRect(i * rw + rw * 0.74, 0, rw * 0.26, size);
  }
  ctx.globalAlpha = 0.16;
  for (let y = 0; y < size; y += 22) {
    ctx.fillStyle = '#2c2c28';
    ctx.fillRect(0, y, size, 2.4);
  }
  ctx.globalAlpha = 1;
  speckle(ctx, size, size, rnd, 900, 0.08);
  return tex(c);
}

// 琉璃瓦(少量黄琉璃:寝宫/宫门屋脊)
export function glazeGoldTexture({ size = 128, seed = 5, base = '#c89038' } = {}) {
  const [c, ctx] = canvas(size, size);
  const rnd = mulberry32(seed);
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  const ridges = 10, rw = size / ridges;
  for (let i = 0; i < ridges; i++) {
    ctx.fillStyle = shade(base, 1.24);
    ctx.fillRect(i * rw + rw * 0.15, 0, rw * 0.3, size);
    ctx.fillStyle = shade(base, 0.72);
    ctx.fillRect(i * rw + rw * 0.72, 0, rw * 0.28, size);
  }
  speckle(ctx, size, size, rnd, 300, 0.08);
  return tex(c);
}

// 朱红大漆(柱 / 门)
export function redPaintTexture({ size = 128, seed = 17, base = '#a83a28' } = {}) {
  const [c, ctx] = canvas(size, size);
  const rnd = mulberry32(seed);
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 46; i++) {
    const x = rnd() * size;
    ctx.globalAlpha = 0.05 + rnd() * 0.1;
    ctx.fillStyle = rnd() > 0.5 ? '#b8482e' : '#6e1a12';
    ctx.fillRect(x, 0, 1 + rnd() * 3, size);
  }
  ctx.globalAlpha = 1;
  speckle(ctx, size, size, rnd, 300, 0.06);
  return tex(c);
}

// 汉白玉(台基 / 桥)
export function marbleTexture({ size = 256, seed = 31, base = '#e8e2d0', vein = '#aaa290' } = {}) {
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  const rnd = mulberry32(seed);
  ctx.strokeStyle = vein; ctx.lineWidth = 1;
  for (let i = 0; i < 30; i++) {
    ctx.globalAlpha = 0.05 + rnd() * 0.1;
    ctx.beginPath();
    let x = rnd() * size, y = 0;
    ctx.moveTo(x, y);
    while (y < size) { y += 8 + rnd() * 14; x += (rnd() - 0.5) * 20; ctx.lineTo(x, y); }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#968e7a'; ctx.lineWidth = 1.6;
  for (let i = 0; i <= 4; i++) {
    ctx.beginPath(); ctx.moveTo(0, i * size / 4); ctx.lineTo(size, i * size / 4); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  speckle(ctx, size, size, rnd, 700, 0.06);
  return tex(c);
}

// 巴洛克石灰岩(西洋楼:奶油色砌块 + 拱肋)
export function baroqueStoneTexture({ size = 256, seed = 71, base = '#d8c9a8' } = {}) {
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  const rnd = mulberry32(seed);
  // 大砌块(横缝 + 竖缝错缝)
  const rows = 6, bh = size / rows;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * bh * 0.9;
    for (let i = -1; i < rows; i++) {
      const l = 0.92 + rnd() * 0.18;
      ctx.fillStyle = shade(base, l);
      ctx.fillRect(i * bh * 1.9 + off + 1.5, r * bh + 1.5, bh * 1.9 - 3, bh - 3);
    }
  }
  // 雨蚀竖纹
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 26; i++) {
    const x = rnd() * size;
    ctx.fillStyle = '#8a7a5c';
    ctx.fillRect(x, rnd() * size * 0.4, 1.5 + rnd() * 2, size * (0.2 + rnd() * 0.5));
  }
  ctx.globalAlpha = 1;
  speckle(ctx, size, size, rnd, 800, 0.07);
  return tex(c);
}

// 青砖(宫墙 / 甬道)
export function brickTexture({ size = 256, seed = 41, base = '#877e6e', mortar = '#635c4e', rows = 10 } = {}) {
  const [c, ctx] = canvas(size, size);
  ctx.fillStyle = mortar; ctx.fillRect(0, 0, size, size);
  const rnd = mulberry32(seed);
  const bh = size / rows, cols = 6;
  for (let r = 0; r < rows; r++) {
    const off = (r % 2) * (size / cols / 2);
    for (let i = -1; i < cols; i++) {
      const bw = size / cols;
      const l = 0.94 + rnd() * 0.16;
      ctx.fillStyle = shade(base, l);
      ctx.fillRect(i * bw + off + 1, r * bh + 1, bw - 2, bh - 2);
    }
  }
  speckle(ctx, size, size, rnd, 1100, 0.1);
  return tex(c);
}

// 园林草地(灰绿 + 苔斑,镜像平铺)
export function gardenTexture({ size = 256, seed = 23 } = {}) {
  const [c, ctx] = canvas(size, size);
  const rnd = mulberry32(seed);
  ctx.fillStyle = '#8e9068'; ctx.fillRect(0, 0, size, size);
  const tones = ['#989a70', '#82845e', '#a4a678', '#748058', '#a09e6e', '#8a9462'];
  for (let i = 0; i < 380; i++) {
    ctx.fillStyle = tones[(rnd() * tones.length) | 0];
    ctx.globalAlpha = 0.12 + rnd() * 0.16;
    ctx.beginPath();
    ctx.ellipse(rnd() * size, rnd() * size, 5 + rnd() * 26, 3 + rnd() * 14, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  speckle(ctx, size, size, rnd, 1200, 0.09);
  const t = tex(c, { repeat: 40 });
  t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
  return t;
}

// 湖水底色(暖玉色,配 water.js 涟漪)
export function waterTexture({ size = 128, seed = 83 } = {}) {
  const [c, ctx] = canvas(size, size);
  const rnd = mulberry32(seed);
  const g = ctx.createLinearGradient(0, 0, size, size);
  g.addColorStop(0, '#4a7263');
  g.addColorStop(1, '#3a5e52');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  ctx.globalAlpha = 0.14;
  for (let i = 0; i < 60; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#6a9478' : '#2c5044';
    ctx.fillRect(rnd() * size, rnd() * size, 10 + rnd() * 40, 1.5);
  }
  ctx.globalAlpha = 1;
  speckle(ctx, size, size, rnd, 200, 0.05);
  return tex(c, { repeat: 8 });
}

// 铜兽首(青铜绿锈 + 高光斑)
export function bronzeTexture({ size = 128, seed = 91 } = {}) {
  const [c, ctx] = canvas(size, size);
  const rnd = mulberry32(seed);
  const g = ctx.createLinearGradient(0, 0, 0, size);
  g.addColorStop(0, '#7c8a6e');
  g.addColorStop(0.5, '#5e6e56');
  g.addColorStop(1, '#44503c');
  ctx.fillStyle = g; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 40; i++) {
    ctx.fillStyle = rnd() > 0.5 ? '#8a9a7c' : '#3c4834';
    ctx.globalAlpha = 0.14 + rnd() * 0.2;
    ctx.beginPath();
    ctx.ellipse(rnd() * size, rnd() * size, 4 + rnd() * 16, 3 + rnd() * 10, rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  speckle(ctx, size, size, rnd, 400, 0.08);
  return tex(c);
}

// 剧画青绿(廊彩画示意)
export function dougongTexture({ size = 128, seed = 51 } = {}) {
  const [c, ctx] = canvas(size, size);
  const rnd = mulberry32(seed);
  ctx.fillStyle = '#14352c'; ctx.fillRect(0, 0, size, size);
  const n = 8, w = size / n;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? '#1e4e3e' : '#102e28';
    ctx.fillRect(i * w + 2, 6, w - 4, size - 20);
    ctx.fillStyle = '#c8a25e';
    ctx.globalAlpha = 0.45;
    ctx.fillRect(i * w + w * 0.36, 10, 3, size - 28);
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#8a6a2f';
  ctx.fillRect(0, size - 14, size, 14);
  speckle(ctx, size, size, rnd, 200, 0.08);
  return tex(c);
}

// 金箍(柱顶 / 宝顶)
export function goldBandTexture({ size = 64, seed = 61 } = {}) {
  const [c, ctx] = canvas(size, size);
  const rnd = mulberry32(seed);
  ctx.fillStyle = '#c8a25e'; ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#9a7434';
  for (let y = 0; y < size; y += 12) ctx.fillRect(0, y, size, 4);
  speckle(ctx, size, size, rnd, 160, 0.1);
  return tex(c);
}

// 共享材质集
export function makeMaterials() {
  const tileGrey = tileGreyTexture();
  const glazeGold = glazeGoldTexture();
  const redPaint = redPaintTexture();
  const marble = marbleTexture();
  const baroque = baroqueStoneTexture();
  const brick = brickTexture();
  const brickWallTex = brickTexture({ size: 256, seed: 41, rows: 10 });
  brickWallTex.repeat.set(8, 2.6);
  const garden = gardenTexture();
  const water = waterTexture();
  const bronze = bronzeTexture();
  const dougong = dougongTexture();
  const goldBand = goldBandTexture();
  const std = (map, opts = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.9, metalness: 0.0, ...opts });
  const mat = (key, opts = {}) => {
    const m = std(key, opts);
    m.side = THREE.DoubleSide;
    return m;
  };
  return {
    tileGrey: mat(tileGrey, { roughness: 0.62 }),
    glazeGold: mat(glazeGold, { roughness: 0.4, metalness: 0.06 }),
    redPaint: mat(redPaint, { roughness: 0.5 }),
    marble: std(marble, { roughness: 0.62 }),
    marbleFine: std(marble.clone(), { roughness: 0.5 }),
    baroque: std(baroque, { roughness: 0.72 }),
    baroqueFine: std(baroque.clone(), { roughness: 0.6 }),
    brick: std(brick, { roughness: 0.95 }),
    brickWall: std(brickWallTex, { roughness: 0.95 }),
    garden: std(garden, { vertexColors: true }),
    water: std(water, { roughness: 0.13, metalness: 0.2 }),
    bronze: std(bronze, { roughness: 0.45, metalness: 0.55 }),
    dougong: mat(dougong, { roughness: 0.75 }),
    gold: mat(goldBand, { roughness: 0.35, metalness: 0.5 }),
    goldTrim: new THREE.MeshStandardMaterial({ color: 0xc8a25e, roughness: 0.35, metalness: 0.55 }),
    bark: new THREE.MeshStandardMaterial({ color: 0x54463a, roughness: 1 }),
    willow: new THREE.MeshStandardMaterial({ color: 0x7c9048, roughness: 1 }),
    pine: new THREE.MeshStandardMaterial({ color: 0x36543c, roughness: 1 }),
    shrub: new THREE.MeshStandardMaterial({ color: 0x647044, roughness: 1 }),
    rock: new THREE.MeshStandardMaterial({ color: 0x8a8276, roughness: 1 }),
  };
}
