/* Home hero carousel: dots, swipe gestures and keyboard navigation all change the actual slide. */
import './home-refresh.css';

const slides = [
  { title: 'Tools for the paperwork of life.', copy: 'Quick. Simple. Powerful.' },
  { title: 'Convert files in seconds.', copy: 'JPG, PNG, WebP and more — in a few taps.' },
  { title: 'Make every image lighter.', copy: 'Compress and resize without the complicated workflow.' },
  { title: 'Your files stay yours.', copy: 'Private, simple image tools designed for everyday tasks.' }
];
let currentSlide = 0;
let pointerStartX = null;

function showSlide(index) {
  const home = document.querySelector('.editorial-home');
  if (!home) return;
  currentSlide = (index + slides.length) % slides.length;

  const title = home.querySelector('#home-hero-title');
  const copy = home.querySelector('#home-hero-copy');
  if (title) title.textContent = slides[currentSlide].title;
  if (copy) copy.textContent = slides[currentSlide].copy;

  home.querySelectorAll('[data-hero-slide]').forEach((button, i) => {
    const active = i === currentSlide;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', `Highlight ${i + 1} of ${slides.length}`);
  });

  const art = home.querySelector('.hero-art');
  if (art) {
    art.style.setProperty('--im-hero-slide-angle', ['-14deg', '-5deg', '6deg', '14deg'][currentSlide]);
    art.dataset.slide = String(currentSlide);
  }
}

document.addEventListener('click', event => {
  const dot = event.target.closest('[data-hero-slide]');
  if (!dot || !document.querySelector('.editorial-home')) return;
  const index = Number(dot.dataset.heroSlide);
  if (Number.isInteger(index) && index >= 0 && index < slides.length) showSlide(index);
});

document.addEventListener('keydown', event => {
  const pagination = event.target.closest('.hero-pagination');
  if (!pagination) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    showSlide(currentSlide + (event.key === 'ArrowRight' ? 1 : -1));
    const buttons = [...pagination.querySelectorAll('[data-hero-slide]')];
    buttons[currentSlide]?.focus();
  }
});

document.addEventListener('pointerdown', event => {
  if (event.target.closest('.editorial-hero')) pointerStartX = event.clientX;
}, { passive: true });

document.addEventListener('pointerup', event => {
  if (pointerStartX === null) return;
  const start = pointerStartX;
  pointerStartX = null;
  const distance = event.clientX - start;
  if (Math.abs(distance) < 45 || !event.target.closest('.editorial-hero')) return;
  showSlide(currentSlide + (distance < 0 ? 1 : -1));
}, { passive: true });
