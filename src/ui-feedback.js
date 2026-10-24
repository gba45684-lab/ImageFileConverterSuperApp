export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

export function showToast(message, type = 'success', duration = 3200) {
  const container = document.querySelector('#imagemate-toast-container') || (() => {
    const el = document.createElement('div');
    el.id = 'imagemate-toast-container';
    el.className = 'imagemate-toast-container';
    document.body.appendChild(el);
    return el;
  })();

  const toast = document.createElement('div');
  toast.className = `imagemate-toast imagemate-toast-${type}`;
  const iconMap = {
    success: '✓',
    error: '!',
    info: 'i',
    warning: '⚠'
  };

  toast.innerHTML = `
    <span class="imagemate-toast__icon">${iconMap[type] || 'i'}</span>
    <span class="imagemate-toast__text">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));

  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 180);
  }, duration);
}

export function confirmAction(message, onConfirm, onCancel = () => {}) {
  if (typeof window.confirm === 'function') {
    if (window.confirm(message)) {
      onConfirm();
    } else {
      onCancel();
    }
    return;
  }

  onConfirm();
}

export function showSkeleton(parentElement, count = 3) {
  if (!parentElement) return;
  parentElement.innerHTML = '';
  for (let i = 0; i < count; i += 1) {
    const block = document.createElement('div');
    block.className = 'imagemate-skeleton';
    block.style.height = i % 2 === 0 ? '16px' : '36px';
    parentElement.appendChild(block);
  }
}

export function initUiFeedback() {
  document.querySelectorAll('.primary, .secondary, .nav-btn, .catalog-tool-row, .editorial-tool, .settings-card .settings-action, .download-item button, .file-row .remove').forEach((button) => {
    if (!button.dataset.uiFeedbackBound) {
      button.dataset.uiFeedbackBound = 'true';
      button.addEventListener('pointerdown', () => button.classList.add('is-pressed'));
      button.addEventListener('pointerup', () => button.classList.remove('is-pressed'));
      button.addEventListener('pointerleave', () => button.classList.remove('is-pressed'));
      button.addEventListener('pointercancel', () => button.classList.remove('is-pressed'));
    }
  });
}
