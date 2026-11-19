/* ============================================================
   POKE SURVIVOR — 부트스트랩 / 입력 / 루프
   ============================================================ */
import { Game } from './game.js?v=23';
import { UI } from './ui.js?v=23';
import { DEX, CHARACTERS, STAGES, VIEW_MODES } from './data.js?v=23';
import { preload, playCry, setCryEnabled } from './sprites.js?v=23';
import { initAudio, setSfxEnabled, SFX } from './audio.js?v=23';
import { getSave, persist, recordRun, toggleSetting, setSetting } from './save.js?v=23';

/* ---------- 오류 수집 (검증용) ---------- */
window.__errors = [];
window.addEventListener('error', e => {
  window.__errors.push((e.message || 'error') + ' @ ' + (e.filename || '') + ':' + (e.lineno || 0));
});
window.addEventListener('unhandledrejection', e => {
  window.__errors.push('promise: ' + ((e.reason && (e.reason.message || e.reason)) || 'unknown'));
});

const cv = document.getElementById('cv');
const ui = new UI();
const game = new Game(cv, {});
ui.game = game;
window.__game = game;
window.__ui = ui;
window.__save = getSave;

const save = getSave();
setSfxEnabled(save.settings.sfx !== false);
setCryEnabled(save.settings.cries !== false);
game.applySettings();

/* ---------- 게임 훅 ---------- */
game.hooks = {
  onHud: g => ui.hudUpdate(g),
  onLevelUp: (g, cards) => { ui.showLevelUp(g, cards); },
  onLevelUpClose: () => ui.hideLevelUp(),
  onEvolve: (g, info) => { ui.showEvolve(g, info); },
  onEvolveClose: () => {},
  onBranch: (g, opts) => ui.showBranch(g, opts),
  onBranchClose: () => {},
  onRunStart: () => {},
  onEnd: (g, result) => {
    if (g.suppressEnd) return;
    recordRun({
      win: result.win, stageKey: result.stageKey, time: result.time,
      kills: result.kills, coins: result.coins, dust: result.dust,
      charKey: result.charKey, shiny: result.shiny,
      level: result.level, seenIds: result.seenIds,
      bosses: result.bosses, awakens: result.awakens, supers: result.supers,
      megas: result.megas, chests: result.chests, shinies: result.shinies
    });
    setTimeout(() => ui.showResult(g, result), result.win ? 900 : 700);
  },
  autoResolveUI: (g) => {
    const els = ['levelupOverlay', 'evoOverlay', 'branchOverlay', 'pauseOverlay'];
    els.forEach(id => document.getElementById(id).classList.add('hidden'));
    if (g.hooks.onLevelUpClose) g.hooks.onLevelUpClose(g);
  }
};

/* ---------- 런 시작 ---------- */
function startRun(opts) {
  initAudio();
  pausedByUser = false;
  game.suppressEnd = false;
  ui.hideAllOverlays();
  ui.hudShow(true);
  ui.lastWeaponSig = '';
  game.startRun(opts);
  ui.hudUpdate(game);
}

ui.onStart = startRun;

/* ---------- 입력 ---------- */
const keys = new Set();
const joy = { active: false, ox: 0, oy: 0, dx: 0, dy: 0, id: null };
game.joy = joy;
game.moveInput = { x: 0, y: 0 };

function keyVec() {
  let x = 0, y = 0;
  if (keys.has('ArrowLeft') || keys.has('a')) x -= 1;
  if (keys.has('ArrowRight') || keys.has('d')) x += 1;
  if (keys.has('ArrowUp') || keys.has('w')) y -= 1;
  if (keys.has('ArrowDown') || keys.has('s')) y += 1;
  return { x, y };
}
function updateMove() {
  const k = keyVec();
  let x = k.x, y = k.y;
  if (joy.active) { x += joy.dx; y += joy.dy; }
  const l = Math.hypot(x, y);
  if (l > 1) { x /= l; y /= l; }
  game.moveInput = { x, y };
}

addEventListener('keydown', e => {
  initAudio();
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  if (e.key === 'Escape' || k === 'p') { togglePause(); return; }
  keys.add(k);
  updateMove();
});
addEventListener('keyup', e => {
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  keys.delete(k);
  updateMove();
});
addEventListener('blur', () => { keys.clear(); joy.active = false; updateMove(); });

