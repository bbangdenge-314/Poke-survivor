/* ============================================================
   POKE SURVIVOR — 게임 엔진
   ============================================================ */
import { WEAPONS, PASSIVES, CHARACTERS, CHAR_BY_KEY, ENEMIES, STAGES, DEX, TYPE_COLORS, BRANCH_NAMES, BRANCH_WEAPON, FIELD_ITEMS, FIELD_ITEM_KEYS, PROP_TYPES, SUPER_AWAKENS, VIEW_MODES } from './data.js?v=22';
import { getSprite, getWhiteSprite, spriteBounds, fallbackDraw, playCry, loadSprite } from './sprites.js?v=22';
import { SFX } from './audio.js?v=22';
import { metaMods, markCaught, markSeen, getSave, isFieldUnlocked, isPassiveUnlocked } from './save.js?v=22';

const TAU = Math.PI * 2;
const WORLD = 4600;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[(Math.random() * arr.length) | 0];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
function hash2(x, y) {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}
function hexA(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
const FLYING = new Set([16, 41, 42, 92, 93, 94, 123, 144, 145, 146, 150, 151, 249, 385, 384, 491]);

export class Game {
  constructor(canvas, hooks) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.hooks = hooks || {};
    this.state = 'idle';
    this.paused = false;
    this.autoPick = false;
    this.dpr = 1;
    this.W = 0; this.H = 0;
    this.uiQueue = [];
    this.time = 0;
    this.runTimeLimit = 900;
    this.lastHud = 0;
    this.acc = 0;
    this.runSeed = 1;
    this.applySettings();
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  applySettings() {
    const st = (getSave().settings) || {};
    this.shakeOn = st.shake !== false;
    this.viewMode = VIEW_MODES[st.view] ? st.view : 'wide';
    this.view = VIEW_MODES[this.viewMode];
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.W = this.cv.clientWidth || innerWidth;
    this.H = this.cv.clientHeight || innerHeight;
    this.cv.width = Math.round(this.W * dpr);
    this.cv.height = Math.round(this.H * dpr);
    this.applySettings();
    const vf = (this.view && this.view.zoom) || 1;
    this.zoom = clamp(Math.min(this.W, this.H) / 980, 0.62, 1) * vf;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
  }

  /* ================= 런 시작 ================= */
  startRun(opts) {
    const char = CHAR_BY_KEY[opts.charKey] || CHARACTERS[0];
    const stage = STAGES.find(s => s.key === opts.stageKey) || STAGES[0];
    const meta = metaMods();
    this.char = char;
    this.stage = stage;
    this.meta = meta;
    this.shiny = !!opts.shiny || Math.random() < (0.015 + this.meta.shinyChance);
    this.autoPick = !!opts.auto;
    this.time = 0;
    this.runTimeLimit = stage.duration;
    this.paused = false;
    this.state = 'run';
    this.uiQueue = [];
    this.stageIdx = STAGES.indexOf(stage);
    this.stageDiff = [1, 1.35, 1.7, 2.05, 2.4, 2.8, 3.3][this.stageIdx] || 1;
    this.runStats = { kills: 0, elites: 0, bosses: 0, skillHits: 0, chests: 0, noHit: 0, noHitBest: 0 };
    this.evoStep = 0;
    this.special = null;
    this.specialDone = false;
    this.superCount = 0;
    this.chestCount = 0;
    this.lastHitAt = -999;
    this._superSeen = false;
    this.kills = 0;
    this.applySettings();
    this.runCoins = 0;
    this.runDust = 0;
    this.bossesKilled = 0;
    this.legendsKilled = 0;
    this.shiniesKilled = 0;
    this.awakenCount = 0;
    this.itemsCollected = 0;
    this.revives = meta.revive;
    this.won = false;
    this.seenIds = new Set();
    this.cam = { x: 0, y: 0, shake: 0, kickX: 0, kickY: 0 };
    this.announcement = null;
    this.spawnTimer = 0;
    this.eliteTimer = 35;
    this.elapsedBossIdx = 0;
    this.elapsedLegendIdx = 0;
    this.finalSpawned = false;
    this.finalBoss = null;
    this.dashState = null;
    this.hazardTimer = 0;
    this.evoStage = 0;
    this.stageIdx = 0;
    this.pendingLevels = 0;
    this._bossDone = {};
    this._legDone = {};
    this._sigTick = 0;
    this._bossSpawned = new Set();
    this.hitstop = 0;
    this.flash = 0;
    this.flashColor = '#fff';
    this.vacuumT = 0;
    this.fieldTimer = 5;
    this.ghosts = [];
    this.runSeed = (Math.random() * 1e6) | 0;

    this.enemies = [];
    this.projectiles = [];
    this.ebullets = [];
    this.orbs = [];
    this.pickups = [];
    this.fieldItems = [];
    this.props = [];
    this.particles = [];
    this.texts = [];
    this.rings = [];
    this.bolts = [];
    this.beams = [];
    this.slashes = [];
    this.hazards = [];
    this.floats = [];
    this.deco = { ponds: [], paths: [], trees: [], rocks: [], flowers: [], tufts: [], bushes: [], pillars: [], clouds: [], crystals: [], hills: [], mist: [], graves: [], corals: [], bubbles: [], embers: [], shards: [], rifts: [] };
    this._miniBg = {};

    const hp = (char.hp + meta.hp) * (char.sig === 'thickfat' ? 1.25 : 1);
    this.player = {
      x: WORLD / 2, y: WORLD / 2, r: 20, hp, maxHp: hp,
      baseSpeed: char.speed, speed: char.speed,
      level: 1, xp: 0, xpNext: this.xpNeeded(1),
      face: 1, vx: 0, vy: 0, moving: false, inv: 0, hitFlash: 0,
      t: 0, weaponList: [], passives: {}, scale: 1, regenAcc: 0,
      critChance: 0.05, critMul: 1.6, armor: 0, magnet: 110,
      xpMul: 1, coinMul: 1, dmgMul: 1, cdMul: 1, regen: 0,
      sig: char.sig, shiny: this.shiny,
      mastery: char.mastery || {}, affinity: char.affinity || [],
      anim: { atk: 0, walk: 0, tilt: 0, squash: 0, hurt: 0, land: 0 },
      hasteT: 0, guardT: 0
    };
    this.base = {
      hp: char.hp + meta.hp,
      speed: char.speed,
      dmg: char.dmg * meta.dmg
    };
    this.addWeapon(char.weapon, 1);
    for (let i = 0; i < meta.startLv; i++) {
      const pool = Object.keys(WEAPONS).filter(k => k !== char.weapon && !this.player.weaponList.some(w => w.id === k));
      if (pool.length) this.addWeapon(pick(pool), 1);
    }
    if (char.sig === 'transform') this.player.weaponList.forEach(w => { w.lv = Math.min(WEAPONS[w.id].max, w.lv + 1); });
    this.recalc(true);
    this.player.hp = this.player.maxHp;
    markSeen(char.id);
    this.seenIds.add(char.id);
    this.buildWorld();
    this.cam.x = this.player.x - (this.W / this.zoom) / 2;
    this.cam.y = this.player.y - (this.H / this.zoom) / 2;
    this.announce('모험 시작!', '이동만 하면 자동 공격 · 레벨업으로 기술을 고르세요', '#93c5fd');
    if (this.hooks.onRunStart) this.hooks.onRunStart(this);
    return this;
  }

  xpNeeded(level) {
    return Math.round(5 + level * 4 + Math.pow(level, 1.95) * 1.1);
  }

  /* ================= 월드 생성 ================= */
  buildWorld() {
    const rnd = mulberry32(0x9e3779b9 ^ (this.runSeed + this.stage.key.length * 977));
    const d = this.deco;
    const theme = this.stage.terrain.theme;
    const W = WORLD;

    /* 길 */
    const pathCount = theme === 'sky' ? 2 : 4;
    for (let i = 0; i < pathCount; i++) {
      const horizontal = rnd() < 0.5;
      const base = 380 + rnd() * (W - 760);
      const amp = 110 + rnd() * 240;
      const freq = 0.0014 + rnd() * 0.0018;
      const pts = [];
      for (let s = 0; s <= 28; s++) {
        const along = (s / 28) * W;
        const off = Math.sin(along * freq + i * 2.1) * amp + Math.sin(along * freq * 2.7 + i) * amp * 0.28;
        pts.push(horizontal ? [along, clamp(base + off, 130, W - 130)] : [clamp(base + off, 130, W - 130), along]);
      }
      d.paths.push({ pts, w: 62 + rnd() * 56 });
    }

    /* 물웅덩이 / 용암 / 심해 */
    const pondCount = theme === 'meadow' ? 14 : theme === 'cave' ? 10 : theme === 'aqua' ? 18 : theme === 'volcano' ? 12 : theme === 'rift' ? 7 : 8;
    for (let i = 0; i < pondCount; i++) {
      const cx = 240 + rnd() * (W - 480), cy = 240 + rnd() * (W - 480);
      const rx = 115 + rnd() * 200, ry = rx * (0.52 + rnd() * 0.52);
      const blob = [];
      for (let k = 0; k < 11; k++) blob.push(0.80 + rnd() * 0.38);
      d.ponds.push({ x: cx, y: cy, rx, ry, rot: rnd() * Math.PI, blob, lava: theme === 'cave' });
    }

    /* 큰 지형 음영 */
    for (let i = 0; i < 26; i++) {
      d.hills.push({ x: rnd() * W, y: rnd() * W, r: 220 + rnd() * 420, a: 0.05 + rnd() * 0.09, dark: rnd() < 0.5 });
    }

    /* 나무 / 기둥 / 바위 / 수정 / 꽃 / 풀 */
    const treeCount = theme === 'meadow' ? 170 : theme === 'forest' ? 230 : theme === 'sky' ? 40 : theme === 'aqua' ? 0 : 30;
    for (let i = 0; i < treeCount; i++) {
      d.trees.push({ x: 80 + rnd() * (W - 160), y: 80 + rnd() * (W - 160), s: 0.75 + rnd() * 0.8, kind: (rnd() * 3) | 0, sway: rnd() * TAU });
    }
    for (let i = 0; i < (theme === 'cave' ? 90 : 0); i++) {
      d.crystals.push({ x: 80 + rnd() * (W - 160), y: 80 + rnd() * (W - 160), h: 26 + rnd() * 40, rot: rnd() * TAU, hue: rnd() < 0.5 ? '#a5b4fc' : '#c4b5fd' });
    }
    for (let i = 0; i < (theme === 'sky' ? 90 : 0); i++) {
      d.pillars.push({ x: 80 + rnd() * (W - 160), y: 80 + rnd() * (W - 160), h: 70 + rnd() * 90, rot: rnd() * TAU });
      d.clouds.push({ x: rnd() * W, y: rnd() * W, r: 60 + rnd() * 110, a: 0.10 + rnd() * 0.12 });
    }
    /* 테마 전용 장식 */
    if (theme === 'forest') {
      for (let i = 0; i < 130; i++) d.mist.push({ x: rnd() * W, y: rnd() * W, r: 120 + rnd() * 260, a: 0.05 + rnd() * 0.07 });
      for (let i = 0; i < 100; i++) d.graves.push({ x: 80 + rnd() * (W - 160), y: 80 + rnd() * (W - 160), s: 0.7 + rnd() * 0.7, rot: rnd() * 0.5 - 0.25 });
      for (let i = 0; i < 160; i++) d.flowers.push({ x: rnd() * W, y: rnd() * W, c: pick(['#c084fc', '#a78bfa', '#f9a8d4', '#7dd3fc']), n: 2 + ((rnd() * 3) | 0), r: rnd() * TAU });
    }
    if (theme === 'aqua') {
      for (let i = 0; i < 170; i++) d.corals.push({ x: 80 + rnd() * (W - 160), y: 80 + rnd() * (W - 160), s: 0.6 + rnd() * 1.1, hue: pick(['#f9a8d4', '#fdba74', '#a7f3d0', '#c4b5fd']), rot: rnd() * TAU });
      for (let i = 0; i < 150; i++) d.bubbles.push({ x: rnd() * W, y: rnd() * W, r: 3 + rnd() * 9, sp: 10 + rnd() * 26, ph: rnd() * TAU });
    }
    if (theme === 'volcano') {
      for (let i = 0; i < 180; i++) d.embers.push({ x: rnd() * W, y: rnd() * W, r: 1.5 + rnd() * 3, sp: 14 + rnd() * 30, ph: rnd() * TAU });
      for (let i = 0; i < 70; i++) d.rocks.push({ x: 60 + rnd() * (W - 120), y: 60 + rnd() * (W - 120), s: 0.8 + rnd() * 1.4, rot: rnd() * TAU, seed: (rnd() * 1000) | 0 });
    }
    if (theme === 'rift') {
      for (let i = 0; i < 130; i++) d.shards.push({ x: 80 + rnd() * (W - 160), y: 80 + rnd() * (W - 160), h: 26 + rnd() * 70, rot: rnd() * TAU, hue: pick(['#a78bfa', '#f0abfc', '#67e8f9']) });
      for (let i = 0; i < 40; i++) d.rifts.push({ x: 80 + rnd() * (W - 160), y: 80 + rnd() * (W - 160), h: 90 + rnd() * 220, rot: rnd() * TAU });
    }
    for (let i = 0; i < (theme === 'meadow' ? 150 : 70); i++) {
      d.rocks.push({ x: 60 + rnd() * (W - 120), y: 60 + rnd() * (W - 120), s: 0.6 + rnd() * 1.1, rot: rnd() * TAU, seed: (rnd() * 1000) | 0 });
    }
    for (let i = 0; i < (theme === 'meadow' ? 90 : 40); i++) {
      d.bushes.push({ x: 60 + rnd() * (W - 120), y: 60 + rnd() * (W - 120), s: 0.6 + rnd() * 0.7, kind: (rnd() * 3) | 0 });
    }
    for (let i = 0; i < 260; i++) {
      d.flowers.push({ x: rnd() * W, y: rnd() * W, c: pick(['#fde68a', '#fca5a5', '#c4b5fd', '#fdba74', '#f9a8d4']), n: 2 + ((rnd() * 4) | 0), r: rnd() * TAU });
    }
    for (let i = 0; i < 640; i++) {
      d.tufts.push({ x: rnd() * W, y: rnd() * W, s: 0.7 + rnd() * 1.1, rot: rnd() * TAU });
    }

    /* 파괴 가능한 오브젝트 — 격자 지터 배치 */
    const cell = 210;
    for (let gy = 0; gy < WORLD / cell; gy++) {
      for (let gx = 0; gx < WORLD / cell; gx++) {
        if (rnd() > 0.30) continue;
        const x = (gx + 0.18 + rnd() * 0.64) * cell;
        const y = (gy + 0.18 + rnd() * 0.64) * cell;
        if (dist2(x, y, WORLD / 2, WORLD / 2) < 300 * 300) continue;
        const type = theme === 'cave' ? pick(['rock', 'crystal', 'crate']) : theme === 'sky' ? pick(['crate', 'crystal', 'rock']) : pick(['crate', 'crate', 'rock']);
        this.props.push(this.makeProp(type, x, y));
      }
    }

    /* 초기 필드 아이템 */
    for (let i = 0; i < 15; i++) {
      const a = rnd() * TAU, r = 300 + rnd() * 1100;
      this.spawnFieldItem(WORLD / 2 + Math.cos(a) * r, WORLD / 2 + Math.sin(a) * r, FIELD_ITEM_KEYS[(rnd() * FIELD_ITEM_KEYS.length) | 0]);
    }
  }

  makeProp(type, x, y) {
    const def = PROP_TYPES[type];
    return { type, x, y, r: def.r, hp: def.hp, maxHp: def.hp, flash: 0, shake: 0, dead: false, bob: Math.random() * TAU, seed: (Math.random() * 999) | 0 };
  }

  /* ================= 스탯 재계산 ================= */
  recalc(initial = false) {
    const p = this.player, s = p.sig, pv = p.passives;
    const lv = k => pv[k] || 0;
    let dmg = this.base.dmg;
    dmg *= 1 + 0.12 * lv('power');
    if (s === 'pressure') dmg *= 1.2;
    if (s === 'airlock') dmg *= 1.15;
    p.dmgMul = dmg;

    let maxHp = this.base.hp + 22 * lv('vitality');
    if (s === 'thickfat') maxHp *= 1.25;
    const oldMax = p.maxHp;
    p.maxHp = Math.round(maxHp);
    if (!initial && p.maxHp > oldMax) p.hp += p.maxHp - oldMax;
    p.hp = Math.min(p.hp, p.maxHp);

    let speed = this.base.speed * (1 + 0.08 * lv('speed')) * this.meta.speed;
    if (s === 'levitate') speed *= 1.12;
    if (s === 'airlock') speed *= 1.08;
    p.speed = speed;

    p.cdMul = this.meta.haste / (1 + 0.1 * lv('cooldown'));
    p.magnet = 110 * (1 + 0.25 * lv('magnet')) * this.meta.magnet;
    p.critChance = 0.05 + 0.09 * lv('crit') + (s === 'innerfocus' ? 0.15 : 0);
    p.critMul = 1.6 + 0.18 * lv('crit');
    p.armor = Math.min(0.75, this.meta.armor + 0.07 * lv('armor') + (s === 'shell' ? 0.18 : 0) + (s === 'thickfat' ? 0.08 : 0) + (s === 'clearbody' ? 0.12 : 0));
    p.xpMul = this.meta.xp * (1 + 0.14 * lv('xp')) * (s === 'adapt' ? 1.2 : 1) * (p.legendBoost ? 1.3 : 1);
    p.coinMul = this.meta.coin * (1 + 0.22 * lv('coin')) * (p.legendBoost ? 1.5 : 1);
    p.regen = 0.9 * lv('regen') + (s === 'photosynthesis' ? (this.evoStage > 0 ? 1.9 : 1.6) : 0);
  }

  addWeapon(id, lv) {
    if (this.player.weaponList.length >= 6 && !this.player.weaponList.some(w => w.id === id)) return;
    const ex = this.player.weaponList.find(w => w.id === id);
    if (ex) { ex.lv = Math.min(WEAPONS[id].max, ex.lv + 1); return; }
    this.player.weaponList.push({ id, lv: lv || 1, cd: 0.25, angle: Math.random() * TAU, state: {}, awake: false });
  }

  addPassive(id) {
    const cur = this.player.passives[id] || 0;
    if (cur === 0 && Object.keys(this.player.passives).length >= 6) return;
    this.player.passives[id] = Math.min(PASSIVES[id].max, cur + 1);
    this.recalc();
    if (this.refreshAwakenReady) this.refreshAwakenReady();
  }

  /* ================= 캐릭터 전용 기술 보정 ================= */
  weaponBonus(id) { return (this.char.weaponBonus || {})[id] || {}; }

  weaponStats(w) {
    const def = WEAPONS[w.id];
    const mod = this.weaponBonus(w.id);
    const st = { ...def.stats(w.lv) };
    if (mod.dmg) st.dmg *= mod.dmg;
    if (mod.count) st.count = (st.count || 1) + mod.count;
    if (mod.radius) st.radius = (st.radius || 100) * mod.radius;
    if (mod.pierce) st.pierce = (st.pierce || 0) + mod.pierce;
    if (mod.blast) st.blast = (st.blast || 40) * mod.blast;
    if (mod.chains) st.chains = (st.chains || 0) + mod.chains;
    if (mod.width) st.width = (st.width || 40) * mod.width;
    if (mod.dist) st.dist = (st.dist || 150) + mod.dist;
    if (mod.cd) st.cd = (st.cd || 1) * mod.cd;
    const mastery = this.player.mastery[def.type] || 0;
    if (mastery) st.dmg *= 1 + mastery;
    return st;
  }

  /* ================= 각성(스킬 조합) ================= */
  canAwaken(w) {
    if (!w || w.awake) return false;
    const def = WEAPONS[w.id];
    if (w.lv < def.max) return false;
    return (this.player.passives[def.pair] || 0) >= 1;
  }

  awakenReadyList() {
    return this.player.weaponList.filter(w => this.canAwaken(w));
  }

  awakenWeapon(w, silent) {
    if (!w || w.awake) return;
    const def = WEAPONS[w.id];
    w.awake = true;
    this.awakenCount++;
    const p = this.player;
    this.rings.push({ x: p.x, y: p.y, r: 24, r1: 340, life: 0.85, max: 0.85, color: def.awakeColor, kind: 'heal', hit: new Set(), dmg: 0 });
    this.rings.push({ x: p.x, y: p.y, r: 10, r1: 200, life: 1.1, max: 1.1, color: '#fff', kind: 'heal', hit: new Set(), dmg: 0 });
    for (let i = 0; i < 48; i++) {
      const a = rand(0, TAU), sp = rand(70, 380);
      this.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.9, max: 0.9, color: i % 2 ? def.awakeColor : '#fff', r: rand(3, 8) });
    }
    this.cam.shake = 16;
    this.flash = 0.45;
    this.flashColor = def.awakeColor;
    this.hitstop = 0.12;
    SFX.evolve();
    if (!silent) this.announce('각성 기술 해금!', `${def.icon}${def.name} → ${def.awakeIcon}${def.awakeName}`, def.awakeColor);
    else this.floatText(p.x, p.y - 50, def.awakeName + '!', def.awakeColor, 1.2);
  }

  refreshAwakenReady() {
    const p = this.player;
    if (!p) return;
    for (const w of p.weaponList) {
      const ready = this.canAwaken(w);
      if (ready && !w.readySeen) {
        w.readySeen = true;
        const d = WEAPONS[w.id];
        this.announce('각성 조합 완성!', `${d.icon}${d.name} Lv.${d.max} + ${PASSIVES[d.pair].icon}${PASSIVES[d.pair].name} → 레벨업에서 각성`, d.awakeColor);
        this.rings.push({ x: p.x, y: p.y, r: 16, r1: 120, life: 0.6, max: 0.6, color: d.awakeColor, kind: 'heal', hit: new Set(), dmg: 0 });
        SFX.levelup();
      } else if (!ready) w.readySeen = false;
    }
    const sp = this.superReadyList();
    if (sp.length && !this._superSeen) {
      this._superSeen = true;
      const s = sp[0];
      this.announce('초각성 조합 완성!', `${WEAPONS[s.from[0]].awakeName} + ${WEAPONS[s.from[1]].awakeName} → ${s.icon}${s.name}`, s.color);
      SFX.evolve();
    }
    if (!sp.length) this._superSeen = false;
  }

  /* ================= 초각성 (각성 + 각성 → 궁극기) ================= */
  superReadyList() {
    const owned = new Map(this.player.weaponList.map(w => [w.id, w]));
    return SUPER_AWAKENS.filter(s =>
      s.from.every(id => owned.get(id) && owned.get(id).awake) &&
      !this.player.weaponList.some(w => w.id === 'super_' + s.key));
  }

  superCard(s) {
    return {
      type: 'super', superKey: s.key, id: 'super_' + s.key, name: s.name, icon: s.icon, color: s.color,
      desc: s.desc, from: s.from.map(id => WEAPONS[id])
    };
  }

  applySuper(s) {
    if (!s) return;
    const p = this.player;
    const ids = s.from;
    this.player.weaponList = p.weaponList.filter(w => !ids.includes(w.id));
    p.weaponList.push({ id: 'super_' + s.key, lv: 1, cd: 0.5, angle: 0, state: {}, awake: true, super: true });
    this.superCount++;
    this.cam.shake = 22;
    this.hitstop = 0.16;
    this.flash = 0.55;
    this.flashColor = s.color;
    this.rings.push({ x: p.x, y: p.y, r: 20, r1: 520, life: 1.1, max: 1.1, color: s.color, kind: 'heal', hit: new Set(), dmg: 0 });
    this.rings.push({ x: p.x, y: p.y, r: 10, r1: 300, life: 0.8, max: 0.8, color: '#fff', kind: 'heal', hit: new Set(), dmg: 0 });
    for (let i = 0; i < 60; i++) {
      const a = rand(0, TAU), spd = rand(80, 460);
      this.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: rand(0.6, 1.1), max: 1.1, color: i % 2 ? s.color : '#fff', r: rand(3, 9) });
    }
    SFX.evolve();
    this.announce('★ 초각성 ★', `${s.icon} ${s.name} — 각성 기술이 하나로 합쳐졌다!`, s.color);
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (dist2(e.x, e.y, p.x, p.y) < 520 * 520) this.damage(e, 90 + p.level * 5, { color: s.color, knock: 200 });
    }
    this.refreshAwakenReady();
  }

  /* ================= 업데이트 ================= */
  update(dt) {
    if (this.state !== 'run') return;
    if (this.paused) { this.updateVisuals(dt * 0.35); return; }
    if (this.hitstop > 0) { this.hitstop -= dt; dt *= 0.22; }
    const p = this.player;
    this.time += dt;
    p.t += dt;
    p.inv = Math.max(0, p.inv - dt);
    p.guardT = Math.max(0, p.guardT - dt);
    p.hasteT = Math.max(0, p.hasteT - dt);
    this.runStats.noHit += dt;
    if (this.runStats.noHit > this.runStats.noHitBest) this.runStats.noHitBest = this.runStats.noHit;
    p.hitFlash = Math.max(0, p.hitFlash - dt);
    p.anim.atk = Math.max(0, p.anim.atk - dt * 4.4);
    p.anim.hurt = Math.max(0, p.anim.hurt - dt * 3.4);
    p.anim.land = Math.max(0, p.anim.land - dt * 5);
    this.vacuumT = Math.max(0, this.vacuumT - dt);
    this.flash = Math.max(0, this.flash - dt * 3.2);
    this.cam.kickX *= Math.pow(0.0015, dt);
    this.cam.kickY *= Math.pow(0.0015, dt);

    /* 이동 */
    const mv = this.moveInput || { x: 0, y: 0 };
    let mx = mv.x, my = mv.y;
    const ml = Math.hypot(mx, my);
    const haste = p.hasteT > 0 ? 1.5 : 1;
    if (ml > 0.08) {
      const n = Math.min(1, ml);
      mx /= ml; my /= ml;
      p.x += mx * p.speed * haste * n * dt;
      p.y += my * p.speed * haste * n * dt;
      p.moving = true;
      p.anim.walk += dt * (7 + p.speed / 55) * (haste > 1 ? 1.35 : 1);
      if (Math.abs(mx) > 0.15) p.face = mx > 0 ? 1 : -1;
      p.anim.tilt += (mx * 0.16 - p.anim.tilt) * Math.min(1, dt * 12);
    } else {
      p.moving = false;
      p.anim.tilt += (0 - p.anim.tilt) * Math.min(1, dt * 8);
    }
    p.x = clamp(p.x, 40, WORLD - 40);
    p.y = clamp(p.y, 40, WORLD - 40);

    if (this.dashState) {
      const d = this.dashState;
      d.t -= dt;
      const step = d.speed * dt;
      p.x = clamp(p.x + Math.cos(d.angle) * step, 40, WORLD - 40);
      p.y = clamp(p.y + Math.sin(d.angle) * step, 40, WORLD - 40);
      p.inv = Math.max(p.inv, 0.2);
      this.dashTrail(p.x, p.y);
      this.dashHit(d);
      if (d.t <= 0) {
        this.dashState = null;
        p.anim.land = 1;
        this.cam.shake = Math.min(10, this.cam.shake + 4);
        this.impact(p.x, p.y + 16, '#fca5a5', 0.8);
      }
    }

    if (p.regen > 0) p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
    if (p.sig === 'wish') {
      p.wishT = (p.wishT || 0) + dt;
      if (p.wishT > 25) {
        p.wishT = 0;
        p.hp = Math.min(p.maxHp, p.hp + 12);
        this.runCoins += 4;
        this.floatText(p.x, p.y - 30, '소원 성취!', '#fcd34d');
      }
    }
    if (p.sig === 'static' || p.sig === 'roughskin' || p.sig === 'intimidate' || p.sig === 'baddreams') {
      this.sigAura(dt);
    }
    if (p.legendBoost) {
      p.legendT = (p.legendT || 0) - dt;
      if (p.legendT <= 0) p.legendBoost = false;
    }

    this.updateWeapons(dt);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateEBullets(dt);
    this.updateOrbs(dt);
    this.updatePickups(dt);
    this.updateFieldItems(dt);
    this.updateProps(dt);
    this.updateHazards(dt);
    this.updateVisuals(dt);
    this.updateSpawns(dt);
    this.updateTimeline();
    this.evoTick = (this.evoTick || 0) + dt;
    if (this.evoTick > 0.4) { this.evoTick = 0; this.checkEvolution(); }

    /* 카메라 */
    const vw = this.W / this.zoom, vh = this.H / this.zoom;
    const cx = clamp(p.x - vw / 2, 0, WORLD - vw);
    const cy = clamp(p.y - vh / 2, 0, WORLD - vh);
    this.cam.x += (cx - this.cam.x) * Math.min(1, dt * 9);
    this.cam.y += (cy - this.cam.y) * Math.min(1, dt * 9);
    this.cam.shake = Math.max(0, this.cam.shake - dt * 22);

    /* HUD */
    this.hudAcc = (this.hudAcc || 0) + dt;
    if (this.hudAcc > 0.08) {
      this.hudAcc = 0;
      if (this.hooks.onHud && !this.skipHud) this.hooks.onHud(this);
    }
  }

  /* ================= 시그니처 오라 ================= */
  sigAura(dt) {
    const p = this.player;
    const s = p.sig;
    if (!this._sigTick) this._sigTick = 0;
    this._sigTick += dt;
    if (this._sigTick < 0.45) return;
    this._sigTick = 0;
    if (s === 'static') {
      for (const e of this.enemies) {
        if (dist2(e.x, e.y, p.x, p.y) < 62 * 62) {
          this.damage(e, 6 + p.level * 1.6, { color: '#fde047', silent: true });
          if (Math.random() < 0.4) this.arc(p.x, p.y, e.x, e.y, '#fde047');
        }
      }
    } else if (s === 'roughskin') {
      for (const e of this.enemies) {
        if (dist2(e.x, e.y, p.x, p.y) < 58 * 58) this.damage(e, 8 + p.level * 2, { color: '#fca5a5', silent: true });
      }
    } else if (s === 'baddreams') {
      for (const e of this.enemies) {
        if (dist2(e.x, e.y, p.x, p.y) < 150 * 150) {
          this.damage(e, 7 + p.level * 2, { color: '#c084fc', silent: true });
          if (Math.random() < 0.2) this.particles.push({ x: e.x + rand(-10, 10), y: e.y - 10, vx: 0, vy: -30, life: 0.5, max: 0.5, color: '#c084fc', r: 4 });
        }
      }
    }
  }

  /* ================= 무기 ================= */
  updateWeapons(dt) {
    const p = this.player;
    for (const w of p.weaponList) {
      const def = WEAPONS[w.id];
      const st = this.weaponStats(w);
      if (this.time < 0.35) continue;
      if (w.id === 'leaf') { this.updateLeaf(w, st, dt); continue; }
      if (w.id === 'nightmare') { this.updateNightmare(w, st, dt); continue; }
      if (w.id === 'tornado') { this.updateTornado(w, st, dt); continue; }
      if (w.id === 'curse') { this.updateCurse(w, st, dt); continue; }
      w.cd -= dt;
      if (w.cd > 0) continue;
      const fired = this.fireWeapon(w, st);
      if (fired) w.cd = Math.max(0.08, st.cd * p.cdMul);
      void def;
    }
  }

  nearestEnemies(n, range, fromX, fromY) {
    const fx = fromX ?? this.player.x, fy = fromY ?? this.player.y;
    if (!range) range = 1e9;
    const r2 = range * range;
    const arr = [];
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = dist2(e.x, e.y, fx, fy);
      if (d < r2) arr.push([d, e]);
    }
    arr.sort((a, b) => a[0] - b[0]);
    const out = [];
    for (let i = 0; i < Math.min(n, arr.length); i++) out.push(arr[i][1]);
    return out;
  }

  nearestTo(x, y, range, exclude) {
    let best = null, bd = range * range;
    for (const e of this.enemies) {
      if (e.dead || (exclude && exclude.has(e))) continue;
      const d = dist2(e.x, e.y, x, y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  attackAnim(dir) {
    const p = this.player;
    p.anim.atk = 1;
    if (dir != null) p.face = Math.cos(dir) >= 0 ? 1 : -1;
    this.cam.kickX += Math.cos(dir ?? 0) * 1.6;
    this.cam.kickY += Math.sin(dir ?? 0) * 1.2;
  }

  fireWeapon(w, st) {
    const p = this.player;
    const awake = w.awake;
    if (w.id.startsWith('super_')) return this.fireSuper(w, st);
    switch (w.id) {
      case 'thunder': {
        const targets = this.nearestEnemies(awake ? 8 : st.count, awake ? 1e9 : st.range);
        if (!targets.length) return false;
        this.attackAnim();
        for (const t0 of targets) {
          let cur = t0, dmg = st.dmg, hit = new Set([t0]);
          this.bolt(p.x, p.y, cur.x, cur.y);
          this.damage(cur, dmg, { color: '#fde047', stun: 0.12 });
          const chainN = st.chains * (awake ? 2 : 1);
          for (let c = 0; c < chainN; c++) {
            const nx = this.nearestTo(cur.x, cur.y, 280, hit);
            if (!nx) break;
            dmg *= 0.84;
            this.bolt(cur.x, cur.y, nx.x, nx.y);
            this.damage(nx, dmg, { color: '#fde047' });
            hit.add(nx); cur = nx;
          }
        }
        SFX.beam();
        return true;
      }
      case 'flame': {
        let dir;
        const near = this.nearestEnemies(1, 900)[0];
        if (near) dir = Math.atan2(near.y - p.y, near.x - p.x);
        else dir = p.face > 0 ? 0 : Math.PI;
        this.attackAnim(dir);
        const n = awake ? st.count * 2 : st.count;
        for (let i = 0; i < n; i++) {
          const a = awake ? (i / n) * TAU : dir + rand(-0.42, 0.42);
          const sp = rand(300, 430) * (awake ? 1.15 : 1);
          this.projectiles.push({
            x: p.x + Math.cos(a) * 24, y: p.y + Math.sin(a) * 24,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            r: 14 + st.dmg * 0.055, dmg: st.dmg, life: 0.55, pierce: 2 + (awake ? 2 : 0),
            kind: 'flame', color: i % 2 ? '#f97316' : '#fbbf24', hit: new Set(),
            burn: (0.6 + st.dmg * 0.02) * (this.char.sig === 'blaze' ? 2 : 1)
          });
        }
        return true;
      }
      case 'water': {
        const near = this.nearestEnemies(awake ? 3 : st.count, 900);
        if (!near.length) return false;
        this.attackAnim();
        near.forEach((e, i) => {
          const a = Math.atan2(e.y - p.y, e.x - p.x) + (i - (near.length - 1) / 2) * (awake ? 0.14 : 0.08);
          this.projectiles.push({
            x: p.x, y: p.y, vx: Math.cos(a) * (awake ? 800 : 640), vy: Math.sin(a) * (awake ? 800 : 640),
            r: awake ? 17 : 10, dmg: st.dmg * (awake ? 1.3 : 1), life: 1.4, pierce: st.pierce,
            kind: 'water', color: '#38bdf8', hit: new Set(), knock: 40, wave: this.char.sig === 'shell'
          });
        });
        SFX.dash();
        return true;
      }
      case 'shadow': {
        const n = st.count + (awake ? 4 : 0);
        const targets = this.nearestEnemies(awake ? 8 : n, 780);
        if (!targets.length) return false;
        this.attackAnim();
        for (const t of targets) {
          const a = Math.atan2(t.y - p.y, t.x - p.x);
          this.projectiles.push({
            x: p.x, y: p.y, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, r: 12 + st.dmg * 0.03,
            dmg: st.dmg, life: 2.4, pierce: awake ? 2 : 0, kind: 'shadow', color: '#a78bfa',
            hit: new Set(), homing: 5.5, blast: st.blast, chainBlast: awake, trail: []
          });
        }
        return true;
      }
      case 'psychic': {
        this.attackAnim();
        this.rings.push({ x: p.x, y: p.y, r: 20, r1: st.radius, life: 0.55, max: 0.55, color: '#f472b6', kind: 'psychic', hit: new Set(), dmg: st.dmg, pull: awake, delay: 0 });
        if (awake) {
          for (const e of this.enemies) {
            const d = Math.hypot(e.x - p.x, e.y - p.y);
            if (d < st.radius * 1.3 && d > 1) {
              e.kx = (p.x - e.x) / d * 200; e.ky = (p.y - e.y) / d * 200;
            }
          }
        }
        SFX.hit();
        return true;
      }
      case 'quake': {
        this.attackAnim();
        const waves = awake ? 3 : 1;
        for (let i = 0; i < waves; i++) {
          this.quakeAt(p.x, p.y, st.radius * (1 - i * 0.18), st.dmg * (1 - i * 0.22), i * 0.14);
        }
        this.cam.shake = Math.min(14, this.cam.shake + 8);
        SFX.explode();
        return true;
      }
      case 'beam': {
        const near = this.nearestEnemies(1, 1000)[0];
        const a = near ? Math.atan2(near.y - p.y, near.x - p.x) : (p.face > 0 ? 0 : Math.PI);
        this.attackAnim(a);
        this.beams.push({ x: p.x, y: p.y, angle: a, len: st.length, width: st.width, life: 0.35, max: 0.35, color: '#fde68a', hit: new Set(), dmg: st.dmg, awake });
        SFX.beam();
        this.cam.shake = Math.min(12, this.cam.shake + 5);
        return true;
      }
      case 'claw': {
        let dir;
        const near = this.nearestEnemies(1, 320)[0];
        if (near) dir = Math.atan2(near.y - p.y, near.x - p.x);
        else dir = p.face > 0 ? 0 : Math.PI;
        this.attackAnim(dir);
        const n = awake ? 3 : st.count;
        for (let i = 0; i < n; i++) {
          const a = dir + (n > 1 ? (i - (n - 1) / 2) * 0.5 : 0);
          this.clawAt(p.x, p.y, a, st.range, st.dmg, i * 0.06);
        }
        SFX.crit();
        return true;
      }
      case 'ice': {
        const near = this.nearestEnemies(awake ? 6 : st.count, 800);
        if (!near.length) return false;
        this.attackAnim();
        for (const t of near) {
          const a = Math.atan2(t.y - p.y, t.x - p.x);
          this.projectiles.push({
            x: p.x, y: p.y, vx: Math.cos(a) * 700, vy: Math.sin(a) * 700, r: 9,
            dmg: st.dmg, life: 1.2, pierce: st.pierce, kind: 'ice', color: '#7dd3fc',
            hit: new Set(), slow: st.slow, freeze: 0.12 + st.slow * 0.4
          });
        }
        if (awake) {
          for (const e of this.enemies) if (dist2(e.x, e.y, p.x, p.y) < 220 * 220) e.freeze = Math.max(e.freeze, 0.8);
          this.rings.push({ x: p.x, y: p.y, r: 30, r1: 220, life: 0.6, max: 0.6, color: '#7dd3fc', kind: 'ice', hit: new Set(), dmg: 0, delay: 0 });
        }
        return true;
      }
      case 'aura': {
        const targets = this.nearestEnemies(awake ? 4 : st.count, 780);
        if (!targets.length) return false;
        this.attackAnim();
        for (const t of targets) {
          const a = Math.atan2(t.y - p.y, t.x - p.x);
          this.projectiles.push({
            x: p.x, y: p.y, vx: Math.cos(a) * 400, vy: Math.sin(a) * 400, r: 13,
            dmg: st.dmg, life: 2, pierce: 2, kind: 'aura', color: '#60a5fa',
            hit: new Set(), homing: 7, blast: st.blast, chainBlast: awake
          });
        }
        return true;
      }
      case 'star': {
        this.attackAnim();
        const n = awake ? st.count * 2 : st.count;
        for (let i = 0; i < n; i++) {
          let tx, ty;
          if (this.enemies.length && Math.random() < 0.82) {
            const e = pick(this.enemies);
            tx = e.x + rand(-25, 25); ty = e.y + rand(-25, 25);
          } else {
            tx = p.x + rand(-260, 260); ty = p.y + rand(-260, 260);
          }
          this.rings.push({
            x: tx, y: ty, r: 4, r1: st.blast, life: 0.75, max: 0.75, color: '#fcd34d',
            kind: 'meteor', hit: new Set(), dmg: st.dmg, delay: 0.4 + i * 0.03, target: true
          });
        }
        return true;
      }
      case 'dash': {
        if (this.dashState) return false;
        let a;
        const near = this.nearestEnemies(1, 460)[0];
        const mv = this.moveInput || { x: 0, y: 0 };
        if (near) a = Math.atan2(near.y - p.y, near.x - p.x);
        else if (Math.hypot(mv.x, mv.y) > 0.1) a = Math.atan2(mv.y, mv.x);
        else a = p.face > 0 ? 0 : Math.PI;
        this.attackAnim(a);
        this.dashState = { angle: a, speed: st.dist / 0.16, t: 0.16, dmg: st.dmg, hit: new Set(), count: awake ? 2 : 1 };
        SFX.dash();
        return true;
      }
      case 'slam': {
        this.attackAnim();
        this.slamAt(p.x, p.y, st.radius, st.dmg, awake);
        SFX.explode();
        this.cam.shake = Math.min(16, this.cam.shake + 10);
        return true;
      }
      case 'poison': {
        const targets = this.nearestEnemies(st.count, 520);
        if (!targets.length) return false;
        this.attackAnim();
        for (const t of targets) {
          this.hazards.push({ x: t.x, y: t.y, r: st.radius, life: 3.8, dmg: st.dmg * 0.55, color: '#a855f7', src: 'player', slow: 0.15 });
          for (let i = 0; i < 8; i++) {
            const a = rand(0, TAU);
            this.particles.push({ x: t.x, y: t.y, vx: Math.cos(a) * rand(30, 130), vy: Math.sin(a) * rand(30, 130) - 30, life: 0.6, max: 0.6, color: i % 2 ? '#c084fc' : '#a855f7', r: rand(2, 5) });
          }
        }
        SFX.hit();
        return true;
      }
      case 'bone': {
        const near = this.nearestEnemies(awake ? st.count * 2 : st.count, 700);
        if (!near.length) return false;
        this.attackAnim();
        for (const t of near) {
          const a = Math.atan2(t.y - p.y, t.x - p.x);
          this.projectiles.push({
            x: p.x, y: p.y, vx: Math.cos(a) * 560, vy: Math.sin(a) * 560, r: 13,
            dmg: st.dmg, life: 1.25, pierce: 99, kind: 'bone', color: '#e7d3a1',
            hit: new Set(), boomerang: true, spin: rand(0, TAU)
          });
        }
        SFX.crit();
        return true;
      }
      case 'echo': {
        this.attackAnim();
        const waves = awake ? 3 : 1;
        for (let i = 0; i < waves; i++) {
          this.rings.push({
            x: p.x, y: p.y, r: 20, r1: st.radius * (1 - i * 0.15), life: 0.55,
            max: 0.55, color: '#fda4af', kind: 'echo', hit: new Set(), dmg: st.dmg * (1 - i * 0.25), delay: i * 0.12, stun: 0.2
          });
        }
        SFX.beam();
        return true;
      }
      case 'fairy': {
        const targets = this.nearestEnemies(awake ? st.count * 2 : st.count, 780);
        if (!targets.length) return false;
        this.attackAnim();
        for (const t of targets) {
          const a = Math.atan2(t.y - p.y, t.x - p.x);
          this.projectiles.push({
            x: p.x, y: p.y, vx: Math.cos(a) * 360, vy: Math.sin(a) * 360, r: 12,
            dmg: st.dmg, life: 2.2, pierce: 1, kind: 'fairy', color: '#f9a8d4',
            hit: new Set(), homing: 6, blast: st.blast, trail: []
          });
        }
        return true;
      }
      case 'mirror': {
        const near = this.nearestEnemies(awake ? 6 : st.count, 820);
        if (!near.length) return false;
        this.attackAnim();
        for (const t of near) {
          const a = Math.atan2(t.y - p.y, t.x - p.x);
          this.projectiles.push({
            x: p.x, y: p.y, vx: Math.cos(a) * 760, vy: Math.sin(a) * 760, r: 10,
            dmg: st.dmg, life: 1.1, pierce: st.pierce, kind: 'mirror', color: '#e2e8f0',
            hit: new Set()
          });
        }
        SFX.beam();
        return true;
      }
      default: return false;
    }
  }

  /* ================= 초각성 발동 ================= */
  fireSuper(w, st) {
    const p = this.player;
    const key = w.id.slice(6);
    this.attackAnim();
    this.cam.shake = Math.min(24, (this.cam.shake || 0) + 14);
    this.flash = Math.max(this.flash, 0.3);
    this.flashColor = WEAPONS[w.id].color;
    SFX.explode();
    if (key === 'storm') {
      const targets = this.nearestEnemies(12, 1e9);
      for (const t of targets) {
        this.bolt(p.x, p.y, t.x, t.y);
        this.damage(t, st.dmg, { color: '#fde047', stun: 0.25 });
        this.rings.push({ x: t.x, y: t.y, r: 4, r1: 90, life: 0.5, max: 0.5, color: '#fde047', kind: 'meteor', hit: new Set(), dmg: st.dmg * 0.5, delay: rand(0, 0.2), target: true });
      }
      for (let i = 0; i < 6; i++) {
        const e = pick(this.enemies);
        if (!e) break;
        this.rings.push({ x: e.x + rand(-40, 40), y: e.y + rand(-40, 40), r: 4, r1: 70, life: 0.7, max: 0.7, color: '#fb923c', kind: 'meteor', hit: new Set(), dmg: st.dmg * 0.4, delay: 0.25 + i * 0.05, target: true });
      }
    } else if (key === 'tsunami') {
      const R = 780;
      this.rings.push({ x: p.x, y: p.y, r: 20, r1: R, life: 0.9, max: 0.9, color: '#7dd3fc', kind: 'psychic', hit: new Set(), dmg: st.dmg * 1.15, delay: 0, wide: 30 });
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (dist2(e.x, e.y, p.x, p.y) < R * R) {
          this.damage(e, st.dmg * 0.5, { color: '#7dd3fc', knock: 160 });
          e.freeze = Math.max(e.freeze, 1.2);
        }
      }
      for (let i = 0; i < 50; i++) {
        const a = rand(0, TAU);
        this.particles.push({ x: p.x + Math.cos(a) * rand(40, 700), y: p.y + Math.sin(a) * rand(40, 700), vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 0.7, max: 0.7, color: i % 2 ? '#7dd3fc' : '#e0f2fe', r: rand(3, 8) });
      }
    } else if (key === 'gaia') {
      for (let i = 0; i < 9; i++) {
        const e = pick(this.enemies);
        const x = e ? e.x + rand(-30, 30) : p.x + rand(-400, 400);
        const y = e ? e.y + rand(-30, 30) : p.y + rand(-400, 400);
        this.rings.push({ x, y, r: 4, r1: 110, life: 0.8, max: 0.8, color: '#86efac', kind: 'meteor', hit: new Set(), dmg: st.dmg * 0.55, delay: 0.2 + i * 0.03, target: true });
      }
      this.rings.push({ x: p.x, y: p.y, r: 20, r1: 420, life: 0.7, max: 0.7, color: '#86efac', kind: 'quake', hit: new Set(), dmg: st.dmg * 0.6, delay: 0 });
    } else if (key === 'void') {
      for (const e of this.enemies) {
        if (e.dead) continue;
        const dx = p.x - e.x, dy = p.y - e.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 760 && !e.boss) { e.kx += dx / d * 420; e.ky += dy / d * 420; }
      }
      this.rings.push({ x: p.x, y: p.y, r: 40, r1: 240, life: 0.7, max: 0.7, color: '#c084fc', kind: 'psychic', hit: new Set(), dmg: st.dmg * 1.2, delay: 0.3, wide: 34 });
      this.explode(p.x, p.y, 260, st.dmg * 0.8, '#c084fc', 2, null);
    } else if (key === 'pulse') {
      for (let i = 0; i < 8; i++) {
        this.beams.push({ x: p.x, y: p.y, angle: (i / 8) * TAU, len: 720, width: 40, life: 0.4, max: 0.4, color: '#93c5fd', hit: new Set(), dmg: st.dmg * 0.55, awake: true });
      }
      this.rings.push({ x: p.x, y: p.y, r: 20, r1: 320, life: 0.6, max: 0.6, color: '#93c5fd', kind: 'psychic', hit: new Set(), dmg: st.dmg * 0.4, delay: 0 });
    } else if (key === 'genesis') {
      for (let i = 0; i < 4; i++) {
        this.rings.push({ x: p.x, y: p.y, r: 20, r1: 620 - i * 70, life: 0.6, max: 0.6, color: '#fbbf24', kind: 'quake', hit: new Set(), dmg: st.dmg * (1 - i * 0.15), delay: i * 0.12, stun: 0.4, wide: 30 });
      }
      this.cam.shake = 26;
    }
    return true;
  }

  updateLeaf(w, st, dt) {
    w.angle += st.spin * dt;
    const p = this.player;
    const blades = w.awake ? st.count * 2 : st.count;
    const rad = st.radius;
    if (!w.state.cd) w.state.cd = new Map();
    const cd = w.state.cd;
    for (let i = 0; i < blades; i++) {
      const a = w.angle + (i / blades) * TAU;
      const bx = p.x + Math.cos(a) * rad, by = p.y + Math.sin(a) * rad * 0.78;
      w.state.bx = bx; w.state.by = by;
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (dist2(e.x, e.y, bx, by) < (e.r + 18) * (e.r + 18)) {
          const key = e.uid;
          if ((cd.get(key) || 0) > this.time) continue;
          cd.set(key, this.time + 0.42);
          this.damage(e, st.dmg, { color: '#4ade80', knock: 24, silent: true });
          if (Math.random() < 0.22) this.impact(bx, by, '#86efac', 0.35);
        }
      }
      this.damageProps(bx, by, 22, st.dmg * 0.55);
      if (Math.random() < 0.5) {
        this.particles.push({ x: bx, y: by, vx: rand(-20, 20), vy: rand(-20, 20), life: 0.3, max: 0.3, color: '#86efac', r: 3 });
      }
    }
  }

  updateNightmare(w, st, dt) {
    const p = this.player;
    w.angle += dt * 1.5;
    if (!w.state.cd) w.state.cd = new Map();
    const cd = w.state.cd;
    const rad = w.awake ? st.radius * 1.45 : st.radius;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (dist2(e.x, e.y, p.x, p.y) < rad * rad) {
        const key = e.uid;
        if ((cd.get(key) || 0) > this.time) continue;
        cd.set(key, this.time + 0.5);
        this.damage(e, st.dmg, { color: '#c084fc' });
        e.slow = Math.max(e.slow, 0.25);
        if (w.awake && Math.random() < 0.15) e.fear = 0.7;
      }
    }
  }

  /* ---------- 회오리 : 주변을 돌며 적을 빨아들인다 ---------- */
  updateTornado(w, st, dt) {
    const p = this.player;
    w.angle += st.spin * dt;
    if (!w.state.cd) w.state.cd = new Map();
    const cd = w.state.cd;
    const blades = w.awake ? st.count * 2 : st.count;
    const rad = w.awake ? st.radius * 1.35 : st.radius;
    if (w.awake) {
      for (const e of this.enemies) {
        if (e.dead) continue;
        const d = Math.hypot(e.x - p.x, e.y - p.y) || 1;
        if (d < rad * 1.8 && d > 20 && !e.boss && !e.legend) {
          e.kx += (p.x - e.x) / d * 320 * dt;
          e.ky += (p.y - e.y) / d * 320 * dt;
        }
      }
    }
    for (let i = 0; i < blades; i++) {
      const a = w.angle + (i / blades) * TAU;
      const bx = p.x + Math.cos(a) * rad, by = p.y + Math.sin(a) * rad;
      for (const e of this.enemies) {
        if (e.dead) continue;
        if (dist2(e.x, e.y, bx, by) < (e.r + 22) * (e.r + 22)) {
          const key = e.uid;
          if ((cd.get(key) || 0) > this.time) continue;
          cd.set(key, this.time + 0.4);
          this.damage(e, st.dmg, { color: '#a5f3fc', knock: 22, silent: true });
        }
      }
      if (Math.random() < 0.4) this.particles.push({ x: bx, y: by, vx: rand(-30, 30), vy: rand(-30, 30), life: 0.3, max: 0.3, color: '#a5f3fc', r: 3 });
    }
    this.damageProps(p.x, p.y, rad, st.dmg * 0.3);
  }

  /* ---------- 저주 : 적 발밑에 장판 ---------- */
  updateCurse(w, st, dt) {
    w.cdTimer = (w.cdTimer || 0) - dt;
    if (w.cdTimer > 0) return;
    w.cdTimer = st.cd;
    const targets = this.nearestEnemies(w.awake ? 4 : 2, 560);
    if (!targets.length) return;
    for (const t of targets) {
      this.hazards.push({
        x: t.x + rand(-20, 20), y: t.y + rand(-20, 20), r: st.radius * (w.awake ? 1.4 : 1),
        life: 3.4, dmg: st.dmg * 0.45, color: '#8b5cf6', src: 'player', slow: w.awake ? 0.3 : 0.18
      });
    }
    this.impact(targets[0].x, targets[0].y, '#8b5cf6', 0.8);
  }

  /* ================= 무기 헬퍼 ================= */
  bolt(x1, y1, x2, y2) {
    const pts = [[x1, y1]];
    const seg = 4;
    for (let i = 1; i < seg; i++) {
      const t = i / seg;
      pts.push([x1 + (x2 - x1) * t + rand(-14, 14), y1 + (y2 - y1) * t + rand(-14, 14)]);
    }
    pts.push([x2, y2]);
    this.bolts.push({ pts, life: 0.22, max: 0.22 });
    this.impact(x2, y2, '#fde047', 0.5);
  }

  arc(x1, y1, x2, y2, color) {
    const pts = [];
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      pts.push([x1 + (x2 - x1) * t + rand(-6, 6), y1 + (y2 - y1) * t + rand(-6, 6)]);
    }
    this.bolts.push({ pts, life: 0.14, max: 0.14, color });
  }

  quakeAt(x, y, radius, dmg, delay) {
    this.rings.push({ x, y, r: 10, r1: radius, life: 0.45 + delay, max: 0.45, color: '#d9b45a', kind: 'quake', hit: new Set(), dmg, delay, wide: 26 });
  }

  clawAt(x, y, angle, range, dmg, delay) {
    this.slashes.push({ x, y, angle, range, arc: 1.25, life: 0.26, max: 0.26, color: '#818cf8', hit: new Set(), dmg, delay });
  }

  slamAt(x, y, radius, dmg, awake) {
    const waves = awake ? 2 : 1;
    for (let i = 0; i < waves; i++) {
      this.rings.push({ x, y, r: 20, r1: radius * (1 - i * 0.25), life: 0.42, max: 0.42, color: '#fbbf24', kind: 'slam', hit: new Set(), dmg: dmg * (1 - i * 0.3), delay: i * 0.18, stun: 0.35 });
    }
  }

  dashTrail(x, y) {
    const p = this.player;
    this.particles.push({ x, y, vx: rand(-30, 30), vy: rand(-30, 30), life: 0.28, max: 0.28, color: '#fca5a5', r: 9 });
    if (Math.random() < 0.7) this.ghosts.push({ x, y, id: this.currentStage(), face: p.face, h: 94 + this.evoStage * 9, life: 0.3, max: 0.3, shiny: p.shiny });
    for (const e of this.enemies) {
      if (!this.dashState || this.dashState.hit.has(e.uid)) continue;
      if (dist2(e.x, e.y, x, y) < (e.r + 26) * (e.r + 26)) {
        this.dashState.hit.add(e.uid);
        this.damage(e, this.dashState.dmg, { color: '#fca5a5', knock: 70 });
      }
    }
    this.damageProps(x, y, 30, (this.dashState ? this.dashState.dmg : 20) * 0.5);
  }

  dashHit(d) { void d; }

  /* ================= 적 ================= */
  spawnEnemy(key, opts = {}) {
    const def = ENEMIES[key];
    if (!def) return null;
    const p = this.player;
    const tScale = 1 + this.time / 115;
    const stageMul = this.stageDiff || 1;
    let px, py;
    if (opts.x != null) { px = opts.x; py = opts.y; }
    else {
      const margin = 90;
      const side = (Math.random() * 4) | 0;
      const vw = this.W / this.zoom, vh = this.H / this.zoom;
      if (side === 0) { px = p.x - vw / 2 - margin; py = p.y + rand(-vh / 2, vh / 2); }
      else if (side === 1) { px = p.x + vw / 2 + margin; py = p.y + rand(-vh / 2, vh / 2); }
      else if (side === 2) { px = p.x + rand(-vw / 2, vw / 2); py = p.y - vh / 2 - margin; }
      else { px = p.x + rand(-vw / 2, vw / 2); py = p.y + vh / 2 + margin; }
    }
    px = clamp(px, 30, WORLD - 30);
    py = clamp(py, 30, WORLD - 30);

    const isBoss = !!def.boss;
    const isLegend = !!def.legend;
    const elite = !!opts.elite;
    const shiny = opts.shiny || (!isBoss && !isLegend && Math.random() < (this.meta.shinyChance * 0.35));
    let hp = def.hp * (isBoss || isLegend ? 1 : tScale * (1 + (Math.pow(stageMul, 0.78) - 1) * Math.min(1, 0.5 + this.time / 260)));
    if (elite) hp *= 9;
    if (shiny) hp *= 3;
    const e = {
      uid: ++Game.uid, key, def, id: def.id, name: def.n,
      x: px, y: py, r: def.r * (elite ? 1.45 : 1),
      hp, maxHp: hp, spd: def.spd * (elite ? 0.92 : 1),
      typeColor: TYPE_COLORS[(DEX[def.id] && DEX[def.id].t[0]) || '노말'] || '#f87171',
      dmg: def.dmg * (isBoss ? 1 : tScale * 0.5 + 0.6) * (1 + (0.72 + stageMul * 0.2 - 1) * Math.min(1, 0.45 + this.time / 300)) * (elite ? 1.3 : 1),
      xp: def.xp * (elite ? 8 : 1) * (shiny ? 4 : 1) * (isBoss ? 3 : 1),
      ai: def.ai, boss: isBoss, final: !!def.final, legend: isLegend,
      elite, shiny, hitCd: 0, flash: 0, slow: 0, freeze: 0, stun: 0, fear: 0,
      kx: 0, ky: 0, phase: Math.random() * TAU, atkCd: rand(1, 2.5), state: 0, st: 0,
      facing: 1, bob: Math.random() * TAU, dead: false, squash: 0, tilt: 0, hop: 0,
      flying: FLYING.has(def.id),
      /* 기믹 */
      shield: def.shield || 0, shieldMax: def.shield || 0, shieldT: 0,
      heal: def.heal || 0, healT: rand(0.4, 1.2), splitInto: def.splitInto || null,
      pattern: def.pattern || 'ring', tele: 0, charging: 0, chargeAng: 0,
      blinkT: rand(1.4, 3), beamWarn: 0, beamLive: 0, beamAng: 0, summonT: rand(5, 8),
      buffT: 0, small: !!opts.small
    };
    if (isBoss && this.bossSpawnedAt == null) this.bossSpawnedAt = this.time;
    this.enemies.push(e);
    if (markSeen(def.id)) this.seenIds.add(def.id);
    if (isBoss) {
      this.announce(def.n + ' 등장!', def.final ? '최종 결전' : '강력한 보스', def.final ? '#f472b6' : '#f87171');
      SFX.boss();
      this.cam.shake = 14;
      this.rings.push({ x: px, y: py, r: 10, r1: 180, life: 0.6, max: 0.6, color: '#f87171', kind: 'enemy', hit: new Set(), dmg: 0 });
    } else if (isLegend) {
      this.announce('환상의 포켓몬 ' + def.n + '!', '도망치기 전에 잡아라', '#a78bfa');
      SFX.legend();
      playCry(def.id);
    } else if (elite) {
      this.announce('엘리트 ' + def.n, '상자를 노려라', '#fbbf24');
    } else if (shiny) {
      this.floatText(px, py - 40, '이로치!', '#fde68a');
    }
    return e;
  }

  updateSpawns(dt) {
    this.spawnTimer -= dt;
    const dens = Math.min(1.4, 0.9 + (this.stageDiff || 1) * 0.12);
    const rate = Math.max(0.085, 0.44 - this.time * 0.00045) / dens;
    if (this.spawnTimer <= 0 && this.enemies.length < 260) {
      this.spawnTimer = rate * rand(0.75, 1.25);
      const pool = this.currentPool();
      if (pool.length) {
        const n = 1 + (this.time > 60 ? 1 : 0) + (this.time > 240 ? 1 : 0) + (this.time > 480 ? 1 : 0);
        for (let i = 0; i < n; i++) this.spawnEnemy(pick(pool));
      }
    }
    if (this.time > 12) {
      this.eliteTimer -= dt;
      if (this.eliteTimer <= 0) {
        this.eliteTimer = Math.max(18, 34 - this.stageIdx * 2);
        const pool = this.currentPool();
        if (pool.length) this.spawnEnemy(pick(pool), { elite: true });
      }
    }
  }

  currentPool() {
    const pools = this.stage.pools;
    let list = pools[0].list;
    for (const p of pools) if (this.time >= p.t) list = p.list;
    return list;
  }

  updateTimeline() {
    const st = this.stage;
    const aliveBoss = this.enemies.some(e => e.boss && !e.dead);
    for (const b of st.bosses) {
      if (this.time >= b.t && !this._bossDone[b.t]) {
        if (aliveBoss) break;
        this._bossDone[b.t] = true;
        this.spawnEnemy(b.k);
      }
    }
    for (const l of st.legends) {
      if (this.time >= l.t && !this._legDone[l.t]) {
        this._legDone[l.t] = true;
        const e = this.spawnEnemy(l.k);
        if (e) e.escapeAt = this.time + 26;
      }
    }
    if (!this.finalSpawned && this.time >= st.final.t) {
      this.finalSpawned = true;
      this.finalBoss = this.spawnEnemy(st.final.k);
    }
    if (this.finalSpawned && this.finalBoss && this.finalBoss.dead && !this.won) this.win();
  }

  updateEnemies(dt) {
    const p = this.player;
    for (const e of this.enemies) {
      if (e.dead) continue;
      e.flash = Math.max(0, e.flash - dt);
      e.hitCd = Math.max(0, e.hitCd - dt);
      e.slow = Math.max(0, e.slow - dt);
      e.stun = Math.max(0, e.stun - dt);
      e.fear = Math.max(0, e.fear - dt);
      e.squash = Math.max(0, e.squash - dt * 5);
      e.bob += dt * 6;
      if (e.burn) {
        e.burn.t -= dt;
        if (e.burn.t <= 0) e.burn = null;
        else if (Math.random() < dt * 6) this.particles.push({ x: e.x + rand(-10, 10), y: e.y + rand(-10, 10), vx: 0, vy: -40, life: 0.35, max: 0.35, color: '#fb923c', r: 4 });
      }
      if (e.freeze > 0) { e.freeze -= dt; continue; }
      if (e.legend && e.escapeAt && this.time > e.escapeAt) {
        e.dead = true; e.escaped = true;
        this.particles.push({ x: e.x, y: e.y, vx: 0, vy: 0, life: 0.5, max: 0.5, color: '#a78bfa', r: 30 });
        continue;
      }
      const dx = p.x - e.x, dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      let vx = 0, vy = 0;
      let spd = e.spd * (1 - Math.min(0.55, e.slow));
      if (e.stun > 0) spd = 0;
      const spd2 = this.player.sig === 'intimidate' && d < 190 ? spd * 0.82 : spd;
      const fearMul = e.fear > 0 ? -1 : 1;

      switch (e.ai) {
        case 'zigzag': {
          const nx = dx / d, ny = dy / d;
          const perp = Math.sin(e.bob * 0.6 + e.phase) * 0.85;
          vx = (nx - ny * perp) * spd2;
          vy = (ny + nx * perp) * spd2;
          break;
        }
        case 'dash': {
          e.st -= dt;
          if (e.st <= 0) { e.st = rand(2.0, 3.2); e.dashing = 0.5; }
          let dm = 1;
          if (e.dashing > 0) { e.dashing -= dt; dm = 3.1; }
          vx = dx / d * spd2 * dm; vy = dy / d * spd2 * dm;
          break;
        }
        case 'tank': vx = dx / d * spd2; vy = dy / d * spd2; break;
        case 'charge': {
          e.st -= dt;
          if (e.charging > 0) {
            e.charging -= dt;
            vx = Math.cos(e.chargeAng) * spd2 * 4.6;
            vy = Math.sin(e.chargeAng) * spd2 * 4.6;
            e.tele = 0;
          } else if (e.tele > 0) {
            e.tele -= dt;
            e.chargeAng = Math.atan2(dy, dx);
            vx = 0; vy = 0;
            if (e.tele <= 0) { e.charging = 0.34; SFX.dash(); }
          } else if (e.st <= 0 && d < 620) {
            e.st = rand(2.8, 4.2);
            e.tele = 0.6;
            e.chargeAng = Math.atan2(dy, dx);
          } else {
            vx = dx / d * spd2 * 0.45;
            vy = dy / d * spd2 * 0.45;
          }
          break;
        }
        case 'barrage': {
          if (d > 330) { vx = dx / d * spd2; vy = dy / d * spd2; }
          else if (d < 210) { vx = -dx / d * spd2 * 0.7; vy = -dy / d * spd2 * 0.7; }
          else { vx = -dy / d * spd2 * 0.3; vy = dx / d * spd2 * 0.3; }
          e.atkCd -= dt;
          if (e.atkCd <= 0 && d < 620) {
            e.atkCd = rand(2.4, 3.6);
            const base = Math.atan2(dy, dx);
            const n = e.elite ? 5 : 3;
            for (let i = 0; i < n; i++) {
              const a = base + (i - (n - 1) / 2) * 0.16;
              this.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 215, vy: Math.sin(a) * 215, r: 9, dmg: e.dmg * 0.5, life: 3.2, color: '#f472b6' });
            }
            this.impact(e.x, e.y, '#f472b6', 0.5);
          }
          break;
        }
        case 'shield': {
          vx = dx / d * spd2 * 0.85; vy = dy / d * spd2 * 0.85;
          e.shieldT = Math.max(0, e.shieldT - dt);
          if (e.shieldT <= 0 && e.shield < e.shieldMax) e.shield = Math.min(e.shieldMax, e.shield + dt * 0.3);
          break;
        }
        case 'split': vx = dx / d * spd2; vy = dy / d * spd2; break;
        case 'healer': {
          if (d < 230) { vx = -dx / d * spd2; vy = -dy / d * spd2; }
          else if (d > 320) { vx = dx / d * spd2 * 0.9; vy = dy / d * spd2 * 0.9; }
          else { vx = -dy / d * spd2 * 0.25; vy = dx / d * spd2 * 0.25; }
          e.healT -= dt;
          if (e.healT <= 0) {
            e.healT = 0.9;
            for (const o of this.enemies) {
              if (o === e || o.dead) continue;
              if (dist2(o.x, o.y, e.x, e.y) < 250 * 250) {
                o.hp = Math.min(o.maxHp, o.hp + o.maxHp * e.heal);
                o.buffT = 1.6;
              }
            }
            this.rings.push({ x: e.x, y: e.y, r: 20, r1: 250, life: 0.5, max: 0.5, color: '#86efac', kind: 'heal', hit: new Set(), dmg: 0 });
          }
          break;
        }
        case 'blink': {
          vx = dx / d * spd2 * 0.7; vy = dy / d * spd2 * 0.7;
          e.blinkT -= dt;
          if (e.blinkT <= 0 && d > 120) {
            e.blinkT = rand(3.2, 4.8);
            const a = rand(0, TAU), rr = rand(130, 210);
            this.impact(e.x, e.y, '#a78bfa', 0.8);
            e.x = clamp(p.x + Math.cos(a) * rr, 30, WORLD - 30);
            e.y = clamp(p.y + Math.sin(a) * rr, 30, WORLD - 30);
            this.impact(e.x, e.y, '#c4b5fd', 0.9);
            e.hitCd = 0.35;
          }
          break;
        }
        case 'bomber': {
          vx = dx / d * spd2 * 1.2; vy = dy / d * spd2 * 1.2;
          if (Math.random() < dt * 3) this.particles.push({ x: e.x, y: e.y - 8, vx: 0, vy: -20, life: 0.4, max: 0.4, color: '#fbbf24', r: 4 });
          break;
        }
        case 'ranged': {
          if (d > 250) { vx = dx / d * spd2; vy = dy / d * spd2; }
          else if (d < 180) { vx = -dx / d * spd2 * 0.6; vy = -dy / d * spd2 * 0.6; }
          e.atkCd -= dt;
          if (e.atkCd <= 0 && d < 420) {
            e.atkCd = rand(2.2, 3.4);
            const a = Math.atan2(dy, dx);
            this.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 195, vy: Math.sin(a) * 195, r: 9, dmg: e.dmg * 0.55, life: 3, color: '#f472b6' });
          }
          break;
        }
        case 'poison': {
          vx = dx / d * spd2; vy = dy / d * spd2;
          if (Math.random() < dt * 2) this.particles.push({ x: e.x, y: e.y, vx: rand(-10, 10), vy: rand(-20, 0), life: 0.5, max: 0.5, color: '#c084fc', r: 5 });
          break;
        }
        case 'flop': vx = dx / d * spd2 * 0.6; vy = dy / d * spd2 * 0.6; break;
        case 'flee': vx = -dx / d * spd2 + Math.cos(e.bob) * 40; vy = -dy / d * spd2 + Math.sin(e.bob) * 40; break;
        case 'boss': {
          vx = dx / d * spd2; vy = dy / d * spd2;
          const pattern = e.pattern || 'ring';
          e.atkCd -= dt;
          if (pattern === 'charge') {
            if (e.charging > 0) {
              e.charging -= dt;
              vx = Math.cos(e.chargeAng) * spd2 * 3.6;
              vy = Math.sin(e.chargeAng) * spd2 * 3.6;
            } else if (e.tele > 0) {
              e.tele -= dt; e.chargeAng = Math.atan2(dy, dx); vx = 0; vy = 0;
              if (e.tele <= 0) { e.charging = 0.5; this.cam.shake = Math.min(14, this.cam.shake + 5); SFX.boss(); }
            } else if (e.atkCd <= 0) {
              e.atkCd = rand(3.4, 4.4); e.tele = 0.75; e.chargeAng = Math.atan2(dy, dx);
            }
          }
          if (e.atkCd <= 0) {
            if (pattern === 'ring' || pattern === 'all') {
              e.atkCd = rand(2.4, 3.4);
              const n = e.final ? 24 : 12;
              const base = Math.atan2(dy, dx);
              for (let i = 0; i < n; i++) {
                const a = base + (i / n) * TAU;
                this.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 185, vy: Math.sin(a) * 185, r: 11, dmg: e.dmg * 0.42, life: 3.6, color: e.final ? '#f472b6' : '#fb7185' });
              }
              this.rings.push({ x: e.x, y: e.y, r: 10, r1: 130, life: 0.5, max: 0.5, color: '#fb7185', kind: 'enemy', hit: new Set(), dmg: 0 });
            } else if (pattern === 'barrage' || pattern === 'beam') {
              if (pattern === 'beam') {
                e.atkCd = rand(3.6, 4.6);
                e.beamWarn = 0.85; e.beamAng = Math.atan2(dy, dx);
              } else {
                e.atkCd = rand(2.0, 2.8);
                const base = Math.atan2(dy, dx);
                const n = e.final ? 9 : 6;
                for (let i = 0; i < n; i++) {
                  const a = base + (i - (n - 1) / 2) * 0.14;
                  this.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, r: 10, dmg: e.dmg * 0.4, life: 3, color: '#38bdf8' });
                }
              }
            } else if (pattern === 'summon') {
              e.atkCd = rand(4.6, 5.6);
              const pool = this.currentPool();
              for (let i = 0; i < 3; i++) {
                const m = this.spawnEnemy(pick(pool), { x: e.x + rand(-90, 90), y: e.y + rand(-90, 90) });
                if (m) m.buffT = 2;
              }
              this.announce('소환!', e.name + '이(가) 부하를 불렀다', '#fbbf24');
            }
          }
          if (e.beamWarn > 0) {
            e.beamWarn -= dt;
            e.beamAng = Math.atan2(dy, dx);
            if (e.beamWarn <= 0) { e.beamLive = 0.55; SFX.beam(); this.cam.shake = Math.min(16, this.cam.shake + 7); }
          } else if (e.beamLive > 0) {
            e.beamLive -= dt;
            const cx = Math.cos(e.beamAng), cy = Math.sin(e.beamAng);
            const px = p.x - e.x, py = p.y - e.y;
            const t = px * cx + py * cy;
            const side = Math.abs(px * cy - py * cx);
            if (t > 0 && t < 900 && side < 46 && p.inv <= 0) this.hurtPlayer(e.dmg * 0.45);
          }
          if (pattern === 'all') {
            e.summonT -= dt;
            if (e.summonT <= 0) {
              e.summonT = 8;
              const pool = this.currentPool();
              for (let i = 0; i < 4; i++) this.spawnEnemy(pick(pool), { x: e.x + rand(-140, 140), y: e.y + rand(-140, 140) });
            }
          }
          break;
        }
        default: vx = dx / d * spd2; vy = dy / d * spd2;
      }
      if (e.buffT > 0) { e.buffT -= dt; vx *= 1.25; vy *= 1.25; }
      if (e.fear > 0) { vx *= fearMul; vy *= fearMul; }
      e.hop += Math.min(1, Math.hypot(vx, vy) / 90) * dt * 14;
      if (Math.abs(vx) > 2) e.facing = vx > 0 ? 1 : -1;
      e.tilt += ((Math.abs(vx) > 1 ? clamp(vx / 400, -0.16, 0.16) : 0) - e.tilt) * Math.min(1, dt * 8);
      e.x += (vx + e.kx) * dt;
      e.y += (vy + e.ky) * dt;
      e.kx *= Math.pow(0.0008, dt); e.ky *= Math.pow(0.0008, dt);

      /* 접촉 피해 */
      if (d < e.r + p.r && e.hitCd <= 0 && p.inv <= 0) {
        const dodge = (p.sig === 'levitate' && Math.random() < 0.15);
        if (!dodge) this.hurtPlayer(e.dmg);
        e.hitCd = 0.85;
        e.kx = -dx / d * 90; e.ky = -dy / d * 90;
        e.squash = 1;
      }
      if (e.burn) this.damage(e, e.burn.dps * dt, { color: '#fb923c', silent: true, dot: true });
    }
    this.enemies = this.enemies.filter(e => !e.dead);
  }

  hurtPlayer(amount) {
    const p = this.player;
    let dmg = amount * (1 - p.armor);
    if (p.sig === 'multiscale' && p.hp > p.maxHp * 0.7) dmg *= 0.75;
    if (p.sig === 'shell' && p.hp > p.maxHp * 0.5) dmg *= 0.9;
    if (p.guardT > 0) {
      p.hp -= 0;
      this.floatText(p.x + rand(-10, 10), p.y - 26, '무적!', '#7dd3fc');
      this.impact(p.x, p.y, '#7dd3fc', 1);
      return;
    }
    p.hp -= dmg;
    this.runStats.noHit = 0;
    p.inv = 0.55;
    p.hitFlash = 0.25;
    p.anim.hurt = 1;
    this.hitstop = Math.max(this.hitstop, 0.05);
    this.flash = Math.max(this.flash, 0.22);
    this.flashColor = '#ef4444';
    this.cam.shake = Math.min(18, this.cam.shake + 8);
    this.cam.kickX += rand(-6, 6);
    SFX.hurt();
    this.floatText(p.x + rand(-10, 10), p.y - 26, '-' + Math.round(dmg), '#fb7185', 1.05);
    for (let i = 0; i < 10; i++) {
      const a = rand(0, TAU);
      this.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * 150, vy: Math.sin(a) * 150, life: 0.35, max: 0.35, color: '#f87171', r: 4 });
    }
    if (p.hp <= 0) {
      if (this.revives > 0) {
        this.revives--;
        p.hp = p.maxHp * 0.65;
        p.inv = 2.5;
        this.announce('부활!', '영구 강화의 힘이 널 되살렸다', '#fbbf24');
        this.rings.push({ x: p.x, y: p.y, r: 20, r1: 260, life: 0.8, max: 0.8, color: '#fbbf24', kind: 'heal', hit: new Set(), dmg: 0 });
        for (const e of this.enemies) {
          const d = Math.hypot(e.x - p.x, e.y - p.y) || 1;
          if (d < 260) { e.kx = (e.x - p.x) / d * 500; e.ky = (e.y - p.y) / d * 500; e.squash = 1; }
        }
        SFX.evolve();
      } else {
        p.hp = 0;
        this.lose();
      }
    }
  }

  /* ================= 투사체 ================= */
  updateProjectiles(dt) {
    const out = [];
    for (const b of this.projectiles) {
      b.life -= dt;
      if (b.boomerang) {
        b.spin += dt * 18;
        if (b.life < 0.62) {
          const dx = this.player.x - b.x, dy = this.player.y - b.y;
          const d = Math.hypot(dx, dy) || 1;
          b.vx += dx / d * 1600 * dt;
          b.vy += dy / d * 1600 * dt;
          const sp = Math.hypot(b.vx, b.vy);
          if (sp > 720) { b.vx = b.vx / sp * 720; b.vy = b.vy / sp * 720; }
        }
      }
      if (b.homing) {
        const t = this.nearestTo(b.x, b.y, 460, b.hit);
        if (t) {
          const a = Math.atan2(t.y - b.y, t.x - b.x);
          const sp = Math.hypot(b.vx, b.vy);
          const ca = Math.atan2(b.vy, b.vx);
          let na = ca + clamp(((a - ca + Math.PI * 3) % TAU) - Math.PI, -b.homing * dt, b.homing * dt);
          b.vx = Math.cos(na) * sp; b.vy = Math.sin(na) * sp;
        }
      }
      if (b.trail) {
        b.trail.push([b.x, b.y]);
        if (b.trail.length > 8) b.trail.shift();
      }
      b.x += b.vx * dt; b.y += b.vy * dt;
      let removed = false;
      for (const e of this.enemies) {
        if (e.dead || b.hit.has(e.uid)) continue;
        if (dist2(e.x, e.y, b.x, b.y) < (e.r + b.r) * (e.r + b.r)) {
          b.hit.add(e.uid);
          this.damage(e, b.dmg, { color: b.color, knock: b.knock || (b.kind === 'water' ? 45 : 0) });
          this.impact(b.x, b.y, b.color, b.dmg > 60 ? 0.9 : 0.55);
          if (b.burn) e.burn = { t: 2.2, dps: b.dmg * 0.35 };
          if (b.slow) e.slow = Math.max(e.slow, b.slow);
          if (b.freeze && Math.random() < 0.35) e.freeze = Math.max(e.freeze, b.freeze);
          if (b.blast) this.explode(b.x, b.y, b.blast, b.dmg * 0.7, b.color, b.chainBlast ? 1 : 0, b.hit);
          if (b.kind === 'flame') {
            this.particles.push({ x: b.x, y: b.y, vx: rand(-40, 40), vy: rand(-40, 40), life: 0.25, max: 0.25, color: '#fdba74', r: 6 });
          }
          b.pierce--;
          if (b.pierce < 0) { removed = true; break; }
        }
      }
      if (!removed) this.damageProps(b.x, b.y, b.r, b.dmg * 0.7);
      if (!removed && b.life <= 0) {
        if (b.blast) this.explode(b.x, b.y, b.blast, b.dmg * 0.7, b.color, b.chainBlast ? 1 : 0, b.hit);
        removed = true;
      }
      if (!removed) out.push(b);
    }
    this.projectiles = out;
  }

  explode(x, y, radius, dmg, color, chain, exclude) {
    this.rings.push({ x, y, r: 8, r1: radius, life: 0.32, max: 0.32, color, kind: 'blast', hit: new Set(), dmg: 0 });
    for (let i = 0; i < 12; i++) {
      const a = rand(0, TAU);
      this.particles.push({ x, y, vx: Math.cos(a) * rand(70, 280), vy: Math.sin(a) * rand(70, 280), life: 0.35, max: 0.35, color, r: rand(3, 7) });
    }
    for (const e of this.enemies) {
      if (e.dead || (exclude && exclude.has(e.uid))) continue;
      if (dist2(e.x, e.y, x, y) < (radius + e.r * 0.5) ** 2) {
        this.damage(e, dmg, { color, knock: 40 });
        if (chain > 0 && Math.random() < 0.35) this.explode(e.x, e.y, radius * 0.7, dmg * 0.5, color, chain - 1, exclude);
      }
    }
    this.damageProps(x, y, radius, dmg * 0.8);
    SFX.explode();
  }

  updateEBullets(dt) {
    const p = this.player;
    const out = [];
    for (const b of this.ebullets) {
      b.life -= dt;
      b.x += b.vx * dt; b.y += b.vy * dt;
      if (dist2(b.x, b.y, p.x, p.y) < (p.r + b.r) ** 2 && p.inv <= 0) {
        this.hurtPlayer(b.dmg);
        this.impact(b.x, b.y, b.color, 1);
        continue;
      }
      if (b.life > 0) out.push(b);
    }
    this.ebullets = out;
  }

  /* ================= 경험치 ================= */
  dropOrbs(x, y, value, color) {
    const n = value > 8 ? 3 : value > 3 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      this.orbs.push({
        x: x + rand(-12, 12), y: y + rand(-12, 12),
        vx: rand(-40, 40), vy: rand(-40, 40),
        value: Math.max(1, Math.round(value / n)), t: 0,
        color: color || '#38bdf8', r: 7
      });
    }
  }

  updateOrbs(dt) {
    const p = this.player;
    const mr = p.magnet;
    const out = [];
    for (const o of this.orbs) {
      o.t += dt;
      const dx = p.x - o.x, dy = p.y - o.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < mr || this.vacuumT > 0) {
        const pull = this.vacuumT > 0 ? 1500 : 620 + (1 - d / mr) * 500;
        o.x += dx / d * pull * dt;
        o.y += dy / d * pull * dt;
      } else if (d < 300) {
        const drift = 90 * (1 - d / 300);
        o.x += dx / d * drift * dt;
        o.y += dy / d * drift * dt;
      } else {
        o.x += o.vx * dt; o.y += o.vy * dt;
        o.vx *= Math.pow(0.02, dt); o.vy *= Math.pow(0.02, dt);
      }
      if (d < p.r + 14) {
        this.gainXp(o.value);
        this.particles.push({ x: o.x, y: o.y, vx: 0, vy: -60, life: 0.25, max: 0.25, color: o.color, r: 6 });
        continue;
      }
      out.push(o);
    }
    this.orbs = out;
  }

  gainXp(v) {
    const p = this.player;
    p.xp += v * p.xpMul;
    SFX.xp();
    while (p.xp >= p.xpNext) {
      p.xp -= p.xpNext;
      p.level++;
      p.xpNext = this.xpNeeded(p.level);
      this.pendingLevels = (this.pendingLevels || 0) + 1;
      this.floatText(p.x, p.y - 46, 'LEVEL ' + p.level, '#facc15', 1.1);
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.04);
      this.rings.push({ x: p.x, y: p.y, r: 20, r1: 110, life: 0.55, max: 0.55, color: '#facc15', kind: 'heal', hit: new Set(), dmg: 0 });
      for (let i = 0; i < 14; i++) {
        const a = rand(0, TAU);
        this.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * 130, vy: Math.sin(a) * 130 - 60, life: 0.6, max: 0.6, color: '#fde68a', r: 3 });
      }
      SFX.levelup();
      this.checkEvolution();
    }
    if (this.pendingLevels > 0 && !this.paused) this.openLevelUp();
  }

  /* ================= 레벨업 카드 ================= */
  weaponCard(w) {
    const d = WEAPONS[w.id];
    const pd = PASSIVES[d.pair];
    const hasPair = (this.player.passives[d.pair] || 0) > 0;
    return {
      type: 'weapon', id: w.id, name: d.name, icon: d.icon, color: d.color,
      lv: w.lv, max: d.max, desc: d.desc, upgrade: true,
      awake: w.lv + 1 >= d.max,
      pairIcon: pd.icon, pairName: pd.name, pairOk: hasPair,
      hint: hasPair ? `각성 준비: ${pd.icon}${pd.name} 보유` : `각성: ${pd.icon}${pd.name} Lv.1 필요`,
      affinity: (this.char.affinity || []).includes(w.id)
    };
  }

  awakenCard(w) {
    const d = WEAPONS[w.id];
    const pd = PASSIVES[d.pair];
    return {
      type: 'awaken', id: w.id, name: d.awakeName, icon: d.awakeIcon, color: d.awakeColor,
      desc: d.awakeDesc, lvTxt: '각성', awaken: true,
      fromName: d.name, fromIcon: d.icon,
      pairIcon: pd.icon, pairName: pd.name,
      hint: `${d.icon}${d.name} Lv.${d.max} + ${pd.icon}${pd.name} Lv.1`,
      combo: `${d.icon}${d.name} Lv.${d.max} + ${pd.icon}${pd.name} Lv.1 → ${d.awakeIcon}${d.awakeName}`
    };
  }

  passiveCard(id) {
    const d = PASSIVES[id];
    if (!d) return null;
    const p = this.player;
    const ready = [];
    const helping = [];
    for (const w of p.weaponList) {
      const wd = WEAPONS[w.id];
      if (wd.pair !== id) continue;
      if (w.awake) continue;
      if (w.lv >= wd.max) ready.push(wd); else helping.push({ d: wd, lv: w.lv });
    }
    return {
      type: 'passive', id, name: d.name, icon: d.icon, color: d.color,
      lv: p.passives[id] || 0, max: d.max, desc: d.desc, upgrade: true,
      comboReady: ready,
      comboHint: ready.length ? `${ready.map(w => w.icon + w.name).join(' · ')} 각성 가능!`
        : helping.length ? `${helping.map(h => h.d.icon + h.d.name).join(' · ')} Lv.6 도달 시 각성`
        : null
    };
  }

  rollCards() {
    const p = this.player;
    const pool = [];
    const haveMap = new Map(p.weaponList.map(w => [w.id, w]));
    for (const w of p.weaponList) {
      const d = WEAPONS[w.id];
      if (d.super) continue;
      if (w.lv < d.max) pool.push(this.weaponCard(w));
    }
    if (p.weaponList.length < 6) {
      for (const id in WEAPONS) {
        if (WEAPONS[id].super) continue;
        if (haveMap.has(id)) continue;
        const d = WEAPONS[id];
        const pd = PASSIVES[d.pair];
        pool.push({
          type: 'weapon', id, name: d.name, icon: d.icon, color: d.color, lv: 0, max: d.max,
          desc: d.desc, isNew: true,
          pairIcon: pd.icon, pairName: pd.name,
          hint: `각성: ${pd.icon}${pd.name} 조합`,
          affinity: (this.char.affinity || []).includes(id)
        });
      }
    }
    for (const id in p.passives) {
      if (p.passives[id] < PASSIVES[id].max) {
        const pc = this.passiveCard(id);
        if (pc) pool.push(pc);
      }
    }
    if (Object.keys(p.passives).length < 6) {
      for (const id in PASSIVES) {
        if (p.passives[id]) continue;
        if (!isPassiveUnlocked(id)) continue;
        const pc = this.passiveCard(id);
        if (pc) pool.push(pc);
      }
    }

    const n = p.sig === 'adapt' ? 4 : 3;
    const out = [];
    // 0) 초각성 최우선
    const supers = this.superReadyList();
    if (supers.length) out.push(this.superCard(supers[(Math.random() * supers.length) | 0]));
    // 1) 각성 카드
    const ready = this.awakenReadyList();
    if (ready.length) {
      const w = ready[(Math.random() * ready.length) | 0];
      out.push(this.awakenCard(w));
    }
    // 2) 만렙인데 짝 패시브가 없으면 그 패시브를 반드시 제시 (조합 안내)
    if (out.length < n) {
      const needPair = p.weaponList.find(w => {
        const d = WEAPONS[w.id];
        if (!d || d.super || !d.pair) return false;
        return w.lv >= d.max && !w.awake && !(p.passives[d.pair] || 0);
      });
      if (needPair) {
        const pairId = WEAPONS[needPair.id].pair;
        if (pairId && !out.some(c => c.type === 'passive' && c.id === pairId)) {
          const pc = this.passiveCard(pairId);
          if (pc) out.push(pc);
        }
      }
    }
    // 3) 기술 카드 최소 1장 보장 (성장 정체 방지) — 각성/친화 가중
    const weapons = pool.filter(c => c.type === 'weapon');
    const weights = c => {
      let w = c.isNew ? 1.5 : 1.1;
      if (c.affinity) w *= 2.4;
      if (c.awake) w *= 1.5;
      if (c.type === 'passive' && c.comboReady && c.comboReady.length) w *= 3.4;
      if (c.type === 'passive' && (this.char.affinity || []).some(id => WEAPONS[id] && WEAPONS[id].pair === c.id)) w *= 1.8;
      if (c.type === 'weapon' && c.pairOk) w *= 1.35;
      return w;
    };
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const poolW = a => { const o = []; for (const c of a) { const k = Math.max(1, Math.round(weights(c) * 2)); for (let i = 0; i < k; i++) o.push(c); } return o; };
    const wpick = poolW(shuffle([...weapons]));
    if (out.length < n && wpick.length) out.push(pick(wpick));
    // 4) 나머지 가중 랜덤
    const weighted = poolW(shuffle([...pool]));
    let guard = 0;
    while (out.length < n && guard++ < 400) {
      if (!weighted.length) break;
      const c = pick(weighted);
      if (out.some(x => x.type === c.type && x.id === c.id)) continue;
      out.push(c);
    }
    if (!out.length) {
      out.push({ type: 'heal', id: 'heal', name: '회복', icon: '🍖', color: '#4ade80', desc: '체력을 40% 회복한다' });
      out.push({ type: 'coin', id: 'coin', name: '보너스 코인', icon: '🪙', color: '#fbbf24', desc: '코인 40개를 획득한다' });
      out.push({ type: 'heal', id: 'heal2', name: '회복', icon: '🍖', color: '#4ade80', desc: '체력을 40% 회복한다' });
    }
    return out;
  }

  openLevelUp() {
    if (this.paused) return;
    this.paused = true;
    const cards = this.rollCards();
    if (this.autoPick) {
      const aw = cards.find(c => c.type === 'awaken');
      this.applyCard(aw || cards[(Math.random() * cards.length) | 0]);
      return;
    }
    if (this.hooks.onLevelUp) this.hooks.onLevelUp(this, cards);
  }

  pickCard(card) {
    if (!card) return;
    this.applyCard(card);
  }

  applyCard(card) {
    const p = this.player;
    if (card.type === 'super') {
      this.applySuper(SUPER_AWAKENS.find(s => s.key === card.superKey));
    } else if (card.type === 'awaken') {
      const w = p.weaponList.find(x => x.id === card.id);
      if (w) this.awakenWeapon(w, true);
    } else if (card.type === 'weapon') {
      if (card.isNew) this.addWeapon(card.id, 1);
      else {
        const w = p.weaponList.find(x => x.id === card.id);
        if (w) w.lv = Math.min(WEAPONS[card.id].max, w.lv + 1);
      }
    } else if (card.type === 'passive') {
      this.addPassive(card.id);
    } else if (card.type === 'heal') {
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.4);
    } else if (card.type === 'coin') {
      this.runCoins += 25;
    }
    this.recalc();
    this.refreshAwakenReady();
    SFX.select();
    this.pendingLevels = Math.max(0, (this.pendingLevels || 1) - 1);
    if (this.pendingLevels > 0) {
      const cards = this.rollCards();
      if (this.autoPick) {
        const aw = cards.find(c => c.type === 'awaken');
        this.applyCard(aw || cards[0]); return;
      }
      if (this.hooks.onLevelUp) this.hooks.onLevelUp(this, cards);
    } else {
      this.paused = false;
      if (this.hooks.onLevelUpClose) this.hooks.onLevelUpClose(this);
    }
  }

  /* ================= 인게임 진화 퀘스트 ================= */
  questDone(q) {
    if (!q) return false;
    const g = q.goals || q;
    const s = this.runStats;
    const val = { kills: s.kills, elites: s.elites, bosses: s.bosses, chests: s.chests, skillHits: s.skillHits, noHit: s.noHitBest, time: this.time };
    for (const k in g) if ((val[k] || 0) < g[k]) return false;
    return true;
  }

  questProgress(q) {
    const g = (q && (q.goals || q)) || {};
    const s = this.runStats;
    const val = { kills: s.kills, elites: s.elites, bosses: s.bosses, chests: s.chests, skillHits: s.skillHits, noHit: s.noHitBest, time: this.time };
    const label = { kills: '처치', elites: '엘리트', bosses: '보스', chests: '상자', skillHits: '명중', noHit: '무피격', time: '생존' };
    const parts = [];
    let pct = 1;
    for (const k of Object.keys(g)) {
      const need = g[k];
      const cur = Math.min(need, val[k] || 0);
      pct = Math.min(pct, need > 0 ? cur / need : 1);
      const fmt = k === 'time' || k === 'noHit' ? `${Math.floor(cur)}/${Math.floor(need)}초` : `${Math.floor(cur)}/${need}`;
      parts.push(`${label[k] || k} ${fmt}`);
    }
    return { pct: Math.round(pct * 100), text: parts.join(' · ') };
  }

  questInfo() {
    const c = this.char;
    if (this.evoStage < c.evoQuests.length) {
      const q = c.evoQuests[this.evoStage];
      const target = (c.branch && this.evoStage === 0) ? '분기 진화' : (c.chain[this.evoStage + 1] ? c.chain[this.evoStage + 1].name : '한계 개방');
      return { kind: 'evo', title: `진화 퀘스트 · ${target}`, quest: q, prog: this.questProgress(q) };
    }
    const sp = c.special;
    if (sp && !this.specialDone) {
      return { kind: 'special', title: `${sp.kind === 'gmax' ? '거다이맥스' : '메가진화'} 퀘스트 · ${sp.name}`, quest: sp.quest, prog: this.questProgress(sp.quest) };
    }
    return { kind: 'done', title: '최종 진화 완료', quest: null, prog: { pct: 100, text: this.special ? this.special.name + ' 각성 완료' : '모든 진화 완료' } };
  }

  checkEvolution() {
    const c = this.char;
    if (this.evoStage < c.evoQuests.length) {
      if (!this.questDone(c.evoQuests[this.evoStage])) return;
      if (c.branch && this.evoStage === 0) {
        if (this.autoPick) this.evolveTo(pick(c.branch.options), true);
        else { this.paused = true; if (this.hooks.onBranch) this.hooks.onBranch(this, c.branch.options); }
        return;
      }
      const next = c.chain[this.evoStage + 1];
      if (next) this.evolveTo(next.id);
      else this.awakenForm(this.evoStage + 1);
      return;
    }
    const sp = c.special;
    if (sp && !this.specialDone && this.questDone(sp.quest)) this.doSpecial(sp);
  }

  evolveTo(id, branchChoice) {
    const p = this.player;
    const prev = this.currentStage();
    this.evoStage++;
    p.stageId = id;
    const nm = DEX[id] ? DEX[id].n : (BRANCH_NAMES[id] || '???');
    p.stageName = nm;
    p.baseName = nm;
    p.r = Math.min(30, 20 + this.evoStage * 3);
    this.base.hp *= 1.22;
    this.base.speed *= 1.03;
    this.base.dmg *= 1.2;
    this.recalc(false);
    p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.35);
    const w = p.weaponList[0];
    if (w) w.lv = Math.min(WEAPONS[w.id].max, w.lv + 2);
    if (branchChoice) {
      const bw = BRANCH_WEAPON[id];
      if (bw) { this.addWeapon(bw, 2); this.addWeapon(bw, 1); }
    }
    markSeen(id); this.seenIds.add(id);
    markCaught(id);
    playCry(id, 0.5);
    SFX.evolve();
    this.rings.push({ x: p.x, y: p.y, r: 20, r1: 300, life: 0.9, max: 0.9, color: '#fde68a', kind: 'heal', hit: new Set(), dmg: 0 });
    for (let i = 0; i < 40; i++) {
      const a = rand(0, TAU);
      this.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * rand(60, 320), vy: Math.sin(a) * rand(60, 320), life: 0.8, max: 0.8, color: i % 2 ? '#fde68a' : '#fff', r: rand(3, 8) });
    }
    this.cam.shake = 12;
    this.flash = 0.35;
    this.flashColor = '#fde68a';
    if (this.hooks.onEvolve && !this.autoPick) {
      this.paused = true;
      this.hooks.onEvolve(this, { from: prev, to: p.stageId, name: nm, sig: c_sig(this.char, this.evoStage) });
    } else {
      this.announce(nm + ' 진화!', '퀘스트를 달성해 새로운 힘이 깨어났다', '#fde68a');
    }
  }

  awakenForm(n) {
    const p = this.player;
    const fromId = this.currentStage();
    this.evoStage = n;
    const base = p.baseName || this.char.chain[0].name;
    p.baseName = base;
    const nm = base + (n >= 2 ? ' · 초월' : ' · 각성');
    p.stageName = nm;
    p.scale = 1 + n * 0.07;
    this.base.hp *= 1.24;
    this.base.dmg *= 1.26;
    this.base.speed *= 1.04;
    this.recalc(false);
    p.hp = p.maxHp;
    p.weaponList.forEach(w => { w.lv = Math.min(WEAPONS[w.id].max, w.lv + 1); });
    SFX.evolve();
    playCry(p.stageId, 0.5);
    this.rings.push({ x: p.x, y: p.y, r: 20, r1: 320, life: 0.9, max: 0.9, color: '#f472b6', kind: 'heal', hit: new Set(), dmg: 0 });
    for (let i = 0; i < 44; i++) {
      const a = rand(0, TAU);
      this.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * rand(60, 340), vy: Math.sin(a) * rand(60, 340), life: 0.9, max: 0.9, color: i % 3 ? '#f472b6' : '#fde68a', r: rand(3, 9) });
    }
    this.cam.shake = 14;
    this.flash = 0.3;
    this.flashColor = '#f472b6';
    if (this.hooks.onEvolve && !this.autoPick) {
      this.paused = true;
      this.hooks.onEvolve(this, { from: fromId, to: fromId, name: nm, awaken: true });
    } else {
      this.announce(nm + '!', '퀘스트를 달성해 한계를 넘어섰다', '#f472b6');
    }
  }

  /* ---------- 메가진화 / 거다이맥스 ---------- */
  doSpecial(sp) {
    const p = this.player;
    const fromId = this.currentStage();
    this.specialDone = true;
    this.special = sp;
    p.stageId = sp.id;
    p.stageName = sp.name;
    p.scale = sp.kind === 'gmax' ? 1.8 : 1.6;
    p.r = 26;
    this.base.hp *= sp.bonus.hp;
    this.base.dmg *= sp.bonus.dmg;
    this.base.speed *= sp.bonus.speed;
    this.recalc(false);
    p.hp = p.maxHp;
    p.weaponList.forEach(w => { w.lv = Math.min(WEAPONS[w.id].max, w.lv + 1); });
    markSeen(sp.id); this.seenIds.add(sp.id);
    markCaught(sp.id);
    playCry(sp.id, 0.6);
    SFX.evolve();
    this.cam.shake = 24;
    this.hitstop = 0.2;
    this.flash = 0.7;
    this.flashColor = sp.aura;
    this.rings.push({ x: p.x, y: p.y, r: 20, r1: 460, life: 1.1, max: 1.1, color: sp.aura, kind: 'heal', hit: new Set(), dmg: 0 });
    this.rings.push({ x: p.x, y: p.y, r: 10, r1: 260, life: 0.8, max: 0.8, color: '#fff', kind: 'heal', hit: new Set(), dmg: 0 });
    for (let i = 0; i < 70; i++) {
      const a = rand(0, TAU), spd = rand(80, 520);
      this.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd, life: rand(0.6, 1.2), max: 1.2, color: i % 2 ? sp.aura : '#fff', r: rand(3, 10) });
    }
    for (const e of this.enemies) {
      if (e.dead) continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y) || 1;
      if (d < 420) {
        this.damage(e, 120 + p.level * 8, { color: sp.aura, knock: 240 });
        e.stun = Math.max(e.stun, 0.8);
      }
    }
    if (this.hooks.onEvolve && !this.autoPick) {
      this.paused = true;
      this.hooks.onEvolve(this, { from: fromId, to: sp.id, name: sp.name, special: sp.kind });
    } else {
      this.announce(sp.name + '!', sp.kind === 'gmax' ? '거다이맥스 발동!' : '메가진화 발동!', sp.aura);
    }
  }


  currentStage() {
    const p = this.player;
    return p.stageId || this.char.id;
  }
  currentStageName() {
    const p = this.player;
    return p.stageName || this.char.chain[0].name;
  }

  chooseBranch(id) {
    this.paused = false;
    if (this.hooks.onBranchClose) this.hooks.onBranchClose(this);
    this.evolveTo(id, true);
  }

  resumeFromEvo() {
    this.paused = false;
    if (this.hooks.onEvolveClose) this.hooks.onEvolveClose(this);
    if (this.pendingLevels > 0) this.openLevelUp();
  }

  /* ================= 픽업 ================= */
  updatePickups(dt) {
    const p = this.player;
    const out = [];
    for (const it of this.pickups) {
      it.life -= dt;
      const d = Math.hypot(p.x - it.x, p.y - it.y) || 1;
      if (d < p.magnet * 0.6) {
        it.x += (p.x - it.x) / d * 280 * dt;
        it.y += (p.y - it.y) / d * 280 * dt;
      }
      if (d < p.r + 18) {
        this.collect(it);
        continue;
      }
      if (it.life > 0) out.push(it);
    }
    this.pickups = out;
  }

  collect(it) {
    const p = this.player;
    if (it.kind === 'chest') {
      SFX.chest();
      this.runStats.chests++;
      this.chestCount++;
      // 0) 초각성 조합이 준비되어 있으면 상자에서 초각성
      const supers = this.superReadyList();
      if (supers.length && Math.random() < 0.8) {
        this.applySuper(pick(supers));
      } else {
      // 1) 각성 개방이 준비되어 있으면 상자에서 각성
      const ready = this.awakenReadyList();
      if (ready.length && Math.random() < 0.62) {
        this.awakenWeapon(pick(ready));
      } else {
        const r = Math.random();
        if (r < 0.38) {
          const cand = p.weaponList.filter(w => WEAPONS[w.id].max > w.lv);
          if (cand.length) {
            const w = pick(cand);
            const before = w.lv;
            w.lv++;
            this.announce('기술 강화!', WEAPONS[w.id].name + ' Lv.' + before + ' → ' + w.lv, '#fbbf24');
            if (this.canAwaken(w)) {
              this.floatText(p.x, p.y - 58, '각성 준비 완료!', WEAPONS[w.id].awakeColor, 1.1);
              this.refreshAwakenReady();
            }
          } else this.runCoins += 30;
        } else if (r < 0.64) {
          const avail = Object.keys(PASSIVES).filter(k => (p.passives[k] || 0) < PASSIVES[k].max && isPassiveUnlocked(k));
          if (avail.length) {
            const k = pick(avail);
            this.addPassive(k);
            this.announce('패시브 획득!', PASSIVES[k].name, '#a78bfa');
          } else this.runCoins += 30;
        } else if (r < 0.85) {
          this.runCoins += 20;
          this.announce('보물 상자', '+20 코인', '#fbbf24');
        } else {
          this.runDust += 2;
          this.announce('별의모래!', '+2 별의모래', '#c4b5fd');
        }
      }
      }
      for (let i = 0; i < 30; i++) {
        const a = rand(0, TAU);
        this.particles.push({ x: it.x, y: it.y, vx: Math.cos(a) * rand(60, 280), vy: Math.sin(a) * rand(60, 280), life: 0.7, max: 0.7, color: i % 2 ? '#fde68a' : '#fff', r: rand(3, 6) });
      }
    } else if (it.kind === 'heart') {
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.18);
      this.floatText(p.x, p.y - 34, '+HP', '#4ade80');
      SFX.coin();
    }
  }

  /* ================= 필드 아이템 ================= */
  spawnFieldItem(x, y, kind) {
    if (x == null) {
      const a = Math.random() * TAU, r = 240 + Math.random() * 420;
      x = clamp(this.player.x + Math.cos(a) * r, 60, WORLD - 60);
      y = clamp(this.player.y + Math.sin(a) * r, 60, WORLD - 60);
    }
    const k = kind || this.rollItemKind();
    this.fieldItems.push({ kind: k, x, y, t: Math.random() * 3, bob: Math.random() * TAU });
  }

  rollItemKind() {
    let table = [['berry', 24], ['coin', 20], ['candy', 14], ['magnet', 11], ['bomb', 10], ['guard', 10], ['haste', 11]];
    table = table.filter(([k]) => isFieldUnlocked(k));
    let total = 0;
    for (const t of table) total += t[1];
    if (!total) return 'berry';
    let r = Math.random() * total;
    for (const [k, w] of table) { r -= w; if (r <= 0) return k; }
    return 'berry';
  }

  updateFieldItems(dt) {
    const p = this.player;
    this.fieldTimer -= dt;
    if (this.fieldTimer <= 0) {
      this.fieldTimer = rand(5.5, 8.5);
      if (this.fieldItems.length < 26) this.spawnFieldItem();
      if (this.fieldItems.length < 16 && Math.random() < 0.35) this.spawnFieldItem();
      // 시야 밖으로 너무 멀리 떨어진 아이템은 정리
      this.fieldItems = this.fieldItems.filter(it => Math.hypot(it.x - p.x, it.y - p.y) < 2400);
    }
    const out = [];
    for (const it of this.fieldItems) {
      it.t += dt;
      const dx = p.x - it.x, dy = p.y - it.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < p.magnet * 0.55) {
        it.x += dx / d * 300 * dt;
        it.y += dy / d * 300 * dt;
      }
      if (d < p.r + 20) { this.collectFieldItem(it); continue; }
      out.push(it);
    }
    this.fieldItems = out;
  }

  collectFieldItem(it) {
    const p = this.player;
    const def = FIELD_ITEMS[it.kind];
    this.itemsCollected++;
    this.impact(it.x, it.y, def.color, 0.9);
    SFX.coin();
    switch (it.kind) {
      case 'berry':
        p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.22);
        this.floatText(p.x, p.y - 36, '+체력', '#4ade80', 1.05);
        break;
      case 'magnet':
        this.vacuumT = 1.6;
        this.rings.push({ x: p.x, y: p.y, r: 20, r1: 420, life: 0.7, max: 0.7, color: '#a78bfa', kind: 'heal', hit: new Set(), dmg: 0 });
        this.floatText(p.x, p.y - 36, '자석!', '#a78bfa', 1.05);
        break;
      case 'coin':
        this.runCoins += 18 * p.coinMul;
        this.floatText(p.x, p.y - 36, '+코인', '#fbbf24', 1.05);
        break;
      case 'bomb':
        this.screenBlast();
        break;
      case 'guard':
        p.guardT = 4;
        this.floatText(p.x, p.y - 36, '무적 4초!', '#7dd3fc', 1.1);
        this.rings.push({ x: p.x, y: p.y, r: 20, r1: 90, life: 0.5, max: 0.5, color: '#7dd3fc', kind: 'heal', hit: new Set(), dmg: 0 });
        break;
      case 'haste':
        p.hasteT = 6;
        this.floatText(p.x, p.y - 36, '가속!', '#34d399', 1.1);
        break;
      case 'candy':
        this.gainXp(26);
        this.floatText(p.x, p.y - 36, '+경험치', '#60a5fa', 1.05);
        break;
      default: break;
    }
  }

  screenBlast() {
    const p = this.player;
    this.flash = 0.5;
    this.flashColor = '#fb923c';
    this.cam.shake = 18;
    this.hitstop = 0.1;
    const r = 900;
    this.rings.push({ x: p.x, y: p.y, r: 30, r1: r, life: 0.7, max: 0.7, color: '#fb923c', kind: 'blast', hit: new Set(), dmg: 0, wide: 34 });
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (dist2(e.x, e.y, p.x, p.y) < r * r) {
        this.damage(e, 70 + p.level * 7, { color: '#fb923c', knock: 180 });
      }
    }
    this.damageProps(p.x, p.y, r, 120);
    for (let i = 0; i < 60; i++) {
      const a = rand(0, TAU), sp = rand(150, 720);
      this.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.4, 0.8), max: 0.8, color: i % 2 ? '#fb923c' : '#fde68a', r: rand(3, 9) });
    }
    SFX.explode();
    this.floatText(p.x, p.y - 56, '충격파!', '#fdba74', 1.25);
  }

  /* ================= 파괴 오브젝트 ================= */
  updateProps(dt) {
    let dirty = false;
    for (const pr of this.props) {
      if (pr.dead) { dirty = true; continue; }
      pr.flash = Math.max(0, pr.flash - dt);
      pr.shake = Math.max(0, pr.shake - dt);
      pr.bob += dt;
    }
    if (dirty) this.props = this.props.filter(pr => !pr.dead);
  }

  damageProps(x, y, r, dmg) {
    if (!this.props.length) return;
    const rr = r;
    for (const pr of this.props) {
      if (pr.dead) continue;
      const d = Math.hypot(pr.x - x, pr.y - y);
      if (d > rr + pr.r) continue;
      pr.hp -= dmg;
      pr.flash = 0.12;
      pr.shake = 0.18;
      if (pr.hp <= 0) this.destroyProp(pr);
    }
  }

  destroyProp(pr) {
    if (pr.dead) return;
    pr.dead = true;
    const def = PROP_TYPES[pr.type];
    this.impact(pr.x, pr.y, pr.type === 'crystal' ? '#c4b5fd' : pr.type === 'rock' ? '#b8a038' : '#d97706', 1.1);
    for (let i = 0; i < 16; i++) {
      const a = rand(0, TAU), sp = rand(60, 260);
      this.particles.push({
        x: pr.x, y: pr.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: rand(0.3, 0.7), max: 0.7,
        color: pr.type === 'crystal' ? '#c4b5fd' : pr.type === 'rock' ? '#94a3b8' : '#b45309',
        r: rand(2, 6)
      });
    }
    SFX.explode();
    this.cam.shake = Math.min(10, this.cam.shake + 3);
    if (def.drop === 'item') {
      if (Math.random() < 0.85) this.spawnFieldItem(pr.x, pr.y, this.rollItemKind());
      else this.runCoins += 6 * this.player.coinMul;
    } else if (def.drop === 'coin') {
      this.runCoins += 7 * this.player.coinMul;
      this.dropOrbs(pr.x, pr.y, 3, '#fbbf24');
      this.floatText(pr.x, pr.y - 20, '+코인', '#fbbf24', 0.9);
    } else {
      this.spawnFieldItem(pr.x, pr.y, Math.random() < 0.5 ? 'candy' : 'berry');
    }
  }

  /* ================= 위험지대 ================= */
  updateHazards(dt) {
    const p = this.player;
    const out = [];
    for (const h of this.hazards) {
      h.life -= dt;
      if (h.src === 'player') {
        for (const e of this.enemies) {
          if (e.dead) continue;
          if (dist2(p.x, p.y, e.x, e.y) > 2600 * 2600) continue;
          if (dist2(e.x, e.y, h.x, h.y) < (h.r + e.r * 0.4) ** 2) {
            this.damage(e, h.dmg * dt * 2.4, { color: h.color, silent: true, dot: true });
            if (h.slow) e.slow = Math.max(e.slow, h.slow);
          }
        }
      } else if (p.inv <= 0 && dist2(p.x, p.y, h.x, h.y) < h.r * h.r) {
        this.hurtPlayer(h.dmg * dt * 2.2);
      }
      if (h.life > 0) out.push(h);
    }
    this.hazards = out;
  }

  /* ================= 데미지/처치 ================= */
  damage(e, amount, optsNow = {}) {
    if (e.dead) return 0;
    const p = this.player;
    let dmg = amount * p.dmgMul;
    let crit = false;
    if (!optsNow.dot && Math.random() < p.critChance) { crit = true; dmg *= p.critMul; }
    if (e.shield > 0) {
      dmg *= 0.35;
      e.shieldT = 3;
      e.shield = Math.max(0, e.shield - dmg / Math.max(60, e.maxHp * 0.85));
      if (e.shield <= 0) this.impact(e.x, e.y, '#93c5fd', 1.2);
    }
    if (!optsNow.dot) this.runStats.skillHits++;
    e.hp -= dmg;
    if (!optsNow.dot) {
      e.flash = Math.max(e.flash, crit ? 0.14 : 0.085);
      e.squash = Math.max(e.squash, crit ? 1 : 0.55);
    }
    if (!optsNow.silent) {
      this.floatText(e.x + rand(-8, 8), e.y - e.r - 6, Math.round(dmg) + (crit ? '!' : ''), crit ? '#fbbf24' : (optsNow.color || '#fff'), crit ? 1.2 : 0.85);
    }
    if (crit) {
      SFX.crit();
      this.hitstop = Math.max(this.hitstop, 0.035);
      this.impact(e.x, e.y, '#fde68a', 1.2);
      this.cam.shake = Math.min(12, this.cam.shake + 3);
    } else SFX.hit();
    if (optsNow.knock) {
      const d = Math.hypot(e.x - p.x, e.y - p.y) || 1;
      e.kx += (e.x - p.x) / d * optsNow.knock;
      e.ky += (e.y - p.y) / d * optsNow.knock;
    }
    if (optsNow.stun) e.stun = Math.max(e.stun, optsNow.stun);
    if (e.hp <= 0) this.kill(e);
    return dmg;
  }

  kill(e) {
    if (e.dead) return;
    e.dead = true;
    this.kills++;
    this.runStats.kills++;
    if (e.elite) this.runStats.elites++;
    if (e.boss) this.runStats.bosses++;
    markCaught(e.id);
    this.seenIds.add(e.id);
    const p = this.player;

    this.dropOrbs(e.x, e.y, e.xp, e.shiny ? '#fde68a' : (e.boss ? '#f472b6' : '#38bdf8'));
    const coins = (e.def.xp * 0.10 + (e.boss ? 25 : 0) + (e.elite ? 15 : 0) + (e.legend ? 50 : 0)) * (e.shiny ? 4 : 1) * p.coinMul;
    this.runCoins += coins;
    if (e.boss) {
      this.cam.shake = 18;
      this.hitstop = Math.max(this.hitstop, 0.16);
      this.flash = Math.max(this.flash, 0.4);
      this.flashColor = '#fde68a';
    }
    if (e.legend) {
      this.legendsKilled++;
      this.runDust += 6;
      this.announce(e.name + ' 포획!', '별의모래 +6 · 코인 +' + Math.round(coins), '#a78bfa');
      this.pickups.push({ x: e.x, y: e.y, kind: 'chest', life: 90, bob: 0 });
      SFX.win();
    } else if (e.boss) {
      this.bossesKilled++;
      this.runDust += e.final ? 10 : 2;
      this.pickups.push({ x: e.x, y: e.y, kind: 'chest', life: 120, bob: 0 });
      if (e.final) { this.finalBoss = e; }
      this.announce(e.name + ' 처치!', '보물 상자가 떨어졌다', '#fbbf24');
    } else if (e.elite) {
      this.pickups.push({ x: e.x, y: e.y, kind: 'chest', life: 90, bob: 0 });
    } else {
      if (Math.random() < 0.03 + this.meta.luck * 0.25) this.pickups.push({ x: e.x, y: e.y, kind: 'heart', life: 20, bob: 0 });
      if (e.shiny) {
        this.shiniesKilled++;
        this.runDust += 1;
        this.pickups.push({ x: e.x, y: e.y, kind: 'chest', life: 60, bob: 0 });
        this.floatText(e.x, e.y - 40, '이로치 보상!', '#fde68a', 1.2);
      }
      if (e.def.selfDestruct) {
        this.hazards.push({ x: e.x, y: e.y, r: 70, life: 2.2, dmg: e.dmg * 0.55, color: '#fbbf24' });
        this.rings.push({ x: e.x, y: e.y, r: 10, r1: 100, life: 0.35, max: 0.35, color: '#fbbf24', kind: 'blast', hit: new Set(), dmg: 0 });
        this.explode(e.x, e.y, 90, e.dmg * 0.8, '#fb923c', 0, null);
        SFX.explode();
      }
      if (e.ai === 'poison') this.hazards.push({ x: e.x, y: e.y, r: 52, life: 4, dmg: e.dmg * 0.35, color: '#a855f7' });
      if (e.splitInto && !e.small) {
        for (let i = 0; i < 2; i++) {
          const child = this.spawnEnemy(e.splitInto, {
            x: e.x + rand(-26, 26), y: e.y + rand(-26, 26), small: true
          });
          if (child) {
            child.hp = child.maxHp = Math.max(1, e.maxHp * 0.28);
            child.dmg = e.dmg * 0.6;
            child.r = e.r * 0.7;
            child.xp = Math.max(1, Math.round(e.xp * 0.35));
          }
        }
        this.floatText(e.x, e.y - 30, '분열!', '#c084fc', 0.95);
      }
      if (e.ai === 'healer') {
        this.announce('지원병 쓰러짐', e.name + '의 회복이 멈췄다', '#86efac');
      }
    }
    for (let i = 0; i < (e.boss ? 44 : 10); i++) {
      const a = rand(0, TAU), sp = e.boss ? rand(100, 440) : rand(40, 200);
      this.particles.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: e.boss ? 0.9 : 0.4, max: e.boss ? 0.9 : 0.4, color: e.shiny ? '#fde68a' : e.typeColor, r: e.boss ? rand(4, 9) : rand(2, 5) });
    }
    this.impact(e.x, e.y, e.shiny ? '#fde68a' : e.typeColor, e.boss ? 2 : 0.8);
    SFX.kill();
    if (e.final) this.win();
  }

  /* ================= 연출 ================= */
  floatText(x, y, text, color, scale = 1) {
    if (this.texts.length > 80) this.texts.shift();
    this.texts.push({ x, y, text, color, life: 0.85, max: 0.85, scale });
  }
  announce(text, sub, color) {
    this.announcement = { text, sub, color: color || '#fff', life: 2.4, max: 2.4 };
  }
  impact(x, y, color, power = 1) {
    if (this.rings.length < 60) this.rings.push({ x, y, r: 4 * power, r1: 16 * power, life: 0.22, max: 0.22, color, kind: 'spark', hit: new Set(), dmg: 0 });
    for (let i = 0; i < 3 * power; i++) {
      const a = rand(0, TAU), sp = rand(40, 170) * power;
      this.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.15, 0.3), max: 0.3, color: i % 3 ? color : '#fff', r: rand(1.5, 3) });
    }
  }

  updateVisuals(dt) {
    for (const p of this.particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(0.1, dt); p.vy *= Math.pow(0.1, dt); p.life -= dt; }
    this.particles = this.particles.filter(p => p.life > 0);
    for (const t of this.texts) { t.y -= 34 * dt; t.life -= dt; }
    this.texts = this.texts.filter(t => t.life > 0);
    for (const b of this.bolts) b.life -= dt;
    this.bolts = this.bolts.filter(b => b.life > 0);
    for (const b of this.beams) b.life -= dt;
    this.beams = this.beams.filter(b => b.life > 0);
    for (const s of this.slashes) s.life -= dt;
    this.slashes = this.slashes.filter(s => s.life > 0);
    for (const g of this.ghosts) g.life -= dt;
    this.ghosts = this.ghosts.filter(g => g.life > 0);
    for (const r of this.rings) {
      r.life -= dt;
      if (r.delay > 0) r.delay -= dt;
      const prog = 1 - Math.max(0, r.life) / r.max;
      r.r = r.r1 * (r.kind === 'meteor' ? 1 : Math.min(1, prog * 1.6));
      if (!(r.delay > 0) && !r.done) {
        r.done = true;
        if (r.dmg > 0) {
          if (r.kind === 'meteor') {
            this.explode(r.x, r.y, r.r1, r.dmg, '#fcd34d', 0, null);
            this.cam.shake = Math.min(12, this.cam.shake + 4);
          } else if (r.kind === 'psychic' || r.kind === 'echo') {
            for (const e of this.enemies) {
              if (r.hit.has(e.uid)) continue;
              if (dist2(e.x, e.y, r.x, r.y) < r.r1 * r.r1) {
                r.hit.add(e.uid);
                this.damage(e, r.dmg, { color: r.kind === 'echo' ? '#fda4af' : '#f472b6' });
                e.slow = Math.max(e.slow, 0.4);
                if (r.kind === 'echo' && r.stun) e.stun = Math.max(e.stun, r.stun);
              }
            }
          } else if (r.kind === 'quake' || r.kind === 'slam') {
            for (const e of this.enemies) {
              if (r.hit.has(e.uid)) continue;
              if (dist2(e.x, e.y, r.x, r.y) < r.r1 * r.r1) {
                r.hit.add(e.uid);
                this.damage(e, r.dmg, { color: r.color, knock: 130 });
                if (r.stun) e.stun = Math.max(e.stun, r.stun);
              }
            }
            this.damageProps(r.x, r.y, r.r1, r.dmg * 0.8);
          }
        }
      }
    }
    this.rings = this.rings.filter(r => r.life > 0);
    for (const s of this.slashes) {
      if (s.done || s.delay > 0) { s.delay -= dt; continue; }
      s.done = true;
      for (const e of this.enemies) {
        if (s.hit.has(e.uid)) continue;
        const dx = e.x - s.x, dy = e.y - s.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d > s.range + e.r) continue;
        let da = Math.atan2(dy, dx) - s.angle;
        da = Math.atan2(Math.sin(da), Math.cos(da));
        if (Math.abs(da) < s.arc / 2 + 0.3) {
          s.hit.add(e.uid);
          this.damage(e, s.dmg, { color: '#818cf8', knock: 35 });
        }
      }
      this.damageProps(s.x + Math.cos(s.angle) * s.range * 0.55, s.y + Math.sin(s.angle) * s.range * 0.55, s.range * 0.5, s.dmg * 0.6);
    }
    for (const b of this.beams) {
      if (b.done) continue;
      b.done = true;
      const cx = Math.cos(b.angle), cy = Math.sin(b.angle);
      for (const e of this.enemies) {
        const dx = e.x - b.x, dy = e.y - b.y;
        const t = dx * cx + dy * cy;
        if (t < 0 || t > b.len) continue;
        const side = Math.abs(dx * cy - dy * cx);
        if (side < b.width / 2 + e.r * 0.6) {
          b.hit.add(e.uid);
          this.damage(e, b.dmg, { color: '#fde68a', knock: 40 });
        }
      }
      for (let t = 60; t < b.len; t += 120) this.damageProps(b.x + cx * t, b.y + cy * t, b.width, b.dmg * 0.5);
      if (b.awake) {
        this.explode(b.x + cx * b.len * 0.75, b.y + cy * b.len * 0.75, 150, b.dmg * 0.6, '#fde68a', 0, null);
      }
    }
    if (this.announcement) {
      this.announcement.life -= dt;
      if (this.announcement.life <= 0) this.announcement = null;
    }
  }

  /* ================= 종료 ================= */
  win() {
    if (this.state !== 'run') return;
    this.state = 'win';
    this.won = true;
    SFX.win();
    const result = this.buildResult(true);
    if (this.hooks.onEnd) this.hooks.onEnd(this, result);
  }
  lose() {
    if (this.state !== 'run') return;
    this.state = 'lose';
    SFX.lose();
    const result = this.buildResult(false);
    if (this.hooks.onEnd) this.hooks.onEnd(this, result);
  }

  buildResult(win) {
    const stageBonus = this.stage.reward || 1;
    const coins = Math.round(this.runCoins + this.kills * 0.08 + (win ? 200 * stageBonus : 0));
    const dust = Math.round(this.runDust + (win ? 6 * stageBonus : 0));
    return {
      win, time: this.time, kills: this.kills, level: this.player.level,
      coins, dust, bosses: this.bossesKilled, legends: this.legendsKilled, shinies: this.shiniesKilled,
      charName: this.currentStageName(), charId: this.currentStage(), charKey: this.char.key,
      stageKey: this.stage.key, stageName: this.stage.name, shiny: this.shiny,
      seenIds: [...this.seenIds], weapons: this.player.weaponList.map(w => ({ id: w.id, lv: w.lv, awake: !!w.awake })),
      awakens: this.awakenCount, items: this.itemsCollected,
      supers: this.superCount, megas: this.specialDone ? 1 : 0, chests: this.chestCount,
      special: this.special ? this.special.name : null, evoStep: this.evoStage
    };
  }

  /* ================= 시뮬레이션(테스트) ================= */
  simulate(seconds, opts = {}) {
    const step = 1 / 60;
    let t = 0;
    const wasAuto = this.autoPick;
    this.autoPick = true;
    this.skipHud = true;
    const errors = [];
    while (t < seconds && (this.state === 'run' || this.paused)) {
      try {
        if (this.paused) {
          if (this.autoPick) {
            if (this.hooks.autoResolveUI) this.hooks.autoResolveUI(this);
            this.paused = false;
          }
        }
        this.moveInput = this.botInput(t, opts);
        this.update(step);
        t += step;
      } catch (err) {
        errors.push(String(err && err.stack || err));
        if (errors.length > 3) break;
      }
    }
    this.autoPick = wasAuto;
    this.skipHud = false;
    return { time: this.time, state: this.state, level: this.player.level, kills: this.kills, errors };
  }

  botInput(t, opts = {}) {
    const p = this.player;
    if (opts.idle) return { x: 0, y: 0 };
    let fx = 0, fy = 0;
    for (const e of this.enemies) {
      if (e.dead) continue;
      const dx = p.x - e.x, dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 230) {
        const w = (230 - d) / 230;
        fx += dx / d * w * w * 2;
        fy += dy / d * w * w * 2;
      }
    }
    for (const b of this.ebullets) {
      const dx = p.x - b.x, dy = p.y - b.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 170) {
        const w = (170 - d) / 170;
        fx += dx / d * w * 1.6;
        fy += dy / d * w * 1.6;
      }
    }
    // 필드 아이템도 수집하러 간다
    let best = null, bd = 1e9;
    for (const o of this.orbs) {
      const dd = dist2(o.x, o.y, p.x, p.y);
      if (dd < bd) { bd = dd; best = o; }
    }
    for (const it of this.fieldItems) {
      const dd = dist2(it.x, it.y, p.x, p.y) * 0.5;
      if (dd < bd) { bd = dd; best = it; }
    }
    if (best && bd > 2000) {
      const d = Math.sqrt(bd);
      fx += (best.x - p.x) / d * 0.9;
      fy += (best.y - p.y) / d * 0.9;
    }
    const m = 220;
    if (p.x < m) fx += (m - p.x) / m;
    if (p.x > WORLD - m) fx -= (p.x - (WORLD - m)) / m;
    if (p.y < m) fy += (m - p.y) / m;
    if (p.y > WORLD - m) fy -= (p.y - (WORLD - m)) / m;
    const l = Math.hypot(fx, fy);
    if (l < 0.02) return { x: Math.cos(t * 0.7) * 0.5, y: Math.sin(t * 0.9) * 0.5 };
    return { x: fx / l, y: fy / l };
  }

  /* ================= 렌더 ================= */
  render() {
    const ctx = this.ctx;
    if (this.state === 'idle' || !this.player) return;
    const W = this.W, H = this.H, zoom = this.zoom;
    const vw = W / zoom, vh = H / zoom;
    const sh = this.shakeOn ? this.cam.shake : 0;
    const kick = this.shakeOn ? 1 : 0;
    const sx = this.cam.x + (sh ? rand(-sh, sh) : 0) + this.cam.kickX * kick;
    const sy = this.cam.y + (sh ? rand(-sh, sh) : 0) + this.cam.kickY * kick;

    ctx.imageSmoothingEnabled = false;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, this.stage.sky[0]);
    sky.addColorStop(1, this.stage.sky[1]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.scale(zoom, zoom);
    ctx.translate(-sx, -sy);

    this.drawTerrain(ctx, sx, sy, vw, vh);
    this.drawFieldItems(ctx, sx, sy, vw, vh);
    this.drawProps(ctx, sx, sy, vw, vh);
    this.drawPickups(ctx);
    this.drawOrbs(ctx);

    for (const g of this.ghosts) {
      this.drawSpriteEntity(ctx, g.x, g.y, g.h, g.id, g.shiny, g.face, { alpha: g.life / g.max * 0.45, feet: g.y + 20, shadow: false, rot: 0, sx: 1, sy: 1 });
    }

    const sorted = [...this.enemies].sort((a, b) => a.y - b.y);
    let drawn = 0;
    for (const e of sorted) {
      if (e.x < sx - 140 || e.x > sx + vw + 140 || e.y < sy - 160 || e.y > sy + vh + 140) continue;
      this.drawEnemy(ctx, e);
      if (++drawn > 240) break;
    }
    this.drawPlayer(ctx);
    this.drawOrbits(ctx);
    this.drawHazards(ctx);
    this.drawProjectiles(ctx);
    this.drawEBullets(ctx);
    this.drawEffects(ctx);
    this.drawTexts(ctx);
    ctx.restore();

    this.drawVignette(ctx);
    this.drawFlash(ctx);
    this.drawMinimap(ctx, W - this.miniSize() - 12, this.miniTop(), this.miniSize());
    this.drawHUDCanvas(ctx);
  }

  miniSize() { return this.W < 700 ? 92 : 142; }
  miniTop() { return this.W < 700 ? this.H - this.miniSize() - 30 : 56; }

  /* ---------- 지형 ---------- */
  drawTerrain(ctx, sx, sy, vw, vh) {
    const st = this.stage;
    const T = st.terrain;
    const pat = this.groundPattern(st);
    ctx.fillStyle = pat;
    ctx.fillRect(sx, sy, vw, vh);

    /* 큰 음영 */
    for (const h of this.deco.hills) {
      if (h.x < sx - h.r || h.x > sx + vw + h.r || h.y < sy - h.r || h.y > sy + vh + h.r) continue;
      const g = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r);
      g.addColorStop(0, h.dark ? 'rgba(0,0,0,' + h.a + ')' : hexA(st.accent, h.a * 0.55));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill();
    }

    /* 돌길 */
    for (const p of this.deco.paths) {
      ctx.save();
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(p.pts[0][0], p.pts[0][1]);
      for (let i = 1; i < p.pts.length; i++) ctx.lineTo(p.pts[i][0], p.pts[i][1]);
      ctx.strokeStyle = hexA(T.path, 0.30);
      ctx.lineWidth = p.w;
      ctx.stroke();
      ctx.strokeStyle = hexA(T.path, 0.55);
      ctx.lineWidth = p.w * 0.55;
      ctx.stroke();
      ctx.restore();
    }

    /* 물웅덩이 / 용암 */
    for (const po of this.deco.ponds) {
      if (po.x < sx - po.rx - 60 || po.x > sx + vw + po.rx + 60 || po.y < sy - po.ry - 60 || po.y > sy + vh + po.ry + 60) continue;
      this.drawPond(ctx, po, T);
    }

    /* 풀 / 꽃 */
    ctx.save();
    for (const t of this.deco.tufts) {
      if (t.x < sx - 20 || t.x > sx + vw + 20 || t.y < sy - 20 || t.y > sy + vh + 20) continue;
      ctx.strokeStyle = hexA(T.foliage[2], 0.42);
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      const s = t.s * 7;
      ctx.moveTo(t.x, t.y);
      ctx.quadraticCurveTo(t.x - 3, t.y - s * 0.7, t.x + 4 * Math.cos(t.rot), t.y - s);
      ctx.moveTo(t.x, t.y);
      ctx.quadraticCurveTo(t.x + 3, t.y - s * 0.6, t.x - 3 * Math.sin(t.rot), t.y - s * 0.85);
      ctx.stroke();
    }
    for (const f of this.deco.flowers) {
      if (f.x < sx - 20 || f.x > sx + vw + 20 || f.y < sy - 20 || f.y > sy + vh + 20) continue;
      ctx.fillStyle = f.c;
      ctx.globalAlpha = 0.75;
      for (let i = 0; i < f.n; i++) {
        const a = f.r + i * 2.1;
        ctx.beginPath();
        ctx.arc(f.x + Math.cos(a) * 4, f.y + Math.sin(a) * 3, 2.1, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    /* 덤불 */
    for (const b of this.deco.bushes) {
      if (b.x < sx - 60 || b.x > sx + vw + 60 || b.y < sy - 70 || b.y > sy + vh + 60) continue;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.fillStyle = 'rgba(0,0,0,0.24)';
      ctx.beginPath(); ctx.ellipse(4, 3, 20 * b.s, 7 * b.s, 0, 0, TAU); ctx.fill();
      const cols = T.foliage;
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = cols[(b.kind + i) % 3];
        ctx.beginPath();
        ctx.arc((i - 1) * 9 * b.s, -8 * b.s - (i === 1 ? 5 * b.s : 0), (11 - i * 1.5) * b.s, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = hexA('#ffffff', 0.12);
      ctx.beginPath(); ctx.arc(-4 * b.s, -18 * b.s, 4 * b.s, 0, TAU); ctx.fill();
      ctx.restore();
    }

    /* 작은 바위 */
    for (const r of this.deco.rocks) {
      if (r.x < sx - 40 || r.x > sx + vw + 40 || r.y < sy - 40 || r.y > sy + vh + 40) continue;
      ctx.save();
      ctx.translate(r.x, r.y);
      ctx.rotate(r.rot);
      const s = r.s * 13;
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.beginPath(); ctx.ellipse(2, s * 0.42, s * 0.95, s * 0.38, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = st.ground[1];
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * TAU;
        const rr = s * (0.72 + ((r.seed >> i) & 3) * 0.09);
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr * 0.72);
      }
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = hexA(st.accent, 0.22);
      ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.22, s * 0.32, s * 0.18, -0.4, 0, TAU); ctx.fill();
      ctx.restore();
    }

    /* 수정 / 기둥 / 구름 */
    for (const c of this.deco.crystals) {
      if (c.x < sx - 60 || c.x > sx + vw + 60 || c.y < sy - 80 || c.y > sy + vh + 60) continue;
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = hexA(c.hue, 0.22);
      ctx.beginPath(); ctx.ellipse(0, 4, c.h * 0.7, c.h * 0.24, 0, 0, TAU); ctx.fill();
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + (i - 1) * 0.5 + Math.sin(c.rot + i) * 0.06;
        const hh = c.h * (1 - i * 0.22);
        ctx.fillStyle = i === 1 ? c.hue : hexA(c.hue, 0.75);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * 8 - 7, 2);
        ctx.lineTo(Math.cos(a) * hh, -Math.sin(a) * hh + Math.sin(a) * 0);
        ctx.lineTo(Math.cos(a) * 8 + 7, 2);
        ctx.closePath(); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.arc(0, -c.h * 0.55, 1.6, 0, TAU); ctx.fill();
      ctx.restore();
    }

    for (const p of this.deco.pillars) {
      if (p.x < sx - 100 || p.x > sx + vw + 100 || p.y < sy - 160 || p.y > sy + vh + 100) continue;
      ctx.save();
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(p.x + 12, p.y + 10, 34, 12, 0, 0, TAU); ctx.fill();
      const w = 26 + (p.rot % 1) * 10;
      const grd = ctx.createLinearGradient(p.x - w, p.y, p.x + w, p.y);
      grd.addColorStop(0, '#4c3575'); grd.addColorStop(0.5, '#6d4a9c'); grd.addColorStop(1, '#3b2a5c');
      ctx.fillStyle = grd;
      ctx.fillRect(p.x - w / 2, p.y - p.h, w, p.h);
      ctx.fillStyle = '#8b6fc4';
      ctx.fillRect(p.x - w / 2 - 5, p.y - p.h - 9, w + 10, 10);
      ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 700 + p.rot) * 0.2;
      ctx.strokeStyle = '#e9d5ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(p.x, p.y - p.h + 14); ctx.lineTo(p.x, p.y - 8); ctx.stroke();
      ctx.restore();
    }

    for (const c of this.deco.clouds) {
      if (c.x < sx - c.r * 2 || c.x > sx + vw + c.r * 2 || c.y < sy - c.r || c.y > sy + vh + c.r) continue;
      ctx.save();
      ctx.globalAlpha = c.a;
      ctx.fillStyle = '#f5f3ff';
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(c.x + Math.cos(i * 1.7) * c.r * 0.5, c.y + Math.sin(i * 2.3) * c.r * 0.2, c.r * 0.55, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    /* 테마 전용 장식 */
    for (const m of this.deco.mist) {
      if (m.x < sx - m.r || m.x > sx + vw + m.r || m.y < sy - m.r || m.y > sy + vh + m.r) continue;
      const g = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
      g.addColorStop(0, 'rgba(196,181,253,' + m.a + ')');
      g.addColorStop(1, 'rgba(196,181,253,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill();
    }
    for (const gr of this.deco.graves) {
      if (gr.x < sx - 40 || gr.x > sx + vw + 40 || gr.y < sy - 70 || gr.y > sy + vh + 40) continue;
      ctx.save();
      ctx.translate(gr.x, gr.y);
      ctx.rotate(gr.rot);
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.beginPath(); ctx.ellipse(3, 3, 18 * gr.s, 6 * gr.s, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath();
      ctx.moveTo(-13 * gr.s, 0); ctx.lineTo(-13 * gr.s, -30 * gr.s);
      ctx.quadraticCurveTo(0, -48 * gr.s, 13 * gr.s, -30 * gr.s);
      ctx.lineTo(13 * gr.s, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#6b7280'; ctx.lineWidth = 2 * gr.s;
      ctx.beginPath(); ctx.moveTo(0, -32 * gr.s); ctx.lineTo(0, -10 * gr.s); ctx.moveTo(-7 * gr.s, -25 * gr.s); ctx.lineTo(7 * gr.s, -25 * gr.s); ctx.stroke();
      ctx.restore();
    }
    for (const co of this.deco.corals) {
      if (co.x < sx - 50 || co.x > sx + vw + 50 || co.y < sy - 60 || co.y > sy + vh + 50) continue;
      ctx.save();
      ctx.translate(co.x, co.y);
      ctx.rotate(Math.sin(co.rot + performance.now() / 2200) * 0.06);
      ctx.strokeStyle = co.hue;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.lineWidth = (5 - i) * co.s;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo((i - 1) * 10 * co.s, -16 * co.s, (i - 1) * 18 * co.s, -30 * co.s);
        ctx.stroke();
      }
      ctx.restore();
    }
    if (this.deco.bubbles.length) {
      const tm = performance.now() / 1000;
      for (const b of this.deco.bubbles) {
        if (b.x < sx - 20 || b.x > sx + vw + 20 || b.y < sy - 40 || b.y > sy + vh + 20) continue;
        const yy = b.y - ((tm * b.sp + b.ph * 30) % 120);
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.arc(b.x, yy, b.r, 0, TAU); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    if (this.deco.embers.length) {
      const tm = performance.now() / 1000;
      for (const em of this.deco.embers) {
        if (em.x < sx - 20 || em.x > sx + vw + 20 || em.y < sy - 40 || em.y > sy + vh + 20) continue;
        const yy = em.y - ((tm * em.sp + em.ph * 20) % 90);
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = '#fb923c';
        ctx.beginPath(); ctx.arc(em.x + Math.sin(tm + em.ph) * 6, yy, em.r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    for (const s of this.deco.shards) {
      if (s.x < sx - 60 || s.x > sx + vw + 60 || s.y < sy - 90 || s.y > sy + vh + 60) continue;
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot + Math.sin(performance.now() / 1600 + s.x) * 0.08);
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = hexA(s.hue, 0.85);
      ctx.beginPath();
      ctx.moveTo(0, -s.h); ctx.lineTo(11, 0); ctx.lineTo(0, s.h * 0.25); ctx.lineTo(-11, 0);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = hexA('#ffffff', 0.5);
      ctx.beginPath(); ctx.moveTo(0, -s.h); ctx.lineTo(5, -s.h * 0.3); ctx.lineTo(-3, -s.h * 0.2); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    for (const rf of this.deco.rifts) {
      if (rf.x < sx - 60 || rf.x > sx + vw + 60 || rf.y < sy - 200 || rf.y > sy + vh + 60) continue;
      ctx.save();
      ctx.translate(rf.x, rf.y);
      ctx.rotate(rf.rot);
      ctx.globalAlpha = 0.55 + Math.sin(performance.now() / 400 + rf.x) * 0.2;
      ctx.strokeStyle = '#f0abfc';
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 18;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const segs = 6;
      for (let i = 1; i <= segs; i++) ctx.lineTo((i % 2 ? 1 : -1) * 12, -rf.h * (i / segs));
      ctx.stroke();
      ctx.restore();
    }

    /* 나무 */
    for (const t of this.deco.trees) {
      if (t.x < sx - 120 || t.x > sx + vw + 120 || t.y < sy - 170 || t.y > sy + vh + 80) continue;
      this.drawTree(ctx, t);
    }

    /* 월드 경계 */
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, WORLD, WORLD);
    ctx.strokeStyle = hexA(st.accent, 0.35);
    ctx.lineWidth = 2;
    ctx.setLineDash([18, 16]);
    ctx.strokeRect(24, 24, WORLD - 48, WORLD - 48);
    ctx.restore();
  }

  drawTree(ctx, t) {
    const T = this.stage.terrain;
    const s = t.s;
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath(); ctx.ellipse(6 * s, 3 * s, 30 * s, 11 * s, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#4a3320';
    ctx.fillRect(-4 * s, -22 * s, 8 * s, 24 * s);
    const sway = Math.sin(performance.now() / 1400 + t.sway) * 3 * s;
    const col = T.foliage[t.kind % 3];
    const blobs = [[-14, -34, 17], [10, -38, 19], [0, -50, 21], [-4, -26, 14]];
    for (const [bx, by, br] of blobs) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(bx * s + sway, (by * s) - br * s * 0.2, br * s, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = hexA('#ffffff', 0.13);
    ctx.beginPath();
    ctx.arc(-6 * s + sway, -54 * s, 12 * s, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  drawPond(ctx, po, T) {
    const time = performance.now() / 1000;
    ctx.save();
    ctx.translate(po.x, po.y);
    ctx.rotate(po.rot);
    const pts = [];
    for (let i = 0; i < po.blob.length; i++) {
      const a = i / po.blob.length * TAU;
      const r = po.blob[i];
      pts.push([Math.cos(a) * po.rx * r, Math.sin(a) * po.ry * r]);
    }
    const blobPath = () => {
      ctx.beginPath();
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      let m = mid(pts[pts.length - 1], pts[0]);
      ctx.moveTo(m[0], m[1]);
      for (let i = 0; i < pts.length; i++) {
        const next = mid(pts[i], pts[(i + 1) % pts.length]);
        ctx.quadraticCurveTo(pts[i][0], pts[i][1], next[0], next[1]);
      }
      ctx.closePath();
    };
    // 둑
    blobPath();
    ctx.fillStyle = hexA(po.lava ? '#7f1d1d' : T.waterEdge, 0.42);
    ctx.fill();
    // 물
    ctx.save();
    ctx.scale(0.94, 0.94);
    blobPath();
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, po.rx);
    g.addColorStop(0, hexA(po.lava ? '#fdba74' : T.water, 0.95));
    g.addColorStop(0.6, hexA(po.lava ? T.water : T.waterDeep, 0.92));
    g.addColorStop(1, hexA(T.waterDeep, 0.85));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    // 물결
    ctx.strokeStyle = hexA('#ffffff', po.lava ? 0.22 : 0.30);
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) {
      const ph = (time * 0.5 + i * 0.33 + po.rot) % 1;
      ctx.globalAlpha = (1 - ph) * 0.6;
      ctx.beginPath();
      ctx.ellipse(0, 0, po.rx * (0.35 + ph * 0.5), po.ry * (0.35 + ph * 0.5), 0, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    if (po.lava) {
      for (let i = 0; i < 4; i++) {
        const bx = Math.sin(time * 0.7 + i * 2.1) * po.rx * 0.5;
        const by = Math.cos(time * 0.9 + i * 1.3) * po.ry * 0.5;
        ctx.fillStyle = 'rgba(253,186,116,0.7)';
        ctx.beginPath(); ctx.arc(bx, by, 2 + Math.sin(time * 3 + i) * 1.2, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  groundPattern(stage) {
    if (!this._groundPat) this._groundPat = {};
    if (this._groundPat[stage.key]) return this._groundPat[stage.key];
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = stage.ground[0];
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 34; i++) {
      const px = Math.random() * 256, py = Math.random() * 256, r = 18 + Math.random() * 44;
      for (let ox = -256; ox <= 256; ox += 256) {
        for (let oy = -256; oy <= 256; oy += 256) {
          const g2 = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, r);
          g2.addColorStop(0, stage.ground[1]);
          g2.addColorStop(1, 'rgba(0,0,0,0)');
          x.globalAlpha = 0.3;
          x.fillStyle = g2;
          x.beginPath(); x.arc(px + ox, py + oy, r, 0, TAU); x.fill();
        }
      }
    }
    x.globalAlpha = 0.14;
    for (let i = 0; i < 300; i++) {
      x.fillStyle = Math.random() < 0.55 ? '#000' : stage.accent;
      const s = Math.random() < 0.9 ? 2 : 3;
      x.fillRect(Math.random() * 256, Math.random() * 256, s, s);
    }
    x.globalAlpha = 1;
    const pat = this.ctx.createPattern(c, 'repeat');
    this._groundPat[stage.key] = pat;
    return pat;
  }

  drawSpriteEntity(ctx, x, y, visibleH, id, shiny, facing, optsNow = {}) {
    let img = getSprite(id, shiny);
    if (!img && shiny) { loadSprite(id, true); img = getSprite(id, false); }
    const bob = optsNow.bob || 0;
    const flash = optsNow.flash || 0;
    const alpha = optsNow.alpha == null ? 1 : optsNow.alpha;
    const rot = optsNow.rot || 0;
    const sxx = optsNow.sx == null ? 1 : optsNow.sx;
    const syy = optsNow.sy == null ? 1 : optsNow.sy;
    const feet = optsNow.feet == null ? y + visibleH * 0.18 : optsNow.feet;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (optsNow.shadow !== false) {
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.beginPath();
      ctx.ellipse(x, feet + 2, visibleH * 0.30 * sxx, visibleH * 0.10, 0, 0, TAU);
      ctx.fill();
    }
    ctx.translate(x, feet + Math.sin(bob) * visibleH * 0.02 - (optsNow.yoff || 0));
    if (facing < 0) ctx.scale(-1, 1);
    if (rot) ctx.rotate(rot);
    ctx.scale(sxx, syy);
    if (img) {
      const b = spriteBounds(img);
      const sc = visibleH / b.h;
      const dw = img.width * sc, dh = img.height * sc;
      const dx = -(b.x + b.w / 2) * sc;
      const dy = -(b.y + b.h) * sc;
      if (flash > 0) {
        try {
          const wimg = getWhiteSprite(img);
          ctx.save();
          ctx.globalAlpha = alpha * Math.min(0.85, flash * 3.6);
          ctx.drawImage(wimg, dx, dy, dw, dh);
          ctx.restore();
        } catch (e) { /* noop */ }
      }
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      fallbackDraw(ctx, id, 0, -visibleH * 0.5, visibleH, optsNow.color, shiny);
    }
    ctx.restore();
  }

  drawPlayer(ctx) {
    const p = this.player;
    const spec = this.special;
    const visH = (94 + this.evoStage * 9) * (this.view ? this.view.scale : 1);
    const id = this.currentStage();
    const a = p.anim;
    // 플레이어 발치 글로우
    ctx.save();
    const gg = ctx.createRadialGradient(p.x, p.y + 22, 0, p.x, p.y + 22, 70);
    gg.addColorStop(0, hexA(this.stage.accent, 0.28));
    gg.addColorStop(1, hexA(this.stage.accent, 0));
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 22, 70, 32, 0, 0, TAU); ctx.fill();
    ctx.restore();
    // 위치 표시 링
    ctx.save();
    ctx.globalAlpha = 0.42 + Math.sin(p.t * 4) * 0.12;
    ctx.strokeStyle = 'rgba(191,219,254,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 26, 34, 13, 0, 0, TAU); ctx.stroke();
    ctx.restore();
    // 무적 / 가속 오라
    if (p.guardT > 0) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(p.t * 10) * 0.15;
      ctx.strokeStyle = '#7dd3fc';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(p.x, p.y - 30, 46, 0, TAU); ctx.stroke();
      ctx.globalAlpha *= 0.4;
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath(); ctx.arc(p.x, p.y - 30, 46, 0, TAU); ctx.fill();
      ctx.restore();
    }
    if (p.hasteT > 0) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) {
        const yy = p.y - 10 - i * 14 - ((p.t * 90 + i * 20) % 42);
        ctx.beginPath(); ctx.moveTo(p.x - 22, yy); ctx.lineTo(p.x - 8, yy); ctx.stroke();
      }
      ctx.restore();
    }
    if (p.shiny) {
      const t = performance.now() / 300;
      for (let i = 0; i < 3; i++) {
        const ang = t + i * TAU / 3;
        const px = p.x + Math.cos(ang) * 28, py = p.y + Math.sin(ang) * 22 - 10;
        ctx.save();
        ctx.fillStyle = '#fde68a';
        ctx.globalAlpha = 0.7 + Math.sin(t * 3 + i) * 0.3;
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          const a2 = k * Math.PI / 2;
          ctx.lineTo(px + Math.cos(a2) * 5, py + Math.sin(a2) * 5);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
    if (p.inv > 0 && Math.floor(performance.now() / 60) % 2 === 0) ctx.globalAlpha = 0.55;
    /* 스쿼시 & 스트레치 + 걷기 바운스 + 공격 리코일 */
    const walkPhase = Math.sin(a.walk);
    const bounce = p.moving ? Math.abs(walkPhase) * 5 : Math.sin(p.t * 2.2) * 1.6;
    const atk = a.atk;
    const hurt = a.hurt;
    const land = a.land;
    const squash = Math.max(0, atk * 0.16 - 0.05) + land * 0.18 + Math.sin(p.t * 2.2) * 0.015;
    const sx = 1 + squash - hurt * 0.12;
    const sy = 1 - squash * 0.85 + (p.moving ? Math.abs(walkPhase) * 0.035 : 0) + hurt * 0.1;
    const rot = a.tilt + (p.moving ? walkPhase * 0.03 : 0) - atk * p.face * 0.05;
    const lunge = atk > 0 ? Math.sin(atk * Math.PI) * 7 * p.face : 0;

    this.drawSpriteEntity(ctx, p.x + lunge, p.y, visH * p.scale, id, p.shiny, p.face, {
      bob: p.t * 9, flash: p.hitFlash > 0 ? 1 : 0, color: '#93c5fd',
      feet: p.y + 26 - bounce, rot, sx, sy, yoff: 0
    });
    ctx.globalAlpha = 1;

    if (spec) {
      const aura = spec.aura || '#fde68a';
      const tm = performance.now() / 1000;
      ctx.save();
      const gg2 = ctx.createRadialGradient(p.x, p.y - visH * p.scale * 0.4, 6, p.x, p.y - visH * p.scale * 0.4, visH * p.scale * 0.95);
      gg2.addColorStop(0, hexA(aura, 0.35 + Math.sin(tm * 3) * 0.1));
      gg2.addColorStop(1, hexA(aura, 0));
      ctx.fillStyle = gg2;
      ctx.beginPath(); ctx.ellipse(p.x, p.y - visH * p.scale * 0.4, visH * p.scale * 0.8, visH * p.scale * 0.95, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = aura;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(p.x, p.y + 22, 52, 20, 0, 0, TAU); ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const a = tm * 1.4 + i * TAU / 5;
        const px = p.x + Math.cos(a) * 46, py = p.y + Math.sin(a) * 30 - visH * p.scale * 0.5;
        ctx.fillStyle = aura;
        ctx.beginPath();
        for (let k = 0; k < 4; k++) { const aa = k * Math.PI / 2; ctx.lineTo(px + Math.cos(aa) * 5, py + Math.sin(aa) * 5); }
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      if (spec.kind === 'gmax') {
        ctx.save();
        ctx.globalAlpha = 0.25 + Math.sin(tm * 2) * 0.08;
        ctx.fillStyle = aura;
        ctx.beginPath(); ctx.ellipse(p.x, p.y + 24, 70, 26, 0, 0, TAU); ctx.fill();
        ctx.restore();
      }
    }
    if (this.evoStage > 0) {
      ctx.save();
      ctx.globalAlpha = 0.35 + Math.sin(p.t * 3) * 0.12;
      ctx.strokeStyle = this.evoStage > 1 ? '#f472b6' : '#fde68a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 18, 34, 12, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawEnemy(ctx, e) {
    const visH = e.def.r * 3.3 * (e.elite ? 1.25 : 1) * (e.boss ? 1.05 : 1);
    const hop = e.flying ? Math.sin(e.bob * 1.5 + e.phase) * 7 : Math.abs(Math.sin(e.hop)) * 4;
    const stretch = e.flying ? 1 + Math.sin(e.bob * 1.5) * 0.04 : 1 + Math.abs(Math.sin(e.hop)) * 0.05;
    const sq = e.squash;
    this.drawSpriteEntity(ctx, e.x, e.y, visH, e.def.id, e.shiny, e.facing, {
      bob: e.bob, flash: e.flash, color: e.typeColor || '#f87171',
      feet: e.y + e.r * 0.55 - hop,
      rot: e.tilt, sx: 1 + sq * 0.14, sy: 1 - sq * 0.14,
      yoff: 0
    });
    void stretch;
    if (e.shiny) {
      ctx.save();
      ctx.globalAlpha = 0.8;
      const t = performance.now() / 400 + e.phase;
      for (let i = 0; i < 2; i++) {
        const a = t + i * Math.PI;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(e.x + Math.cos(a) * e.r * 0.9, e.y - e.r * 0.6 + Math.sin(a) * e.r * 0.5, 3, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
    if (e.elite) {
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 300) * 0.15;
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(e.x, e.y + e.r * 0.6, e.r * 1.1, e.r * 0.4, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    if (e.boss) {
      const w = 84, h = 8;
      const x = e.x - w / 2, y = e.y - visH - e.r * 0.55 - 10;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
      ctx.fillStyle = e.final ? '#f472b6' : '#f87171';
      ctx.fillRect(x, y, w * Math.max(0, e.hp / e.maxHp), h);
    }
    if (e.freeze > 0) {
      ctx.save();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = '#7dd3fc';
      ctx.beginPath(); ctx.arc(e.x, e.y, e.r * 1.05, 0, TAU); ctx.fill();
      ctx.restore();
    }
    if (e.legend) {
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 260 + e.phase) * 0.2;
      ctx.strokeStyle = '#c4b5fd';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(e.x, e.y - e.r * 0.4, e.r * 1.4, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    /* 돌진 예고선 */
    if (e.tele > 0 || e.charging > 0) {
      const a = e.chargeAng || 0;
      const len = 460;
      ctx.save();
      ctx.globalAlpha = e.charging > 0 ? 0.6 : 0.3 + Math.sin(performance.now() / 90) * 0.18;
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = e.boss ? 8 : 5;
      ctx.setLineDash([16, 11]);
      ctx.beginPath(); ctx.moveTo(e.x, e.y); ctx.lineTo(e.x + Math.cos(a) * len, e.y + Math.sin(a) * len); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha *= 0.5;
      ctx.fillStyle = '#fb7185';
      ctx.beginPath(); ctx.arc(e.x + Math.cos(a) * len, e.y + Math.sin(a) * len, 10, 0, TAU); ctx.fill();
      ctx.restore();
    }
    /* 보호막 */
    if (e.shield > 0) {
      ctx.save();
      ctx.globalAlpha = 0.25 + e.shield * 0.45;
      ctx.strokeStyle = '#93c5fd';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(e.x, e.y - e.r * 0.15, e.r * 1.3, 0, TAU); ctx.stroke();
      ctx.globalAlpha *= 0.4;
      ctx.fillStyle = '#bfdbfe';
      ctx.beginPath(); ctx.arc(e.x, e.y - e.r * 0.15, e.r * 1.3, 0, TAU); ctx.fill();
      ctx.restore();
    }
    /* 지원/버프 */
    if (e.ai === 'healer') {
      ctx.save();
      ctx.globalAlpha = 0.4 + Math.sin(performance.now() / 300 + e.phase) * 0.15;
      ctx.strokeStyle = '#86efac'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(e.x, e.y - e.r * 0.2, e.r * 1.6, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    if (e.buffT > 0) {
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.moveTo(e.x, e.y - e.r * 2.1);
      ctx.lineTo(e.x - 7, e.y - e.r * 1.8);
      ctx.lineTo(e.x + 7, e.y - e.r * 1.8);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    /* 보스 빔 */
    if (e.beamWarn > 0 || e.beamLive > 0) {
      const a = e.beamAng || 0;
      ctx.save();
      ctx.translate(e.x, e.y);
      ctx.rotate(a);
      if (e.beamWarn > 0) {
        ctx.globalAlpha = 0.25 + Math.sin(performance.now() / 70) * 0.15;
        ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 4; ctx.setLineDash([18, 12]);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(900, 0); ctx.stroke();
        ctx.setLineDash([]);
      } else {
        ctx.globalAlpha = 0.85;
        const g = ctx.createLinearGradient(0, 0, 900, 0);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(0.4, 'rgba(244,114,182,0.85)');
        g.addColorStop(1, 'rgba(244,114,182,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, -46, 900, 92);
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.fillRect(0, -12, 900, 24);
      }
      ctx.restore();
    }
  }

  drawProps(ctx, sx, sy, vw, vh) {
    const t = performance.now() / 1000;
    for (const pr of this.props) {
      if (pr.x < sx - 60 || pr.x > sx + vw + 60 || pr.y < sy - 80 || pr.y > sy + vh + 60) continue;
      const sh = pr.shake ? Math.sin(pr.shake * 90) * 3 : 0;
      ctx.save();
      ctx.translate(pr.x + sh, pr.y);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath(); ctx.ellipse(2, 4, pr.r * 1.05, pr.r * 0.36, 0, 0, TAU); ctx.fill();
      if (pr.type === 'crate') {
        const s = pr.r;
        ctx.fillStyle = pr.flash > 0 ? '#fff' : '#8a5a2b';
        ctx.fillRect(-s * 0.8, -s * 1.5, s * 1.6, s * 1.5);
        ctx.strokeStyle = pr.flash > 0 ? '#fff' : '#5c3a19';
        ctx.lineWidth = 3;
        ctx.strokeRect(-s * 0.8, -s * 1.5, s * 1.6, s * 1.5);
        ctx.beginPath();
        ctx.moveTo(-s * 0.8, -s * 1.5); ctx.lineTo(s * 0.8, 0);
        ctx.moveTo(s * 0.8, -s * 1.5); ctx.lineTo(-s * 0.8, 0);
        ctx.stroke();
        ctx.fillStyle = pr.flash > 0 ? '#fff' : '#b8860b';
        ctx.fillRect(-s * 0.8, -s * 0.85, s * 1.6, s * 0.16);
      } else if (pr.type === 'rock') {
        const s = pr.r;
        ctx.fillStyle = pr.flash > 0 ? '#fff' : '#5b5b6e';
        ctx.beginPath();
        for (let i = 0; i < 7; i++) {
          const a = i / 7 * TAU;
          ctx.lineTo(Math.cos(a) * s * (0.82 + ((pr.seed >> i) & 3) * 0.07), -s * 0.5 + Math.sin(a) * s * 0.62);
        }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = pr.flash > 0 ? '#fff' : 'rgba(165,180,252,0.35)';
        ctx.beginPath(); ctx.ellipse(-s * 0.25, -s * 0.62, s * 0.34, s * 0.2, -0.4, 0, TAU); ctx.fill();
      } else {
        const s = pr.r;
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = hexA('#c4b5fd', 0.22);
        ctx.beginPath(); ctx.ellipse(0, 2, s, s * 0.3, 0, 0, TAU); ctx.fill();
        const pulse = 0.75 + Math.sin(t * 2 + pr.bob) * 0.12;
        ctx.fillStyle = pr.flash > 0 ? '#fff' : hexA('#a78bfa', pulse);
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, 0);
        ctx.lineTo(0, -s * 1.9);
        ctx.lineTo(s * 0.5, 0);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath(); ctx.arc(0, -s * 1.2, 2, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  drawItemGlyph(ctx, kind, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = Math.max(1.4, r * 0.2);
    switch (kind) {
      case 'berry': {
        ctx.fillStyle = '#fecdd3';
        ctx.beginPath(); ctx.arc(-r * 0.32, r * 0.1, r * 0.52, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(r * 0.32, r * 0.1, r * 0.52, 0, TAU); ctx.fill();
        ctx.fillStyle = '#dc2626';
        ctx.beginPath(); ctx.arc(-r * 0.3, r * 0.06, r * 0.36, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(r * 0.3, r * 0.06, r * 0.36, 0, TAU); ctx.fill();
        ctx.fillStyle = '#4ade80';
        ctx.beginPath(); ctx.ellipse(0, -r * 0.62, r * 0.42, r * 0.2, -0.5, 0, TAU); ctx.fill();
        break;
      }
      case 'magnet': {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = r * 0.42;
        ctx.beginPath(); ctx.arc(0, r * 0.1, r * 0.52, Math.PI, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r * 0.52, r * 0.1); ctx.lineTo(-r * 0.52, r * 0.55); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(r * 0.52, r * 0.1); ctx.lineTo(r * 0.52, r * 0.55); ctx.stroke();
        break;
      }
      case 'coin': {
        ctx.fillStyle = '#fff7d6';
        ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, TAU); ctx.fill();
        ctx.fillStyle = '#b45309';
        ctx.font = `900 ${Math.round(r * 1.05)}px system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('₩', 0, r * 0.04);
        break;
      }
      case 'bomb': {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, r * 0.22, r * 0.6, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = r * 0.18;
        ctx.beginPath(); ctx.moveTo(r * 0.1, -r * 0.35); ctx.quadraticCurveTo(r * 0.55, -r * 0.8, r * 0.2, -r * 0.95); ctx.stroke();
        ctx.fillStyle = '#fde68a';
        ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.95, r * 0.16, 0, TAU); ctx.fill();
        break;
      }
      case 'guard': {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.72);
        ctx.lineTo(r * 0.6, -r * 0.42);
        ctx.lineTo(r * 0.6, r * 0.16);
        ctx.quadraticCurveTo(r * 0.6, r * 0.7, 0, r * 0.85);
        ctx.quadraticCurveTo(-r * 0.6, r * 0.7, -r * 0.6, r * 0.16);
        ctx.lineTo(-r * 0.6, -r * 0.42);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#0284c7';
        ctx.beginPath(); ctx.arc(0, r * 0.02, r * 0.2, 0, TAU); ctx.fill();
        break;
      }
      case 'haste': {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, r * 0.4);
        ctx.quadraticCurveTo(-r * 0.1, -r * 0.1, r * 0.2, -r * 0.9);
        ctx.quadraticCurveTo(r * 0.55, -r * 0.1, r * 0.3, r * 0.45);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(6,78,59,0.55)';
        ctx.lineWidth = r * 0.1;
        ctx.beginPath(); ctx.moveTo(-r * 0.2, r * 0.3); ctx.lineTo(r * 0.15, -r * 0.4); ctx.stroke();
        break;
      }
      default: { // candy
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * TAU - Math.PI / 2;
          const rr = i % 2 ? r * 0.3 : r * 0.78;
          ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
        }
        ctx.closePath(); ctx.fill();
        break;
      }
    }
    ctx.restore();
  }

  drawFieldItems(ctx, sx, sy, vw, vh) {
    const t = performance.now() / 300;
    for (const it of this.fieldItems) {
      if (it.x < sx - 40 || it.x > sx + vw + 40 || it.y < sy - 40 || it.y > sy + vh + 40) continue;
      const def = FIELD_ITEMS[it.kind];
      const y = it.y + Math.sin(t + it.bob) * 5;
      ctx.save();
      // 바닥 광채
      const g = ctx.createRadialGradient(it.x, it.y + 6, 0, it.x, it.y + 6, 26);
      g.addColorStop(0, hexA(def.color, 0.45));
      g.addColorStop(1, hexA(def.color, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(it.x, it.y + 6, 26, 12, 0, 0, TAU); ctx.fill();
      ctx.translate(it.x, y);
      ctx.shadowColor = def.color;
      ctx.shadowBlur = 14;
      ctx.fillStyle = hexA(def.color, 0.92);
      ctx.beginPath(); ctx.arc(0, -10, 13, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
      this.drawItemGlyph(ctx, it.kind, 0, -10, 9);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath(); ctx.ellipse(0, 4, 9, 3.5, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  drawOrbs(ctx) {
    const t = performance.now() / 200;
    for (const o of this.orbs) {
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = o.color;
      ctx.shadowColor = o.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      const r = o.r * (1 + Math.sin(t + o.t * 4) * 0.12);
      ctx.arc(o.x, o.y + Math.sin(t + o.t * 3) * 2, r, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  drawPickups(ctx) {
    const t = performance.now() / 300;
    for (const it of this.pickups) {
      const y = it.y + Math.sin(t + it.x) * 4;
      if (it.kind === 'chest') {
        ctx.save();
        const g = ctx.createRadialGradient(it.x, y, 0, it.x, y, 40);
        g.addColorStop(0, 'rgba(251,191,36,0.35)');
        g.addColorStop(1, 'rgba(251,191,36,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(it.x, y + 6, 40, 20, 0, 0, TAU); ctx.fill();
        ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 18;
        ctx.fillStyle = '#b45309';
        ctx.fillRect(it.x - 14, y - 10, 28, 20);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(it.x - 15, y - 13, 30, 7);
        ctx.fillRect(it.x - 3, y - 4, 6, 9);
        ctx.restore();
      } else {
        ctx.save();
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(it.x - 5, y - 3, 7, 0, TAU);
        ctx.arc(it.x + 5, y - 3, 7, 0, TAU);
        ctx.moveTo(it.x - 12, y);
        ctx.lineTo(it.x, y + 13);
        ctx.lineTo(it.x + 12, y);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  drawHazards(ctx) {
    for (const h of this.hazards) {
      const a = Math.min(0.42, h.life * 0.16);
      const g = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r);
      g.addColorStop(0, hexA(h.color, a));
      g.addColorStop(0.65, hexA(h.color, a * 0.65));
      g.addColorStop(1, hexA(h.color, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill();
      ctx.save();
      ctx.strokeStyle = hexA(h.color, 0.35);
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 7]);
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r * 0.9, 0, TAU); ctx.stroke();
      ctx.restore();
      const t = performance.now() / 500;
      for (let i = 0; i < 3; i++) {
        const ang = t + i * 2.1 + h.x * 0.01;
        const rr = h.r * (0.3 + 0.4 * ((Math.sin(t + i) + 1) / 2));
        ctx.fillStyle = hexA(h.color, 0.25);
        ctx.beginPath();
        ctx.arc(h.x + Math.cos(ang) * rr, h.y + Math.sin(ang) * rr, 4 + i, 0, TAU);
        ctx.fill();
      }
    }
  }

  drawProjectiles(ctx) {
    for (const b of this.projectiles) {
      ctx.save();
      if (b.kind === 'flame') {
        ctx.globalCompositeOperation = 'lighter';
        const rr = b.r * (1.25 + Math.sin(performance.now() / 40 + b.x) * 0.1);
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(b.vy, b.vx));
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rr * 1.5);
        g.addColorStop(0, 'rgba(255,251,235,0.78)');
        g.addColorStop(0.2, hexA(b.color, 0.82));
        g.addColorStop(0.55, 'rgba(249,115,22,0.42)');
        g.addColorStop(1, 'rgba(239,68,68,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(0, 0, rr * 1.65, rr * 0.85, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,240,200,0.65)';
        ctx.beginPath();
        ctx.ellipse(-rr * 1.1, 0, rr * 0.9, rr * 0.4, 0, 0, TAU);
        ctx.fill();
      } else if (b.kind === 'shadow' || b.kind === 'aura') {
        if (b.trail && b.trail.length > 1) {
          ctx.strokeStyle = hexA(b.color, 0.35);
          ctx.lineWidth = b.r * 1.2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(b.trail[0][0], b.trail[0][1]);
          for (let i = 1; i < b.trail.length; i++) ctx.lineTo(b.trail[i][0], b.trail[i][1]);
          ctx.stroke();
        }
        ctx.shadowColor = b.color; ctx.shadowBlur = 16;
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.arc(b.x - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.35, 0, TAU); ctx.fill();
      } else if (b.kind === 'water') {
        ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 10;
        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r * 1.5, b.r, Math.atan2(b.vy, b.vx), 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.65)';
        ctx.beginPath(); ctx.ellipse(b.x - b.r * 0.4, b.y - b.r * 0.2, b.r * 0.5, b.r * 0.25, 0, 0, TAU); ctx.fill();
      } else if (b.kind === 'ice') {
        ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(125,211,252,0.7)';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * TAU;
          ctx.lineTo(b.x + Math.cos(a) * b.r, b.y + Math.sin(a) * b.r);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else if (b.kind === 'bone') {
        ctx.translate(b.x, b.y);
        ctx.rotate(b.spin || 0);
        ctx.fillStyle = '#f5f0dc';
        ctx.strokeStyle = '#a8a29e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-14, -3); ctx.lineTo(12, -3); ctx.lineTo(12, 3); ctx.lineTo(-14, 3); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.arc(-14, -5, 4, 0, TAU); ctx.arc(-14, 5, 4, 0, TAU);
        ctx.arc(12, -5, 4, 0, TAU); ctx.arc(12, 5, 4, 0, TAU);
        ctx.fill(); ctx.stroke();
      } else if (b.kind === 'fairy') {
        if (b.trail && b.trail.length > 1) {
          ctx.strokeStyle = 'rgba(249,168,212,0.4)';
          ctx.lineWidth = b.r;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(b.trail[0][0], b.trail[0][1]);
          for (let i = 1; i < b.trail.length; i++) ctx.lineTo(b.trail[i][0], b.trail[i][1]);
          ctx.stroke();
        }
        ctx.shadowColor = '#f9a8d4'; ctx.shadowBlur = 18;
        ctx.fillStyle = '#fbcfe8';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = i / 5 * TAU - Math.PI / 2;
          const rr = i % 2 ? b.r * 0.35 : b.r * 0.95;
          ctx.lineTo(b.x + Math.cos(a) * rr, b.y + Math.sin(a) * rr);
        }
        ctx.closePath(); ctx.fill();
      } else if (b.kind === 'mirror') {
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(b.vy, b.vx));
        ctx.shadowColor = '#e2e8f0'; ctx.shadowBlur = 14;
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(-10, -8); ctx.lineTo(-4, 0); ctx.lineTo(-10, 8); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#93c5fd';
        ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -4); ctx.lineTo(-6, 4); ctx.closePath(); ctx.fill();
      } else {
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
  }

  drawEBullets(ctx) {
    for (const b of this.ebullets) {
      ctx.save();
      ctx.shadowColor = b.color; ctx.shadowBlur = 10;
      ctx.fillStyle = b.color;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath(); ctx.arc(b.x - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.35, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  drawEffects(ctx) {
    for (const r of this.rings) {
      if (r.delay > 0) continue;
      const a = Math.max(0, r.life / r.max);
      ctx.save();
      ctx.globalAlpha = a * 0.85;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.wide ? r.wide * 0.3 * a : 3 + 4 * a;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
      if (r.kind === 'meteor' && r.done) {
        ctx.globalAlpha = a * 0.3;
        ctx.fillStyle = r.color;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r1 * 0.8, 0, TAU); ctx.fill();
      }
      if (r.kind === 'blast' || r.kind === 'quake') {
        ctx.globalAlpha = a * 0.25;
        ctx.fillStyle = r.color;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    for (const b of this.bolts) {
      const a = b.life / b.max;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = b.color || '#fef08a';
      ctx.shadowColor = b.color || '#fbbf24'; ctx.shadowBlur = 14;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.pts[0][0], b.pts[0][1]);
      for (let i = 1; i < b.pts.length; i++) ctx.lineTo(b.pts[i][0], b.pts[i][1]);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }
    for (const b of this.beams) {
      const a = b.life / b.max;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);
      const g = ctx.createLinearGradient(0, 0, b.len, 0);
      g.addColorStop(0, 'rgba(255,255,255,0.95)');
      g.addColorStop(0.35, 'rgba(253,230,138,0.9)');
      g.addColorStop(1, 'rgba(251,146,60,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, -b.width / 2, b.len, b.width);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(0, -b.width * 0.12, b.len, b.width * 0.24);
      ctx.restore();
    }
    for (const s of this.slashes) {
      if (s.delay > 0) continue;
      const a = s.life / s.max;
      ctx.save();
      ctx.globalAlpha = a * 0.95;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.angle);
      ctx.strokeStyle = '#c7d2fe';
      ctx.shadowColor = '#818cf8'; ctx.shadowBlur = 16;
      ctx.lineWidth = 12 * a;
      ctx.beginPath();
      ctx.arc(0, 0, s.range * 0.8, -s.arc / 2, s.arc / 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 3 * a;
      ctx.stroke();
      ctx.restore();
    }
    for (const p of this.particles) {
      const a = p.life / p.max;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  drawTexts(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      const a = Math.min(1, t.life / t.max * 1.6);
      ctx.globalAlpha = a;
      const size = 15 * t.scale;
      ctx.font = `900 ${size}px system-ui, -apple-system, sans-serif`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.75)';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.restore();
  }

  drawVignette(ctx) {
    const W = this.W, H = this.H;
    if (!this._vig || this._vigW !== W || this._vigH !== H) {
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.34, W / 2, H / 2, Math.max(W, H) * 0.78);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.36)');
      this._vig = g; this._vigW = W; this._vigH = H;
    }
    ctx.fillStyle = this._vig;
    ctx.fillRect(0, 0, W, H);
    const p = this.player;
    if (p && p.hp / p.maxHp < 0.3) {
      ctx.save();
      ctx.globalAlpha = 0.18 + Math.sin(performance.now() / 250) * 0.08;
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (this.announcement) {
      const an = this.announcement;
      const a = Math.min(1, an.life / 0.5);
      const y = H * 0.17;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.font = '900 25px system-ui, -apple-system, sans-serif';
      const tw = ctx.measureText(an.text).width;
      const bw = Math.min(W - 40, tw + 60), bh = an.sub ? 68 : 46;
      const bx = W / 2 - bw / 2, by = y - 6;
      ctx.beginPath();
      const r = 16;
      ctx.moveTo(bx + r, by);
      ctx.lineTo(bx + bw - r, by); ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r);
      ctx.lineTo(bx + bw, by + bh - r); ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh);
      ctx.lineTo(bx + r, by + bh); ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r);
      ctx.lineTo(bx, by + r); ctx.quadraticCurveTo(bx, by, bx + r, by);
      ctx.closePath();
      ctx.fillStyle = 'rgba(8,13,24,0.80)';
      ctx.fill();
      ctx.strokeStyle = an.color;
      ctx.globalAlpha = a * 0.5;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = a;
      ctx.fillStyle = an.color;
      ctx.shadowColor = an.color; ctx.shadowBlur = 16;
      ctx.fillText(an.text, W / 2, by + 31);
      if (an.sub) {
        ctx.shadowBlur = 0;
        ctx.font = '600 13.5px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText(an.sub, W / 2, by + 53);
      }
      ctx.restore();
    }
  }

  drawFlash(ctx) {
    if (this.flash <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = Math.min(0.5, this.flash);
    ctx.fillStyle = this.flashColor;
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.restore();
  }

  drawOrbits(ctx) {
    const p = this.player;
    for (const w of p.weaponList) {
      if (w.id !== 'leaf') continue;
      const st = this.weaponStats(w);
      const blades = w.awake ? st.count * 2 : st.count;
      for (let i = 0; i < blades; i++) {
        const a = w.angle + (i / blades) * TAU;
        const bx = p.x + Math.cos(a) * st.radius;
        const by = p.y + Math.sin(a) * st.radius * 0.78;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(a + Math.PI / 2 + Math.sin(p.t * 8 + i) * 0.12);
        if (w.awake) { ctx.shadowColor = '#bbf7d0'; ctx.shadowBlur = 16; }
        else { ctx.shadowColor = '#4ade80'; ctx.shadowBlur = 10; }
        ctx.fillStyle = i % 2 ? '#86efac' : '#4ade80';
        ctx.beginPath();
        ctx.ellipse(0, 0, w.awake ? 8 : 6, w.awake ? 18 : 15, 0, 0, TAU);
        ctx.fill();
        ctx.strokeStyle = 'rgba(240,253,244,0.85)';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(0, -14); ctx.lineTo(0, 14);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  /* ---------- 미니맵 ---------- */
  miniBackground(S, full) {
    if (!this._miniBg) this._miniBg = {};
    const key = S + (full ? 'f' : 'h') + this.stage.key;
    if (this._miniBg[key]) return this._miniBg[key];
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const c = document.createElement('canvas');
    c.width = Math.round(S * dpr); c.height = Math.round(S * dpr);
    const x = c.getContext('2d');
    x.scale(dpr, dpr);
    const k = S / WORLD;
    const g = x.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, this.stage.ground[0]);
    g.addColorStop(1, this.stage.ground[1]);
    x.globalAlpha = 0.8;
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
    x.globalAlpha = 1;
    for (const po of this.deco.ponds) {
      x.beginPath();
      x.ellipse(po.x * k, po.y * k, Math.max(1.2, po.rx * k), Math.max(1, po.ry * k), po.rot, 0, TAU);
      x.fillStyle = hexA(po.lava ? '#f97316' : this.stage.terrain.waterDeep, 0.6);
      x.fill();
    }
    if (full) {
      x.globalAlpha = 0.4;
      x.strokeStyle = this.stage.terrain.path;
      x.lineWidth = 3;
      for (const p of this.deco.paths) {
        x.beginPath();
        x.moveTo(p.pts[0][0] * k, p.pts[0][1] * k);
        for (let i = 1; i < p.pts.length; i++) x.lineTo(p.pts[i][0] * k, p.pts[i][1] * k);
        x.stroke();
      }
      x.globalAlpha = 1;
    }
    this._miniBg[key] = c;
    if (Object.keys(this._miniBg).length > 8) {
      for (const kk of Object.keys(this._miniBg)) if (kk !== key) delete this._miniBg[kk];
    }
    return c;
  }

  drawMinimap(ctx, x, y, S, opts = {}) {
    if (!this.player) return;
    const k = S / WORLD;
    const full = !!opts.full;
    ctx.save();
    rrect(ctx, x, y, S, S, full ? 16 : 12);
    ctx.fillStyle = 'rgba(6,10,20,0.72)';
    ctx.fill();
    ctx.save();
    rrect(ctx, x, y, S, S, full ? 16 : 12);
    ctx.clip();
    ctx.drawImage(this.miniBackground(S, full), x, y, S, S);
    ctx.globalAlpha = 1;
    // 파괴 오브젝트
    for (const pr of this.props) {
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + pr.x * k - 0.7, y + pr.y * k - 0.7, 1.6, 1.6);
    }
    // 적
    let n = 0;
    for (const e of this.enemies) {
      if (e.dead) continue;
      if (e.boss) {
        const pulse = 1 + Math.sin(performance.now() / 200) * 0.35;
        ctx.fillStyle = e.final ? '#f472b6' : '#ef4444';
        ctx.beginPath(); ctx.arc(x + e.x * k, y + e.y * k, (full ? 4.3 : 3.2) * pulse, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(x + e.x * k, y + e.y * k, (full ? 7 : 5.5) * pulse, 0, TAU); ctx.stroke();
      } else if (e.legend) {
        ctx.fillStyle = '#c4b5fd';
        ctx.beginPath(); ctx.arc(x + e.x * k, y + e.y * k, full ? 3.6 : 2.6, 0, TAU); ctx.fill();
      } else if (n++ < 160) {
        ctx.fillStyle = e.elite ? '#fbbf24' : 'rgba(248,113,113,0.85)';
        const rr = e.elite ? (full ? 2.4 : 1.8) : (full ? 1.6 : 1.2);
        ctx.fillRect(x + e.x * k - rr / 2, y + e.y * k - rr / 2, rr, rr);
      }
    }
    // 보물상자
    for (const it of this.pickups) {
      if (it.kind !== 'chest') continue;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(x + it.x * k, y + it.y * k, full ? 3.2 : 2.4, 0, TAU); ctx.fill();
    }
    // 필드 아이템
    for (const it of this.fieldItems) {
      ctx.fillStyle = FIELD_ITEMS[it.kind].color;
      ctx.beginPath(); ctx.arc(x + it.x * k, y + it.y * k, full ? 2.6 : 1.9, 0, TAU); ctx.fill();
    }
    // 플레이어
    const px = x + this.player.x * k, py = y + this.player.y * k;
    const pulse = 0.6 + Math.sin(performance.now() / 260) * 0.25;
    ctx.strokeStyle = hexA('#93c5fd', 0.85);
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(px, py, (full ? 9 : 6) * (1 + pulse * 0.18), 0, TAU); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(this.player.face > 0 ? 0 : Math.PI);
    ctx.beginPath();
    ctx.moveTo(4.5, 0); ctx.lineTo(-3.2, 3.2); ctx.lineTo(-3.2, -3.2);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.restore();
    // 테두리
    rrect(ctx, x, y, S, S, full ? 16 : 12);
    ctx.strokeStyle = full ? 'rgba(165,180,252,0.55)' : 'rgba(255,255,255,0.28)';
    ctx.lineWidth = full ? 2 : 1.5;
    ctx.stroke();
    if (!full) {
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = 'rgba(226,232,240,0.9)';
      ctx.font = '800 9px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('MAP', x + 7, y + 12);
    }
    ctx.restore();
  }

  drawMinimapTo(canvas, opts = {}) {
    if (!canvas) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = canvas.clientWidth || 320;
    const h = canvas.clientHeight || 320;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const S = Math.min(w, h);
    this.drawMinimap(ctx, (w - S) / 2, (h - S) / 2, S, { full: true });
  }

  drawHUDCanvas(ctx) {
    const j = this.joy;
    if (!j || !j.active) return;
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(j.ox, j.oy, 62, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(j.ox + j.dx * 46, j.oy + j.dy * 46, 26, 0, TAU); ctx.fill();
    ctx.restore();
  }
}
Game.uid = 0;

function c_sig(char, evoStage) {
  return char.sigName + (evoStage > 1 ? ' · 각성' : '');
}
