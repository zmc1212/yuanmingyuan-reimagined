// 后处理:bloom + 暗角 + 胶片颗粒(贯穿所有场景,呼应原版的统一融合手法)
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const GrainVignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignette: { value: 1.15 },
    uGrain: { value: 0.045 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    uniform float uGrain;
    varying vec2 vUv;
    void main() {
      vec4 col = texture2D(tDiffuse, vUv);
      // 暗角
      vec2 d = vUv - 0.5;
      float vig = smoothstep(0.92, 0.32, length(d) * uVignette * 2.0);
      col.rgb *= mix(0.62, 1.0, vig);
      // 颗粒
      float g = fract(sin(dot(vUv * (uTime + 13.7), vec2(12.9898, 78.233))) * 43758.5453);
      col.rgb += (g - 0.5) * uGrain;
      gl_FragColor = col;
    }`,
};

export function createComposer(renderer, scene, camera, quality) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  let bloom = null;
  if (quality.bloom) {
    bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.28, 0.5, 0.9);
    composer.addPass(bloom);
  }
  const grain = new ShaderPass(GrainVignetteShader);
  composer.addPass(grain);
  composer.addPass(new OutputPass());
  composer.setSize(window.innerWidth, window.innerHeight);
  return { composer, bloom, grain };
}
