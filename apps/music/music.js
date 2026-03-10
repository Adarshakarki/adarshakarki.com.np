const SONG_FILES = [
  'Frank Ocean - Nights.m4a',
  'Future - Low Life (feat. The Weeknd).m4a',
  'Ken Carson - ss.m4a',
  'Playboi Carti - POP OUT.m4a',
  'The Weeknd - Is There Someone Else.m4a',
  'Travis Scott - FE!N (feat. Playboi Carti).m4a',
  'Yeat - COMË N GO.m4a',
];

// Load jsmediatags from CDN once
function loadTagReader(cb) {
  if (window.jsmediatags) { cb(); return; }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js';
  s.onload  = cb;
  s.onerror = cb; // continue even if CDN fails
  document.head.appendChild(s);
}

// Read tags from a file — fetches as blob so m4a/mp3 both work
function readTags(file) {
  const fallback = {
    title:  file.replace(/\.[^.]+$/, '').replace(/_/g, ' '),
    artist: 'Unknown Artist',
    artUrl: null,
  };

  return fetch(`apps/music/songs/${file}`)
    .then(r => r.blob())
    .then(blob => new Promise(resolve => {
      if (!window.jsmediatags) { resolve(fallback); return; }

      window.jsmediatags.read(blob, {
        onSuccess(tag) {
          const t      = tag.tags;
          const title  = t.title  || fallback.title;
          const artist = t.artist || fallback.artist;
          let artUrl   = null;

          if (t.picture) {
            const { data, format } = t.picture;
            const artBlob = new Blob([new Uint8Array(data)], { type: format });
            artUrl = URL.createObjectURL(artBlob);
          }

          resolve({ title, artist, artUrl });
        },
        onError() { resolve(fallback); }
      });
    }))
    .catch(() => fallback);
}

