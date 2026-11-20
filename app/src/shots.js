// Fixed scenes for screenshots: ?shot=editor shows the page with a sample
// photo loaded; ?shot=cover shows the cover alone, drawn by the app itself
// at the requested export size. `size` picks 1080x1080, 1080x1350 or
// 1920x1080; `photo` picks the hero sample; `caption` the title.
// window.__shotReady is set once the cover is painted.
import { SIZES } from './main.js';

export async function runShot(shot, query, state, helpers) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const sizeKey = query.get('size') || '1080x1080';
  const sizeSelect = document.getElementById('size');
  if (SIZES[sizeKey]) sizeSelect.value = sizeKey;
  const photo = query.get('photo');
  if (photo === 'pier') {
    state.slots[0].photo = 2;
    state.slots[1].photo = 0;
    state.slots[2].photo = 1;
    state.slots[3].photo = 2;
  } else if (photo === 'boulevard') {
    state.slots[0].photo = 1;
    state.slots[1].photo = 0;
    state.slots[2].photo = 2;
    state.slots[3].photo = 0;
  }
  const caption = query.get('caption');
  if (caption) {
    state.title = caption;
    document.getElementById('title').value = caption;
  }
  const subtitle = query.get('subtitle');
  if (subtitle) {
    state.subtitle = subtitle;
    document.getElementById('subtitle').value = subtitle;
  }
  const grade = query.get('grade');
  if (grade) state.grade = grade;
  const layout = query.get('layout');
  if (layout) state.layout = layout;
  try {
    await document.fonts.load('400 100px Anton');
    await document.fonts.load('400 60px Pacifico');
    await document.fonts.ready;
  } catch { /* fall back to system fonts */ }
  helpers.redraw();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
