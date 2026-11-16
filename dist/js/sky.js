// 天穹、太阳、雾:统一由"时间状态"驱动,可插值(夜→黎明→黄金时刻→夕阳)
import * as THREE from 'three';

const VERT = /* glsl */`
varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const FRAG = /* glsl */`
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uSunColor;
uniform vec3 uSunDir;
uniform float uSunGlow;
uniform float uStars;
varying vec3 vDir;

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.1, 0.17, 0.13));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y, -1.0, 1.0);
  float t = pow(smoothstep(-0.08, 0.62, h), 0.78);
  vec3 col = mix(uHorizon, uTop, t);

  // 太阳辉光 + 日盘
  float sd = max(dot(d, normalize(uSunDir)), 0.0);
  float glow = pow(sd, 8.0) * uSunGlow;
  float disc = smoothstep(0.9992, 0.99965, sd);
  col += uSunColor * glow * 0.85;
  col += uSunColor * disc * 2.2;

  // 星空(仅夜)
  if (uStars > 0.001 && h > 0.02) {
    vec3 cell = floor(d * 260.0);
    float s = hash(cell);
    if (s > 0.9975) {
      float tw = 0.6 + 0.4 * hash(cell + 7.31);
      col += vec3(0.9, 0.94, 1.0) * uStars * tw * smoothstep(0.02, 0.3, h);
    }
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export function createSky(scene) {
  const uniforms = {
    uTop: { value: new THREE.Color(0x86a8d8) },
    uHorizon: { value: new THREE.Color(0xf6dfb4) },
    uSunColor: { value: new THREE.Color(0xffdba8) },
    uSunDir: { value: new THREE.Vector3(0.4, 0.5, 0.2) },
    uSunGlow: { value: 0.55 },
    uStars: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, vertexShader: VERT, fragmentShader: FRAG,
    side: THREE.BackSide, depthWrite: false, fog: false,
  });
  const geo = new THREE.SphereGeometry(2600, 40, 24);
  const dome = new THREE.Mesh(geo, mat);
  dome.frustumCulled = false;
  dome.userData.noOcclude = true;
  dome.renderOrder = -10;
  scene.add(dome);

  const sun = new THREE.DirectionalLight(0xffdba8, 2.9);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const cam = sun.shadow.camera;
  cam.near = 50; cam.far = 1400;
  cam.left = -380; cam.right = 380; cam.top = 320; cam.bottom = -320;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.6;
  scene.add(sun);
  scene.add(sun.target);

  const hemi = new THREE.HemisphereLight(0xbfd0e8, 0x8a7355, 0.65);
  scene.add(hemi);
  const amb = new THREE.AmbientLight(0xffffff, 0.2);
  scene.add(amb);

  const fog = new THREE.FogExp2(0xf3e4c8, 0.00135);
  scene.fog = fog;

  return { dome, sun, hemi, amb, fog, uniforms, state: null };
}

const _c = new THREE.Color();
const _v = new THREE.Vector3();

function colTo(css) { return _c.set(css); }

function sunVec(azDeg, elDeg) {
  const az = THREE.MathUtils.degToRad(azDeg);
  const el = THREE.MathUtils.degToRad(elDeg);
  // az: 0=北(+Z),90=东(+X)
  return _v.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
}

// 线性插值两个时间状态(可复用 out 对象,但每次全量重算)
const _ca = new THREE.Color(), _cb = new THREE.Color(), _cm = new THREE.Color();
export function lerpState(a, b, t, out = {}) {
  const L = (k) => { const v = a[k] + (b[k] - a[k]) * t; out[k] = v; return v; };
  const mixCol = (k) => { out[k] = _cm.copy(_ca.set(a[k])).lerp(_cb.set(b[k]), t).getHex(); return out[k]; };
  return {
    az: L('az'), el: L('el'),
    sunColor: mixCol('sunColor'), sunIntensity: L('sunIntensity'),
    hemiSky: mixCol('hemiSky'), hemiGround: mixCol('hemiGround'),
    hemiIntensity: L('hemiIntensity'), amb: L('amb'),
    fogColor: mixCol('fogColor'), fogDensity: L('fogDensity'),
    top: mixCol('top'), horizon: mixCol('horizon'),
    sunGlow: L('sunGlow'), stars: L('stars'), exposure: L('exposure'),
  };
}

export function applyState(sky, s, renderer) {
  sky.state = s;
  const dir = sunVec(s.az, s.el);
  sky.sun.position.copy(dir).multiplyScalar(700);
  sky.sun.target.position.set(0, 10, 0);
  sky.sun.color.copy(colTo(s.sunColor));
  sky.sun.intensity = s.sunIntensity;
  sky.hemi.color.copy(colTo(s.hemiSky));
  sky.hemi.groundColor.copy(colTo(s.hemiGround));
  sky.hemi.intensity = s.hemiIntensity;
  sky.amb.intensity = s.amb;
  sky.fog.color.copy(colTo(s.fogColor));
  sky.fog.density = s.fogDensity;
  sky.uniforms.uTop.value.copy(colTo(s.top));
  sky.uniforms.uHorizon.value.copy(colTo(s.horizon));
  sky.uniforms.uSunColor.value.copy(colTo(s.sunColor));
  sky.uniforms.uSunDir.value.copy(dir);
  sky.uniforms.uSunGlow.value = s.sunGlow;
  sky.uniforms.uStars.value = s.stars;
  if (renderer) renderer.toneMappingExposure = s.exposure;
}
