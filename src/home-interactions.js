/* Stage 1 Home interactions: delegated listeners survive app rerenders. */
import './home-refresh.css';
const slideLabels = ['Highlight 1 of 4','Highlight 2 of 4','Highlight 3 of 4','Highlight 4 of 4'];
document.addEventListener('click', event => {
  const dot = event.target.closest('[data-hero-slide]');
  if (!dot || !document.querySelector('.editorial-home')) return;
  const index = Number(dot.dataset.heroSlide);
  if (!Number.isInteger(index) || index < 0 || index > 3) return;
  document.querySelectorAll('[data-hero-slide]').forEach((button, i) => {
    const active = i === index;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', slideLabels[i]);
  });
  const art = document.querySelector('.hero-art');
  if (art) art.style.setProperty('--im-hero-slide-angle', ['-14deg','-5deg','6deg','14deg'][index]);
});
