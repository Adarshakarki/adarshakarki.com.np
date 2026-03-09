function initNotes() {
  let notes = JSON.parse(localStorage.getItem('notes') || '[]');
  let activeId = null;

  const list  = document.getElementById('notes-list');
  const title = document.getElementById('note-title');
  const body  = document.getElementById('note-body');

  function save() { localStorage.setItem('notes', JSON.stringify(notes)); }

  function renderList() {
    list.innerHTML = '';
    notes.forEach(n => {
      const el = document.createElement('div');
      el.className = 'note-item' + (n.id === activeId ? ' active' : '');
      el.textContent = n.title || 'Untitled';
      el.addEventListener('click', () => loadNote(n.id));
      list.appendChild(el);
    });
  }

  function loadNote(id) {
    activeId = id;
    const n = notes.find(n => n.id === id);
    title.value = n.title;
    body.value  = n.body;
    renderList();
  }

  function newNote() {
    const n = { id: Date.now(), title: '', body: '' };
    notes.unshift(n);
    save();
    loadNote(n.id);
  }

  // Auto-save on typing
  [title, body].forEach(el => {
    el.addEventListener('input', () => {
      const n = notes.find(n => n.id === activeId);
      if (!n) return;
      n.title = title.value;
      n.body  = body.value;
      save();
      renderList();
    });
  });

  // Expose newNote to button
  window.newNote = newNote;

  // Init
  if (notes.length) loadNote(notes[0].id);
  else newNote();

  renderList();
}