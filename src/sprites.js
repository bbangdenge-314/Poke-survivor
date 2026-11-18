/* 스프라이트 로딩 · 드로잉 유틸 */
const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const ART_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';
const CRY_BASE = 'https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest';

const cache = new Map();     // key -> HTMLImageElement | 'error'
const pending = new Map();
const listeners = new Set();

export function spriteKey(id, shiny) { return `${id}${shiny ? 's' : ''}`; }
export function spriteURL(id, shiny) { return `${SPRITE_BASE}/${shiny ? 'shiny/' : ''}${id}.png`; }
export function artURL(id) { return `${ART_BASE}/${id}.png`; }

export function getSprite(id, shiny) {
  const k = spriteKey(id, shiny);
  const v = cache.get(k);
  return v && v !== 'error' ? v : null;
}

export function loadSprite(id, shiny = false) {
  const k = spriteKey(id, shiny);
  if (cache.has(k)) return Promise.resolve(cache.get(k));
  if (pending.has(k)) return pending.get(k);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => { cache.set(k, img); pending.delete(k); done(img); resolve(img); };
    img.onerror = () => { cache.set(k, 'error'); pending.delete(k); done(null); resolve(null); };
    img.src = `${SPRITE_BASE}/${shiny ? 'shiny/' : ''}${id}.png`;
  });
  pending.set(k, p);
  return p;
}

const artCache = new Map(); // id -> { img: HTMLImageElement|null, promise }
export function loadArt(id) {
  const hit = artCache.get(id);
  if (hit) return hit.promise;
  const entry = { img: null, promise: null };
  entry.promise = new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { entry.img = img; resolve(img); };
    img.onerror = () => { entry.img = null; resolve(null); };
    img.src = `${ART_BASE}/${id}.png`;
  });
  artCache.set(id, entry);
  return entry.promise;
}

export function getArt(id) {
  const e = artCache.get(id);
  return e && e.img instanceof HTMLImageElement ? e.img : null;
}

export function onLoad(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function done(img) { for (const f of listeners) { try { f(img); } catch (e) { /* noop */ } } }

export function preload(ids, shiny = false, onProgress) {
  const uniq = [...new Set(ids)];
  let n = 0;
  return Promise.all(uniq.map(id => loadSprite(id, shiny).then(r => {
    n++;
    if (onProgress) onProgress(n, uniq.length);
    return r;
  })));
}

/* ---------- 폴백 드로잉 (스프라이트 없을 때) ---------- */
export function fallbackDraw(ctx, id, x, y, size, color, shiny) {
  const seed = (id * 9301 + 49297) % 233280 / 233280;
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.42, size * 0.5, 0, 0, Math.PI * 2);
  ctx.fillStyle = shiny ? '#fde68a' : (color || '#94a3b8');
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -size * 0.42, size * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-size * 0.12, -size * 0.48, size * 0.055, 0, Math.PI * 2);
  ctx.arc(size * 0.12, -size * 0.48, size * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = Math.max(1, size * 0.03);
  ctx.beginPath();
  ctx.arc(0, -size * 0.3, size * 0.1, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.restore();
  void seed;
}

/* ---------- 울음소리 ---------- */
const cryCache = new Map();
let cryEnabled = true;
export function setCryEnabled(v) { cryEnabled = v; }
export function playCry(id, volume = 0.35) {
  if (!cryEnabled || !id) return;
  try {
    let a = cryCache.get(id);
    if (!a) {
      a = new Audio(`${CRY_BASE}/${id}.ogg`);
      a.preload = 'auto';
      a.volume = volume;
      cryCache.set(id, a);
    }
    a.volume = volume;
    a.currentTime = 0;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) { /* noop */ }
}
