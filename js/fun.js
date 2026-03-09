// Dock click sound
function playClick() {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.start(); osc.stop(ctx.currentTime + 0.1);
  } catch (_) {}
}

document.querySelectorAll('.dock-item').forEach(item => {
  item.addEventListener('click', playClick);
});


// Spotlight
const spotlight    = document.getElementById('spotlight');
const spotInput    = document.getElementById('spotlight-input');
const spotResults  = document.getElementById('spotlight-results');

const apps = [
  'finder', 'folder', 'launchpad', 'terminal',
  'photos', 'settings', 'trash', 'notes', 'calculator'
];

function openSpotlight() {
  spotlight.classList.add('open');
  spotInput.value = '';
  spotResults.innerHTML = '';
  spotInput.focus();
}

function closeSpotlight() {
  spotlight.classList.remove('open');
}

spotInput.addEventListener('input', () => {
  const q = spotInput.value.toLowerCase().trim();
  spotResults.innerHTML = '';
  if (!q) return;

  apps.filter(a => a.includes(q)).forEach(app => {
    const el = document.createElement('div');
    el.className = 'spot-result';
    el.textContent = app.charAt(0).toUpperCase() + app.slice(1);
    el.addEventListener('click', () => {
      openAppWindow(`apps/${app}/${app}.html`, el.textContent);
      closeSpotlight();
    });
    spotResults.appendChild(el);
  });
});

spotInput.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSpotlight();
  if (e.key === 'Enter') {
    const first = spotResults.querySelector('.spot-result');
    if (first) first.click();
  }
});

spotlight.addEventListener('click', e => {
  if (e.target === spotlight) closeSpotlight();
});

document.addEventListener('keydown', e => {
  if ((e.metaKey || e.ctrlKey) && e.key === ' ') {
    e.preventDefault();
    spotlight.classList.contains('open') ? closeSpotlight() : openSpotlight();
  }
});


// Konami code
const KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
let konamiIdx = 0;

document.addEventListener('keydown', e => {
  if (e.key === KONAMI[konamiIdx]) {
    konamiIdx++;
    if (konamiIdx === KONAMI.length) { triggerKonami(); konamiIdx = 0; }
  } else {
    konamiIdx = 0;
  }
});

function triggerKonami() {
  const msg = document.createElement('div');
  msg.id = 'konami-msg';
  msg.innerHTML = `
    <div class="konami-inner">
      <div class="konami-emoji">🎉</div>
      <h2>You found the secret!</h2>
      <p>Not many people get here.<br>You clearly have too much time — Adarsha approves.</p>
      <button onclick="document.getElementById('konami-msg').remove()">Close</button>
    </div>
  `;
  document.body.appendChild(msg);
}


// Kernel panic (click Apple logo)
document.querySelector('.menu-left .apple')?.addEventListener('click', triggerKernelPanic);

function triggerKernelPanic() {
  const panic = document.createElement('div');
  panic.id = 'kernel-panic';
  panic.innerHTML = `
    <div class="panic-content">
      <p>You need to restart your computer.</p>
      <p class="panic-sub">Hold down the Power button until it turns off,<br>then press it again to start it up.</p>
      <p class="panic-langs">
        <span>재시동하십시오.</span>
        <span>Reiniciando...</span>
        <span>Redémarrez.</span>
        <span>Riavvio...</span>
      </p>
    </div>
  `;
  document.body.appendChild(panic);
  setTimeout(() => {
    panic.style.opacity = '0';
    setTimeout(() => panic.remove(), 800);
  }, 3500);
}