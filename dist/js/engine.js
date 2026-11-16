// 渲染引擎:renderer / composer / 画质自适应 / 主循环
import * as THREE from 'three';
import { CFG } from './config.js';
import { createComposer } from './postfx.js';

export function createEngine(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(CFG.camera.fov, window.innerWidth / window.innerHeight, CFG.camera.near, CFG.camera.far);

  const engine = {
    renderer, scene, camera,
    composer: null, bloom: null, grain: null,
    tier: 'high',
    clock: new THREE.Clock(),
    updateFns: [],
    onFrame: null,
    _fps: [], _fpsWindow: 0,
  };

  engine.setQuality = (tier) => {
    const q = CFG.quality[tier];
    engine.tier = tier;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, q.pixelRatioCap));
    renderer.shadowMap.enabled = q.shadows;
    if (engine.sun) engine.sun.castShadow = q.shadows;
    if (engine.sun && q.shadows) engine.sun.shadow.mapSize.set(q.shadowMap, q.shadowMap);
    // bloom 开关需重建 composer
    const fx = createComposer(renderer, scene, camera, q);
    engine.composer = fx.composer;
    engine.bloom = fx.bloom;
    engine.grain = fx.grain;
    engine.renderer.shadowMap.needsUpdate = true;
  };

  engine.setQuality('high');

  engine.render = () => {
    if (engine.grain) engine.grain.uniforms.uTime.value = engine.clock.elapsedTime % 97;
    engine.composer.render();
  };

  engine.loop = () => {
    requestAnimationFrame(engine.loop);
    const dt = Math.min(engine.clock.getDelta(), 0.1);
    for (const fn of engine.updateFns) fn(dt);
    if (engine.onFrame) engine.onFrame(dt);
    engine.render();
    // FPS 采样 → 画质自适应
    engine._fps.push(1 / Math.max(dt, 1e-4));
    engine._fpsWindow += dt;
    if (engine._fpsWindow > 3) {
      const avg = engine._fps.reduce((a, b) => a + b, 0) / engine._fps.length;
      engine._fps.length = 0;
      engine._fpsWindow = 0;
      if (avg < 30 && engine.tier !== 'low') engine.setQuality(engine.tier === 'high' ? 'mid' : 'low');
      else if (avg > 55 && engine.tier === 'mid') engine.setQuality('high');
    }
  };

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (engine.composer) engine.composer.setSize(window.innerWidth, window.innerHeight);
  });
  renderer.setSize(window.innerWidth, window.innerHeight);

  return engine;
}
