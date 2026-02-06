/* Malleable Reader v1.0 */
(function() {
  let current = 0;
  const pages = document.querySelectorAll('.m-page');
  const bars = document.querySelectorAll('.m-bar');
  const total = pages.length;

  function show(idx) {
    if (idx < 0 || idx >= total) return;
    pages[current].classList.remove('active');
    current = idx;
    pages[current].classList.add('active');
    bars.forEach((b, i) => {
      b.classList.toggle('visited', i < current);
      b.classList.toggle('active', i === current);
    });
    // Pause/play videos
    pages.forEach((p, i) => {
      const v = p.querySelector('video');
      if (v) { i === current ? v.play().catch(() => {}) : v.pause(); }
    });
  }

  // Tap navigation
  document.querySelector('.m-tap--next')?.addEventListener('click', () => show(current + 1));
  document.querySelector('.m-tap--prev')?.addEventListener('click', () => show(current - 1));

  // Keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); show(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
  });

  // Swipe
  let startX = 0;
  document.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 50) { dx < 0 ? show(current + 1) : show(current - 1); }
  });

  // Init
  show(0);
})();
