// Dark mode
document.addEventListener('change', e => {
  if (e.target.id === 'darkModeToggle') setTheme(e.target.checked);
  const key = toggleKeyMap[e.target.id];
  if (key) localStorage.setItem(key, e.target.checked);
});

// Wallpaper picker
document.addEventListener('click', e => {
  const thumb = e.target.closest('.wallpaper-thumb');
  if (!thumb) return;
  document.querySelectorAll('.wallpaper-thumb').forEach(t => t.classList.remove('active'));
  thumb.classList.add('active');
  const src = thumb.dataset.src;
  document.body.style.backgroundImage = `url('${src}')`;
  localStorage.setItem('wallpaper', src);
});