// Shared player singleton
if (!window._musicPlayer) {
  window._musicPlayer = {
    audio:     new Audio(),
    current:   0,
    playing:   false,
    meta:      [],        // { title, artist, artUrl } per song
    ready:     false,
    listeners: [],

    on(fn)  { this.listeners.push(fn); },
    off(fn) { this.listeners = this.listeners.filter(l => l !== fn); },
    emit()  { this.listeners.forEach(fn => fn()); },

    load(index) {
      this.current   = ((index % SONG_FILES.length) + SONG_FILES.length) % SONG_FILES.length;
      this.audio.src = `apps/music/songs/${SONG_FILES[this.current]}`;
      this.audio.load();
      this.emit();
    },

    play()   { this.audio.play().then(() => { this.playing = true;  this.emit(); }).catch(() => {}); },
    pause()  { this.audio.pause(); this.playing = false; this.emit(); },
    toggle() { this.playing ? this.pause() : this.play(); },

    next() { const n = (this.current + 1) % SONG_FILES.length; this.load(n); if (this.playing) this.play(); },
    prev() {
      if (this.audio.currentTime > 3) { this.audio.currentTime = 0; this.emit(); return; }
      const p = (this.current - 1 + SONG_FILES.length) % SONG_FILES.length;
      this.load(p);
      if (this.playing) this.play();
    },

    seek(pct) { if (this.audio.duration) this.audio.currentTime = (pct / 100) * this.audio.duration; },

    get pct() { return this.audio.duration ? (this.audio.currentTime / this.audio.duration) * 100 : 0; },

    fmt(s) {
      if (!s || isNaN(s)) return '0:00';
      return `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
    },

    currentMeta() { return this.meta[this.current] || { title: SONG_FILES[this.current], artist: '—', artUrl: null }; },
  };

  window._musicPlayer.audio.addEventListener('ended', () => window._musicPlayer.next());

  // Read all tags then load first song + build mini
  loadTagReader(async () => {
    const mp    = window._musicPlayer;
    mp.meta     = await Promise.all(SONG_FILES.map(f => readTags(f)));
    mp.ready    = true;
    mp.load(0);
    buildMiniPlayer();
  });
}

// Mini player
function buildMiniPlayer() {
  if (document.getElementById('music-mini')) return;

  const mini = document.createElement('div');
  mini.id    = 'music-mini';
  mini.innerHTML = `
    <div class="mini-art-placeholder" id="mini-art-wrap">♪</div>
    <div class="mini-info" id="mini-open-trigger">
      <div class="mini-title"  id="mini-title">Loading…</div>
      <div class="mini-artist" id="mini-artist"></div>
    </div>
    <div class="mini-controls">
      <button class="mini-btn" id="mini-prev"><img src="apps/music/icons/skip-back.svg" class="mini-icon" alt="prev"></button>
      <button class="mini-btn" id="mini-play"><img src="apps/music/icons/play.svg" class="mini-icon" alt="play" id="mini-play-icon"></button>
      <button class="mini-btn" id="mini-next"><img src="apps/music/icons/skip-forward.svg" class="mini-icon" alt="next"></button>
      <button class="mini-btn mini-btn-close" id="mini-close"><img src="apps/music/icons/x.svg" class="mini-icon" alt="close"></button>
    </div>
    <div class="mini-seek"><div class="mini-seek-fill" id="mini-seek-fill"></div></div>
  `;
  document.body.appendChild(mini);

  const mp       = window._musicPlayer;
  const openFull = () => openAppWindow('apps/music/music.html', 'Music');

  mini.querySelector('#mini-prev').onclick  = e => { e.stopPropagation(); mp.prev(); };
  mini.querySelector('#mini-next').onclick  = e => { e.stopPropagation(); mp.next(); };
  mini.querySelector('#mini-play').onclick  = e => { e.stopPropagation(); mp.toggle(); };
  mini.querySelector('#mini-close').onclick = e => { e.stopPropagation(); mp.pause(); mini.remove(); };
  mini.querySelector('#mini-art-wrap').onclick       = openFull;
  mini.querySelector('#mini-open-trigger').onclick   = openFull;

  function syncMini() {
    const m    = mp.currentMeta();
    mini.querySelector('#mini-title').textContent  = m.title;
    mini.querySelector('#mini-artist').textContent = m.artist;
    mini.querySelector('#mini-play-icon').src = mp.playing
      ? 'apps/music/icons/pause.svg'
      : 'apps/music/icons/play.svg';

    const wrap = mini.querySelector('#mini-art-wrap');
    if (m.artUrl) {
      wrap.innerHTML = `<img class="mini-art" src="${m.artUrl}" onclick="openAppWindow('apps/music/music.html','Music')">`;
      wrap.className = '';
    } else {
      wrap.innerHTML = '♪';
      wrap.className = 'mini-art-placeholder';
    }
  }

  setInterval(() => {
    const fill = mini.querySelector('#mini-seek-fill');
    if (fill) fill.style.width = mp.pct + '%';
  }, 500);

  mp.on(syncMini);
  syncMini();
}

// Full window
function initMusic(winEl) {
  const mp = window._musicPlayer;

  // If tags not loaded yet wait for them
  if (!mp.ready) {
    const check = setInterval(() => {
      if (mp.ready) { clearInterval(check); initMusic(winEl); }
    }, 200);
    return;
  }

  const playlist       = winEl.querySelector('#music-playlist');
  const artImg         = winEl.querySelector('#music-art-full');
  const artPlaceholder = winEl.querySelector('#music-art-placeholder');
  const titleEl        = winEl.querySelector('#music-title-full');
  const artistEl       = winEl.querySelector('#music-artist-full');
  const seekEl         = winEl.querySelector('#music-seek');
  const currentEl      = winEl.querySelector('#music-current');
  const durationEl     = winEl.querySelector('#music-duration');
  const playBtn        = winEl.querySelector('#music-play-full');

  // Build playlist from metadata
  SONG_FILES.forEach((file, i) => {
    const m  = mp.meta[i] || { title: file, artist: '—', artUrl: null };
    const li = document.createElement('li');

    const artEl = m.artUrl
      ? `<img src="${m.artUrl}" style="width:36px;height:36px;border-radius:5px;object-fit:cover;">`
      : `<div class="music-playlist-placeholder">♪</div>`;

    li.innerHTML = `
      ${artEl}
      <div class="music-playlist-info">
        <div class="music-playlist-name">${m.title}</div>
        <div class="music-playlist-artist">${m.artist}</div>
      </div>
    `;
    li.onclick = () => { mp.load(i); mp.play(); };
    playlist.appendChild(li);
  });

  function syncFull() {
    const m = mp.currentMeta();
    titleEl.textContent  = m.title;
    artistEl.textContent = m.artist;
    winEl.querySelector('#music-play-icon').src = mp.playing
      ? 'apps/music/icons/pause.svg'
      : 'apps/music/icons/play.svg';

    // Album art
    if (m.artUrl) {
      artImg.src = m.artUrl;
      artImg.onload = () => {
        artImg.classList.add('loaded');
        artPlaceholder.style.display = 'none';
      };
    } else {
      artImg.classList.remove('loaded');
      artPlaceholder.style.display = '';
    }

    // Active playlist item
    playlist.querySelectorAll('li').forEach((li, i) => {
      li.classList.toggle('active', i === mp.current);
    });
  }

  // Seek tick
  const tick = setInterval(() => {
    if (!winEl.isConnected) { clearInterval(tick); return; }
    const pct = mp.pct;
    seekEl.value              = pct;
    currentEl.textContent     = mp.fmt(mp.audio.currentTime);
    durationEl.textContent    = mp.fmt(mp.audio.duration);
    seekEl.style.background   = `linear-gradient(to right, #f38ba8 ${pct}%, #45475a ${pct}%)`;
  }, 500);

  seekEl.addEventListener('input', () => mp.seek(parseFloat(seekEl.value)));
  winEl.querySelector('#music-prev-full').onclick = () => mp.prev();
  winEl.querySelector('#music-next-full').onclick = () => mp.next();
  playBtn.onclick = () => mp.toggle();

  mp.on(syncFull);
  syncFull();

  winEl.querySelector('.btn.close').addEventListener('click', () => {
    mp.off(syncFull);
  }, { once: true });
}