// 自由漫游:指针锁定 WASD(Shift 疾跑),地面取高 + 建筑 AABB 碰撞
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { groundHeight } from './config.js';

const KEYS = {};

export class RoamController {
  constructor({ camera, dom, colliders, plainFn }) {
    this.camera = camera;
    this.dom = dom;
    this.colliders = colliders;
    this.plainFn = plainFn;
    this.enabled = false;
    this.eye = 1.8;
    this.vel = new THREE.Vector3();
    this._onLock = null;
    this._fwd = new THREE.Vector3();
    this.pointer = new PointerLockControls(camera, dom);
    this.pointer.addEventListener('lock', () => { this.enabled = true; this._emit(true); });
    this.pointer.addEventListener('unlock', () => { this.enabled = false; this._emit(false); });
    window.addEventListener('keydown', (e) => { KEYS[e.code] = true; });
    window.addEventListener('keyup', (e) => { KEYS[e.code] = false; });
  }

  onLockChange(fn) { this._onLock = fn; }
  _emit(locked) { if (this._onLock) this._onLock(locked); }

  enter(at) {
    if (at) this.camera.position.set(at[0], at[1], at[2]);
    else {
      const h = groundHeight(this.camera.position.x, this.camera.position.z, this.plainFn);
      this.camera.position.y = h + this.eye;
    }
    this.pointer.lock();
  }

  exit() { this.pointer.unlock(); }

  update(dt) {
    if (!this.enabled) return;
    const dirX = (KEYS['KeyD'] ? 1 : 0) - (KEYS['KeyA'] ? 1 : 0);
    const dirZ = (KEYS['KeyW'] ? 1 : 0) - (KEYS['KeyS'] ? 1 : 0);
    this.camera.getWorldDirection(this._fwd);
    this._fwd.y = 0;
    if (this._fwd.lengthSq() < 1e-6) this._fwd.set(0, 0, -1);
    this._fwd.normalize();
    const fx = this._fwd.x, fz = this._fwd.z;
    const rx = -fz, rz = fx;
    let vx = fx * dirZ + rx * dirX;
    let vz = fz * dirZ + rz * dirX;
    const len = Math.hypot(vx, vz);
    if (len > 0) { vx /= len; vz /= len; }
    const sp = 9 * (KEYS['ShiftLeft'] || KEYS['ShiftRight'] ? 2.1 : 1);
    const k = 1 - Math.exp(-dt * 8);
    this.vel.x += (vx * sp - this.vel.x) * k;
    this.vel.z += (vz * sp - this.vel.z) * k;

    const p = this.camera.position;
    const nx = p.x + this.vel.x * dt;
    const nz = p.z + this.vel.z * dt;
    if (!this._blocked(nx, p.z)) p.x = nx; // 分离轴滑动
    if (!this._blocked(p.x, nz)) p.z = nz;
    const r = Math.hypot(p.x, p.z);
    if (r > 900) { p.x *= 900 / r; p.z *= 900 / r; }
    const h = groundHeight(p.x, p.z, this.plainFn);
    p.y += (h + this.eye - p.y) * Math.min(1, dt * 10);
  }

  _blocked(x, z) {
    const cur = this.camera.position.y - this.eye;
    const h = groundHeight(x, z, this.plainFn);
    if (Math.abs(h - cur) > 2.4) return true; // 台缘挡墙 / 陡坎
    for (const c of this.colliders) {
      if (c.circle) {
        // 圆形墙体:{circle:[cx,cz,r0,r1], doors:[[中心角θ(0=+Z), 半宽]]}
        const [ccx, ccz, r0, r1] = c.circle;
        const d = Math.hypot(x - ccx, z - ccz);
        if (d > r0 - 0.55 && d < r1 + 0.55) {
          let pass = false;
          if (c.doors) {
            const a = Math.atan2(x - ccx, z - ccz);
            for (const [da, hw] of c.doors) {
              const diff = Math.abs(((a - da + Math.PI) % (Math.PI * 2)) - Math.PI);
              if (diff < hw) { pass = true; break; }
            }
          }
          if (!pass) return true;
        }
        continue;
      }
      if (x > c.minX - 0.6 && x < c.maxX + 0.6 && z > c.minZ - 0.6 && z < c.maxZ + 0.6) {
        return true;
      }
    }
    return false;
  }
}
