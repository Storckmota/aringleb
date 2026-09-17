(() => {
  const back = document.querySelector('[data-safe-back]');
  if (!back || !document.referrer) return;
  try {
    const referrer = new URL(document.referrer);
    if (referrer.origin !== location.origin || !/^\/(?:press|insights)\//.test(referrer.pathname)) return;
    back.addEventListener('click', event => {
      event.preventDefault();
      history.back();
    });
  } catch { /* the real href remains the fallback */ }
})();
