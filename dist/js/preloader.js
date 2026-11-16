// Preloader:分帧构建场景(真实进度)+ 夜转日过渡(复刻原版手法)
import { lerpState, applyState } from './sky.js';
import { DAY_STATES } from './config.js';

export class Preloader {
  constructor({ sky, renderer, ui }) {
    this.sky = sky;
    this.renderer = renderer;
    this.ui = ui;
    this.steps = [];
    this.done = false;
    this.progress = 0;
    this._state = null;
    // 初始:夜景
    applyState(sky, DAY_STATES.night, renderer);
  }

  add(label, fn) { this.steps.push({ label, fn }); return this; }

  // 分帧执行;每帧渲染一帧夜景渐亮的场景
  run(renderFrame, onDone) {
    let i = 0;
    const total = this.steps.length;
    const tick = () => {
      if (i < total) {
        const step = this.steps[i];
        try {
          step.fn();
        } catch (err) {
          console.error(`[构建失败] ${step.label}`, err);
          throw err;
        }
        i++;
        this.progress = i / total;
        this.ui.setLoading(this.progress, step.label);
        // 夜 → 黎明(随进度)
        this._state = lerpState(DAY_STATES.night, DAY_STATES.dawn, easeOutCubic(this.progress), this._state || {});
        applyState(this.sky, this._state, this.renderer);
        renderFrame();
        requestAnimationFrame(tick);
      } else {
        this.done = true;
        onDone();
      }
    };
    requestAnimationFrame(tick);
  }
}

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
