/* ImageMate home carousel: animated transitions, autoplay, touch/pointer swipes, and persistent settings. */
import './home-refresh.css';

const slides = [
  { title: 'Tools for the paperwork of life.', copy: 'Quick. Simple. Powerful.' },
  { title: 'Convert files in seconds.', copy: 'JPG, PNG, WebP and more — in a few taps.' },
  { title: 'Make every image lighter.', copy: 'Compress and resize without the complicated workflow.' },
  { title: 'Your files stay yours.', copy: 'Private, simple image tools designed for everyday tasks.' }
];
const AUTOPLAY_MS = 4500;
const SWIPE_THRESHOLD = 36;
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const enabled = key => localStorage.getItem(key) !== '0';
let currentSlide = 0;
let pointerStart = null;
let touchStart = null;
let lastInteractionAt = 0;

function syncPreferences() {
  document.documentElement.classList.toggle('im-slider-animations-off', !enabled('imagemate-slider-animations') || reduceMotion());
  document.documentElement.classList.toggle('im-slider-autoplay-off', !enabled('imagemate-slider-autoplay'));
}

function showSlide(index, source = 'manual') {
  const home = document.querySelector('.editorial-home');
  if (!home) return;
  const next = (index + slides.length) % slides.length;
  const changed = next !== currentSlide;
  currentSlide = next;

  const title = home.querySelector('#home-hero-title');
  const copy = home.querySelector('#home-hero-copy');
  const art = home.querySelector('.hero-art');
  const animate = enabled('imagemate-slider-animations') && !reduceMotion() && changed;

  if (animate) {
    [title, copy, art].filter(Boolean).forEach(el => {
      el.classList.remove('im-slide-enter');
      void el.offsetWidth;
      el.classList.add('im-slide-enter');
    });
  }
  if (title) title.textContent = slides[currentSlide].title;
  if (copy) copy.textContent = slides[currentSlide].copy;

  home.querySelectorAll('[data-hero-slide]').forEach((button, i) => {
    const active = i === currentSlide;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', `Highlight ${i + 1} of ${slides.length}`);
  });
  if (art) {
    art.style.setProperty('--im-hero-slide-angle', ['-14deg', '-5deg', '6deg', '14deg'][currentSlide]);
    art.dataset.slide = String(currentSlide);
  }
  home.dataset.activeSlide = String(currentSlide);
  if (source !== 'auto') lastInteractionAt = Date.now();
}

function moveBySwipe(deltaX, deltaY) {
  if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) <= Math.abs(deltaY) * 1.1) return;
  showSlide(currentSlide + (deltaX < 0 ? 1 : -1), 'swipe');
}

document.addEventListener('click', event => {
  const dot = event.target.closest('[data-hero-slide]');
  if (!dot || !document.querySelector('.editorial-home')) return;
  const index = Number(dot.dataset.heroSlide);
  if (Number.isInteger(index) && index >= 0 && index < slides.length) showSlide(index);
});

document.addEventListener('keydown', event => {
  if (!event.target.closest('.hero-pagination')) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    showSlide(currentSlide + (event.key === 'ArrowRight' ? 1 : -1));
    document.querySelectorAll('.hero-pagination [data-hero-slide]')[currentSlide]?.focus();
  }
});

document.addEventListener('pointerdown', event => {
  const hero = event.target.closest('.editorial-hero');
  if (!hero || (event.pointerType === 'mouse' && event.button !== 0)) return;
  pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
}, { passive: true });
document.addEventListener('pointerup', event => {
  if (!pointerStart || event.pointerId !== pointerStart.id) return;
  const start = pointerStart; pointerStart = null;
  moveBySwipe(event.clientX - start.x, event.clientY - start.y);
}, { passive: true });
document.addEventListener('pointercancel', () => { pointerStart = null; }, { passive: true });

document.addEventListener('touchstart', event => {
  const hero = event.target.closest('.editorial-hero');
  const touch = event.changedTouches?.[0];
  if (hero && touch) touchStart = { x: touch.clientX, y: touch.clientY };
}, { passive: true });
document.addEventListener('touchend', event => {
  if (!touchStart) return;
  const start = touchStart; touchStart = null;
  const touch = event.changedTouches?.[0];
  if (touch) moveBySwipe(touch.clientX - start.x, touch.clientY - start.y);
}, { passive: true });
document.addEventListener('touchcancel', () => { touchStart = null; }, { passive: true });

function prepareHero() {
  document.querySelectorAll('.editorial-hero').forEach(hero => { hero.style.touchAction = 'pan-y'; });
}
new MutationObserver(prepareHero).observe(document.documentElement, { childList: true, subtree: true });
prepareHero();
syncPreferences();
window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', syncPreferences);

window.setInterval(() => {
  syncPreferences();
  if (!enabled('imagemate-slider-autoplay') || !document.querySelector('.editorial-home') || document.hidden) return;
  if (Date.now() - lastInteractionAt < 1200) return;
  showSlide(currentSlide + 1, 'auto');
}, AUTOPLAY_MS);
