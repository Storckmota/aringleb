/* ============================================================
   Body motion — central architecture for the site body.
   Scope: the progressive diagnosis in #pain, the layered narrative
   in #about (Story), and the Burgermeister case feature. The proof-strip
   marquee is CSS-only.

   Contract: motion is armed ONLY under html.anim (added by hero.js when
   motion is allowed). When it commits it stamps html.motion-on, and all
   reveal/sticky CSS keys on that class — so under reduced motion, no-JS,
   ?static=1, or any JS failure before commit, every section renders
   fully visible and static. Content is never hidden waiting on JS.
   ============================================================ */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/* ---------- Preloader — runs ALWAYS, independent of the motion guard ----------
   Premium editorial intro: a quick multilingual word-scan (hospitality /
   operation / Miami / investment) resolves into the A—R monogram, which opens
   outward (letter-spacing + the central rule elongating), then the paper panel
   wipes up to reveal the site. First visit of the session only — an inline
   script in index.html adds .preloader-skip on repeat visits and ?static=1;
   ?preload=1 forces it. A hard killswitch and a CSS fallback guarantee the
   overlay is never trapped, even if this module fails to load. */
initPreloader();
function initPreloader() {
  const overlay = document.getElementById('site-preloader');
  if (!overlay) return;
  if (document.documentElement.classList.contains('preloader-skip')) {
    overlay.remove();
    return;
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wordEl = overlay.querySelector('.preloader-word');
  const mark = overlay.querySelector('.preloader-mark');
  const dash = mark ? mark.querySelector('.pm-dash') : null;

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(kill);
    try { sessionStorage.setItem('arPreloaderSeen', '1'); } catch (e) { /* blocked */ }
    overlay.remove();
  };
  const kill = setTimeout(finish, 3500);   // safety: never trap the page

  // Reduced motion: no scan, no wipe — hold the mark for a beat, fade out.
  if (reduce) {
    if (wordEl) wordEl.style.display = 'none';
    gsap.set(mark, { opacity: 1 });
    gsap.to(overlay, { opacity: 0, duration: 0.4, delay: 0.5, ease: 'power1.out', onComplete: finish });
    return;
  }

  const words = ['Hospitality', 'Gastfreundschaft', 'Miami', 'Investimento', 'Ringleb'];
  gsap.set(mark, { opacity: 0, letterSpacing: '0.04em' });
  if (dash) gsap.set(dash, { width: '0.9em' });

  const tl = gsap.timeline({ onComplete: finish });

  // 1) Word-scan through the same centre the mark will occupy (~0.8s total).
  words.forEach((wd) => {
    tl.call(() => { wordEl.textContent = wd; });
    tl.fromTo(wordEl, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.08, ease: 'power2.out' });
    tl.to(wordEl, { opacity: 0, y: -10, duration: 0.06, ease: 'power2.in' }, '+=0.02');
  });

  // 2) The A—R mark resolves and opens outward (letter-spacing + rule elongating).
  tl.call(() => { wordEl.style.display = 'none'; });
  tl.to(mark, { opacity: 1, duration: 0.28, ease: 'power2.out' });
  tl.to(mark, { letterSpacing: '0.5em', duration: 0.45, ease: 'power3.inOut' }, '+=0.1');
  if (dash) tl.to(dash, { width: '2.4em', duration: 0.45, ease: 'power3.inOut' }, '<');

  // 3) Paper panel wipes up to reveal the composed hero (~2.3s total).
  tl.to(overlay, { yPercent: -100, duration: 0.55, ease: 'power4.inOut' }, '+=0.12');
}

