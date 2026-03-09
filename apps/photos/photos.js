function initPhotos() {
  const grid  = document.getElementById('photos-grid');
  const count = document.getElementById('photos-count');
  if (!grid) return;

  const folder = 'apps/photos/images/';
  const photos = [
    { file: 'anime-girl.jpg',      category: 'anime' },
    { file: 'flower-guy.jpg',      category: 'misc'  },
    { file: 'glasses-nft.png',     category: 'art'   },
    { file: 'kaws.jpg',            category: 'art'   },
    { file: 'mortal-kombat.jpg',   category: 'misc'  },
    { file: 'offwhite.png',        category: 'art'   },
    { file: 'pink-skull.png',      category: 'art'   },
    { file: 'starwars.jpg',        category: 'misc'  },
    { file: 'vaporwave.jpg',       category: 'anime' },
  ];

  function render(filter) {
    const filtered = filter === 'all' ? photos : photos.filter(p => p.category === filter);
    grid.innerHTML = '';
    count.textContent = `${filtered.length} items`;

    filtered.forEach(({ file }) => {
      const img = document.createElement('img');
      img.src       = `${folder}${file}`;
      img.alt       = file;
      img.className = 'photo-item';
      img.onerror   = () => img.remove();
      img.addEventListener('click', () => openLightbox(img.src));
      grid.appendChild(img);
    });
  }

  document.querySelectorAll('.sidebar-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      render(item.dataset.filter || 'all');
    });
  });

  render('all');
}

function openLightbox(src) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.88);display:flex;align-items:center;justify-content:center;z-index:99999;cursor:zoom-out`;
  overlay.innerHTML = `<img src="${src}" style="max-width:90vw;max-height:90vh;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,0.6)">`;
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
}