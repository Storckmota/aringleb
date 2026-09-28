/* Social cards. A permanent video source is added as data-video-src on the
   media figure (optionally data-video-type, default video/mp4). Without one
   the real poster stays a plain image and no control is rendered; without
   JavaScript the poster and the "View on Instagram" link are the card.

   With a source, the video is built only when the card nears the viewport,
   plays muted and looped while at least half of it is on screen, and pauses
   off screen or when the tab is hidden. The picture itself is the control:
   an invisible button covers it, so a click, a tap, Enter or Space opens
   the video full screen with sound; leaving full screen mutes it again.
   Only one video is ever unmuted. Reduced motion: nothing autoplays, the
   picture still plays when pressed. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasIO = 'IntersectionObserver' in window;
  const records = [];
  // A press that travelled further than this was a drag of the rail or a
  // scroll, not a request to play.
  const DRAG_SLOP = 10;

  const fullscreenEl = () => document.fullscreenElement || document.webkitFullscreenElement || null;

  const muteOthers = keep => {
    for (const r of records) if (r !== keep && r.video && !r.video.muted) r.video.muted = true;
  };

  const shouldPlay = r => r.full || (!reduce && r.visible && !document.hidden);

  const sync = r => {
    const {video} = r;
    if (!video || !r.loaded) return;
    if (shouldPlay(r)) video.play().catch(() => {});
    else if (!video.paused) video.pause();
  };

  const load = r => {
    if (r.loaded) return;
    r.loaded = true;
    const source = document.createElement('source');
    source.src = r.src;
    source.type = r.type;
    // A failing <source> reports on itself, not on the video.
    source.addEventListener('error', () => r.fail(), {once:true});
    r.video.append(source);
    r.video.load();
  };

  const exitFull = r => {
    if (!r.full) return;
    r.full = false;
    r.inline = false;
    r.video.muted = true;
    r.video.controls = false;
    r.video.setAttribute('aria-hidden', 'true');
    r.media.classList.remove('is-full', 'is-inline');
    sync(r);
  };

  const enterFull = r => {
    load(r);
    const {video} = r;
    muteOthers(r);
    video.muted = false;
    r.full = true;
    r.media.classList.add('is-full', 'has-frame');
    video.controls = true;
    // Full screen, the video and its native controls are the interface.
    video.removeAttribute('aria-hidden');

    // play() inside the click keeps the gesture, which is what lets the
    // sound start at all.
    video.play().catch(() => {});

    // No full screen available: the video plays in its card with sound and
    // native controls, and the cover steps aside so those controls answer.
    const inline = () => { r.inline = true; r.media.classList.add('is-inline'); };
    if (video.requestFullscreen) {
      video.requestFullscreen().catch(inline);
    } else if (video.webkitRequestFullscreen) {
      video.webkitRequestFullscreen();
    } else if (video.webkitEnterFullscreen) {
      // iOS Safari: only the video element itself can go full screen.
      try { video.webkitEnterFullscreen(); } catch { inline(); }
    } else {
      inline();
    }
  };

  document.addEventListener('fullscreenchange', () => {
    const el = fullscreenEl();
    for (const r of records) if (r.full && el !== r.video) exitFull(r);
  });
  document.addEventListener('webkitfullscreenchange', () => {
    const el = fullscreenEl();
    for (const r of records) if (r.full && el !== r.video) exitFull(r);
  });
  document.addEventListener('visibilitychange', () => { for (const r of records) sync(r); });

  const near = hasIO ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const r = records.find(item => item.media === entry.target);
      if (r) { load(r); near.unobserve(entry.target); }
    }
  }, {rootMargin:'600px 0px'}) : null;

  const seen = hasIO ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      const r = records.find(item => item.media === entry.target);
      if (!r) continue;
      r.visible = entry.isIntersecting;
      // Scrolling an inline, unmuted fallback away leaves it silent.
      if (!r.visible && r.inline && r.full) exitFull(r);
      sync(r);
    }
  }, {threshold:.55}) : null;

  for (const item of document.querySelectorAll('[data-social-item]')) {
    const media = item.querySelector('[data-social-media]');
    const poster = media?.querySelector('img');
    if (!media || !poster) continue;

    poster.addEventListener('error', () => {
      poster.hidden = true;
      media.classList.add('is-broken');
      media.setAttribute('role','img');
      media.setAttribute('aria-label','Social preview unavailable');
    }, {once:true});

    const src = media.dataset.videoSrc?.trim();
    if (!src) continue;

    const title = item.querySelector('.reel-t')?.textContent?.trim() || 'Social video';

    const video = document.createElement('video');
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.preload = 'metadata';
    video.poster = poster.currentSrc || poster.src;
    if (!reduce) { video.autoplay = true; video.setAttribute('autoplay', ''); }
    video.disablePictureInPicture = true;
    // The cover button is the accessible control; the moving picture is
    // decoration until it is full screen.
    video.setAttribute('aria-hidden', 'true');
    video.tabIndex = -1;

    // A real <button> over the whole picture, with nothing drawn on it: the
    // name says which video it plays, the keyboard gets Enter and Space for
    // free, and the focus ring shows only for keyboard focus (CSS).
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'video-hit';
    button.setAttribute('aria-label', `Play “${title}” full screen with sound`);

    const r = {
      item, media, video, button, src,
      type: media.dataset.videoType || 'video/mp4',
      loaded: false, visible: false, full: false, inline: false,
      fail() {
        video.remove();
        button.remove();
        media.classList.remove('has-video', 'has-frame', 'is-full');
        media.classList.add('is-video-fallback');
        const i = records.indexOf(r);
        if (i > -1) records.splice(i, 1);
      },
    };

    let start = null;
    button.addEventListener('pointerdown', e => { start = {x:e.clientX, y:e.clientY}; });
    const open = e => {
      // The card sits beside its Instagram link; a press on the picture
      // must never travel to it or to anything listening on the card.
      e.preventDefault();
      e.stopPropagation();
      // A keyboard press has no pointer; a pointer press that moved was a drag.
      const from = start;
      start = null;
      if (e.detail && from && Math.hypot(e.clientX - from.x, e.clientY - from.y) > DRAG_SLOP) return;
      enterFull(r);
    };
    button.addEventListener('click', open);
    video.addEventListener('click', e => e.stopPropagation());

    video.addEventListener('playing', () => media.classList.add('has-frame'));
    // Autoplay can start a video the observer has since scrolled away from.
    video.addEventListener('play', () => { if (!shouldPlay(r)) video.pause(); });
    // Native controls can unmute too; whichever speaks, the rest go quiet.
    video.addEventListener('volumechange', () => { if (!video.muted) muteOthers(r); });
    video.addEventListener('webkitendfullscreen', () => exitFull(r));
    video.addEventListener('error', () => r.fail(), {once:true});

    media.classList.add('has-video');
    media.append(video, button);
    records.push(r);

    if (hasIO) { near.observe(media); seen.observe(media); }
    else { load(r); r.visible = true; sync(r); }
  }
})();
