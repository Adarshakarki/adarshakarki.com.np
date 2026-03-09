// Runs immediately before anything else is visible
(function () {
  const boot = document.createElement('div');
  boot.id = 'boot-screen';
  boot.innerHTML = `
    <img src="assets/icons/applehd.png" class="boot-apple" alt="Apple">
    <div class="boot-bar-track"><div class="boot-bar-fill" id="boot-bar"></div></div>
  `;
  document.body.appendChild(boot);

  // Startup chime via Web Audio API
  function playChime() {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const gain = ctx.createGain();
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.2);

      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = freq;
        osc.connect(gain);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 1.8);
      });
    } catch (_) {}
  }

  // Animate progress bar then fade out
  let progress = 0;
  const bar = document.getElementById('boot-bar');
  const fill = setInterval(() => {
    progress += Math.random() * 6 + 2;
    if (progress >= 100) { progress = 100; clearInterval(fill); }
    bar.style.width = progress + '%';
  }, 80);

  playChime();

  setTimeout(() => {
    boot.style.opacity = '0';
    setTimeout(() => boot.remove(), 700);
  }, 3000);
})();