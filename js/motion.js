/* ============================================================
   Body motion — what is left of it.

   PDF p.12 asked for fewer effects, so the machinery that used to drive
   the home page is gone: the About pin and its four-photograph swap, the
   Burgermeister scroll variables, The Office cursor preview, the reel arc
   and the per-word quote reveal. None of those come back.

   What remains:
     · the preloader (home page, first visit of the session);
     · the Insights rail: a native horizontal scroller at every width, and
       on a desktop width a real horizontal run — ScrollTrigger pins the
       Insights section and scrubs the track's X off the page scroll, over
       the track's own measured overflow;
     · one shared text entry for [data-rv] — used only by the lower
       paragraph of blocks 01/02/03, the one place the client marked;
     · the quote sign, on every desktop width, filled to the lane;
     · the three investment panels: E-2 holds the viewport, EB-5 rises over
       it, Important rises last. This is the panel pattern from the approved
       baseline (c89d14b initOpps). GSAP comes back only for this — a
       multi-panel pin with a pin-spacer is exactly what ScrollTrigger
       manages reliably, and hand-rolling it with sticky is brittle across
       variable-height panels — and it is loaded with a dynamic import, so
       only /opportunities/ on a desktop width downloads it.

   Contract: everything except the preloader is armed ONLY under
   html.anim (added before paint when motion is allowed). When it commits
   it stamps html.motion-on, and the reveal CSS keys on that class — so
   under reduced motion, no-JS, ?static=1, or any JS failure before
   commit, every section renders fully visible and static.
   ============================================================ */

/* ---------- Preloader — runs ALWAYS, independent of the motion guard ----------
   Two words resolve into the A—R monogram, the mark opens outward, and
   the panel wipes up. Around three seconds: an intro, not a gate. An
   inline script in index.html only adds .preloader-on when it should
   run, so repeat visits, ?static=1 and a browser with scripts off never
   see it; ?preload=1 forces it. A killswitch and a CSS fallback
   guarantee the overlay is never trapped, even if this module fails.

   The sequence is a real sequence: each stage awaits the previous one's
   animation.finished before it starts. The first build fired five
   overlapping animations off a shared clock with fill: 'both', and a
   persisting fill reaches backwards as well as forwards — the leave
   animation of a word, queued with a delay, applied its own first
   keyframe (opaque, unmoved, unblurred) from frame zero and outranked the
   rise animation under it, because the later animation on an element wins
   the property. The result was 'Hospitality' and 'Miami' both solid, both
   centred on the same grid cell, printing through each other for the
   first 720ms. One element carries every word now, one word at a time, so
   there is no second layer that could overlap the first. */
