function initGame(winEl) {
  // Guard — prevent double init if called twice on same window
  if (winEl._gameRunning) return;
  winEl._gameRunning = true;

  const canvas = winEl.querySelector('#gameCanvas');
  const ctx    = canvas.getContext('2d');

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width  = rect.width  || 700;
    canvas.height = rect.height || 300;
  }
  resizeCanvas();
  new ResizeObserver(resizeCanvas).observe(canvas.parentElement);

  // Catppuccin palette
  const C = {
    bg:          '#1a1b26',
    bgNight:     '#11111b',
    ground:      '#313244',
    groundNight: '#1e1e2e',
    grid:        '#89b4fa',
    text:        '#cdd6f4',
    subtext:     '#6c7086',
    blue:        '#89b4fa',
    red:         '#f38ba8',
    yellow:      '#f9e2af',
    mauve:       '#cba6f7',
    peach:       '#fab387',
    teal:        '#94e2d5',
  };

  // Dynamic helpers
  const W        = () => canvas.width;
  const H        = () => canvas.height;
  const GROUND_Y = () => canvas.height - 60;

  const CHAR_W   = 40;
  const CHAR_H   = 50;
  const CROUCH_H = 28;

  let state        = 'idle';
  let score        = 0;
  let hi           = parseInt(localStorage.getItem('adarshrun-hi') || '0');
  let speed        = 5;
  let frame        = 0;
  let nightMode    = false;
  let stars        = [];
  let groundOffset = 0;
  let raf;

  // Player
  const player = {
    x: 80,
    y: 0,
    vy: 0,
    jumps: 0,
    crouching: false,
    dead: false,

    get h()      { return this.crouching ? CROUCH_H : CHAR_H; },
    get w()      { return CHAR_W; },
    get bottom() { return this.y + this.h; },
    get right()  { return this.x + this.w - 6; },
    get left()   { return this.x + 6; },

    reset() {
      this.y        = GROUND_Y() - CHAR_H;
      this.vy       = 0;
      this.jumps    = 0;
      this.crouching = false;
      this.dead     = false;
    },

    jump() {
      if (this.jumps < 2) {
        this.vy = this.jumps === 0 ? -13 : -11;
        this.jumps++;
        playSound('jump', this.jumps === 2);
        this.crouching = false;
      }
    },

    crouch(on) {
      if (this.bottom >= GROUND_Y() - 2) {
        this.crouching = on;
        if (on) this.y = GROUND_Y() - CROUCH_H;
      }
    },

    update() {
      if (this.dead) return;
      this.vy += 0.65;
      this.y  += this.vy;
      if (this.y >= GROUND_Y() - this.h) {
        this.y     = GROUND_Y() - this.h;
        this.vy    = 0;
        this.jumps = 0;
      }
    },

    draw() {
      const cx  = this.x;
      const bob = (state === 'running' && !this.crouching) ? Math.sin(frame * 0.3) * 2 : 0;
      const cy  = this.crouching ? GROUND_Y() - CROUCH_H : this.y + bob;

      if (this.dead) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle   = C.red;
        ctx.beginPath();
        ctx.ellipse(cx + 20, cy + 25, 20, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      drawPixelChar(cx, cy, this.crouching);
    }
  };

  // Pixel character 
  function drawPixelChar(x, y, crouching) {
    if (crouching) {
      ctx.fillStyle = '#89dceb';
      ctx.fillRect(x + 2,  y + 8,  36, 14);
      ctx.fillStyle = '#74c7ec';
      ctx.fillRect(x + 2,  y + 8,  6,  14);
      ctx.fillRect(x + 32, y + 8,  6,  14);
      ctx.fillStyle = '#f5c2e7';
      ctx.fillRect(x + 10, y + 10, 20, 10);
      ctx.fillStyle = '#fae3b0';
      ctx.fillRect(x + 12, y,      16, 12);
      ctx.fillStyle = '#fab387';
      ctx.fillRect(x + 10, y,      20,  6);
      ctx.fillRect(x + 8,  y,       6,  4);
      ctx.fillStyle = '#89b4fa';
      ctx.fillRect(x + 11, y + 5,   6,  4);
      ctx.fillRect(x + 19, y + 5,   6,  4);
      ctx.fillStyle = '#1e1e2e';
      ctx.fillRect(x + 12, y + 6,   4,  2);
      ctx.fillRect(x + 20, y + 6,   4,  2);
      return;
    }

    const leg = state === 'running' ? Math.sin(frame * 0.35) * 5 : 0;

    // Legs
    ctx.fillStyle = '#45475a';
    ctx.fillRect(x + 10, y + 34, 8, 14 + leg);
    ctx.fillRect(x + 22, y + 34, 8, 14 - leg);
    // Shoes
    ctx.fillStyle = '#1e1e2e';
    ctx.fillRect(x + 8,  y + 46 + leg, 12, 4);
    ctx.fillRect(x + 20, y + 46 - leg, 12, 4);
    // Jacket
    ctx.fillStyle = '#89dceb';
    ctx.fillRect(x + 6,  y + 20, 28, 16);
    ctx.fillStyle = '#74c7ec';
    ctx.fillRect(x + 6,  y + 20, 7,  16);
    ctx.fillRect(x + 27, y + 20, 7,  16);
    // Pink shirt
    ctx.fillStyle = '#f5c2e7';
    ctx.fillRect(x + 13, y + 16, 14,  8);
    ctx.fillRect(x + 14, y + 20, 12,  4);
    // Arms
    ctx.fillStyle = '#89dceb';
    ctx.fillRect(x + 1,  y + 21 - leg * 0.5, 6, 14);
    ctx.fillRect(x + 33, y + 21 + leg * 0.5, 6, 14);
    // Hands
    ctx.fillStyle = '#fae3b0';
    ctx.fillRect(x + 1,  y + 33 - leg * 0.5, 6, 5);
    ctx.fillRect(x + 33, y + 33 + leg * 0.5, 6, 5);
    // Neck
    ctx.fillStyle = '#fae3b0';
    ctx.fillRect(x + 16, y + 13, 8, 6);
    // Head
    ctx.fillStyle = '#fae3b0';
    ctx.fillRect(x + 10, y + 2,  20, 16);
    ctx.fillRect(x + 7,  y + 7,   4,  6);
    ctx.fillRect(x + 29, y + 7,   4,  6);
    // Hair
    ctx.fillStyle = '#fab387';
    ctx.fillRect(x + 8,  y,      24,  8);
    ctx.fillRect(x + 6,  y + 2,   6,  8);
    ctx.fillRect(x + 28, y + 2,   6,  6);
    ctx.fillRect(x + 16, y - 2,   8,  4);
    ctx.fillStyle = '#f9e2af';
    ctx.fillRect(x + 18, y + 1,   6,  3);
    // Glasses frame
    ctx.fillStyle = '#89b4fa';
    ctx.fillRect(x + 10, y + 8,   8,  6);
    ctx.fillRect(x + 20, y + 8,   8,  6);
    ctx.fillRect(x + 17, y + 9,   4,  2);
    // Lens
    ctx.fillStyle = 'rgba(205,214,244,0.3)';
    ctx.fillRect(x + 11, y + 9,   6,  4);
    ctx.fillRect(x + 21, y + 9,   6,  4);
    // Pupils
    ctx.fillStyle = '#6c7086';
    ctx.fillRect(x + 13, y + 10,  2,  2);
    ctx.fillRect(x + 23, y + 10,  2,  2);
    // Outline
    ctx.strokeStyle = '#1e1e2e';
    ctx.lineWidth   = 1;
    ctx.strokeRect(x + 10, y + 2,  20, 16);
    ctx.strokeRect(x + 6,  y + 20, 28, 16);
  }

  // Obstacles
  const obstacles = [];
  let   nextSpawn = 80;

  // Pipe bottom: low enough that standing hits it, crouching clears it
  const PIPE_BOTTOM = () => GROUND_Y() - CHAR_H + 4;

  // Single jump apex ≈ 130px. Wall > 125px forces double jump.
  const TYPES = [

    // Short spike — easy single jump
    {
      type: 'spike', w: 36, h: 38, flying: false,
      collide(x) { return { x: x + 3, y: GROUND_Y() - this.h, w: this.w - 6, h: this.h }; },
      draw(x) {
        const gY = GROUND_Y();
        ctx.fillStyle = 'rgba(203,166,247,0.12)';
        ctx.beginPath(); ctx.ellipse(x + 18, gY + 2, 22, 5, 0, 0, Math.PI*2); ctx.fill();
        const heights = [0.55, 1.0, 0.8, 0.6];
        const colors  = ['#cba6f7','#b4befe','#cba6f7','#b4befe'];
        ctx.shadowBlur = 10;
        for (let i = 0; i < 4; i++) {
          const sx = x + i * 9, sh = this.h * heights[i], sy = gY - sh;
          const g  = ctx.createLinearGradient(sx, sy, sx, gY);
          g.addColorStop(0, colors[i]); g.addColorStop(1, 'rgba(127,90,240,0.5)');
          ctx.fillStyle = g; ctx.shadowColor = colors[i];
          ctx.beginPath(); ctx.moveTo(sx, gY); ctx.lineTo(sx+4.5, sy); ctx.lineTo(sx+9, gY); ctx.closePath(); ctx.fill();
        }
        ctx.shadowBlur = 0;
      }
    },

    // Medium wall — comfortable single jump
    {
      type: 'wall_sm', w: 28, h: 70, flying: false,
      collide(x) { return { x: x, y: GROUND_Y() - this.h, w: this.w, h: this.h }; },
      draw(x) {
        const gY = GROUND_Y(), y = gY - this.h;
        const g  = ctx.createLinearGradient(x, y, x + this.w, gY);
        g.addColorStop(0, '#cba6f7'); g.addColorStop(1, '#45475a');
        ctx.fillStyle = g; ctx.shadowColor = '#cba6f7'; ctx.shadowBlur = 14;
        ctx.fillRect(x, y, this.w, this.h); ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
        for (let i = y+4; i < gY; i += 6) { ctx.beginPath(); ctx.moveTo(x+2,i); ctx.lineTo(x+this.w-2,i); ctx.stroke(); }
        ctx.fillStyle = '#cba6f7'; ctx.shadowColor = '#cba6f7'; ctx.shadowBlur = 12;
        ctx.fillRect(x - 2, y - 2, this.w + 4, 5); ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x+2, y+5, 4, this.h-5);
      }
    },

    // Tall wall — MUST double jump (h=130 > single jump apex ~125px)
    {
      type: 'wall_lg', w: 28, h: 128, flying: false,
      collide(x) { return { x: x, y: GROUND_Y() - this.h, w: this.w, h: this.h }; },
      draw(x) {
        const gY = GROUND_Y(), y = gY - this.h;
        const g  = ctx.createLinearGradient(x, y, x + this.w, gY);
        g.addColorStop(0, '#89dceb'); g.addColorStop(0.5, '#04a5e5'); g.addColorStop(1, '#1e1e2e');
        ctx.fillStyle = g; ctx.shadowColor = '#89dceb'; ctx.shadowBlur = 18;
        ctx.fillRect(x, y, this.w, this.h); ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
        for (let i = y+4; i < gY; i += 7) { ctx.beginPath(); ctx.moveTo(x+2,i); ctx.lineTo(x+this.w-2,i); ctx.stroke(); }
        ctx.fillStyle = '#94e2d5'; ctx.shadowColor = '#94e2d5'; ctx.shadowBlur = 16;
        ctx.fillRect(x - 3, y - 2, this.w + 6, 6); ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(x+2, y+6, 4, this.h-6);
        // "×2" badge so player knows double jump needed
        ctx.fillStyle = '#94e2d5'; ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center';
        ctx.fillText('×2', x + this.w/2, y - 6); ctx.textAlign = 'left';
      }
    },

    // Green top pipe — must crouch (standard gap)
    {
      type: 'pipe_green', w: 38, flying: true,
      collide(x) { return { x: x - 4, y: 0, w: this.w + 8, h: PIPE_BOTTOM() }; },
      draw(x) {
        const pb = PIPE_BOTTOM();
        const g  = ctx.createLinearGradient(x, 0, x + this.w, 0);
        g.addColorStop(0, '#a6e3a1'); g.addColorStop(0.4, '#40a02b'); g.addColorStop(1, '#1e3a1e');
        ctx.fillStyle = g; ctx.shadowColor = '#a6e3a1'; ctx.shadowBlur = 12;
        ctx.fillRect(x, 0, this.w, pb - 12); ctx.shadowBlur = 0;
        const cg = ctx.createLinearGradient(x-4, 0, x+this.w+4, 0);
        cg.addColorStop(0, '#a6e3a1'); cg.addColorStop(0.4, '#40a02b'); cg.addColorStop(1, '#1e3a1e');
        ctx.fillStyle = cg; ctx.fillRect(x - 4, pb - 18, this.w + 8, 18);
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x + 3, 0, 5, pb - 12); ctx.fillRect(x - 1, pb - 18, 5, 18);
        const pulse = 0.5 + 0.5 * Math.sin(frame * 0.12);
        ctx.globalAlpha = 0.5 + 0.5 * pulse; ctx.fillStyle = '#a6e3a1';
        ctx.font = '12px monospace'; ctx.textAlign = 'center';
        ctx.fillText('▼ DUCK', x + this.w/2, pb + 16);
        ctx.textAlign = 'left'; ctx.globalAlpha = 1;
      }
    },

    // Blue top pipe — must crouch (slightly shorter gap)
    {
      type: 'pipe_blue', w: 38, flying: true,
      collide(x) { return { x: x - 4, y: 0, w: this.w + 8, h: PIPE_BOTTOM() - 8 }; },
      draw(x) {
        const pb = PIPE_BOTTOM() - 8;
        const g  = ctx.createLinearGradient(x, 0, x + this.w, 0);
        g.addColorStop(0, '#89dceb'); g.addColorStop(0.4, '#04a5e5'); g.addColorStop(1, '#0a2030');
        ctx.fillStyle = g; ctx.shadowColor = '#89dceb'; ctx.shadowBlur = 12;
        ctx.fillRect(x, 0, this.w, pb - 12); ctx.shadowBlur = 0;
        const cg = ctx.createLinearGradient(x-4, 0, x+this.w+4, 0);
        cg.addColorStop(0, '#89dceb'); cg.addColorStop(0.4, '#04a5e5'); cg.addColorStop(1, '#0a2030');
        ctx.fillStyle = cg; ctx.fillRect(x - 4, pb - 18, this.w + 8, 18);
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x + 3, 0, 5, pb - 12); ctx.fillRect(x - 1, pb - 18, 5, 18);
        const pulse = 0.5 + 0.5 * Math.sin(frame * 0.1);
        ctx.globalAlpha = 0.5 + 0.5 * pulse; ctx.fillStyle = '#89dceb';
        ctx.font = '12px monospace'; ctx.textAlign = 'center';
        ctx.fillText('▼ DUCK', x + this.w/2, pb + 16);
        ctx.textAlign = 'left'; ctx.globalAlpha = 1;
      }
    },
  ];

  function spawnObstacle() {
    const t  = TYPES[Math.floor(Math.random() * TYPES.length)];
    const ob = Object.create(t);
    ob.x     = W() + 20;
    obstacles.push(ob);
  }

  function updateObstacles() {
    nextSpawn--;
    if (nextSpawn <= 0) {
      spawnObstacle();
      nextSpawn = Math.max(40, Math.floor(80 + Math.random() * 60 - score * 0.03));
    }
    for (let i = obstacles.length - 1; i >= 0; i--) {
      obstacles[i].x -= speed;
      if (obstacles[i].x < -120) obstacles.splice(i, 1);
    }
  }

  // Collision — uses each type's own collide() function
  function checkCollision() {
    const px = player.left, py = player.y, pw = player.right - player.left, ph = player.h;
    for (const ob of obstacles) {
      const box = ob.collide(ob.x);
      if (px < box.x + box.w && px + pw > box.x &&
          py < box.y + box.h && py + ph > box.y) return true;
    }
    return false;
  }

  // Sound
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  function playSound(type, isDouble) {
    const osc  = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    if (type === 'jump') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isDouble ? 600 : 440, now);
      osc.frequency.exponentialRampToValueAtTime(isDouble ? 900 : 660, now + 0.12);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now); osc.stop(now + 0.18);
    } else if (type === 'death') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now); osc.stop(now + 0.4);
    } else if (type === 'milestone') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now); osc.stop(now + 0.2);
    } else if (type === 'crouch') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now); osc.stop(now + 0.1);
    }
  }

  // Stars
  function initStars() {
    stars = Array.from({length: 60}, () => ({
      x: Math.random() * W(),
      y: Math.random() * (GROUND_Y() - 40),
      r: Math.random() * 1.5 + 0.5,
      t: Math.random() * Math.PI * 2
    }));
  }

  // Parallax bg layers
  // Far mountains (slow scroll)
  function drawMountains(offset, color, scale, yBase) {
    ctx.fillStyle = color;
    ctx.beginPath();
    const peaks = [0.1,0.25,0.18,0.35,0.22,0.4,0.15,0.3,0.12,0.28,0.2,0.38];
    const segW   = W() / (peaks.length / 2);
    const off    = (offset * scale) % (W());
    ctx.moveTo(-off, GROUND_Y());
    for (let i = 0; i <= peaks.length; i++) {
      const px = i * segW - off;
      const py = GROUND_Y() - peaks[i % peaks.length] * yBase;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(W() + segW, GROUND_Y());
    ctx.closePath();
    ctx.fill();
  }

  // Draw background
  function drawBackground() {
    const W_ = W(), H_ = H(), GY = GROUND_Y();

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, GY);
    if (nightMode) {
      skyGrad.addColorStop(0, '#11111b');
      skyGrad.addColorStop(1, '#1e1e2e');
    } else {
      skyGrad.addColorStop(0, '#1a1b26');
      skyGrad.addColorStop(1, '#24273a');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W_, H_);

    // Stars (always visible, brighter at night)
    stars.forEach(s => {
      s.t += 0.03;
      const alpha = nightMode
        ? 0.5 + Math.sin(s.t) * 0.5
        : 0.1 + Math.sin(s.t) * 0.08;
      ctx.globalAlpha = alpha;
      ctx.fillStyle   = '#f9e2af';
      ctx.beginPath();
      ctx.arc((s.x - groundOffset * 0.05 % W_ + W_) % W_, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Parallax mountains (far)
    drawMountains(groundOffset, nightMode ? 'rgba(49,50,68,0.6)' : 'rgba(49,50,68,0.5)', 0.08, GY * 0.55);
    // Parallax mountains (near)
    drawMountains(groundOffset, nightMode ? 'rgba(30,30,46,0.8)' : 'rgba(36,39,58,0.7)', 0.18, GY * 0.35);

    // Night neon grid
    if (nightMode) {
      ctx.strokeStyle = C.grid;
      ctx.lineWidth   = 0.5;
      ctx.globalAlpha = 0.15;
      for (let gx = (groundOffset * 0.5) % 50; gx < W_; gx += 50) {
        ctx.beginPath(); ctx.moveTo(gx, GY - 30); ctx.lineTo(W_/2, GY); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Ground gradient
    const groundGrad = ctx.createLinearGradient(0, GY, 0, H_);
    if (nightMode) {
      groundGrad.addColorStop(0, '#1e1e2e');
      groundGrad.addColorStop(1, '#181825');
    } else {
      groundGrad.addColorStop(0, '#313244');
      groundGrad.addColorStop(1, '#1e1e2e');
    }
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, GY, W_, H_ - GY);

    // Ground top line glow
    ctx.strokeStyle = nightMode ? C.grid : '#45475a';
    ctx.lineWidth   = 2;
    ctx.shadowColor = nightMode ? C.grid : 'transparent';
    ctx.shadowBlur  = nightMode ? 8 : 0;
    ctx.globalAlpha = nightMode ? 0.7 : 1;
    ctx.beginPath(); ctx.moveTo(0, GY); ctx.lineTo(W_, GY); ctx.stroke();
    ctx.shadowBlur  = 0;
    ctx.globalAlpha = 1;

    // Ground dashes (parallax scroll)
    ctx.strokeStyle = nightMode ? 'rgba(137,180,250,0.3)' : 'rgba(69,71,90,0.6)';
    ctx.lineWidth   = 1.5;
    const off = groundOffset % 40;
    for (let gx = -off; gx < W_; gx += 40) {
      ctx.beginPath();
      ctx.moveTo(gx,      GY + 8);
      ctx.lineTo(gx + 20, GY + 8);
      ctx.stroke();
    }
  }

  // Draw score
  function drawScore() {
    ctx.textAlign   = 'right';
    ctx.font        = '10px "SF Mono", monospace';
    ctx.fillStyle   = C.subtext;
    ctx.fillText('HI', W() - 64, 20);
    ctx.fillText('SCORE', W() - 10, 20);
    ctx.font        = 'bold 14px "SF Mono", monospace';
    ctx.fillStyle   = C.text;
    ctx.fillText(String(hi).padStart(5,'0'),    W() - 64, 36);
    ctx.fillText(String(score).padStart(5,'0'), W() - 10, 36);
    ctx.textAlign   = 'left';
  }

  // Overlay
  function drawOverlay(title, sub) {
    ctx.fillStyle = 'rgba(26,27,38,0.78)';
    ctx.fillRect(0, 0, W(), H());
    ctx.textAlign   = 'center';
    ctx.fillStyle   = title === 'GAME OVER' ? C.red : C.text;
    ctx.font        = 'bold 28px "SF Mono", monospace';
    ctx.fillText(title, W()/2, H()/2 - 14);
    ctx.fillStyle   = C.subtext;
    ctx.font        = '12px "SF Mono", monospace';
    ctx.fillText(sub, W()/2, H()/2 + 12);
    ctx.textAlign   = 'left';
  }

  // Main loop
  function loop() {
    frame++;
    groundOffset += speed;
    if (score >= 500 && !nightMode) nightMode = true;
    speed = Math.min(5 + score * 0.004, 14);
    if (score > 0 && score % 100 === 0 && frame % 60 === 0) playSound('milestone');

    drawBackground();
    updateObstacles();
    obstacles.forEach(ob => ob.draw(ob.x));
    player.update();
    player.draw();
    drawScore();

    if (checkCollision()) { die(); return; }

    score++;
    raf = requestAnimationFrame(loop);
  }

  function die() {
    state       = 'dead';
    player.dead = true;
    playSound('death');
    if (score > hi) {
      hi = score;
      localStorage.setItem('adarshrun-hi', hi);
    }
    drawBackground();
    obstacles.forEach(ob => ob.draw(ob.x));
    player.draw();
    drawScore();
    drawOverlay('GAME OVER', `Score: ${score}   Hi: ${hi}   —   Space / Click to retry`);
  }

  function restart() {
    obstacles.length = 0;
    score        = 0;
    speed        = 5;
    frame        = 0;
    nightMode    = false;
    nextSpawn    = 80;
    groundOffset = 0;
    player.reset();
    state = 'running';
    initStars();
    if (raf) cancelAnimationFrame(raf);
    loop();
  }

  // Idle screen — animated pulse
  let idleFrame = 0;
  let idleRaf;

  function drawIdleScreen() {
    idleFrame++;
    drawBackground();
    // Draw character standing still
    player.draw();
    drawScore();

    // Title
    ctx.textAlign = 'center';
    ctx.fillStyle = C.text;
    ctx.font      = 'bold 28px "SF Mono", monospace';
    ctx.fillText('ADARSH RUN', W()/2, H()/2 - 30);

    // Pulsing "click to start"
    const pulse   = 0.5 + 0.5 * Math.sin(idleFrame * 0.07);
    ctx.globalAlpha = 0.4 + 0.6 * pulse;
    ctx.fillStyle = C.blue;
    ctx.font      = 'bold 16px "SF Mono", monospace';
    ctx.fillText('▶  CLICK OR PRESS SPACE TO START  ◀', W()/2, H()/2 + 4);
    ctx.globalAlpha = 1;

    // Controls hint
    ctx.fillStyle = C.subtext;
    ctx.font      = '11px "SF Mono", monospace';
    ctx.fillText('↑ jump   ↑↑ double jump   ↓ crouch', W()/2, H()/2 + 26);
    ctx.textAlign = 'left';

    idleRaf = requestAnimationFrame(drawIdleScreen);
  }

  // Input & idle
  let blinkFrame = 0;
  let blinkRaf;

  function drawIdle() {
    if (state !== 'idle') return;
    blinkFrame++;
    drawBackground();
    drawScore();

    ctx.fillStyle = 'rgba(26,27,38,0.82)';
    ctx.fillRect(0, 0, W(), H());

    ctx.textAlign = 'center';
    ctx.fillStyle = C.text;
    ctx.font      = 'bold 32px "SF Mono", monospace';
    ctx.fillText('ADARSH RUN', W()/2, H()/2 - 30);

    // Blink every 30 frames
    if (Math.floor(blinkFrame / 30) % 2 === 0) {
      ctx.fillStyle = C.yellow;
      ctx.font      = 'bold 14px "SF Mono", monospace';
      ctx.fillText('▶  PRESS SPACE OR CLICK TO START  ◀', W()/2, H()/2 + 10);
    }

    ctx.fillStyle = C.subtext;
    ctx.font      = '11px "SF Mono", monospace';
    ctx.fillText('↑ jump   ↑↑ double jump   ↓ crouch', W()/2, H()/2 + 36);
    ctx.textAlign = 'left';

    blinkRaf = requestAnimationFrame(drawIdle);
  }

  function startOrJump() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (state === 'idle') {
      cancelAnimationFrame(blinkRaf);
      state = 'running';
      loop();
    } else if (state === 'running') {
      player.jump();
    } else if (state === 'dead') {
      restart();
    }
  }

  // Keyboard handlers (named so they can be removed on close)
  function onKeyDown(e) {
    if (!winEl.isConnected) return;
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      startOrJump();
    }
    if ((e.code === 'ArrowDown' || e.code === 'KeyS') && state === 'running') {
      e.preventDefault();
      if (!player.crouching) playSound('crouch');
      player.crouch(true);
    }
  }

  function onKeyUp(e) {
    if (!winEl.isConnected) return;
    if (e.code === 'ArrowDown' || e.code === 'KeyS') player.crouch(false);
  }

  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup',   onKeyUp);
  canvas.addEventListener('click', startOrJump);

  // Clean up when window is closed so game doesn't ghost-run
  winEl.querySelector('.btn.close').addEventListener('click', () => {
    cancelAnimationFrame(raf);
    cancelAnimationFrame(blinkRaf);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup',   onKeyUp);
  }, { once: true });

  // Start idle screen
  requestAnimationFrame(() => {
    player.reset();
    initStars();
    drawIdle();
  });
}