(() => {
  'use strict';

  const docEl = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const anim = docEl.classList.contains('anim');
  if (!anim || reduced || !('IntersectionObserver' in window)) return;

  // Commit: from here the reveal CSS is allowed to hide-then-reveal.
  docEl.classList.add('motion-on');

  initPainProgression();
  initStory();
  initBurgermeister();
  initOffice();
  initSocial();
  initOpps();
  initQuoteText();

  /* #pain — three steps take turns in focus as the section scrolls.
     A thin band at the viewport centre decides the active step; steps
     above it are marked "past". State only (opacity / gold spine). */
  function initPainProgression() {
    const pain = document.getElementById('pain');
    if (!pain) return;

    const steps = [...pain.querySelectorAll('.pain-step')];
    if (!steps.length) return;

    let activeIdx = -1;
    const setActive = (idx) => {
      if (idx === activeIdx) return;
      activeIdx = idx;
      steps.forEach((step, i) => {
        step.classList.toggle('is-active', i === idx);
        step.classList.toggle('is-past', i < idx);
      });
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) setActive(steps.indexOf(e.target));
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    steps.forEach((step) => io.observe(step));
    setActive(0);
  }

  /* #about (Story) — an editorial reel driven by scroll progress.
     On desktop the section is tall (CSS: 420vh) and its stage pins;
     this maps how far we have scrolled through that track to a 0..1
     progress, which:
       - fills the foot hairline (continuous, scrubbed cue — no numbers);
       - selects the active chapter (four equal zones) so its image
         wipes in and its copy masks up (CSS transitions on .is-active).
     Reversible with the scroll — the reader feels the chapters change.
     CSS gates the pin/wipe/hide on a desktop width, so on narrow screens
     this only sets a variable and toggles a class with no hiding effect:
     every chapter stays visible in the vertical run.

     Perf: the scroll handler reads only one cheap rect and writes at
     most one transform + one class toggle per frame; the section's
     scroll length is cached and recomputed on resize/orientation, so no
     layout is forced during scroll. rAF-throttled and Story-scoped. */
  function initStory() {
    const section = document.getElementById('about');
    if (!section) return;

    const slides = [...section.querySelectorAll('.story-slide')];
    const fillEl = section.querySelector('.story-progress > i');
    const n = slides.length;
    if (!n) return;

    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    let active = -1;
    let lastP = -1;
    let total = 0;

    const measure = () => { total = section.offsetHeight - window.innerHeight; };

    const setActive = (i) => {
      if (i === active) return;
      active = i;
      slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    };

    let ticking = false;
    const update = () => {
      ticking = false;
      const top = section.getBoundingClientRect().top;
      const p = total > 0 ? clamp01(-top / total) : (top <= 0 ? 1 : 0);
      if (p === lastP) return;
      lastP = p;
      if (fillEl) fillEl.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      setActive(Math.min(n - 1, Math.floor(p * n + 1e-4)));
    };

    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    const onResize = () => { measure(); lastP = -1; onScroll(); };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    measure();
    setActive(0);
    update();
  }

  /* #burgermeister — opens like a case monument, not a slide deck.
     The copy reveals progressively: each paragraph (and the CTA) has its
     own trigger and rises from behind a mask as it reaches the reading
     line, so the reader feels them arrive one after another. The proof
     ledger settles in as its zone enters. Scroll writes one local
     progress variable for the monumental word, title, and image drift.
     Reduced motion and no-JS keep the static layout fully visible because
     the CSS is gated by .bm-motion and the per-element .is-in class. */
  function initBurgermeister() {
    const section = document.getElementById('burgermeister');
    if (!section) return;

    section.classList.add('bm-motion');

    // Progressive copy: reveal each paragraph/CTA as it enters, in order.
    const lines = [...section.querySelectorAll('.bm-copy > *')];
    if (lines.length) {
      const lineIo = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            lineIo.unobserve(entry.target);
          }
        });
      }, { rootMargin: '0px 0px -20% 0px', threshold: 0.25 });
      lines.forEach((el) => lineIo.observe(el));
    }

    const proof = section.querySelector('.bm-proof');
    if (proof) {
      const proofIo = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) section.classList.add('is-proof-inview');
        });
      }, { rootMargin: '0px 0px -24% 0px', threshold: 0.16 });
      proofIo.observe(proof);
    }

    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    let ticking = false;

    const update = () => {
      ticking = false;
      const r = section.getBoundingClientRect();
      const total = window.innerHeight + r.height;
      const p = total > 0 ? clamp01((window.innerHeight - r.top) / total) : 0;
      section.style.setProperty('--bm-p', p.toFixed(4));
    };

    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* #the-office — a living operational dossier.
     1. Scroll entrance: the record lays itself out (masthead + rows draw
        down in a short cascade), keyed on .is-inview.
     2. Cursor image preview: on desktop pointers, an editorial plate
        follows the cursor over the dossier rows and swaps its image per
        row. Vanilla rAF + lerp for a smooth trailing follow — no GSAP
        needed for a single lerped element, and it keeps the zero-dep
        contract that protects the approved hero. Fixed + pointer-events
        none, so it never shifts layout or creates overflow. Disabled on
        touch / coarse pointers / reduced motion (CSS hides it too). */
  function initOffice() {
    const section = document.getElementById('the-office');
    if (!section) return;

    section.classList.add('to-motion');

    const revIo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          section.classList.add('is-inview');
          revIo.disconnect();
        }
      });
    }, { rootMargin: '0px 0px -16% 0px', threshold: 0.12 });
    revIo.observe(section);

    // Cursor preview — desktop pointer only.
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const rows = [...section.querySelectorAll('.to-detail > div[data-preview]')];
    const preview = section.querySelector('.to-preview');
    const img = preview && preview.querySelector('img');
    if (!fine || !preview || !img || !rows.length) return;

    // Warm the images so the swap is instant.
    rows.forEach((row) => {
      const src = row.getAttribute('data-preview');
      if (src) { const pre = new Image(); pre.src = src; }
    });

    const detail = section.querySelector('.to-detail');
    const lerp = (a, b, t) => a + (b - a) * t;
    let targetX = -100, targetY = -100;
    let curX = -100, curY = -100;
    let hovering = 0;
    let raf = 0;

    const run = () => {
      curX = lerp(curX, targetX, 0.16);
      curY = lerp(curY, targetY, 0.16);
      preview.style.transform =
        'translate3d(' + curX.toFixed(1) + 'px,' + curY.toFixed(1) + 'px,0)';
      const settled = Math.abs(curX - targetX) < 0.4 && Math.abs(curY - targetY) < 0.4;
      if (hovering || !settled) { raf = requestAnimationFrame(run); }
      else { raf = 0; }
    };

    const onMove = (e) => {
      const w = preview.offsetWidth || 220;
      const h = preview.offsetHeight || 275;
      // sit to the right of the cursor, clamped inside the viewport
      let x = e.clientX + 26;
      let y = e.clientY - h / 2;
      if (x + w > window.innerWidth - 14) x = e.clientX - w - 26;
      x = Math.max(14, Math.min(x, window.innerWidth - w - 14));
      y = Math.max(12, Math.min(y, window.innerHeight - h - 12));
      targetX = x; targetY = y;
      if (!raf) raf = requestAnimationFrame(run);
    };

    rows.forEach((row) => {
      row.addEventListener('mouseenter', () => {
        const src = row.getAttribute('data-preview');
        if (src && img.getAttribute('src') !== src) img.setAttribute('src', src);
        hovering += 1;
        preview.classList.add('is-on');
        if (!raf) raf = requestAnimationFrame(run);
      });
      row.addEventListener('mouseleave', () => {
        hovering = Math.max(0, hovering - 1);
        if (!hovering) preview.classList.remove('is-on');
      });
    });

    (detail || section).addEventListener('mousemove', onMove, { passive: true });
  }

  /* #social — a living content showcase. On desktop the stage pins over
     a tall track and scroll progress moves the post cards through an arc:
     each card gets translateX (spread), a parabolic translateY (the arc),
     rotation, scale, depth (z-index), fade and blur by its distance from
     centre — the centre card largest, upright, sharp, in front. Vanilla
     rAF: the arc is one formula over a handful of cards, so GSAP would
     only add a dependency and a pin-spacer that risks the approved hero's
     scroll. Gated on desktop width + motion; otherwise the CSS scroll-snap
     rail stands in, so cards stay visible and links live everywhere. */
  function initSocial() {
    const section = document.getElementById('social');
    if (!section) return;

    section.classList.add('social-motion');

    const arc = section.querySelector('.social-arc');
    const cards = [...section.querySelectorAll('.social-card')];
    const n = cards.length;
    if (!arc || !n) return;

    const wide = window.matchMedia('(min-width: 861px)');
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    let total = 0;
    let ticking = false;
    let cleared = false;

    const measure = () => { total = section.offsetHeight - window.innerHeight; };

    const clearInline = () => {
      if (cleared) return;
      cleared = true;
      cards.forEach((c) => {
        c.style.transform = '';
        c.style.opacity = '';
        c.style.filter = '';
        c.style.zIndex = '';
        c.classList.remove('is-active');
      });
    };

    const apply = (p) => {
      cleared = false;
      const active = p * (n - 1);
      const cw = cards[0].getBoundingClientRect().width || 220;
      // Constant step + constant card size => the horizontal gap between
      // every pair of cards is identical, whatever their position. The arc
      // is drawn purely by a gentle vertical curve and a tangent rotation,
      // so the even spacing is never deformed by the motion.
      const step = cw * 1.16;
      cards.forEach((card, i) => {
        const off = i - active;
        const a = Math.abs(off);
        const x = off * step;
        const y = 82 * (1 - Math.cos(off * 0.5));     // symmetric arc, centre peak
        const rot = off * 6;                          // tangent tilt
        const op = Math.max(0, 1 - a * 0.32);
        const blur = Math.min(a * 1.0, 2.6);
        card.style.transform =
          'translate3d(calc(-50% + ' + x.toFixed(1) + 'px), calc(-50% + ' + y.toFixed(1) + 'px), 0)' +
          ' rotate(' + rot.toFixed(2) + 'deg)';
        card.style.opacity = op.toFixed(3);
        card.style.filter = blur > 0.05 ? 'blur(' + blur.toFixed(2) + 'px)' : 'none';
        card.style.zIndex = String(100 - Math.round(a * 10));
        card.classList.toggle('is-active', a < 0.5);
      });
    };

    const update = () => {
      ticking = false;
      if (!wide.matches) { clearInline(); return; }
      const top = section.getBoundingClientRect().top;
      const p = total > 0 ? clamp01(-top / total) : 0;
      apply(p);
    };

    const onScroll = () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    };
    const onResize = () => { measure(); onScroll(); };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });

    measure();
    update();
  }

  /* #opportunities — four pinned panels (GSAP ScrollTrigger, the
     "pinned panels with overscroll" pattern). Each panel except the last
     is pinned; the next panel slides up over it, and a panel taller than
     the viewport scrolls its own content before releasing (start at
     bottom-bottom rather than top-top). GSAP is used here because a
     multi-panel pin with per-panel overscroll and a pin-spacer is exactly
     what ScrollTrigger manages robustly; hand-rolling it with sticky is
     brittle across variable-height panels.

     Desktop width + motion only. This function is never reached under
     reduced motion / no-JS (the IIFE returns early), and it bails on
     narrow screens — so the panels stay a normal vertical run there. */
  function initOpps() {
    const section = document.getElementById('opportunities');
    if (!section) return;
    if (!window.matchMedia('(min-width: 861px)').matches) return;

    const panels = [...section.querySelectorAll('.opps-panel')];
    if (panels.length < 2) return;

    gsap.registerPlugin(ScrollTrigger);
    section.classList.add('is-pinned');   // gives panels min-height:100vh

    // Pin every panel but the last; the closing panel flows out into
    // Contact. Short panels pin at top-top; tall panels pin at
    // bottom-bottom so their content scrolls past first (overscroll).
    panels.forEach((panel, i) => {
      if (i === panels.length - 1) return;
      ScrollTrigger.create({
        trigger: panel,
        start: () => (panel.offsetHeight < window.innerHeight ? 'top top' : 'bottom bottom'),
        pin: true,
        pinSpacing: false,
      });
    });

    // Recompute once fonts/images settle so pin points are accurate.
    ScrollTrigger.refresh();
    window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
  }

  /* #quote — an editorial interlude on plain deep-pine. The sophistication is
     in the TYPOGRAPHY, not the background: the quote is split into words and
     revealed on scroll with a short, refined stagger (rise + fade, a touch of
     blur on desktop); the signature follows. GSAP + ScrollTrigger, no extra
     library. Reduced motion / no-JS never reach here (the IIFE returns before
     stamping html.motion-on) so the quote renders fully at rest and legible. */
  function initQuoteText() {
    const section = document.getElementById('quote');
    if (!section) return;
    const tx = section.querySelector('.quote-tx');
    const quoteIn = section.querySelector('.quote-in');
    if (!tx || !quoteIn) return;
    const by = section.querySelector('.quote-by');
    gsap.registerPlugin(ScrollTrigger);   // idempotent — independent of initOpps

    // Manual word split (SplitText isn't bundled). Keep real spaces as text
    // nodes so wrapping — and the non-breaking "a city" — stay intact.
    const words = tx.textContent.split(' ');
    tx.textContent = '';
    const spans = words.map((wd, i) => {
      const s = document.createElement('span');
      s.className = 'quote-word';
      s.textContent = wd;
      tx.appendChild(s);
      if (i < words.length - 1) tx.appendChild(document.createTextNode(' '));
      return s;
    });

    // Container was hidden by html.motion-on .quote-in{opacity:0}; reveal it now
    // and let the words carry the hidden state, so there is no flash of full
    // text before the animation.
    gsap.set(quoteIn, { opacity: 1 });

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {                       // belt-and-braces: never leave it hidden
      gsap.set(spans, { opacity: 1, yPercent: 0 });
      if (by) gsap.set(by, { opacity: 1, y: 0 });
      return;
    }

    const mobile = window.matchMedia('(max-width: 700px)').matches;
    const from = { yPercent: 42, opacity: 0 };
    const to = {
      yPercent: 0, opacity: 1, ease: 'expo.out',
      duration: mobile ? 0.9 : 1.15,
      stagger: mobile ? 0.03 : 0.055
    };
    if (!mobile) { from.filter = 'blur(7px)'; to.filter = 'blur(0px)'; }
    gsap.set(spans, from);
    if (by) gsap.set(by, { opacity: 0, y: 14 });

    const tl = gsap.timeline({ paused: true });
    tl.to(spans, to);
    if (by) tl.to(by, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' }, '-=0.4');

    ScrollTrigger.create({
      trigger: section,
      start: 'top 70%',
      once: true,
      onEnter: () => tl.play()
    });
  }
})();