initPreloader();
function initPreloader() {
  const overlay = document.getElementById('site-preloader');
  if (!overlay) return;
  if (!document.documentElement.classList.contains('preloader-on')) {
    overlay.remove();
    return;
  }

  const inner = overlay.querySelector('.preloader-inner');
  const word = overlay.querySelector('.preloader-word');
  const mark = overlay.querySelector('.preloader-mark');
  const dash = mark ? mark.querySelector('.pm-dash') : null;
  if (!inner || !word || !mark) { overlay.remove(); return; }

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(kill);
    try { sessionStorage.setItem('arPreloaderSeen', '1'); } catch (e) { /* blocked */ }
    overlay.remove();
  };
  const kill = setTimeout(finish, 4400);   // safety: never trap the page

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    word.style.display = 'none';
    mark.style.opacity = '1';
    setTimeout(finish, 650);
    return;
  }

  const ease = 'cubic-bezier(.16,1,.3,1)';
  const rise = [
    { opacity: 0, transform: 'translateY(15px)', filter: 'blur(8px)' },
    { opacity: 1, transform: 'none', filter: 'blur(0px)' }
  ];
  const leave = [
    { opacity: 1, transform: 'none', filter: 'blur(0px)' },
    { opacity: 0, transform: 'translateY(-12px)', filter: 'blur(8px)' }
  ];

  // Awaitable. `done` is checked by the caller between stages, so a
  // killswitch that removes the overlay mid-run never leaves a promise
  // waiting on an animation that can no longer tick.
  const play = (el, frames, duration, easing) =>
    el.animate(frames, { duration, easing: easing || ease, fill: 'both' }).finished;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* Enter, hold, leave — and nothing else is on screen for any of it.
     HOLD is the part the client reads: no blur, no travel, no tracking
     change, the word simply sitting there long enough to be a word. */
  const HOLD = 560;
  async function say(text) {
    word.textContent = text;
    word.getAnimations().forEach((a) => a.cancel());
    word.style.opacity = '0';
    await play(word, rise, 300);
    if (done) return;
    await wait(HOLD);
    if (done) return;
    await play(word, leave, 210);
    // Cancelling drops the persisted fill, so the next word starts from the
    // stylesheet's own opacity: 0 rather than from this one's end state.
    word.getAnimations().forEach((a) => a.cancel());
    word.style.opacity = '0';
  }

  const open = 'cubic-bezier(.65,0,.35,1)';
  async function monogram() {
    word.style.display = 'none';        // the cell belongs to the mark now
    const rising = play(mark, rise, 320);
    // Tracking and the rule open on their own properties, so they can run
    // under the rise without either animation fighting the other for one.
    mark.animate([{ letterSpacing: '.04em' }, { letterSpacing: '.44em' }],
      { duration: 430, delay: 110, easing: open, fill: 'both' });
    if (dash) dash.animate([{ width: '.9em' }, { width: '2.2em' }],
      { duration: 430, delay: 110, easing: open, fill: 'both' });
    await rising;
    if (done) return;
    await wait(300);                    // the mark, formed and still
  }

  (async () => {
    await say('Hospitality');
    if (done) return;
    await say('Miami');
    if (done) return;
    await monogram();
    if (done) return;
    await play(overlay, [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }],
      480, 'cubic-bezier(.76,0,.24,1)');
    finish();
  })().catch(finish);
}


/* ---------- Insights rail — wired on every page that has one ----------
   Deliberately outside the motion guard below, because the first thing it
   does is a job the guard has no opinion about: the four covers that are
   on screen before anyone scrolls are decoded before the track is measured.
   Without that the rail is measured while six frames are still empty
   plates, the travel is computed from the wrong height, and the reader
   watches the pictures arrive one by one into a run that has already
   started.

   What the rail does with no script at all is the whole fallback: it is a
   native overflow-x scroller, so swipe, trackpad, shift-wheel, drag and
   the Tab key reach all six cards, with scroll snap and no page overflow.
   That is what no-JS, reduced motion, every touch width and every window
   outside DESKTOP_RUN get, and nothing below is needed for any of them.

   On a desktop width with motion committed this becomes a real horizontal
   run: ScrollTrigger pins the section — this section only — and scrubs the
   track's X off the page's own vertical scroll. The distance is the
   track's own overflow, so the run starts with the first card flush
   against the measure, ends with the sixth whole and the right gutter
   equal to the left, and releases the page there. Nothing is pinned after
   the last card, and the earlier build's arbitrary window (0.35 of the
   viewport height, which is what made the six cards flick past) is gone
   along with the two arrow controls it sat next to. */
/* The one query that decides whether this page gets the pinned run, kept
   identical to the stylesheet's own so the two can never disagree about
   which mode the window is in: wide enough for three cards across, and
   tall enough to hold a whole card under a fixed header without the frame
   shrinking back into a thumbnail. */
const DESKTOP_RUN = '(min-width: 1081px) and (min-height: 880px)';

