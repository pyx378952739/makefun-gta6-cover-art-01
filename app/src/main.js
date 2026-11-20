// Vice Coast Cover Lab — editor wiring.
// Pick photos from the machine (File API, never uploaded), assign them to
// panels, drag to pan, zoom, pick a layout and a grade, edit the title and
// subtitle, and export the cover as a PNG in 1080 x 1080, 1080 x 1350 or
// 1920 x 1080. A `?shot=` query sets up a fixed scene for screenshots.
import { drawCover, layoutPanels, LAYOUTS, GRADES, TITLE_STYLES } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.getElementById('cover');
const tray = document.getElementById('tray');
const titleInput = document.getElementById('title');
const subtitleInput = document.getElementById('subtitle');
const zoomInput = document.getElementById('zoom');
const status = document.getElementById('status');
const sizeSelect = document.getElementById('size');

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const state = {
  layout: 'hero3',
  grade: 'sunset',
  intensity: 0.85,
  title: 'Neon Shore',
  subtitle: 'vice coast nights',
  titleStyle: 'sunset',
  frame: true,
  grain: true,
  photos: [], // { img, name }
  slots: [
    { photo: 0, zoom: 1, dx: 0, dy: 0 },
    { photo: 0, zoom: 1, dx: 0, dy: 0 },
    { photo: 0, zoom: 1, dx: 0, dy: 0 },
    { photo: 0, zoom: 1, dx: 0, dy: 0 },
  ],
  selectedPanel: 0,
};

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function redraw() {
  const [w, h] = SIZES[sizeSelect.value] || SIZES['1080x1080'];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state);
  syncPanelButtons();
}

function syncPanelButtons() {
  const panels = layoutPanels(state.layout, canvas.width, canvas.height);
  document.querySelectorAll('#panels .panel-btn').forEach((btn, i) => {
    btn.disabled = i >= panels.length;
    btn.classList.toggle('active', i === state.selectedPanel && i < panels.length);
    const slot = state.slots[i];
    const photo = state.photos[slot?.photo];
    btn.textContent = `Panel ${i + 1}${photo ? ' · ' + photo.name : ' · empty'}`;
  });
  const slot = state.slots[state.selectedPanel] || { zoom: 1 };
  zoomInput.value = Math.round((slot.zoom || 1) * 100);
}

function buildTray() {
  tray.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    btn.title = `Use ${photo.name} in the selected panel`;
    const img = document.createElement('img');
    img.src = photo.url;
    img.alt = photo.name;
    btn.appendChild(img);
    const label = document.createElement('span');
    label.textContent = photo.name;
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      state.slots[state.selectedPanel].photo = i;
      redraw();
    });
    tray.appendChild(btn);
  });
}

function buildOptionButtons(el, options, current, onPick) {
  el.innerHTML = '';
  for (const [key, value] of Object.entries(options)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip' + (key === current ? ' active' : '');
    btn.textContent = value.name;
    btn.addEventListener('click', () => {
      onPick(key);
      buildOptionButtons(el, options, key, onPick);
    });
    el.appendChild(btn);
  }
}

function fillAllPanels() {
  const photo = state.slots[state.selectedPanel].photo;
  state.slots.forEach((slot) => { slot.photo = photo; });
  redraw();
  status.textContent = 'One photo now fills every panel — drag any panel to reframe it.';
}

// Panel picking + drag-to-pan on the preview canvas.
let drag = null;
function panelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const px = (clientX - rect.left) / rect.width;
  const py = (clientY - rect.top) / rect.height;
  const panels = layoutPanels(state.layout, canvas.width, canvas.height);
  return panels.findIndex(([x, y, w, h]) => px >= x && px <= x + w && py >= y && py <= y + h);
}
canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  state.selectedPanel = i;
  canvas.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, dx: state.slots[i].dx, dy: state.slots[i].dy };
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const slot = state.slots[state.selectedPanel];
  slot.dx = drag.dx + (e.clientX - drag.x) / rect.width;
  slot.dy = drag.dy + (e.clientY - drag.y) / rect.height;
  slot.dx = Math.max(-0.6, Math.min(0.6, slot.dx));
  slot.dy = Math.max(-0.6, Math.min(0.6, slot.dy));
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const slot = state.slots[state.selectedPanel];
  slot.zoom = Math.max(1, Math.min(3, (slot.zoom || 1) * (e.deltaY < 0 ? 1.08 : 0.93)));
  redraw();
}, { passive: false });

