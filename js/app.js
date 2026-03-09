// Restore wallpaper immediately on load
const savedWallpaper = localStorage.getItem('wallpaper');
if (savedWallpaper) document.body.style.backgroundImage = `url('${savedWallpaper}')`;

// Clock
function updateClock() {
  const now = new Date();
  const h   = now.getHours(), m = now.getMinutes().toString().padStart(2, '0');
  document.getElementById('date').textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  document.getElementById('time').textContent = `${h % 12 || 12}:${m} ${h >= 12 ? 'PM' : 'AM'}`;
}
updateClock();
setInterval(updateClock, 1000);

// Theme — called by settings app toggle
function setTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
}
if (localStorage.getItem('theme') === 'dark') setTheme(true);

// Click ripple
document.addEventListener('click', e => {
  const r = document.createElement('div');
  r.className = 'click-effect';
  r.style.cssText = `left:${e.clientX}px;top:${e.clientY}px`;
  document.body.appendChild(r);
  setTimeout(() => r.remove(), 450);
});

// Escape closes focused window
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const focused = document.querySelector('.app-window.focused');
  if (focused) focused.remove();
});

// Open external link
function openRepo(url) { window.open(url, '_blank'); }


const toggleKeyMap = {
  'wifiToggle':          'wifi',
  'bluetoothToggle':     'bluetooth',
  'airplaneToggle':      'airplane',
  'notificationsToggle': 'notifications',
};

function syncSettingsUI() {
  const darkToggle = document.getElementById('darkModeToggle');
  if (darkToggle) darkToggle.checked = localStorage.getItem('theme') === 'dark';

  Object.entries(toggleKeyMap).forEach(([id, key]) => {
    const el = document.getElementById(id);
    if (el) el.checked = localStorage.getItem(key) !== 'false';
  });

  const savedWp = localStorage.getItem('wallpaper');
  if (savedWp) {
    document.querySelectorAll('.wallpaper-thumb').forEach(t => {
      t.classList.toggle('active', t.dataset.src === savedWp);
    });
  }
}