// Vice Coast Cover Lab — the cover engine.
// Draws a multi-panel GTA-poster-style cover on a 2D canvas: panel photos with
// per-panel crop/position, a Vice City sunset-or-neon grade, bold Anton title
// lettering with a Pacifico neon subtitle, poster frame, grain and vignette.
// Everything is drawn from local files only; no network, no Rockstar assets.

export const LAYOUTS = {
  hero3: { name: 'Hero + 3', panels: 4 },
  grid4: { name: 'Four Square', panels: 4 },
  strips3: { name: 'Three Strips', panels: 3 },
  fullbleed: { name: 'Full Bleed', panels: 1 },
};

export const GRADES = {
  sunset: { name: 'Vice Sunset', filter: 'saturate(1.3) contrast(1.06)', stops: [[0, 'rgba(255,196,90,0.20)'], [0.55, 'rgba(255,110,80,0.10)'], [1, 'rgba(255,45,140,0.42)']] },
  neon: { name: 'Neon Nights', filter: 'saturate(1.45) contrast(1.1)', stops: [[0, 'rgba(0,229,255,0.20)'], [0.5, 'rgba(160,60,255,0.12)'], [1, 'rgba(255,45,149,0.45)']] },
  gold: { name: 'Palm Gold', filter: 'sepia(0.28) saturate(1.35) contrast(1.04)', stops: [[0, 'rgba(255,214,120,0.26)'], [1, 'rgba(190,90,20,0.30)']] },
  teal: { name: 'Teal Dusk', filter: 'saturate(1.15) contrast(1.08)', stops: [[0, 'rgba(255,150,90,0.16)'], [1, 'rgba(0,120,140,0.38)']] },
  noir: { name: 'Noir', filter: 'grayscale(1) contrast(1.18) brightness(1.02)', stops: [[0, 'rgba(255,255,255,0.05)'], [1, 'rgba(0,0,0,0.28)']] },
};

export const TITLE_STYLES = {
  sunset: { name: 'Sunset gradient', kind: 'gradient', stops: ['#ffe259', '#ff7e5f', '#ff2e88'] },
  white: { name: 'White', kind: 'solid', color: '#ffffff' },
  neon: { name: 'Neon pink', kind: 'solid', color: '#ff5da2' },
};

/** Panel rectangles for a layout, as fractions of the cover (x, y, w, h). */
export function layoutPanels(layout, W, H) {
  const g = 0.012; // white gutter, fraction of the short side
  const gw = g * Math.min(W, H);
  const gx = gw / W;
  const gy = gw / H;
  switch (layout) {
    case 'grid4':
      return [
        [0, 0, 0.5 - gx / 2, 0.5 - gy / 2],
        [0.5 + gx / 2, 0, 0.5 - gx / 2, 0.5 - gy / 2],
        [0, 0.5 + gy / 2, 0.5 - gx / 2, 0.5 - gy / 2],
        [0.5 + gx / 2, 0.5 + gy / 2, 0.5 - gx / 2, 0.5 - gy / 2],
      ];
    case 'strips3': {
      const w = (1 - 2 * gx) / 3;
      return [
        [0, 0, w, 1],
        [w + gx, 0, w, 1],
        [2 * w + 2 * gx, 0, w, 1],
      ];
    }
    case 'fullbleed':
      return [[0, 0, 1, 1]];
    case 'hero3':
    default: {
      const heroW = 0.62;
      const third = 1 / 3;
      return [
        [0, 0, heroW - gx / 2, 1],
        [heroW + gx / 2, 0, 1 - heroW - gx / 2, third - gy / 2],
        [heroW + gx / 2, third + gy / 2, 1 - heroW - gx / 2, third - gy / 2],
        [heroW + gx / 2, 2 * third + gy / 2, 1 - heroW - gx / 2, third - gy / 2],
      ];
    }
  }
}

