/* The four houses open as a fullscreen slide over the page.

   Opening and closing are interface state and nothing else: no hash, no
   pushState, no route, no scrollIntoView, no smooth scroll, no reload. The
   page underneath is frozen at the exact scrollY it was on when the case
   opened, and closing puts it back on that same pixel, so the reader
   returns to the Cases row where they left it. The one animation is the
   panel arriving from the right and leaving the same way.

   A /#case=<id> address still opens its case on load, so links published
   before this change keep working; nothing written afterwards creates one. */
(() => {
  const layer = document.querySelector('[data-case-layer]');
  const cases = document.getElementById('cases');
  if (!layer || !cases) return;

  const panels = new Map([...layer.querySelectorAll('[data-case-panel]')].map(panel => [panel.dataset.casePanel, panel]));
  const openers = new Map([...document.querySelectorAll('[data-case-open]')].map(opener => [opener.dataset.caseOpen, opener]));
  const root = document.documentElement;
  const body = document.body;
  let active = null;
  let lastFocus = null;
  let lockedAt = 0;

  for (const panel of panels.values()) panel.hidden = true;

  const focusables = panel => [...panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(el => !el.hidden);

  /* The page is pinned where it stands. Taking the body out of flow is what
     stops the document behind the panel from moving at all — including on
     touch, where overflow:hidden alone is not enough. */
  const lockPage = () => {
    lockedAt = window.scrollY;
    const gap = window.innerWidth - root.clientWidth;
    body.style.position = 'fixed';
    body.style.top = `-${lockedAt}px`;
    body.style.width = '100%';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
  };

  /* Releasing the body drops the document back to the top, so the stored
     offset has to be put back in the same frame. The root no longer
     carries scroll-behavior: smooth (css/hero.css), which is what used to
     animate that restore into exactly the scroll the client asked us to
     remove; the suspend/restore below stays as a guard, so this keeps
     working if the property is ever declared on the root again. */
  const unlockPage = () => {
    const behavior = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    body.style.position = '';
    body.style.top = '';
    body.style.width = '';
    body.style.paddingRight = '';
    window.scrollTo(0, lockedAt);
    root.style.scrollBehavior = behavior;
  };

  const show = (id, {focus = true} = {}) => {
    const panel = panels.get(id);
    if (!panel || active === id) return;
    if (!active) lockPage();
    active = id;
    layer.classList.add('is-open');
    layer.setAttribute('aria-hidden', 'false');
    for (const [key, item] of panels) {
      const on = key === id;
      item.hidden = !on;
      if (on) {
        item.setAttribute('aria-modal', 'true');
        item.setAttribute('role', 'dialog');
      } else {
        item.removeAttribute('aria-modal');
        item.removeAttribute('role');
      }
    }
    // A fresh case starts at its own beginning, not where the last one ended.
    panel.scrollTop = 0;
    if (focus) requestAnimationFrame(() => panel.querySelector('[data-case-close]')?.focus({preventScroll: true}));
  };

  const hide = () => {
    if (!active) return;
    const opener = lastFocus || openers.get(active);
    active = null;
    layer.classList.remove('is-open');
    layer.setAttribute('aria-hidden', 'true');
    for (const panel of panels.values()) {
      panel.removeAttribute('role');
      panel.removeAttribute('aria-modal');
    }
    unlockPage();
    /* The panel stays in the DOM until the slide out has finished, or it
       would vanish instead of leaving. The transition length is the one
       declared on .case-drawer-panel. */
    setTimeout(() => {
      if (active) return;
      for (const panel of panels.values()) panel.hidden = true;
    }, 520);
    if (opener?.isConnected) requestAnimationFrame(() => opener.focus({preventScroll: true}));
  };

  for (const opener of openers.values()) opener.addEventListener('click', event => {
    event.preventDefault();
    lastFocus = opener;
    show(opener.dataset.caseOpen);
  });

  layer.addEventListener('click', event => {
    if (!event.target.closest('[data-case-close]')) return;
    event.preventDefault();
    hide();
  });

  document.addEventListener('keydown', event => {
    if (!active) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      hide();
      return;
    }
    if (event.key !== 'Tab') return;
    const stops = focusables(panels.get(active));
    if (!stops.length) return;
    const first = stops[0], last = stops.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });

  /* Legacy address only, read once. Nothing here writes to the URL. */
  const match = location.hash.match(/^#case=([a-z0-9-]+)$/);
  if (match && panels.has(match[1])) {
    cases.scrollIntoView({block: 'start', behavior: 'instant'});
    show(match[1]);
  }
})();
