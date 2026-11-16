// 导览模式输入:滚轮 / 触摸拖动 / 方向键;进度目标值 + 阻尼平滑
// 章节边界与相机系统共用(弧长域),保证字幕、进度点、跳转与画面一致
import { CHAPTERS } from './chapters.js';

export class TourController {
  constructor({ dom, onChapterChange, getMode, tourCam }) {
    this.P = 0;
    this.target = 0;
    this.onChapterChange = onChapterChange;
    this.getMode = getMode;
    this.tourCam = tourCam;
    this.enabled = false;
    this._chapter = -1;

    dom.addEventListener('wheel', (e) => {
      if (!this.enabled) return;
      e.preventDefault();
      const k = e.deltaMode === 1 ? 18 : e.deltaMode === 2 ? 120 : 1;
      this.target = clamp(this.target + (e.deltaY * k) * 0.000075);
    }, { passive: false });

    let touchY = null;
    dom.addEventListener('touchstart', (e) => {
      if (!this.enabled) return;
      touchY = e.touches[0].clientY;
    }, { passive: true });
    dom.addEventListener('touchmove', (e) => {
      if (!this.enabled || touchY === null) return;
      const dy = touchY - e.touches[0].clientY;
      touchY = e.touches[0].clientY;
      this.target = clamp(this.target + dy * 0.00055);
      e.preventDefault();
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (!this.enabled) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') this.nextChapter(1);
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') this.nextChapter(-1);
      else if (e.key === ' ') this.target = clamp(this.target + 0.06);
    });
  }

  nextChapter(dir) {
    this.jumpToChapter(this.currentChapter() + dir);
  }

  currentChapter() {
    const B = this.tourCam.path.boundsS;
    const P = this.target;
    for (let i = 0; i < B.length; i++) if (P <= B[i][1] + 1e-9) return i;
    return B.length - 1;
  }

  jumpToChapter(i) {
    const B = this.tourCam.path.boundsS;
    const idx = Math.min(B.length - 1, Math.max(0, i));
    this.target = clamp(B[idx][0] + 0.02);
  }

  setProgress(p, instant = false) {
    this.target = clamp(p);
    if (instant) this.P = this.target;
  }

  update(dt, tourCam) {
    if (!this.enabled) return 0;
    const k = 1 - Math.exp(-dt * 3.0);
    this.P += (this.target - this.P) * k;
    if (Math.abs(this.target - this.P) < 1e-5) this.P = this.target;
    const changed = tourCam.update(this.P, dt);
    if (changed >= 0 && this._chapter !== changed) {
      this._chapter = changed;
      this.onChapterChange(changed);
    }
    return this.P;
  }
}

function clamp(v) { return Math.min(1, Math.max(0, v)); }
