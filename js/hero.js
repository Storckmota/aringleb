/* Alexander Ringleb — shell behaviour
   0. Hash entry: land on the section that was asked for, not the top
   1. Entrance release once the brand fonts are ready
   2. Header: transparent over a dark cover, paper bar past it (and paper
      from the first frame on the pages that open on paper) — plus the one
      "Let's talk", which changes place instead of being duplicated
   3. Section state in the menu
   4. Mobile menu
   5. Magnetic CTA

   Nothing here gates content, and everything decorative is skipped under
   prefers-reduced-motion. */

(() => {
  'use strict';

  const docEl = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 0. Arriving with a hash ----------
     Coming from /press/ to /#insights, the visitor asked for a section. The
     inline gate already skipped the preloader and the hero entrance; this
     puts the page at the destination and holds it there while late layout
     (fonts, lazy images) settles.

     It re-asserts the position only until the visitor touches the page —
     after the first wheel, key, touch or pointer the browser is theirs
     again, so this can never fight a normal scroll. Back/forward are
     untouched: the browser restores those itself, and nothing here runs on
     a hashchange. */
  const hash = location.hash;
  if (hash.length > 1) {
    let target = null;
    try { target = document.querySelector(hash); } catch (e) { /* not a selector */ }
    // Nothing to land on (a stale or malformed hash): show the page as it is.
    if (!target) docEl.classList.add('hash-landed');
    if (target) {
      let released = false;
      const release = () => { released = true; };
      ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach((ev) =>
        window.addEventListener(ev, release, { once: true, passive: true }));

      // Arriving from another page is a jump, not a journey: the visitor
      // already chose the section, so the hero must not scroll past them on
      // the way down. 'instant' says so outright now that the sheet no
      // longer puts scroll-behavior: smooth on the root.
      const land = () => {
        if (released) return;
        target.scrollIntoView({ behavior: 'instant', block: 'start' });
      };
      land();
      requestAnimationFrame(() => { land(); docEl.classList.add('hash-landed'); });
      window.addEventListener('load', () => requestAnimationFrame(land), { once: true });
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => requestAnimationFrame(land));
      }
      // last word once images have reserved their space
      setTimeout(land, 260);
    }
  }

  /* ---------- 1. Entrance ---------- */
  const release = () => requestAnimationFrame(() => docEl.classList.add('is-ready'));

  const fontsReady = (document.fonts && document.fonts.ready)
    ? Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))])
    : new Promise((r) => setTimeout(r, 150));

  fontsReady.then(release);

  /* ---------- 2. Header state + the single "Let's talk" ----------
     The bar keeps its paper-on-ink treatment while a dark cover is behind
     it and turns into the paper bar once that cover is gone. Pages that
     open on paper declare html.page-light before paint, so their bar is
     legible on the first frame and never flashes.

     The CTA: the hero holds it at rest, the header pill takes over past
     the hero, and only one of the two is ever visible. Hysteresis keeps
     the swap from flickering on the edge. On the inner pages there is no
     hero CTA, so the pill is simply there from the first frame.
     Functional (not decorative), so it runs under reduced motion too. */
  const head = document.getElementById('site-head');
  const hero = document.getElementById('top');
  const lightPage = docEl.classList.contains('page-light');

  if (head) {
    const cover = hero || document.querySelector('.page-head');
    let docked = false;

    if (!hero) docEl.classList.add('head-docked');   // no hero CTA to hand over from

    const setHead = () => {
      const y = window.scrollY;
      if (lightPage) {
        head.classList.add('scrolled');
      } else {
        const coverH = cover ? cover.offsetHeight : 0;
        const headH = head.offsetHeight || 64;
        head.classList.toggle('scrolled', y > Math.max(40, coverH - headH));
      }

      if (!hero) return;
      const h = hero.offsetHeight || window.innerHeight;
      const next = docked ? y > h * 0.42 : y > h * 0.54;
      if (next === docked) return;
      docked = next;
      docEl.classList.toggle('head-docked', docked);
    };

    window.addEventListener('scroll', setHead, { passive: true });
    window.addEventListener('resize', setHead);
    setHead();
  }

  /* ---------- 2b. In-page anchors glide; nothing else does ----------
     This is the one place the site asks for an animated scroll, and it is
     the only place that gets one. The stylesheet used to declare
     scroll-behavior: smooth on the root, which handed the same animation
     to the arrow keys, Page Up/Down, Home/End and the browser's own
     scroll restoration — none of which asked for it, all of which then
     felt like they were arriving late.

     Clicking "About" is a stated destination, so the glide is doing a
     job: it shows the reader the ground between here and there. Under
     reduced motion, or with a modifier held (the visitor is opening a
     tab), the browser keeps the jump. */
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

    const href = link.getAttribute('href');
    if (!href || href.charAt(0) !== '#' || href.length < 2) return;

    let target = null;
    try { target = document.querySelector(href); } catch (err) { /* not a selector */ }
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth', block: 'start' });
    history.pushState(null, '', href);

    // The glide moves the page; it must move the keyboard too, or Tab
    // carries on from wherever the reader was before the click.
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  /* ---------- 3. Section state in the menu ----------
     On the home page the three anchor items mark the section being read.
     A narrow band at the middle of the viewport decides, so exactly one
     item is ever current — and none while the hero fills the screen. The
     inner pages keep aria-current="page" on their own item, set in the
     markup, and this never runs there (they have no in-page anchors). */
  const anchors = [...document.querySelectorAll('.site-nav a[href^="#"]')]
    .map((a) => {
      let el = null;
      try { el = document.querySelector(a.getAttribute('href')); } catch (e) { /* ignore */ }
      return { a, el };
    })
    .filter((m) => m.el);

  if (anchors.length && 'IntersectionObserver' in window) {
    let current = null;
    const setCurrent = (mark) => {
      if (mark === current) return;
      if (current) current.a.removeAttribute('aria-current');
      current = mark;
      if (current) current.a.setAttribute('aria-current', 'true');
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const mark = anchors.find((m) => m.el === e.target);
        if (mark) setCurrent(mark);
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    anchors.forEach((m) => io.observe(m.el));

    // above the first anchored section nothing is current
    window.addEventListener('scroll', () => {
      if (current && window.scrollY < anchors[0].el.offsetTop - window.innerHeight * 0.5) setCurrent(null);
    }, { passive: true });
  }

  /* ---------- 4. Mobile menu ----------
     The panel is a plain row on wide screens; below the menu breakpoint
     CSS turns it into a sliding sheet. This only toggles the class and
     the aria state — and with scripts off the CSS leaves the panel in
     the flow, so the links stay reachable either way. */
  const toggle = document.getElementById('nav-toggle');
  const panel = document.getElementById('site-nav');

  if (toggle && panel) {
    const setMenu = (open) => {
      panel.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    };

    toggle.addEventListener('click', () => {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // Choosing a destination closes the sheet behind you
    panel.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => setMenu(false));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });

    // Crossing back to the wide layout must not leave a stale open state
    const wide = window.matchMedia('(min-width: 1181px)');
    wide.addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  }

  if (reduced) return;

  /* ---------- 5. Magnetic CTA ---------- */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (finePointer) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const strength = 0.2;
      const limit = 6;

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
