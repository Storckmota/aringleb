/* Alexander Ringleb — hero behaviour (art direction 02)
   1. Entrance release once brand fonts are ready
   2. Pointer parallax on the figure (fine pointer only)
   3. Scroll progress → masthead/stamps exit + marquee boost
   4. Magnetic CTA
   All motion is skipped under prefers-reduced-motion. */

(() => {
  'use strict';

  const docEl = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Photographic variant: ?photo=refined swaps back to the original cut */
  if (docEl.classList.contains('photo-refined')) {
    const source = document.querySelector('.figure source');
    const img = document.querySelector('.figure img');
    if (source) source.srcset = 'assets/img/alex-cut-700.webp';
    if (img) img.src = 'assets/img/alex-cut-1100.webp';
  }

  /* ---------- 1. Entrance ---------- */
  const release = () => requestAnimationFrame(() => docEl.classList.add('is-ready'));

  const fontsReady = (document.fonts && document.fonts.ready)
    ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))])
    : new Promise((r) => setTimeout(r, 150));

  /* ---------- 1b. Loader — minimal A—R hold ----------
     Deliberately simple this round: the mark fades in, holds
     briefly, then the paper panel fades out into the hero.
     First load of the session only; skipped for ?static=1;
     near-instant under reduced motion. Never blocks the page. */
  const loader = document.getElementById('loader');
  const isStatic = /[?&]static=1/.test(location.search);

  let introSeen = true;
  try {
    introSeen = !!sessionStorage.getItem('ar-intro');
    if (!introSeen) sessionStorage.setItem('ar-intro', '1');
  } catch (e) { /* storage blocked → treat as seen */ }

  const runLoader = loader && !isStatic && !introSeen;

  if (!runLoader) {
    if (loader) loader.remove();
    fontsReady.then(release);
  } else {
    loader.hidden = false;
    const killswitch = setTimeout(() => { loader.remove(); release(); }, 3000);

    if (reduced || !docEl.classList.contains('anim')) {
      // Reduced motion: show the mark for a beat, then reveal
      loader.classList.add('mark');
      setTimeout(() => { clearTimeout(killswitch); loader.remove(); release(); }, 450);
    } else {
      requestAnimationFrame(() => loader.classList.add('mark')); // A—R fades in
      setTimeout(() => {                                          // panel fades out
        loader.classList.add('reveal');
        fontsReady.then(release);                                 // hero scene begins
      }, 900);
      setTimeout(() => { clearTimeout(killswitch); loader.remove(); }, 1600);
    }
  }

  /* ---------- Navigation: solid paper once past the hero top ----------
     Functional (not decorative), so it runs under reduced motion too. */
  const head = document.getElementById('site-head');
  if (head) {
    const setHead = () => head.classList.toggle('scrolled', window.scrollY > 60);
    window.addEventListener('scroll', setHead, { passive: true });
    setHead();
  }

  if (reduced) return;

  /* ---------- Section reveals (site chapters) ----------
     Initial hidden states exist only under html.anim, so this
     observer is meaningful only there; without it the chapters
     are simply visible. */
  if (docEl.classList.contains('anim') && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });

    document.querySelectorAll('.rv, .rv-mask, .rv-line, .rv-draw, .rv-stamp')
      .forEach((el) => io.observe(el));
  }

  /* ---------- 2 + 3. Shared frame state ---------- */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const state = {
    tx: 0, ty: 0,    // pointer target (-0.5 … 0.5)
    x: 0, y: 0,      // eased pointer
    sp: 0, spCur: 0, // scroll progress target / eased
    sb: 0, sbCur: 0  // marquee scroll boost (px)
  };

  if (finePointer) {
    window.addEventListener('pointermove', (e) => {
      state.tx = e.clientX / window.innerWidth - 0.5;
      state.ty = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
  }

  const readScroll = () => {
    const y = window.scrollY;
    state.sp = Math.min(1, Math.max(0, y / (window.innerHeight * 0.9)));
    state.sb = y * -0.4; // the name slides ahead as the page moves
  };
  window.addEventListener('scroll', readScroll, { passive: true });
  readScroll();

  const lerp = (a, b, t) => a + (b - a) * t;

  const tickFrame = () => {
    state.x = lerp(state.x, state.tx, 0.055);
    state.y = lerp(state.y, state.ty, 0.055);
    state.spCur = lerp(state.spCur, state.sp, 0.12);
    state.sbCur = lerp(state.sbCur, state.sb, 0.12);

    docEl.style.setProperty('--mx', state.x.toFixed(4));
    docEl.style.setProperty('--my', state.y.toFixed(4));
    docEl.style.setProperty('--sp', state.spCur.toFixed(4));
    docEl.style.setProperty('--sb', state.sbCur.toFixed(1) + 'px');

    requestAnimationFrame(tickFrame);
  };
  requestAnimationFrame(tickFrame);

  /* ---------- 4. Magnetic CTA ---------- */
  if (finePointer) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = 0.22;
      const limit = 7;

      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * strength;
        const dy = (e.clientY - (r.top + r.height / 2)) * strength;
        const cl = (v) => Math.max(-limit, Math.min(limit, v));
        el.style.transform = `translate(${cl(dx)}px, ${cl(dy)}px)`;
      });

      el.addEventListener('pointerleave', () => {
        el.style.transform = '';
      });
    });
  }
})();