function drawPhotoInto(ctx, img, rect, slot, grade, intensity) {
  const [fx, fy, fw, fh] = rect;
  const x = fx * ctx.canvas.width;
  const y = fy * ctx.canvas.height;
  const w = fw * ctx.canvas.width;
  const h = fh * ctx.canvas.height;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = '#241a2e';
  ctx.fillRect(x, y, w, h);
  if (img) {
    const zoom = slot.zoom || 1;
    const base = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const pw = img.naturalWidth * base;
    const ph = img.naturalHeight * base;
    // A portrait photo in a wide panel, left at its default framing, shows
    // its middle band — usually a torso. Bias the frame toward the top of
    // the photo, where faces usually are, until the user pans it.
    let dy = (slot.dy || 0) * h;
    if (!slot.dy && ph > h * 1.15) dy = Math.min((ph - h) * 0.3, h * 0.3);
    const dx = (slot.dx || 0) * w;
    ctx.filter = grade.filter;
    ctx.drawImage(img, x + (w - pw) / 2 + dx, y + (h - ph) / 2 + dy, pw, ph);
    ctx.filter = 'none';
  }
  // Grade wash: a soft-light gradient over the photo, scaled by intensity.
  const wash = ctx.createLinearGradient(x, y, x + w * 0.25, y + h);
  for (const [stop, color] of grade.stops) wash.addColorStop(stop, color);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = 0.55 + 0.45 * intensity;
  ctx.fillStyle = wash;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  // A warm foot-glow so the title band reads on any photo.
  const foot = ctx.createLinearGradient(0, y + h * 0.55, 0, y + h);
  foot.addColorStop(0, 'rgba(20,8,28,0)');
  foot.addColorStop(1, `rgba(20,8,28,${0.35 * intensity})`);
  ctx.fillStyle = foot;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function fitFont(ctx, text, fontFamily, maxWidth, startSize, weight = '') {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${fontFamily}`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size = Math.floor(size * 0.94);
    ctx.font = `${weight} ${size}px ${fontFamily}`;
  }
  return size;
}

let grainPattern = null;
function getGrain(ctx) {
  if (grainPattern) return grainPattern;
  const n = document.createElement('canvas');
  n.width = 160;
  n.height = 160;
  const c = n.getContext('2d');
  const data = c.createImageData(160, 160);
  let seed = 20261120;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < data.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    data.data[i] = v;
    data.data[i + 1] = v;
    data.data[i + 2] = v;
    data.data[i + 3] = 255;
  }
  c.putImageData(data, 0, 0);
  grainPattern = ctx.createPattern(n, 'repeat');
  return grainPattern;
}

/**
 * Draws the whole cover. `state` holds layout, slots (per-panel photo/zoom/pan),
 * photos (HTMLImageElements), title, subtitle, titleStyle, grade, intensity,
 * frame and grain flags. `canvas` is drawn at its own pixel size.
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const intensity = state.intensity ?? 0.85;
  const panels = layoutPanels(state.layout, W, H);

  // Poster paper.
  ctx.fillStyle = '#f4ede1';
  ctx.fillRect(0, 0, W, H);

  const slots = state.slots || [];
  panels.forEach((rect, i) => {
    const slot = slots[i] || { photo: 0, zoom: 1, dx: 0, dy: 0 };
    const img = state.photos[slot.photo]?.img || null;
    drawPhotoInto(ctx, img, rect, slot, grade, intensity);
  });

  // White gutters are the paper showing through; add a thin keyline.
  ctx.strokeStyle = 'rgba(244,237,225,0.9)';
  ctx.lineWidth = Math.max(2, W * 0.002);

  const pad = W * 0.045;
  const title = (state.title || '').trim().toUpperCase();
  const subtitle = (state.subtitle || '').trim();

  // Title block: bottom band, big Anton capitals, Pacifico neon subtitle above.
  if (subtitle) {
    const subSize = fitFont(ctx, subtitle, 'Pacifico, cursive', W * 0.6, H * 0.045);
    ctx.save();
    ctx.translate(pad + W * 0.01, H - pad - H * 0.135);
    ctx.rotate(-0.03);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = subSize * 0.7;
    ctx.fillStyle = '#ff8ac2';
    ctx.fillText(subtitle, 0, 0);
    ctx.restore();
  }
  if (title) {
    const maxW = W - pad * 2;
    const size = fitFont(ctx, title, 'Anton, sans-serif', maxW, H * 0.115);
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    const ty = H - pad * 0.35;
    const style = TITLE_STYLES[state.titleStyle] || TITLE_STYLES.sunset;
    let fill;
    if (style.kind === 'gradient') {
      fill = ctx.createLinearGradient(pad, ty - size, pad, ty);
      const stops = style.stops;
      stops.forEach((c, i) => fill.addColorStop(i / (stops.length - 1), c));
    } else {
      fill = style.color;
    }
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(24,6,26,0.85)';
    ctx.lineWidth = size * 0.09;
    ctx.strokeText(title, pad, ty);
    ctx.fillStyle = fill;
    if (style.kind === 'solid' && state.titleStyle === 'neon') {
      ctx.shadowColor = '#ff2e88';
      ctx.shadowBlur = size * 0.35;
    }
    ctx.fillText(title, pad, ty);
    ctx.shadowBlur = 0;
  }

  // Corner badge: small original mark, top-left.
  const badge = 'VICE COAST';
  const bs = Math.max(10, W * 0.016);
  ctx.font = `${bs}px Anton, sans-serif`;
  const bw = ctx.measureText(badge).width + bs * 1.6;
  const bh = bs * 2.1;
  ctx.fillStyle = 'rgba(20,8,28,0.82)';
  ctx.fillRect(pad, pad * 0.7, bw, bh);
  ctx.fillStyle = '#ffd166';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(badge, pad + bs * 0.8, pad * 0.7 + bh / 2 + 1);

  // Vignette + grain finish.
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(10,4,18,0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  if (state.grain !== false) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = getGrain(ctx);
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.frame) {
    const fw = Math.max(6, W * 0.014);
    ctx.strokeStyle = '#f4ede1';
    ctx.lineWidth = fw;
    ctx.strokeRect(fw / 2, fw / 2, W - fw, H - fw);
    ctx.strokeStyle = 'rgba(24,6,26,0.55)';
    ctx.lineWidth = Math.max(1, W * 0.0015);
    ctx.strokeRect(fw * 1.9, fw * 1.9, W - fw * 3.8, H - fw * 3.8);
  }
}
