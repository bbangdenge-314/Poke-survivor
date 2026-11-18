/* ============================================================
   POKE SURVIVOR — 부트스트랩 / 입력 / 루프
   ============================================================ */
import { Game } from './game.js?v=5';
import { UI } from './ui.js?v=5';
import { DEX, CHARACTERS, STAGES } from './data.js?v=5';
import { preload, playCry, setCryEnabled } from './sprites.js?v=5';
import { initAudio, setSfxEnabled, SFX } from './audio.js?v=5';
import { getSave, persist, recordRun, toggleSetting } from './save.js?v=5';

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
window.__game = game;
window.__ui = ui;
window.__save = getSave;

const save = getSave();
setSfxEnabled(save.settings.sfx !== false);
setCryEnabled(save.settings.cries !== false);

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
      finalLevel: result.level, seenIds: result.seenIds
    });
    setTimeout(() => ui.showResult(g, result), result.win ? 900 : 700);
  },
  autoResolveUI: (g) => {
    // 테스트용: 정지 상태를 강제로 해제
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
  if (k === 'escape' || k === 'p') { togglePause(); return; }
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
  // 플레이어블 이로치도 미리
  await preload(CHARACTERS.map(c => c.id), true);
  document.getElementById('loading').classList.add('hidden');
  ui.showTitle();
  requestAnimationFrame(frame);
}

addEventListener('resize', () => game.resize());
if (window.visualViewport) window.visualViewport.addEventListener('resize', () => game.resize());

/* ---------- 자체 테스트 ---------- */
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
      evo: game.evoStage, errs: sim.errors.length ? sim.errors : undefined
    });
    // UI 화면은 건드리지 않는다
  }
  game.state = 'idle';
  game.hideResult = true;
  return { results, errors };
};

window.__selftestAll = async function () {
  const out = [];
  for (const c of CHARACTERS) {
    game.startRun({ charKey: c.key, stageKey: STAGES[0].key, auto: true });
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

boot();