// Controls.
document.getElementById('add-photos').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    state.photos.push({ img, url, name: file.name.replace(/\.[^.]+$/, '').slice(0, 14) || 'photo' });
  }
  buildTray();
  redraw();
  status.textContent = `${state.photos.length} photo(s) loaded — click a thumbnail, then a panel.`;
});
document.getElementById('fill-all').addEventListener('click', fillAllPanels);
document.getElementById('reset-panel').addEventListener('click', () => {
  state.slots[state.selectedPanel] = { photo: state.slots[state.selectedPanel].photo, zoom: 1, dx: 0, dy: 0 };
  redraw();
});
titleInput.addEventListener('input', () => { state.title = titleInput.value; redraw(); });
subtitleInput.addEventListener('input', () => { state.subtitle = subtitleInput.value; redraw(); });
zoomInput.addEventListener('input', () => {
  state.slots[state.selectedPanel].zoom = zoomInput.value / 100;
  redraw();
});
document.getElementById('grade-strength').addEventListener('input', (e) => {
  state.intensity = e.target.value / 100;
  redraw();
});
document.getElementById('frame').addEventListener('change', (e) => { state.frame = e.target.checked; redraw(); });
document.getElementById('grain').addEventListener('change', (e) => { state.grain = e.target.checked; redraw(); });
sizeSelect.addEventListener('change', redraw);

buildOptionButtons(document.getElementById('layouts'), LAYOUTS, state.layout, (key) => {
  state.layout = key;
  state.selectedPanel = 0;
  redraw();
});
buildOptionButtons(document.getElementById('grades'), GRADES, state.grade, (key) => {
  state.grade = key;
  redraw();
});
buildOptionButtons(document.getElementById('title-styles'), TITLE_STYLES, state.titleStyle, (key) => {
  state.titleStyle = key;
  redraw();
});

document.querySelectorAll('#panels .panel-btn').forEach((btn, i) => {
  btn.addEventListener('click', () => { state.selectedPanel = i; redraw(); });
});

function exportCover(sizeKey) {
  const [w, h] = SIZES[sizeKey];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  drawCover(off, state);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-coast-cover-${sizeKey}.png`;
    a.click();
    status.textContent = `Saved vice-coast-cover-${sizeKey}.png (${w} x ${h}).`;
  }, 'image/png');
}
document.getElementById('export').addEventListener('click', () => exportCover(sizeSelect.value));
document.getElementById('export-all').addEventListener('click', () => {
  Object.keys(SIZES).forEach((key, i) => setTimeout(() => exportCover(key), i * 350));
  status.textContent = 'Exporting all three sizes…';
});

// Boot: load the bundled sample photos, then the shot scene if any.
async function boot() {
  const samples = [
    ['samples/vice-hero.jpg', 'vice-hero'],
    ['samples/boulevard.jpg', 'boulevard'],
    ['samples/pier.jpg', 'pier'],
  ];
  for (const [url, name] of samples) {
    try {
      const img = await loadImage(url);
      state.photos.push({ img, url, name });
    } catch { /* a missing sample never blocks the editor */ }
  }
  buildTray();
  // Sample arrangement: hero photo big, the other two in the side panels.
  state.slots[1].photo = 1;
  state.slots[2].photo = 2;
  state.slots[3].photo = 1;
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    await runShot(shot, params, state, { redraw, loadImage });
  } else {
    try { await document.fonts.ready; } catch { /* system fonts are fine */ }
    redraw();
  }
}
boot();