/* 포인터(터치/마우스) 조이스틱 */
cv.addEventListener('pointerdown', e => {
  initAudio();
  if (game.state !== 'run' || game.paused) return;
  cv.setPointerCapture(e.pointerId);
  joy.active = true; joy.id = e.pointerId;
  joy.ox = e.clientX; joy.oy = e.clientY; joy.dx = 0; joy.dy = 0;
  updateMove();
});
cv.addEventListener('pointermove', e => {
  if (!joy.active || e.pointerId !== joy.id) return;
  let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy;
  const l = Math.hypot(dx, dy);
  const R = 62;
  if (l > R) { dx = dx / l * R; dy = dy / l * R; }
  joy.dx = dx / R; joy.dy = dy / R;
  updateMove();
});
function endPointer(e) {
  if (e && joy.id != null && e.pointerId !== joy.id) return;
  joy.active = false; joy.id = null; joy.dx = 0; joy.dy = 0;
  updateMove();
}
cv.addEventListener('pointerup', endPointer);
cv.addEventListener('pointercancel', endPointer);
addEventListener('pointerup', endPointer);

/* 일시정지 */
let pausedByUser = false;
function togglePause() {
  if (game.state !== 'run') return;
  if (game.paused && !pausedByUser) return; // 레벨업/진화 중에는 무시
  if (!game.paused) {
    pausedByUser = true;
    game.paused = true;
    ui.showPause(save.settings);
  } else if (pausedByUser) {
    pausedByUser = false;
    game.paused = false;
    ui.hidePause();
  }
}
document.getElementById('pauseBtn').addEventListener('click', togglePause);
['pause', 'map', 'combo'].forEach(name => {
  const btn = document.getElementById('ptab-' + name);
  if (btn) btn.addEventListener('click', () => ui.pauseTab(name));
});
document.getElementById('pauseOverlay').addEventListener('click', e => {
  if (e.target === e.currentTarget && pausedByUser) togglePause();
});
document.getElementById('resumeBtn').addEventListener('click', togglePause);
document.getElementById('quitBtn').addEventListener('click', () => {
  pausedByUser = false;
  game.paused = false;
  game.state = 'idle';
  ui.hidePause();
  ui.hideAllOverlays();
  ui.showTitle();
});
document.getElementById('soundBtn').addEventListener('click', () => {
  const v = toggleSetting('sfx');
  setSfxEnabled(v);
  document.getElementById('soundBtn').textContent = '효과음: ' + (v ? '켜짐' : '꺼짐');
});
document.getElementById('cryBtn').addEventListener('click', () => {
  const v = toggleSetting('cries');
  setCryEnabled(v);
  document.getElementById('cryBtn').textContent = '울음소리: ' + (v ? '켜짐' : '꺼짐');
});
const shakeBtn = document.getElementById('shakeBtn');
if (shakeBtn) shakeBtn.addEventListener('click', () => {
  const v = toggleSetting('shake');
  game.applySettings();
  shakeBtn.textContent = '화면 흔들림: ' + (v ? 'ON' : 'OFF');
});
const viewBtn = document.getElementById('viewBtn');
if (viewBtn) viewBtn.addEventListener('click', () => {
  const order = Object.keys(VIEW_MODES);
  const cur = getSave().settings.view || 'wide';
  const next = order[(order.indexOf(cur) + 1) % order.length];
  setSetting('view', next);
  game.resize();
  viewBtn.textContent = '시야: ' + VIEW_MODES[next].name;
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && game.state === 'run' && !game.paused) togglePause();
});

/* ---------- 루프 ---------- */
let last = performance.now();
let renderErrorOnce = false;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  try {
    if (game.state === 'run') game.update(dt);
    game.render();
  } catch (err) {
    if (!renderErrorOnce) {
      renderErrorOnce = true;
      window.__errors.push('loop: ' + (err && err.stack || err));
    }
  }
  requestAnimationFrame(frame);
}

/* ---------- 부팅 ---------- */
async function boot() {
  const ids = Object.keys(DEX).map(Number);
  const pct = document.getElementById('loadPct');
  await preload(ids, false, (n, total) => {
    if (pct) pct.textContent = Math.round(n / total * 100) + '%';
  });
  await preload(CHARACTERS.map(c => c.id), true);
  await preload(CHARACTERS.filter(c => c.special).map(c => c.special.id), false);
  document.getElementById('loading').classList.add('hidden');
  ui.showTitle();
  requestAnimationFrame(frame);
}

