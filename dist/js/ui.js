// UI:加载条 / 标题序列 / 章节卡片 / 进度点 / 地图 / 漫游 HUD / 错误屏
import { CHAPTERS, INTRO_LINES } from './chapters.js';

const $ = (sel) => document.querySelector(sel);

export function setupUI() {
  const el = {
    preloader: $('#preloader'),
    loadBar: $('#load-bar'),
    loadLabel: $('#load-label'),
    loadPct: $('#load-pct'),
    intro: $('#intro'),
    introLines: $('#intro-lines'),
    enterBtn: $('#enter-btn'),
    hud: $('#hud'),
    card: $('#chapter-card'),
    cardNum: $('#card-num'),
    cardTitle: $('#card-title'),
    cardEn: $('#card-en'),
    cardParas: $('#card-paras'),
    cardSeal: $('#card-seal'),
    dots: $('#progress-dots'),
    scrollHint: $('#scroll-hint'),
    topbar: $('#topbar'),
    mapBtn: $('#btn-map'),
    roamBtn: $('#btn-roam'),
    fsBtn: $('#btn-fs'),
    mapOverlay: $('#map-overlay'),
    mapBox: $('#map-box'),
    mapClose: $('#map-close'),
    roamHud: $('#roam-hud'),
    roamBack: $('#btn-roam-back'),
    error: $('#error-screen'),
    errorMsg: $('#error-msg'),
    fadeVeil: $('#fade-veil'),
  };

  const ui = {
    el,
    setLoading(p, label) {
      el.loadBar.style.transform = `scaleX(${p})`;
      el.loadPct.textContent = `${Math.round(p * 100)}%`;
      if (label) el.loadLabel.textContent = label;
    },
    hidePreloader() {
      el.preloader.classList.add('hide');
      setTimeout(() => (el.preloader.style.display = 'none'), 900);
    },
    // 标题序列:三行导语渐显 → 出现进入按钮
    showIntro() {
      el.intro.classList.remove('hidden');
      el.introLines.innerHTML = '';
      INTRO_LINES.forEach((line, i) => {
        const p = document.createElement('p');
        p.textContent = line;
        p.style.animationDelay = `${0.7 + i * 1.6}s`;
        el.introLines.appendChild(p);
      });
      setTimeout(() => el.enterBtn.classList.add('show'), 0.7 * 1000 + INTRO_LINES.length * 1600 + 500);
    },
    hideIntro() {
      el.intro.classList.add('hidden');
      setTimeout(() => (el.intro.style.display = 'none'), 1400);
    },
    showHud() { el.hud.classList.remove('hidden'); },
    // 章节卡片
    showChapter(i) {
      const c = CHAPTERS[i];
      el.card.classList.remove('show');
      // 重新触发过渡
      void el.card.offsetWidth;
      el.cardNum.textContent = `${c.num} · ${String(i + 1).padStart(2, '0')} / ${String(CHAPTERS.length).padStart(2, '0')}`;
      el.cardTitle.textContent = c.title;
      el.cardEn.textContent = c.en;
      el.cardSeal.textContent = c.seal || c.title[0];
      el.cardParas.innerHTML = '';
      c.paras.forEach((t) => {
        const p = document.createElement('p');
        p.textContent = t;
        el.cardParas.appendChild(p);
      });
      el.card.classList.add('show');
      this._syncDots(i);
    },
    hideChapter() { el.card.classList.remove('show'); },
    _syncDots(i) {
      [...el.dots.children].forEach((d, k) => {
        d.classList.toggle('active', k === i);
        d.classList.toggle('done', k < i);
      });
    },
    buildDots(onJump) {
      el.dots.innerHTML = '';
      CHAPTERS.forEach((c, i) => {
        const d = document.createElement('button');
        d.className = 'dot';
        d.title = `${c.num} · ${c.title}`;
        d.dataset.name = c.title;
        d.setAttribute('aria-label', d.title);
        d.addEventListener('click', () => onJump(i));
        el.dots.appendChild(d);
      });
    },
    showScrollHint() { el.scrollHint.classList.add('show'); },
    hideScrollHint() { el.scrollHint.classList.remove('show'); },
    // 地图
    toggleMap(open) {
      el.mapOverlay.classList.toggle('show', open);
    },
    // 漫游模式
    setRoamMode(on) {
      el.roamHud.classList.toggle('show', on);
      el.topbar.classList.toggle('roaming', on);
      el.roamBtn.textContent = on ? '返回导览' : '自由漫游';
    },
    showError(msg) {
      el.errorMsg.innerHTML = msg;
      el.error.classList.remove('hidden');
    },
    veil(on) { el.fadeVeil.classList.toggle('show', on); },
  };
  return ui;
}
