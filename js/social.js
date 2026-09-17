/* Permanent video sources can be added as data-video-src on a media figure.
   Without one, the real poster remains a plain image and no false controls
   are rendered. */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = [...document.querySelectorAll('[data-social-item]')];
  const videos = [];

  for (const item of items) {
    const media = item.querySelector('[data-social-media]');
    const poster = media?.querySelector('img');
    const source = media?.dataset.videoSrc;
    if (!media || !poster) continue;

    poster.addEventListener('error', () => {
      poster.hidden = true;
      media.classList.add('is-broken');
      media.setAttribute('role','img');
      media.setAttribute('aria-label','Social preview unavailable');
    }, {once:true});
    if (!source) continue;

    const video = document.createElement('video');
    video.muted = true;
    video.defaultMuted = true;
    video.autoplay = !reduce;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.poster = poster.currentSrc || poster.src;
    video.src = source;
    video.setAttribute('aria-label', item.querySelector('.reel-t')?.textContent?.trim() || 'Social video');
    if (reduce) video.controls = true;

    const audio = document.createElement('button');
    audio.type = 'button';
    audio.className = 'video-audio';
    audio.textContent = 'Unmute';
    audio.setAttribute('aria-label','Unmute video');
    if (reduce) audio.hidden = true;

    const setMuted = muted => {
      video.muted = muted;
      audio.textContent = muted ? 'Unmute' : 'Mute';
      audio.setAttribute('aria-label', muted ? 'Unmute video' : 'Mute video');
      if (!muted) {
        for (const other of videos) {
          if (other.video === video) continue;
          other.video.muted = true;
          other.audio.textContent = 'Unmute';
          other.audio.setAttribute('aria-label','Unmute video');
        }
      }
    };
    const toggle = () => setMuted(!video.muted);
    video.addEventListener('click', toggle);
    audio.addEventListener('click', toggle);
    video.addEventListener('error', () => {
      video.remove();
      audio.remove();
      poster.hidden = false;
      media.classList.add('is-video-fallback');
    }, {once:true});

    poster.hidden = true;
    media.append(video,audio);
    videos.push({video,audio});
  }

  if (reduce || !videos.length || !('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const record = videos.find(item => item.video === entry.target);
      if (!record) continue;
      if (entry.isIntersecting) record.video.play().catch(() => { record.video.controls = true; });
      else record.video.pause();
    }
  }, {threshold:.55});
  for (const {video} of videos) observer.observe(video);
})();