addEventListener('resize', () => game.resize());
if (window.visualViewport) window.visualViewport.addEventListener('resize', () => game.resize());

/* ---------- 자체 테스트 (개발/검증용) ---------- */
window.__start = (opts = {}) => {
  startRun({ charKey: opts.charKey || 'pikachu', stageKey: opts.stageKey || 'meadow', shiny: !!opts.shiny });
  return game.state;
};

window.__selftest = async function (opts = {}) {
  const errors = [];
  const results = [];
  game.autoPick = true;
  const cases = opts.cases || ['pikachu', 'charmander', 'eevee', 'mewtwo'];
  for (const key of cases) {
    const before = window.__errors.length;
    game.suppressEnd = true;
    game.startRun({ charKey: key, stageKey: opts.stageKey || 'meadow', shiny: false, auto: true });
    const sim = game.simulate(opts.seconds || 300);
    window.__errors.slice(before).forEach(e => errors.push(key + ': ' + e));
    results.push({
      key, time: Math.round(sim.time), state: sim.state, level: sim.level,
      kills: sim.kills, coins: Math.round(game.runCoins), weapons: game.player.weaponList.length,
      evo: game.evoStage, special: game.special ? game.special.name : null,
      supers: game.superCount, errs: sim.errors.length ? sim.errors : undefined
    });
  }
  game.state = 'idle';
  game.hideResult = true;
  return { results, errors };
};

window.__selftestAll = async function (stageKey) {
  const out = [];
  for (const c of CHARACTERS) {
    game.startRun({ charKey: c.key, stageKey: stageKey || STAGES[0].key, auto: true });
    const sim = game.simulate(240);
    out.push({ key: c.key, t: Math.round(sim.time), lv: sim.level, kills: sim.kills, st: sim.state, err: sim.errors[0] || null });
  }
  game.state = 'idle';
  return out;
};

window.__botplay = function (seconds, stageKey = 'meadow', charKey = 'pikachu') {
  game.startRun({ charKey, stageKey, auto: true });
  return game.simulate(seconds);
};

/* 테스트용: 퀘스트 목표를 즉시 채운다 */
window.__forceQuests = function () {
  const c = game.char;
  const q = game.evoStage < c.evoQuests.length ? c.evoQuests[game.evoStage] : (c.special ? c.special.quest : null);
  if (!q) return 'none';
  const st = game.runStats;
  const g = q.goals || q;
  if (g.kills) st.kills = g.kills;
  if (g.elites) st.elites = g.elites;
  if (g.bosses) st.bosses = g.bosses;
  if (g.chests) st.chests = g.chests;
  if (g.skillHits) st.skillHits = g.skillHits;
  if (g.noHit) st.noHitBest = g.noHit;
  if (g.time) game.time = Math.max(game.time, g.time);
  game.checkEvolution();
  return game.questInfo().title;
};

/* 테스트용: 메가/거다이 즉시 발동 */
window.__testSpecial = function (charKey) {
  const c = CHARACTERS.find(x => x.key === (charKey || 'charmander'));
  game.startRun({ charKey: c.key, stageKey: 'meadow', auto: true });
  game.evoStage = c.evoQuests.length;
  if (c.chain.length > 1) game.evolveTo(c.chain[c.chain.length - 1].id);
  game.paused = false;
  if (c.special) game.doSpecial(c.special);
  return { char: c.key, name: game.currentStageName(), id: game.currentStage(), special: !!game.special };
};

/* 테스트용: 초각성 즉시 구성 */
window.__testSuper = function (key) {
  game.startRun({ charKey: 'pikachu', stageKey: 'meadow', auto: true });
  const rec = (window.__superRecipes || []);
  void rec;
  const chars = ['thunder', 'flame'];
  for (const id of chars) {
    if (!game.player.weaponList.some(w => w.id === id)) game.addWeapon(id, 6);
    const w = game.player.weaponList.find(x => x.id === id);
    w.lv = 6; w.awake = true;
  }
  const s = key || 'storm';
  game.applySuper({ key: s, name: '폭풍의 심판', icon: '🌩️', color: '#fde047', from: chars, desc: '' });
  return { supers: game.superCount, weapons: game.player.weaponList.map(w => w.id) };
};

boot();