initReelRail();
function initReelRail() {
  const section = document.querySelector('[data-insights]');
  const view = document.querySelector('[data-reel-view]');
  const rail = document.querySelector('[data-reel-rail]');
  if (!section || !view || !rail) return;

  const docEl = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!docEl.classList.contains('anim') || reduced) return;
  if (!window.matchMedia(DESKTOP_RUN).matches) return;

  /* The covers in the first frame, decoded before anything is measured. A
     cover that never arrives must not hold the section: every decode
     swallows its own failure and the whole wait is raced against a short
     timeout, so the worst case is the run being set up against a frame
     that is still loading — never a section that stays put. */
  const first = [...rail.querySelectorAll('img')].slice(0, 4);
  const ready = Promise.race([
    Promise.all(first.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()))),
    new Promise((r) => setTimeout(r, 2500)),
  ]);

  ready.then(setup);

  async function setup() {
    const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]);
    gsap.registerPlugin(ScrollTrigger);

    /* The travel, from the track itself: six cards, five gaps and both
       gutters, less what is on screen. offsetWidth and not a bounding
       rect — the track carries the transform while the trigger is live and
       a rect would read the moved box and shrink the distance every
       frame. Rounded so a sub-pixel width cannot leave a hairline of the
       last card outside the window at the end. */
    const distance = () => Math.max(0, Math.round(rail.offsetWidth - view.clientWidth));

    /* The breakpoint lives here as well as in the stylesheet: matchMedia
       tears the trigger down and clears the transform when the window
       crosses it, so a resize down to a tablet width leaves the plain
       native scroller behind with nothing of the run still applied. */
    const mm = gsap.matchMedia();
    mm.add(DESKTOP_RUN, () => {
      section.classList.add('is-hscroll');
      view.scrollLeft = 0;

      const tween = gsap.to(rail, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => '+=' + distance(),
          scrub: true,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,   // the distance is re-read on resize
        },
      });
      const st = tween.scrollTrigger;

      /* Keyboard. The view is clipped, so the browser cannot bring a
         focused card into view by scrolling it sideways — which is the
         point, since that offset would stack on top of the transform. The
         page scroll is moved instead: the card's own offset inside the
         track is the same fraction of the travel as of the trigger's
         length, so focusing card four lands the run exactly where card
         four is flush against the measure. */
      const onFocus = (e) => {
        const card = e.target.closest('.reel');
        if (!card || !st) return;
        const d = distance();
        if (!d) return;
        const gutter = parseFloat(getComputedStyle(rail).paddingLeft) || 0;
        const p = Math.min(1, Math.max(0, (card.offsetLeft - gutter) / d));
        window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: 'instant' });
      };
      rail.addEventListener('focusin', onFocus);

      // Belt and braces for a browser without `overflow: clip`, where the
      // clipped box is still a scroll container.
      const onScroll = () => { if (view.scrollLeft) view.scrollLeft = 0; };
      view.addEventListener('scroll', onScroll, { passive: true });

      return () => {
        rail.removeEventListener('focusin', onFocus);
        view.removeEventListener('scroll', onScroll);
        if (st) st.kill();
        tween.kill();
        gsap.set(rail, { clearProps: 'transform,willChange' });
        section.classList.remove('is-hscroll');
      };
    });

    /* The pin point depends on a track whose covers, fonts and clamps are
       still settling at first paint, so the measurement is taken again
       after each of them lands. */
    const refresh = () => ScrollTrigger.refresh();
    refresh();
    window.addEventListener('load', refresh, { once: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  }
}
(() => {
  'use strict';

  const docEl = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const anim = docEl.classList.contains('anim');
  if (!anim || reduced || !('IntersectionObserver' in window)) return;

  // Commit: from here the reveal CSS is allowed to hide-then-reveal.
  docEl.classList.add('motion-on');

  initReveals();
  initQuoteSign();
  initRoutes();

  /* Reveal — the site's one entrance, and the only thing on the page that
     reacts to scroll position at all. A module marked [data-rv] rises
     16px into place as it reaches the reading line ([data-rv-i] staggers
     things that belong together). The hidden state lives under
     html.motion-on, so no-JS and reduced motion never hide anything.
     Reveal-once: the class goes on, the element is unobserved, and
     nothing here ever takes it off again.

     Nothing in this function reads or writes scroll position, measures
     during a scroll callback beyond one getBoundingClientRect per pending
     element, or animates anything but opacity and transform. That is
     deliberate: the entrance must be invisible to the scroll, not a
     second thing competing for the same frames.

     The observer alone cannot guarantee reveal-once-and-always. A hard
     flick of the wheel, a drag of the scrollbar or a jump to a #hash can
     carry an element from below the fold to above it between two frames:
     the intersection ratio reads 0 before and 0 after, no threshold is
     crossed, no entry is queued, and the element stays invisible for the
     rest of the visit. With photographs on [data-rv] that is a blank
     panel where a case should be.

     So a sweep runs alongside the observer and lets through anything that
     has already reached the reading line, whether or not the observer
     ever spoke. It runs on the five occasions that can strand an element:

       · at init, for a page that loads already scrolled — a reload
         partway down, or a hash landing;
       · on scroll, debounced, for the flick and the scrollbar drag;
       · on resize, because the reading line itself moves;
       · on load, once late images have settled the layout;
       · on pageshow with persisted set, for a back/forward out of the
         bfcache, where the document is restored mid-visit and the
         observer's callbacks are not replayed.

     Both paths drain the same set. When it is empty the listeners come
     off and html.rv-done retires the hidden state in the stylesheet. */
  function initReveals() {
    const pending = new Set(document.querySelectorAll('[data-rv]'));
    if (!pending.size) { docEl.classList.add('rv-done'); return; }

    const show = (el) => {
      el.classList.add('is-in');
      pending.delete(el);
      io.unobserve(el);
    };

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) show(e.target); });
      if (!pending.size) finish();
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });
    pending.forEach((el) => io.observe(el));

    let t = 0;
    const sweep = () => {
      const line = window.innerHeight * 0.88;      // the observer's own line
      [...pending].forEach((el) => {
        if (el.getBoundingClientRect().top < line) show(el);
      });
      if (!pending.size) finish();
    };
    const queue = () => { clearTimeout(t); t = setTimeout(sweep, 140); };

    const finish = () => {
      clearTimeout(t);
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      window.removeEventListener('pageshow', onShow);
      io.disconnect();
      docEl.classList.add('rv-done');
    };

    // A restore from the bfcache hands back a document that is already
    // scrolled, with no scroll event to announce it.
    const onShow = (e) => { if (e.persisted) sweep(); };

    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    window.addEventListener('pageshow', onShow);
    window.addEventListener('load', sweep, { once: true });
    sweep();
  }

  /* #opportunities — E-2 holds, EB-5 rises over it, Important rises last.
     Three panels now: the note that used to sit under the stack as a short
     tinted band is the third slide, so the page closes on the thing a
     reader has to know before taking either route.

     The loop was already written against however many .route-panel it
     finds and needs no change for the third; what did need saying is that
     the last panel is never pinned, which is what lets the footer arrive
     in the ordinary way instead of over a held viewport.

     Desktop width only, and only when motion is committed: this function is
     never reached under reduced motion or no-JS (the IIFE returns before the
     commit), and it bails below 861px, so those readers get a plain vertical
     run of three full sections with every line and both CTAs present.
     ScrollTrigger recomputes after fonts and after load, because the pin
     points depend on panel heights that are still settling at first paint. */
  async function initRoutes() {
    const stack = document.querySelector('.route-stack');
    if (!stack) return;
    if (!window.matchMedia('(min-width: 861px)').matches) return;

    const panels = [...stack.querySelectorAll('.route-panel')];
    if (panels.length < 2) return;

    // Only this page, at this width, pays for the library.
    const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
      import('gsap'),
      import('gsap/ScrollTrigger'),
    ]);
    gsap.registerPlugin(ScrollTrigger);
    stack.classList.add('is-pinned');       // gives the panels min-height: 100vh

    // Pin every panel but the last; the last one carries on into the note.
    // A panel shorter than the viewport pins at top-top; a taller one pins at
    // bottom-bottom so its own content scrolls past before it releases.
    panels.forEach((panel, i) => {
      if (i === panels.length - 1) return;
      ScrollTrigger.create({
        trigger: panel,
        start: () => (panel.offsetHeight < window.innerHeight ? 'top top' : 'bottom bottom'),
        pin: true,
        pinSpacing: false,
      });
    });

    const refresh = () => ScrollTrigger.refresh();
    refresh();
    window.addEventListener('load', refresh, { once: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  }

  /* #quote — the one authorised effect (PDF p.6): the line travels left
     to right like a sign. On every desktop width it is a sign.

     The first build only switched the travel on when one copy of the line
     was wider than its lane. That held on a 1440 screen and failed on a
     wide one: past ~1690px the type stops growing (the clamp caps at
     3.8rem) while the lane keeps widening, so one copy fits, the function
     returned before adding the class, and the client saw a frozen
     quotation. Overflow is gone as a condition. The lane is filled
     instead: enough copies to cover it, that group doubled, and the pair
     travelling one group per cycle at a fixed 62 px a second, which also
     gives a 1280 and a 2560 screen the same pace.

     Below 700px it stays a wrapped, static quotation: a scrolling line is
     not something you read on a phone. Only the first copy carries the
     text for screen readers; every duplicate is aria-hidden. */
  function initQuoteSign() {
    const lane = document.querySelector("[data-quote-lane]");
    if (!lane) return;
    const track = lane.querySelector(".quote-track");
    const line = lane.querySelector("[data-quote-line]");
    if (!track || !line) return;

    const narrow = window.matchMedia("(max-width: 700px)");
    const SPEED = 62;             // px a second: a sign, not a news ticker
    let copies = 0;               // copies currently in the track
    let secs = 0;                 // seconds for one cycle, as applied

    const dropDups = () => track.querySelectorAll("[data-quote-dup]").forEach((el) => el.remove());

    const setup = () => {
      if (narrow.matches) {
        if (!copies) return;
        dropDups();
        lane.classList.remove("is-marquee");
        lane.style.removeProperty("--q-dur");
        copies = 0; secs = 0;
        return;
      }

      // The copy has to be measured in the layout it will run in: as a flex
      // item, set on one line, with the seam padding already on it. So the
      // class goes first and the reading is taken after — measuring the bare
      // block gave the lane width instead, and a sign three times too fast.
      const fresh = !lane.classList.contains("is-marquee");
      if (fresh) lane.classList.add("is-marquee");
      const one = line.getBoundingClientRect().width;
      if (!one) { if (fresh) lane.classList.remove("is-marquee"); return; }

      // A group has to be at least as wide as the lane, or the seam between
      // the two groups would drag a band of empty pine across the screen.
      const perGroup = Math.max(1, Math.ceil(lane.clientWidth / one));
      const want = perGroup * 2;
      const next = Math.max(6, Math.round(perGroup * one / SPEED));

      // A resize that changes neither the copy count nor the pace leaves the
      // running animation exactly where it is: no restart, no jump. The same
      // guard absorbs the sub-pixel drift a font swap leaves behind.
      const paceHeld = secs && Math.abs(next - secs) / secs < 0.05;
      if (want === copies && (paceHeld || next === secs)) return;

      if (want !== copies) {
        dropDups();
        const frag = document.createDocumentFragment();
        for (let i = 1; i < want; i++) {
          const dup = line.cloneNode(true);
          dup.setAttribute("aria-hidden", "true");
          dup.removeAttribute("data-quote-line");
          dup.setAttribute("data-quote-dup", "");
          frag.appendChild(dup);
        }
        track.appendChild(frag);
        copies = want;
      }
      if (!paceHeld) {
        lane.style.setProperty("--q-dur", next + "s");
        secs = next;
      }
    };

    setup();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setup);

    let t = 0;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(setup, 220);
    }, { passive: true });
  }
})();
