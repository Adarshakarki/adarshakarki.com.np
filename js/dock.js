const dock      = document.querySelector('.dock');
const dockItems = document.querySelectorAll('.dock-item');

// Neighbour magnification
dock.addEventListener('mousemove', e => {
  dockItems.forEach(item => {
    const img  = item.querySelector('img');
    const rect = img.getBoundingClientRect();
    const dist = Math.abs(e.clientX - (rect.left + rect.width / 2));
    img.style.transform = `scale(${Math.max(1, 1.6 - dist / 150)})`;
  });
});

dock.addEventListener('mouseleave', () => {
  dockItems.forEach(item => item.querySelector('img').style.transform = 'scale(1)');
});

// Open app on click
dockItems.forEach(item => {
  item.addEventListener('click', () => {
    const { app, name } = item.dataset;
    if (app) openAppWindow(`apps/${app}/${app}.html`, name);
  });
});

// Toggle running indicator dot
function updateIndicator(appFolder, running) {
  const item = document.querySelector(`.dock-item[data-app="${appFolder}"]`);
  if (item) item.classList.toggle('running', running);
}