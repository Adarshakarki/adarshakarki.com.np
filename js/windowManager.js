let zIndex = 10;
const desktop = document.getElementById('desktop');

function createWindow(appName, html, appFolder) {
  const win = document.createElement('div');
  win.className = 'app-window';
  win.dataset.app = appFolder;
  win.innerHTML = `
    <div class="title-bar">
      <div class="controls">
        <span class="btn close"></span>
        <span class="btn min"></span>
        <span class="btn max"></span>
      </div>
      <span class="title">${appName}</span>
    </div>
    <div class="content">${html}</div>
  `;
  desktop.appendChild(win);
  centerWindow(win);
  focusWindow(win);
  bindControls(win, appFolder);
  return win;
}

function centerWindow(win) {
  requestAnimationFrame(() => {
    const menuH  = 28;
    const dockH  = 90;
    const maxW   = window.innerWidth  - 16;
    const maxH   = window.innerHeight - menuH - dockH - 16;

    if (win.offsetWidth  > maxW) win.style.width  = maxW + 'px';
    if (win.offsetHeight > maxH) win.style.height = maxH + 'px';

    const left = Math.max(8, (window.innerWidth  - win.offsetWidth)  / 2);
    const top  = Math.max(menuH + 8, menuH + (maxH - win.offsetHeight) / 2);

    win.style.left = `${left}px`;
    win.style.top  = `${top}px`;
  });
}

function focusWindow(win) {
  document.querySelectorAll('.app-window').forEach(w => w.classList.remove('focused'));
  win.classList.add('focused');
  win.style.zIndex = ++zIndex;
}

function bindControls(win, appFolder) {
  // Close
  win.querySelector('.btn.close').addEventListener('click', () => {
    win.remove();
    updateIndicator(appFolder, false);
  });

  // Minimize
  win.querySelector('.btn.min').addEventListener('click', () => {
    win.classList.toggle('minimized');
  });

  // Maximize / restore
  let maximized = false, prev = {};
  win.querySelector('.btn.max').addEventListener('click', () => {
    if (!maximized) {
      prev = { top: win.style.top, left: win.style.left, width: win.style.width, height: win.style.height };
      win.classList.add('maximized');
    } else {
      win.classList.remove('maximized');
      Object.assign(win.style, prev);
    }
    maximized = !maximized;
  });

  // Bring to front on click
  win.addEventListener('mousedown', () => focusWindow(win));

  // Drag
  const bar = win.querySelector('.title-bar');
  let dragging = false, ox = 0, oy = 0;

  bar.addEventListener('mousedown', e => {
    if (win.classList.contains('maximized')) return;
    dragging = true;
    ox = e.clientX - win.offsetLeft;
    oy = e.clientY - win.offsetTop;
  });

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const dockH  = 90;
    const menuH  = 28;
    const maxLeft = window.innerWidth  - win.offsetWidth;
    const maxTop  = window.innerHeight - win.offsetHeight - dockH;

    win.style.left = `${Math.max(0,     Math.min(maxLeft, e.clientX - ox))}px`;
    win.style.top  = `${Math.max(menuH, Math.min(maxTop,  e.clientY - oy))}px`;
  });

  document.addEventListener('mouseup', () => dragging = false);
}

// Apps with no JS file — skip script loading entirely
const NO_JS_APPS = ['finder', 'trash', 'terminal', 'launchpad', 'folder'];

function openAppWindow(url, appName) {
  const appFolder = url.split('/')[1];

  // Single instance — if already open, focus it (unminimize if needed)
  const existing = document.querySelector(`.app-window[data-app="${appFolder}"]`);
  if (existing) {
    existing.classList.remove('minimized');
    focusWindow(existing);
    return;
  }

  if (!document.getElementById(`css-${appFolder}`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `apps/${appFolder}/${appFolder}.css`;
    link.id = `css-${appFolder}`;
    document.head.appendChild(link);
  }

  fetch(url)
    .then(r => r.text())
    .then(html => {
      const win = createWindow(appName, html, appFolder);
      updateIndicator(appFolder, true);

      // Sync settings UI now that the HTML is in the DOM
      if (appFolder === 'settings') syncSettingsUI();

      if (NO_JS_APPS.includes(appFolder)) return;

      if (!document.getElementById(`js-${appFolder}`)) {
        const script = document.createElement('script');
        script.src = `apps/${appFolder}/${appFolder}.js`;
        script.id  = `js-${appFolder}`;
        script.onload = () => callInit(appFolder, win);
        document.body.appendChild(script);
      } else {
        callInit(appFolder, win);
      }
    });
}

function callInit(appFolder, win) {
  const fn = window[`init${appFolder.charAt(0).toUpperCase() + appFolder.slice(1)}`];
  if (typeof fn === 'function') fn(win);
}