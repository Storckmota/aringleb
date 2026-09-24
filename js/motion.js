/* ============================================================
   Body motion.

   The machinery PDF p.12 took out stays out: the About pin and its
   four-photograph swap, The Office cursor preview, the reel arc and the
   per-word quote reveal. The single fade-up every module used to share
   is gone too, replaced by the motion engine below.

   What runs:
     · the preloader (home page, first visit of the session);
     · the Insights rail: a native horizontal scroller at every width, and
       on a desktop width a real horizontal run — ScrollTrigger pins the
       Insights section and scrubs the track's X off the page scroll, over
       the track's own measured overflow;
     · the motion engine (initEngine): editorial paragraphs swept in word
       by word off the scroll, photographs settling and drifting inside
       their frames, and role-based entrances for labels, titles, text,
       actions, media and cards;
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

   finish() is the single funnel — the wipe's end, the 4.4s killswitch and
   the catch all land on it — so it is also where the page is told the
   overlay is gone. The hero's own entrance starts from that signal rather
   than from a clock, which is what keeps the two from playing at once.

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
  const docEl = document.documentElement;

  /* The one thing the rest of the page listens for. It fires the moment
     the overlay stops covering the document and never fires twice — the
     class is the state, the event is the notification, and a listener
     that arrives late reads the class instead of missing the event.
     js/hero.js holds the hero's entrance until this lands, so every exit
     below announces, including the ones that never draw anything. */
  const announce = () => {
    if (docEl.classList.contains('preloader-done')) return;
    docEl.classList.add('preloader-done');
    document.dispatchEvent(new Event('ar:preloader-done'));
  };

  const overlay = document.getElementById('site-preloader');
  if (!overlay) { announce(); return; }
  if (!docEl.classList.contains('preloader-on')) {
    overlay.remove();
    announce();
    return;
  }

  const inner = overlay.querySelector('.preloader-inner');
  const word = overlay.querySelector('.preloader-word');
  const mark = overlay.querySelector('.preloader-mark');
  const dash = mark ? mark.querySelector('.pm-dash') : null;
  if (!inner || !word || !mark) { overlay.remove(); announce(); return; }

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    clearTimeout(kill);
    try { sessionStorage.setItem('arPreloaderSeen', '1'); } catch (e) { /* blocked */ }
    overlay.remove();
    announce();
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

  // Commit: from here the motion CSS is allowed to hide-then-reveal.
  docEl.classList.add('motion-on');

  initEngine();
  initQuoteSign();
  initRoutes();

  /* ============================================================
     Motion engine

     The generic reveal is gone: every module on every page used to rise
     16-20px and fade in on the same curve when it crossed the same line.
     In its place, three kinds of movement, each doing one job:

       1. the hero's opening — css/hero.css, released by js/hero.js once
          the preloader has left (unchanged hand-off, new choreography);
       2. scroll-linked motion — progress read straight off the page's
          position, so it moves exactly as fast as the reader scrolls and
          runs backwards when they do:
            · words: editorial paragraphs swept into place word by word;
            · media: photographs settling from 1.085 to 1 as they arrive
              and drifting inside their own frame (internal parallax);
       3. editorial reveals — one-shot entrances for labels, titles, text,
          actions, media and cards, each role with its own distance, blur
          and timing, sequenced inside the section in reading order.

     One loop drives everything in (2). Scroll and resize only schedule a
     frame; the frame reads every active component's geometry first and
     writes every style after, so there is no read/write interleaving.
     IntersectionObservers decide which components are active at all, so
     a paragraph three screens away costs nothing.

     Nothing here touches the scroll itself. No wheel or touch listener,
     no preventDefault, no scrollTo: the document scroll stays native.

     Guarantees: no-JS and reduced motion never reach this function (the
     IIFE returns first), so words are never split and nothing is hidden.
     The hidden states all key on classes this function adds, and every
     word's resting value is its visible one: a word only goes transparent
     when a frame has written it so. */
  function initEngine() {
    const narrow = window.matchMedia('(max-width: 860px)');
    const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const smooth = (t) => t * t * (3 - 2 * t);                 // smoothstep
    const expo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)); // ease-out-expo

    /* ---------- The loop ---------- */
    const live = new Set();       // components near the viewport
    let queued = false;
    let H = window.innerHeight;

    const frame = (now) => {
      queued = false;
      let again = false;
      const list = [...live];
      for (const c of list) c.read(H, now);             // all reads …
      for (const c of list) if (c.write(now)) again = true;   // … then all writes
      if (again) schedule();      // a time-based sweep still running
    };
    const schedule = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(frame);
    };

    const watch = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const c = e.target.__motion;
        if (!c) continue;
        if (e.isIntersecting) { live.add(c); c.wake && c.wake(); }
        else if (live.has(c)) {
          /* Leaving the band: settle before sleeping. A hard flick can
             carry a paragraph from half-swept to far above the viewport
             between two frames; without this last read and write it would
             sleep half-revealed. The read clamps it: whole above the
             viewport, unrevealed below it. Only a component that was live
             is settled — the observer's first report on a block that has
             never been near the screen is not a departure. */
          settle(c);
          live.delete(c);
        }
      }
      schedule();
    }, { rootMargin: '30% 0px 30% 0px' });

    const all = [];
    const register = (el, c) => { el.__motion = c; all.push(c); watch.observe(el); };
    const settle = (c) => { c.read(window.innerHeight, performance.now()); c.write(Infinity); };

    /* The observer only reports a change of state. A jump that carries a
       block from below the band to above it between two of its samples —
       End, a dragged scrollbar, a #hash — reports nothing, and the block
       keeps whatever it was last written. So once the scroll comes to
       rest, every block that is not live is settled against where it now
       is. Five or six blocks, once per gesture: nothing to measure. */
    let rest = 0;
    const settleIdle = () => { for (const c of all) if (!live.has(c)) settle(c); };
    window.addEventListener('scroll', () => {
      clearTimeout(rest);
      rest = setTimeout(settleIdle, 160);
    }, { passive: true });

    window.addEventListener('scroll', schedule, { passive: true });
    // The case drawer scrolls inside itself; its frames need the same loop.
    document.querySelectorAll('.case-drawer-panel').forEach((p) =>
      p.addEventListener('scroll', schedule, { passive: true }));
    let rt = 0;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        H = window.innerHeight;
        media.forEach((m) => m.measure());
        schedule();
      }, 120);
    }, { passive: true });

    /* ---------- 2a. Words ----------
       The paragraph keeps its own markup: every text node is split at its
       spaces, each word wrapped in an inline-block span, and the spaces
       themselves stay as plain text nodes between them. So wrapping is
       the browser's, selection and copy return the original sentence,
       <strong> and every other inline element keep their meaning, and a
       screen reader meets the same run of text it met before.

       Progress is the block's own passage through the viewport:

         start  its top at 98% of the viewport height
         end    its centre at 58% — a little below the middle, so a short
                dek is whole before it reaches the line the eye reads on
                and a long paragraph completes as its middle arrives.

         p     = smoothstep( clamp01( (0.98·H − top) / (0.98·H − (0.58·H − h/2)) ) )

       That progress drives a sweep across the words in reading order.
       With N words and a window of W words in transition at once:

         t(i)  = clamp01( (p · (N + W) − i) / W )
         opacity = smoothstep(t),   shift = (1 − smoothstep(t)) · 0.24em

       W is about a sixth of the paragraph (never under 4), so a handful of
       neighbours are always mid-way: it reads as a wave across the lines,
       not a typewriter. Scroll back up and the wave runs backwards.

       A block that is already on screen when the page opens (a masthead
       dek, a reload half-way down, a #hash landing) has no scroll left to
       drive it, so it takes the same sweep over time instead — 1.6s on a
       smoothstep, so the wave is seen crossing the lines rather than
       front-loaded — and then hands back to the scroll. */
    const WORD_TARGETS = [
      '.about-body .body-p',       // About: the whole biography
      '.cases-lede',               // Cases: the introduction
      '.page-open-dek',            // inner-page openings (Opportunities, Insights, Contact)
      '.diag-turn-p',              // Opportunities: the closing argument
    ].join(',');

    const splitWords = (block) => {
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      const words = [];
      for (const node of nodes) {
        const parts = node.nodeValue.split(/(\s+)/);
        if (parts.length === 1 && !parts[0].trim()) continue;
        const frag = document.createDocumentFragment();
        for (const part of parts) {
          if (!part) continue;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); continue; }
          const w = document.createElement('span');
          w.className = 'w';
          w.textContent = part;
          frag.appendChild(w);
          words.push(w);
        }
        node.parentNode.replaceChild(frag, node);
      }
      return words;
    };

    document.querySelectorAll(WORD_TARGETS).forEach((block) => {
      const words = splitWords(block);
      block.classList.add('is-words');
      const N = words.length;
      const W = Math.max(4, Math.round(N / 6));
      const last = new Float32Array(N).fill(-1);
      let top = 0, h = 0, p = 0;
      let t0 = 0;           // start of the time sweep, if the block opened on screen
      let lastS = -1;
      let intro = false;

      const c = {
        wake() {
          // First activation while already past the start line: sweep in time.
          if (t0 === 0) {
            const r = block.getBoundingClientRect();
            t0 = -1;
            if (r.top < 0.98 * window.innerHeight && r.bottom > 0) { intro = true; t0 = performance.now(); }
          }
        },
        read(Hh) {
          const r = block.getBoundingClientRect();
          top = r.top; h = r.height;
          const start = 0.98 * Hh;
          const end = 0.58 * Hh - h / 2;
          p = smooth(clamp01((start - top) / Math.max(1, start - end)));
        },
        write(now) {
          let s = p;
          let running = false;
          if (intro) {
            const k = clamp01((now - t0) / 1600);
            s = p * smooth(k);
            if (k < 1) running = true; else intro = false;
          }
          // Nothing moved since the last frame: nothing to write.
          const sq = Math.round(s * 1000);
          if (sq === lastS) return running;
          lastS = sq;
          const span = s * (N + W);
          for (let i = 0; i < N; i++) {
            const t = smooth(clamp01((span - i) / W));
            const q = Math.round(t * 100) / 100;
            if (q === last[i]) continue;
            last[i] = q;
            const st = words[i].style;
            if (q >= 1) { st.removeProperty('--word-opacity'); st.removeProperty('--word-shift'); }
            else {
              st.setProperty('--word-opacity', q);
              st.setProperty('--word-shift', ((1 - q) * 0.24).toFixed(3) + 'em');
            }
          }
          block.style.setProperty('--progress', s.toFixed(3));
          return running;
        },
      };
      register(block, c);
    });

    /* ---------- 2b. Media: settle and drift ----------
       Photographs that are read as photographs (not thumbnails, not
       cards) sit in their frame a little larger than it, and two things
       are read off the frame's position:

         --reveal-scale  1.085 when the frame's top enters, easing to 1 by
                         the time it reaches 35% of the viewport — the
                         picture settles into place as it arrives;
         --parallax-y    the frame's centre against the viewport's centre,
                         −1 … 1, times the amplitude — the picture drifts
                         inside a frame that itself scrolls normally.

       The amplitude is a share of the frame's height, capped: 16% up to
       170px on a desktop, 8% up to 48px on a phone. The image is made taller
       than its frame by twice that (css/site.css, .px), so the drift never
       shows an edge. Only the <img> moves; the frame, and so the layout,
       never does. The hero is not in this list: its framing is approved and
       its crop is the composition. */
    const MEDIA_TARGETS = [
      '.about-shot',
      '.case-drawer-panel .case-shot--wide',
      '.case-drawer-panel .case-shot--tall',
    ].join(',');

    /* The compositor layer (will-change) is granted on a much wider band
       than the one that runs the maths — a screen above and below — so it
       is created once as a picture approaches and dropped once it is well
       gone. Toggling it on the same edge as the loop meant creating and
       destroying a layer the size of a photograph mid-scroll, and each of
       those re-rasterised the picture: measured, that was the whole of the
       jank this engine added on a throttled phone. */
    const layer = new IntersectionObserver((entries) => {
      for (const e of entries) e.target.classList.toggle('is-live', e.isIntersecting);
    }, { rootMargin: '100% 0px 100% 0px' });

    const media = [...document.querySelectorAll(MEDIA_TARGETS)].map((fig) => {
      fig.classList.add('px');
      let amp = 0, top = 0, h = 0, y = 0, sc = 1;
      let lastY = NaN, lastS = NaN;
      const c = {
        measure() {
          const fh = fig.offsetHeight;
          // --px-k lets a frame ask for less drift (css/site.css): a portrait
          // with little headroom above the face cannot afford the full range.
          const k = parseFloat(getComputedStyle(fig).getPropertyValue('--px-k'));
          amp = (narrow.matches ? Math.min(48, fh * 0.08) : Math.min(170, fh * 0.16)) * (isNaN(k) ? 1 : k);
          fig.style.setProperty('--px-amp', Math.round(amp) + 'px');
        },
        read(Hh) {
          const r = fig.getBoundingClientRect();
          top = r.top; h = r.height;
          if (!h) return;
          const d = (top + h / 2 - Hh / 2) / (Hh / 2 + h / 2);
          y = Math.max(-1, Math.min(1, d)) * amp;
          const e = clamp01((Hh - top) / (0.65 * Hh));
          sc = 1 + (narrow.matches ? 0.05 : 0.085) * (1 - expo(e));
        },
        write() {
          const ry = Math.round(y * 10) / 10, rs = Math.round(sc * 1000) / 1000;
          if (ry !== lastY) { fig.style.setProperty('--parallax-y', ry + 'px'); lastY = ry; }
          if (rs !== lastS) { fig.style.setProperty('--reveal-scale', rs); lastS = rs; }
          return false;
        },
      };
      c.measure();
      register(fig, c);
      layer.observe(fig);
      return c;
    });

    /* ---------- 3. Editorial reveals ----------
       A module ([data-rv], and each inner page's opening) is broken into
       the parts a reader meets in order, and every part enters by its
       role rather than by one shared recipe:

         label   24px, no blur, .9s    — it only has to be there first
         title   44px, 6px blur, 1.25s — the one that visibly arrives
         text    36px, 5px blur, 1.1s
         action  28px, 3px blur, 1s
         card    48px, 5px blur, 1.2s  — whole cards in a row
         media   a mask drawn open from the foot, 1.4s; the picture's scale
                 is the scroll's (2b), so the two read as one gesture

       Order inside a module is reading order at 110ms a step; modules that
       belong together are offset by their data-rv-i at 120ms. Paragraphs
       the word sweep owns are skipped, so no element is ever driven by two
       systems. Reveal-once: .is-in goes on and nothing takes it off.

       The first screen of an open case is not in here: the drawer has its
       own opening (css/site.css), and a panel that is display:none at load
       is not revealed by the sweep either (a zero rect is not "above the
       line", it is not rendered). */
    const LABEL = '.sec-kicker, .page-kicker, .press-sub-label, .case-aw-title, .route-kind, .sec-head';
    const TITLE = 'h1, h2, h3, .route-code';
    const ACTION = '.btn-solid, .btn-outline, .btn-ghost, .about-act, .link-arrow';
    const MEDIA = 'figure, .case-shot, .about-shot';
    const CARD = '.reel, .press-item, .diag-cards > li, .case-marks > li';

    const roleOf = (el) => {
      if (el.matches(CARD)) return 'card';
      if (el.matches(MEDIA)) return 'media';
      if (el.matches(LABEL)) return 'label';
      if (el.matches(TITLE)) return 'title';
      if (el.matches(ACTION) || el.querySelector(':scope > .btn-solid, :scope > .btn-outline, :scope > .btn-ghost')) return 'action';
      return 'text';
    };

    const partsOf = (mod) => {
      const r = roleOf(mod);
      if (r === 'card' || r === 'media' || r === 'title') return [mod];
      const out = [];
      const walk = (el, depth) => {
        for (const ch of el.children) {
          if (ch.matches('.is-words')) continue;                     // the sweep owns it
          if (ch.matches(CARD)) { out.push(ch); continue; }
          const plainWrapper = ch.tagName === 'DIV' && !ch.matches(LABEL + ',' + MEDIA) && ch.children.length > 1;
          if (depth < 2 && (plainWrapper || ch.querySelector(':scope > .is-words'))) { walk(ch, depth + 1); continue; }
          out.push(ch);
        }
      };
      walk(mod, 0);
      return out;
    };

    const outer = [...document.querySelectorAll('[data-rv], .page-open-say, .page-open-side')]
      .filter((m) => !m.parentElement.closest('[data-rv]'))
      .filter((m) => !m.matches('.case-layer .case-head, .case-layer .case-shot--lead, .case-layer .case-copy'));

    const pending = new Set();
    outer.forEach((mod) => {
      const parts = partsOf(mod);
      if (!parts.length) return;
      const base = (parseInt(mod.getAttribute('data-rv-i'), 10) || 0) * 120;
      parts.forEach((part, k) => {
        part.classList.add('rv', 'rv--' + roleOf(part));
        const i = part.matches(CARD) && part !== mod ? k * 90 : k * 110;
        part.style.setProperty('--rv-delay', (base + i) + 'ms');
      });
      mod.classList.add('rv-group');
      pending.add(mod);
    });

    const show = (mod) => {
      mod.classList.add('is-in');
      pending.delete(mod);
      io.unobserve(mod);
      if (!pending.size) done();
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) show(e.target); });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
    pending.forEach((m) => io.observe(m));

    /* The observer alone can strand a module a hard flick or a #hash jump
       carries over the line between two frames (ratio 0 before and after).
       A debounced sweep lets through anything already above the line. */
    let st = 0;
    const sweep = () => {
      const line = window.innerHeight * 0.9;
      [...pending].forEach((m) => {
        const r = m.getBoundingClientRect();
        if (r.height && r.top < line) show(m);
      });
    };
    const queue = () => { clearTimeout(st); st = setTimeout(sweep, 140); };
    const onShow = (e) => { if (e.persisted) sweep(); };
    const done = () => {
      clearTimeout(st);
      window.removeEventListener('scroll', queue);
      window.removeEventListener('pageshow', onShow);
      io.disconnect();
      docEl.classList.add('rv-done');
    };
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('pageshow', onShow);
    window.addEventListener('load', sweep, { once: true });
    sweep();
    if (!pending.size) done();

    schedule();
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
