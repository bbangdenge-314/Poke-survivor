/* ============================================================
   POKE SURVIVOR — 게임 엔진
   ============================================================ */
import { WEAPONS, PASSIVES, CHARACTERS, CHAR_BY_KEY, ENEMIES, STAGES, DEX, TYPE_COLORS, BRANCH_NAMES } from './data.js?v=10';
import { getSprite, spriteBounds, fallbackDraw, playCry, loadSprite } from './sprites.js?v=10';
import { SFX } from './audio.js?v=10';
import { metaMods, markCaught, markSeen } from './save.js?v=10';

const TAU = Math.PI * 2;
const WORLD = 3000;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[(Math.random() * arr.length) | 0];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const dist2 = (ax, ay, bx, by) => { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy; };
function hash2(x, y) {
  let h = x * 374761393 + y * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967296;
}

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
    this.resize();
    addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.dpr = dpr;
    this.W = this.cv.clientWidth || innerWidth;
    this.H = this.cv.clientHeight || innerHeight;
    this.cv.width = Math.round(this.W * dpr);
    this.cv.height = Math.round(this.H * dpr);
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
    this.shiny = !!opts.shiny;
    this.autoPick = !!opts.auto;
    this.time = 0;
    this.runTimeLimit = stage.duration;
    this.paused = false;
    this.state = 'run';
    this.uiQueue = [];
    this.kills = 0;
    this.runCoins = 0;
    this.runDust = 0;
    this.bossesKilled = 0;
    this.legendsKilled = 0;
    this.shiniesKilled = 0;
    this.revives = meta.revive;
    this.won = false;
    this.seenIds = new Set();
    this.cam = { x: 0, y: 0, shake: 0 };
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

    this.enemies = [];
    this.projectiles = [];
    this.ebullets = [];
    this.orbs = [];
    this.pickups = [];
    this.particles = [];
    this.texts = [];
    this.rings = [];
    this.bolts = [];
    this.beams = [];
    this.slashes = [];
    this.hazards = [];
    this.floats = [];

    const hp = (char.hp + meta.hp) * (char.sig === 'thickfat' ? 1.25 : 1);
    this.player = {
      x: WORLD / 2, y: WORLD / 2, r: 20, hp, maxHp: hp,
      baseSpeed: char.speed, speed: char.speed,
      level: 1, xp: 0, xpNext: this.xpNeeded(1),
      face: 1, vx: 0, vy: 0, moving: false, inv: 0, hitFlash: 0,
      t: 0, weaponList: [], passives: {}, scale: 1, regenAcc: 0,
      critChance: 0.05, critMul: 1.6, armor: 0, magnet: 95,
      xpMul: 1, coinMul: 1, dmgMul: 1, cdMul: 1, regen: 0,
      sig: char.sig, shiny: this.shiny
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
    this.cam.x = this.player.x - this.W / 2;
    this.cam.y = this.player.y - this.H / 2;
    this.announce('모험 시작!', '이동만 하면 자동 공격 · 레벨업으로 기술을 고르세요', '#93c5fd');
    if (this.hooks.onRunStart) this.hooks.onRunStart(this);
    return this;
  }

  xpNeeded(level) {
    return Math.round(5 + level * 4 + Math.pow(level, 1.95) * 1.1);
  }

  /* ================= 스탯 재계산 ================= */
  recalc(initial = false) {
    const p = this.player, s = p.sig, pv = p.passives;
    const lv = k => pv[k] || 0;
    let dmg = this.base.dmg;
    dmg *= 1 + 0.12 * lv('power');
    if (s === 'blaze') dmg *= 1.25;
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
    p.magnet = 95 * (1 + 0.25 * lv('magnet')) * this.meta.magnet;
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
    this.player.weaponList.push({ id, lv: lv || 1, cd: 0.25, angle: Math.random() * TAU, state: {} });
  }

  addPassive(id) {
    const cur = this.player.passives[id] || 0;
    if (cur === 0 && Object.keys(this.player.passives).length >= 6) return;
    this.player.passives[id] = Math.min(PASSIVES[id].max, cur + 1);
    this.recalc();
  }

  /* ================= 업데이트 ================= */
  update(dt) {
    if (this.state !== 'run') return;
    if (this.paused) { this.updateVisuals(dt * 0.35); return; }
    const p = this.player;
    this.time += dt;
    p.t += dt;
    p.inv = Math.max(0, p.inv - dt);
    p.hitFlash = Math.max(0, p.hitFlash - dt);

    /* 이동 */
    const mv = this.moveInput || { x: 0, y: 0 };
    let mx = mv.x, my = mv.y;
    const ml = Math.hypot(mx, my);
    if (ml > 0.08) {
      const n = Math.min(1, ml);
      mx /= ml; my /= ml;
      p.x += mx * p.speed * n * dt;
      p.y += my * p.speed * n * dt;
      p.moving = true;
      if (Math.abs(mx) > 0.15) p.face = mx > 0 ? 1 : -1;
    } else p.moving = false;
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
      if (d.t <= 0) this.dashState = null;
    }

    if (p.regen > 0) {
      p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);
    }
    if (p.sig === 'wish') {
      p.wishT = (p.wishT || 0) + dt;
      if (p.wishT > 25) {
        p.wishT = 0;
        p.hp = Math.min(p.maxHp, p.hp + 12);
        this.runCoins += 8;
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
    this.updateHazards(dt);
    this.updateVisuals(dt);
    this.updateSpawns(dt);
    this.updateTimeline();

    /* 카메라 */
    const cx = clamp(p.x - this.W / 2, 0, WORLD - this.W);
    const cy = clamp(p.y - this.H / 2, 0, WORLD - this.H);
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
        if (dist2(e.x, e.y, p.x, p.y) < 62 * 62) this.damage(e, 6 + p.level * 1.6, { color: '#fde047', silent: true });
      }
    } else if (s === 'roughskin') {
      for (const e of this.enemies) {
        if (dist2(e.x, e.y, p.x, p.y) < 58 * 58) this.damage(e, 8 + p.level * 2, { color: '#fca5a5', silent: true });
      }
    } else if (s === 'baddreams') {
      for (const e of this.enemies) {
        if (dist2(e.x, e.y, p.x, p.y) < 150 * 150) this.damage(e, 7 + p.level * 2, { color: '#c084fc', silent: true });
      }
    }
  }

  /* ================= 무기 ================= */
  updateWeapons(dt) {
    const p = this.player;
    for (const w of p.weaponList) {
      const def = WEAPONS[w.id];
      const st = def.stats(w.lv);
      w.awake = w.lv >= def.max;
      if (this.time < 0.35) continue;
      if (w.id === 'leaf') { this.updateLeaf(w, st, dt); continue; }
      if (w.id === 'nightmare') { this.updateNightmare(w, st, dt); continue; }
      w.cd -= dt;
      if (w.cd > 0) continue;
      const fired = this.fireWeapon(w, st);
      if (fired) w.cd = Math.max(0.08, st.cd * p.cdMul);
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

  fireWeapon(w, st) {
    const p = this.player;
    const awake = w.awake;
    switch (w.id) {
      case 'thunder': {
        const targets = this.nearestEnemies(awake ? 6 : st.count, awake ? 1e9 : st.range);
        if (!targets.length) return false;
        for (const t0 of targets) {
          let cur = t0, dmg = st.dmg, hit = new Set([t0]);
          this.bolt(p.x, p.y, cur.x, cur.y);
          this.damage(cur, dmg, { color: '#fde047', stun: 0.12 });
          for (let c = 0; c < st.chains; c++) {
            const nx = this.nearestTo(cur.x, cur.y, 260, hit);
            if (!nx) break;
            dmg *= 0.8;
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
        const n = awake ? st.count * 2 : st.count;
        for (let i = 0; i < n; i++) {
          const a = awake ? (i / n) * TAU : dir + rand(-0.42, 0.42);
          const sp = rand(300, 420) * (awake ? 1.15 : 1);
          this.projectiles.push({
            x: p.x + Math.cos(a) * 16, y: p.y + Math.sin(a) * 16,
            vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
            r: 15 + st.dmg * 0.06, dmg: st.dmg, life: 0.55, pierce: 2 + (awake ? 2 : 0),
            kind: 'flame', color: i % 2 ? '#f97316' : '#fbbf24', hit: new Set(), burn: 0.6 + st.dmg * 0.02
          });
        }
        return true;
      }
      case 'water': {
        const near = this.nearestEnemies(awake ? 3 : st.count, 900);
        if (!near.length) return false;
        near.forEach((e, i) => {
          const a = Math.atan2(e.y - p.y, e.x - p.x) + (i - (near.length - 1) / 2) * (awake ? 0 : 0.08);
          this.projectiles.push({
            x: p.x, y: p.y, vx: Math.cos(a) * (awake ? 760 : 640), vy: Math.sin(a) * (awake ? 760 : 640),
            r: awake ? 16 : 10, dmg: st.dmg * (awake ? 1.25 : 1), life: 1.4, pierce: st.pierce,
            kind: 'water', color: '#38bdf8', hit: new Set(), knock: 30
          });
        });
        SFX.dash();
        return true;
      }
      case 'shadow': {
        const targets = this.nearestEnemies(awake ? 8 : st.count, 760);
        if (!targets.length) return false;
        for (const t of targets) {
          const a = Math.atan2(t.y - p.y, t.x - p.x);
          this.projectiles.push({
            x: p.x, y: p.y, vx: Math.cos(a) * 320, vy: Math.sin(a) * 320, r: 12 + st.dmg * 0.03,
            dmg: st.dmg, life: 2.4, pierce: 0, kind: 'shadow', color: '#a78bfa',
            hit: new Set(), homing: 5.5, blast: st.blast, trail: []
          });
        }
        return true;
      }
      case 'psychic': {
        this.rings.push({ x: p.x, y: p.y, r: 20, r1: st.radius, life: 0.55, max: 0.55, color: '#f472b6', kind: 'psychic', hit: new Set(), dmg: st.dmg, pull: awake, delay: 0 });
        if (awake) {
          for (const e of this.enemies) {
            const d = Math.hypot(e.x - p.x, e.y - p.y);
            if (d < st.radius * 1.2 && d > 1) {
              e.kx = (p.x - e.x) / d * 160; e.ky = (p.y - e.y) / d * 160;
            }
          }
        }
        SFX.hit();
        return true;
      }
      case 'quake': {
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
        for (const t of near) {
          const a = Math.atan2(t.y - p.y, t.x - p.x);
          this.projectiles.push({
            x: p.x, y: p.y, vx: Math.cos(a) * 700, vy: Math.sin(a) * 700, r: 9,
            dmg: st.dmg, life: 1.2, pierce: st.pierce, kind: 'ice', color: '#7dd3fc',
            hit: new Set(), slow: st.slow, freeze: 0.12 + st.slow * 0.4
          });
        }
        if (awake) {
          for (const e of this.enemies) if (dist2(e.x, e.y, p.x, p.y) < 200 * 200) e.freeze = Math.max(e.freeze, 0.8);
          this.rings.push({ x: p.x, y: p.y, r: 30, r1: 210, life: 0.6, max: 0.6, color: '#7dd3fc', kind: 'ice', hit: new Set(), dmg: 0, delay: 0 });
        }
        return true;
      }
      case 'aura': {
        const targets = this.nearestEnemies(awake ? 4 : st.count, 760);
        if (!targets.length) return false;
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
        const n = awake ? st.count * 2 : st.count;
        for (let i = 0; i < n; i++) {
          let tx, ty;
          if (this.enemies.length && Math.random() < 0.8) {
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
        this.dashState = { angle: a, speed: st.dist / 0.16, t: 0.16, dmg: st.dmg, hit: new Set(), count: awake ? 2 : 1 };
        SFX.dash();
        return true;
      }
      case 'slam': {
        this.slamAt(p.x, p.y, st.radius, st.dmg, awake);
        SFX.explode();
        this.cam.shake = Math.min(16, this.cam.shake + 10);
        return true;
      }
      default: return false;
    }
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
        if (dist2(e.x, e.y, bx, by) < (e.r + 20) * (e.r + 20)) {
          const key = e.uid;
          if ((cd.get(key) || 0) > this.time) continue;
          cd.set(key, this.time + 0.42);
          this.damage(e, st.dmg, { color: '#4ade80', knock: 22 });
        }
      }
    }
    // 잎날 잔상 파티클
    if (Math.random() < 0.5) {
      this.particles.push({ x: w.state.bx || p.x, y: w.state.by || p.y, vx: rand(-20, 20), vy: rand(-20, 20), life: 0.3, max: 0.3, color: '#86efac', r: 3 });
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
    this.particles.push({ x, y, vx: rand(-30, 30), vy: rand(-30, 30), life: 0.28, max: 0.28, color: '#fca5a5', r: 10 });
    for (const e of this.enemies) {
      if (!this.dashState || this.dashState.hit.has(e.uid)) continue;
      if (dist2(e.x, e.y, x, y) < (e.r + 26) * (e.r + 26)) {
        this.dashState.hit.add(e.uid);
        this.damage(e, this.dashState.dmg, { color: '#fca5a5', knock: 60 });
      }
    }
    void p;
  }

  dashHit(d) { void d; }

  /* ================= 적 ================= */
  spawnEnemy(key, opts = {}) {
    const def = ENEMIES[key];
    if (!def) return null;
    const p = this.player;
    const tScale = 1 + this.time / 140;
    const stageMul = [1, 1.25, 1.6][STAGES.indexOf(this.stage)] || 1;
    let ang, px, py;
    if (opts.x != null) { px = opts.x; py = opts.y; }
    else {
      // 화면 밖에서 스폰
      const margin = 90;
      const side = (Math.random() * 4) | 0;
      const vw = this.W, vh = this.H;
      if (side === 0) { px = p.x - vw / 2 - margin; py = p.y + rand(-vh / 2, vh / 2); }
      else if (side === 1) { px = p.x + vw / 2 + margin; py = p.y + rand(-vh / 2, vh / 2); }
      else if (side === 2) { px = p.x + rand(-vw / 2, vw / 2); py = p.y - vh / 2 - margin; }
      else { px = p.x + rand(-vw / 2, vw / 2); py = p.y + vh / 2 + margin; }
      ang = 0;
    }
    px = clamp(px, 30, WORLD - 30);
    py = clamp(py, 30, WORLD - 30);

    const isBoss = !!def.boss;
    const isLegend = !!def.legend;
    const elite = !!opts.elite;
    const shiny = opts.shiny || (!isBoss && !isLegend && Math.random() < (this.meta.shinyChance * 0.35));
    let hp = def.hp * (isBoss || isLegend ? 1 : tScale * stageMul);
    if (elite) hp *= 9;
    if (shiny) hp *= 3;
    const e = {
      uid: ++Game.uid, key, def, id: def.id, name: def.n,
      x: px, y: py, r: def.r * (elite ? 1.45 : 1) * (isBoss ? 1 : 1),
      hp, maxHp: hp, spd: def.spd * (elite ? 0.9 : 1),
      typeColor: TYPE_COLORS[(DEX[def.id] && DEX[def.id].t[0]) || '노말'] || '#f87171',
      dmg: def.dmg * (isBoss ? 1 : tScale * 0.45 + 0.55) * stageMul * (elite ? 1.3 : 1),
      xp: def.xp * (elite ? 8 : 1) * (shiny ? 4 : 1) * (isBoss ? 3 : 1),
      ai: def.ai, boss: isBoss, final: !!def.final, legend: isLegend,
      elite, shiny, hitCd: 0, flash: 0, slow: 0, freeze: 0, stun: 0, fear: 0,
      kx: 0, ky: 0, phase: Math.random() * TAU, atkCd: rand(1, 2.5), state: 0, st: 0,
      facing: 1, bob: Math.random() * TAU, dead: false
    };
    if (isBoss && this.bossSpawnedAt == null) this.bossSpawnedAt = this.time;
    this.enemies.push(e);
    if (markSeen(def.id)) this.seenIds.add(def.id);
    if (isBoss) {
      this.announce(def.n + ' 등장!', def.final ? '최종 결전' : '강력한 보스', def.final ? '#f472b6' : '#f87171');
      SFX.boss();
      this.cam.shake = 14;
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
    if (this.finalSpawned && this.enemies.length === 0 && !this.finalBoss) { /* noop */ }
    this.spawnTimer -= dt;
    const rate = Math.max(0.11, 0.5 - this.time * 0.00048);
    if (this.spawnTimer <= 0 && this.enemies.length < 230) {
      this.spawnTimer = rate * rand(0.75, 1.25);
      const pool = this.currentPool();
      if (pool.length) {
        const n = 1 + (this.time > 90 ? 1 : 0) + (this.time > 300 ? 1 : 0);
        for (let i = 0; i < n; i++) this.spawnEnemy(pick(pool));
      }
    }
    if (this.time > 12) {
      this.eliteTimer -= dt;
      if (this.eliteTimer <= 0) {
        this.eliteTimer = 42;
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
      const spd2 = this.player.sig === 'intimidate' && d < 180 ? spd * 0.82 : spd;
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
          e.atkCd -= dt;
          if (e.atkCd <= 0) {
            e.atkCd = rand(2.6, 3.8);
            const n = e.final ? 18 : 10;
            const base = Math.atan2(dy, dx);
            for (let i = 0; i < n; i++) {
              const a = base + (i / n) * TAU;
              this.ebullets.push({ x: e.x, y: e.y, vx: Math.cos(a) * 165, vy: Math.sin(a) * 165, r: 11, dmg: e.dmg * 0.45, life: 3.4, color: '#fb7185' });
            }
            this.rings.push({ x: e.x, y: e.y, r: 10, r1: 120, life: 0.5, max: 0.5, color: '#fb7185', kind: 'enemy', hit: new Set(), dmg: 0 });
          }
          break;
        }
        default: vx = dx / d * spd2; vy = dy / d * spd2;
      }
      if (e.fear > 0) { vx *= fearMul; vy *= fearMul; }
      e.x += (vx + e.kx) * dt;
      e.y += (vy + e.ky) * dt;
      e.kx *= Math.pow(0.0008, dt); e.ky *= Math.pow(0.0008, dt);
      if (Math.abs(vx) > 1) e.facing = vx > 0 ? 1 : -1;

      /* 접촉 피해 */
      if (d < e.r + p.r && e.hitCd <= 0 && p.inv <= 0) {
        const dodge = (p.sig === 'levitate' && Math.random() < 0.15);
        if (!dodge) this.hurtPlayer(e.dmg);
        e.hitCd = 0.85;
        e.kx = -dx / d * 90; e.ky = -dy / d * 90;
      }
      /* 화상 */
      if (e.burn) this.damage(e, e.burn.dps * dt, { color: '#fb923c', silent: true, dot: true });
    }
    this.enemies = this.enemies.filter(e => !e.dead);
  }

  hurtPlayer(amount) {
    const p = this.player;
    let dmg = amount * (1 - p.armor);
    if (p.sig === 'multiscale' && p.hp > p.maxHp * 0.7) dmg *= 0.75;
    if (p.sig === 'shell' && p.hp > p.maxHp * 0.5) dmg *= 0.9;
    p.hp -= dmg;
    p.inv = 0.55;
    p.hitFlash = 0.25;
    this.cam.shake = Math.min(16, this.cam.shake + 7);
    SFX.hurt();
    this.floatText(p.x + rand(-10, 10), p.y - 26, '-' + Math.round(dmg), '#fb7185');
    for (let i = 0; i < 8; i++) {
      const a = rand(0, TAU);
      this.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 0.35, max: 0.35, color: '#f87171', r: 4 });
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
          if (d < 260) { e.kx = (e.x - p.x) / d * 500; e.ky = (e.y - p.y) / d * 500; }
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
          this.damage(e, b.dmg, { color: b.color, knock: b.knock || 0 });
          if (b.burn) e.burn = { t: 2.2, dps: b.dmg * 0.35 };
          if (b.slow) e.slow = Math.max(e.slow, b.slow);
          if (b.freeze && Math.random() < 0.35) e.freeze = Math.max(e.freeze, b.freeze);
          if (b.blast) this.explode(b.x, b.y, b.blast, b.dmg * 0.7, b.color, b.chainBlast ? 1 : 0, b.hit);
          if (b.kind === 'flame') {
            this.particles.push({ x: b.x, y: b.y, vx: rand(-40, 40), vy: rand(-40, 40), life: 0.25, max: 0.25, color: '#fdba74', r: 6 });
          }
          b.pierce--;
          if (b.kind === 'shadow' || b.pierce < 0) { removed = true; break; }
        }
      }
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
    for (let i = 0; i < 10; i++) {
      const a = rand(0, TAU);
      this.particles.push({ x, y, vx: Math.cos(a) * rand(60, 240), vy: Math.sin(a) * rand(60, 240), life: 0.35, max: 0.35, color, r: rand(3, 7) });
    }
    for (const e of this.enemies) {
      if (e.dead || (exclude && exclude.has(e.uid))) continue;
      if (dist2(e.x, e.y, x, y) < (radius + e.r * 0.5) ** 2) {
        this.damage(e, dmg, { color, knock: 30 });
        if (chain > 0 && Math.random() < 0.35) this.explode(e.x, e.y, radius * 0.7, dmg * 0.5, color, chain - 1, exclude);
      }
    }
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
        this.particles.push({ x: b.x, y: b.y, vx: 0, vy: 0, life: 0.3, max: 0.3, color: b.color, r: 12 });
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
      if (d < mr) {
        const pull = 620 + (1 - d / mr) * 500;
        o.x += dx / d * pull * dt;
        o.y += dy / d * pull * dt;
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
      SFX.levelup();
      this.checkEvolution();
    }
    if (this.pendingLevels > 0 && !this.paused) this.openLevelUp();
  }

  /* ================= 레벨업 카드 ================= */
  rollCards() {
    const p = this.player;
    const pool = [];
    for (const w of p.weaponList) {
      if (w.lv < WEAPONS[w.id].max) {
        const d = WEAPONS[w.id];
        pool.push({ type: 'weapon', id: w.id, name: d.name, icon: d.icon, color: d.color, lv: w.lv, max: d.max, desc: d.desc, upgrade: true, awake: w.lv + 1 >= d.max });
      }
    }
    if (p.weaponList.length < 6) {
      for (const id in WEAPONS) {
        if (p.weaponList.some(w => w.id === id)) continue;
        const d = WEAPONS[id];
        pool.push({ type: 'weapon', id, name: d.name, icon: d.icon, color: d.color, lv: 0, max: d.max, desc: d.desc, isNew: true });
      }
    }
    for (const id in p.passives) {
      if (p.passives[id] < PASSIVES[id].max) {
        const d = PASSIVES[id];
        pool.push({ type: 'passive', id, name: d.name, icon: d.icon, color: d.color, lv: p.passives[id], max: d.max, desc: d.desc, upgrade: true });
      }
    }
    if (Object.keys(p.passives).length < 6) {
      for (const id in PASSIVES) {
        if (p.passives[id]) continue;
        const d = PASSIVES[id];
        pool.push({ type: 'passive', id, name: d.name, icon: d.icon, color: d.color, lv: 0, max: d.max, desc: d.desc, isNew: true });
      }
    }
    // 가중치: 신규 기술/패시브 조금 높게
    const weighted = [];
    for (const c of pool) {
      const w = c.isNew ? 1.5 : 1;
      for (let i = 0; i < Math.round(w * 2); i++) weighted.push(c);
    }
    const n = p.sig === 'adapt' ? 4 : 3;
    const out = [];
    let guard = 0;
    while (out.length < n && guard++ < 400 && weighted.length) {
      const c = pick(weighted);
      if (out.some(x => x.type === c.type && x.id === c.id)) continue;
      out.push(c);
    }
    if (!out.length) {
      out.push({ type: 'heal', id: 'heal', name: '회복', icon: '🍖', color: '#4ade80', desc: '체력을 40% 회복한다' });
      out.push({ type: 'coin', id: 'coin', name: '보너스 코인', icon: '🪙', color: '#fbbf24', desc: '코인 40개를 획득한다' });
      out.push({ type: 'heal', id: 'heal', name: '회복', icon: '🍖', color: '#4ade80', desc: '체력을 40% 회복한다' });
    }
    return out;
  }

  openLevelUp() {
    if (this.paused) return;
    this.paused = true;
    const cards = this.rollCards();
    if (this.autoPick) {
      this.applyCard(cards[(Math.random() * cards.length) | 0]);
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
    if (card.type === 'weapon') {
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
      this.runCoins += 40;
    }
    this.recalc();
    SFX.select();
    this.pendingLevels = Math.max(0, (this.pendingLevels || 1) - 1);
    if (this.pendingLevels > 0) {
      const cards = this.rollCards();
      if (this.autoPick) { this.applyCard(cards[0]); return; }
      if (this.hooks.onLevelUp) this.hooks.onLevelUp(this, cards);
    } else {
      this.paused = false;
      if (this.hooks.onLevelUpClose) this.hooks.onLevelUpClose(this);
    }
  }

  /* ================= 진화 ================= */
  checkEvolution() {
    const p = this.player, c = this.char;
    const lvl = p.level;
    const chain = c.chain;
    if (c.branch && this.evoStage === 0 && lvl >= c.branch.lv) {
      if (this.autoPick) {
        this.evolveTo(pick(c.branch.options), true);
      } else {
        this.paused = true;
        if (this.hooks.onBranch) this.hooks.onBranch(this, c.branch.options);
      }
      return;
    }
    if (chain[this.evoStage + 1] && lvl >= chain[this.evoStage + 1].lv) {
      this.evolveTo(chain[this.evoStage + 1].id);
    } else if (c.awaken && this.evoStage < c.awaken.length && lvl >= c.awaken[this.evoStage]) {
      this.awaken();
    }
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
    // 기술 강화: 대표 기술 +2레벨
    const w = p.weaponList[0];
    if (w) w.lv = Math.min(WEAPONS[w.id].max, w.lv + 2);
    if (branchChoice) {
      const bw = { 134: 'water', 135: 'thunder', 136: 'flame', 196: 'psychic', 197: 'nightmare' }[id];
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
    if (this.hooks.onEvolve && !this.autoPick) {
      this.paused = true;
      this.hooks.onEvolve(this, { from: prev, to: p.stageId, name: nm, sig: c_sig(this.char, this.evoStage) });
    } else {
      this.announce(nm + ' 진화!', '새로운 힘이 깨어났다', '#fde68a');
    }
  }

  awaken() {
    const p = this.player;
    this.evoStage++;
    const base = p.baseName || this.char.chain[this.char.chain.length - 1].name;
    const nm = base + (this.evoStage >= 2 ? ' · 초각성' : ' · 각성');
    p.stageName = nm;
    p.scale = 1 + this.evoStage * 0.08;
    this.base.hp *= 1.28;
    this.base.dmg *= 1.28;
    this.base.speed *= 1.04;
    this.recalc(false);
    p.hp = this.player.maxHp;
    p.weaponList.forEach(w => { w.lv = Math.min(WEAPONS[w.id].max, w.lv + 1); });
    SFX.evolve();
    playCry(p.stageId, 0.5);
    this.rings.push({ x: p.x, y: p.y, r: 20, r1: 320, life: 0.9, max: 0.9, color: '#f472b6', kind: 'heal', hit: new Set(), dmg: 0 });
    for (let i = 0; i < 44; i++) {
      const a = rand(0, TAU);
      this.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * rand(60, 340), vy: Math.sin(a) * rand(60, 340), life: 0.9, max: 0.9, color: i % 3 ? '#f472b6' : '#fde68a', r: rand(3, 9) });
    }
    this.cam.shake = 14;
    if (this.hooks.onEvolve && !this.autoPick) {
      this.paused = true;
      this.hooks.onEvolve(this, { from: p.stageId, to: p.stageId, name: nm, awaken: true });
    } else {
      this.announce(nm + '!', '전설의 힘을 각성했다', '#f472b6');
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
      const d = Math.hypot(p.x - it.x, p.y - it.y);
      if (d < p.magnet * 0.6) {
        it.x += (p.x - it.x) / d * 260 * dt;
        it.y += (p.y - it.y) / d * 260 * dt;
      }
      if (d < p.r + 16) {
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
      const r = Math.random();
      if (r < 0.42) {
        const cand = p.weaponList.filter(w => w.lv < WEAPONS[w.id].max);
        if (cand.length) {
          const w = pick(cand);
          w.lv++;
          this.announce('기술 강화!', WEAPONS[w.id].name + ' Lv.' + w.lv, '#fbbf24');
        } else this.runCoins += 60;
      } else if (r < 0.68) {
        const avail = Object.keys(PASSIVES).filter(k => (p.passives[k] || 0) < PASSIVES[k].max);
        if (avail.length) {
          const k = pick(avail);
          this.addPassive(k);
          this.announce('패시브 획득!', PASSIVES[k].name, '#a78bfa');
        } else this.runCoins += 60;
      } else if (r < 0.88) {
        this.runCoins += 45;
        this.announce('보물 상자', '+45 코인', '#fbbf24');
      } else {
        this.runDust += 2;
        this.announce('별의모래!', '+2 별의모래', '#c4b5fd');
      }
      for (let i = 0; i < 26; i++) {
        const a = rand(0, TAU);
        this.particles.push({ x: it.x, y: it.y, vx: Math.cos(a) * rand(60, 260), vy: Math.sin(a) * rand(60, 260), life: 0.7, max: 0.7, color: i % 2 ? '#fde68a' : '#fff', r: rand(3, 6) });
      }
    } else if (it.kind === 'heart') {
      p.hp = Math.min(p.maxHp, p.hp + p.maxHp * 0.18);
      this.floatText(p.x, p.y - 34, '+HP', '#4ade80');
      SFX.coin();
    }
  }

  /* ================= 위험지대 ================= */
  updateHazards(dt) {
    const p = this.player;
    const out = [];
    for (const h of this.hazards) {
      h.life -= dt;
      if (p.inv <= 0 && dist2(p.x, p.y, h.x, h.y) < h.r * h.r) {
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
    e.hp -= dmg;
    e.flash = 0.1;
    if (!optsNow.silent) {
      this.floatText(e.x + rand(-8, 8), e.y - e.r - 6, Math.round(dmg) + (crit ? '!' : ''), crit ? '#fbbf24' : (optsNow.color || '#fff'), crit ? 1.15 : 0.85);
    }
    if (crit) SFX.crit(); else SFX.hit();
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
    markCaught(e.id);
    this.seenIds.add(e.id);
    const p = this.player;

    this.dropOrbs(e.x, e.y, e.xp, e.shiny ? '#fde68a' : (e.boss ? '#f472b6' : '#38bdf8'));
    const coins = Math.round((e.def.xp * 0.7 + (e.boss ? 40 : 0) + (e.elite ? 25 : 0) + (e.legend ? 60 : 0)) * (e.shiny ? 4 : 1) * p.coinMul);
    this.runCoins += coins;
    if (e.boss) this.cam.shake = 18;
    if (e.legend) {
      this.legendsKilled++;
      this.runDust += 6;
      this.announce(e.name + ' 포획!', '별의모래 +6 · 코인 +' + coins, '#a78bfa');
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
        this.hazards.push({ x: e.x, y: e.y, r: 60, life: 2.2, dmg: e.dmg * 0.5, color: '#fbbf24' });
        this.rings.push({ x: e.x, y: e.y, r: 10, r1: 90, life: 0.35, max: 0.35, color: '#fbbf24', kind: 'blast', hit: new Set(), dmg: 0 });
        SFX.explode();
      }
      if (e.ai === 'poison') this.hazards.push({ x: e.x, y: e.y, r: 52, life: 4, dmg: e.dmg * 0.35, color: '#a855f7' });
    }
    for (let i = 0; i < (e.boss ? 40 : 8); i++) {
      const a = rand(0, TAU), sp = e.boss ? rand(100, 420) : rand(40, 190);
      this.particles.push({ x: e.x, y: e.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: e.boss ? 0.9 : 0.4, max: e.boss ? 0.9 : 0.4, color: e.shiny ? '#fde68a' : e.typeColor, r: e.boss ? rand(4, 9) : rand(2, 5) });
    }
    SFX.kill();
    if (e.final) this.win();
    else if (e.legend) { /* capture */ }
  }

  /* ================= 연출 ================= */
  floatText(x, y, text, color, scale = 1) {
    if (this.texts.length > 70) this.texts.shift();
    this.texts.push({ x, y, text, color, life: 0.85, max: 0.85, scale });
  }
  announce(text, sub, color) {
    this.announcement = { text, sub, color: color || '#fff', life: 2.4, max: 2.4 };
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
          } else if (r.kind === 'psychic') {
            for (const e of this.enemies) {
              if (r.hit.has(e.uid)) continue;
              if (dist2(e.x, e.y, r.x, r.y) < r.r1 * r.r1) { r.hit.add(e.uid); this.damage(e, r.dmg, { color: '#f472b6' }); e.slow = Math.max(e.slow, 0.4); }
            }
          } else if (r.kind === 'quake' || r.kind === 'slam') {
            for (const e of this.enemies) {
              if (r.hit.has(e.uid)) continue;
              if (dist2(e.x, e.y, r.x, r.y) < r.r1 * r.r1) {
                r.hit.add(e.uid);
                this.damage(e, r.dmg, { color: '#d9b45a', knock: 120 });
                if (r.stun) e.stun = Math.max(e.stun, r.stun);
              }
            }
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
          this.damage(e, s.dmg, { color: '#818cf8', knock: 30 });
        }
      }
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
          this.damage(e, b.dmg, { color: '#fde68a', knock: 30 });
        }
      }
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
    const coins = Math.round((this.runCoins + this.kills * 0.6 + (win ? 250 * stageBonus : 0)) * (win ? 1.15 : 1));
    const dust = Math.round(this.runDust + (win ? 6 * stageBonus : 0));
    return {
      win, time: this.time, kills: this.kills, level: this.player.level,
      coins, dust, bosses: this.bossesKilled, legends: this.legendsKilled, shinies: this.shiniesKilled,
      charName: this.currentStageName(), charId: this.currentStage(), charKey: this.char.key,
      stageKey: this.stage.key, stageName: this.stage.name, shiny: this.shiny,
      seenIds: [...this.seenIds], weapons: this.player.weaponList.map(w => ({ id: w.id, lv: w.lv }))
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
            // 이벤트성 정지(진화/분기)는 강제 해제
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
    let best = null, bd = 1e9;
    for (const b of this.ebullets) {
      const dx = p.x - b.x, dy = p.y - b.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 170) {
        const w = (170 - d) / 170;
        fx += dx / d * w * 1.6;
        fy += dy / d * w * 1.6;
      }
    }
    for (const o of this.orbs) {
      const dd = dist2(o.x, o.y, p.x, p.y);
      if (dd < bd) { bd = dd; best = o; }
    }
    if (best && bd > 2000) {
      const d = Math.sqrt(bd);
      fx += (best.x - p.x) / d * 0.9;
      fy += (best.y - p.y) / d * 0.9;
    }
    // 월드 경계 회피
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
    const W = this.W, H = this.H;
    const sh = this.cam.shake;
    const sx = this.cam.x + (sh ? rand(-sh, sh) : 0);
    const sy = this.cam.y + (sh ? rand(-sh, sh) : 0);

    ctx.imageSmoothingEnabled = false;
    this.drawGround(ctx, sx, sy);

    ctx.save();
    ctx.translate(-sx, -sy);

    this.drawPickups(ctx);
    this.drawOrbs(ctx);

    const sorted = [...this.enemies].sort((a, b) => a.y - b.y);
    let drawn = 0;
    for (const e of sorted) {
      if (e.x < sx - 90 || e.x > sx + W + 90 || e.y < sy - 90 || e.y > sy + H + 90) continue;
      this.drawEnemy(ctx, e);
      if (++drawn > 220) break;
    }
    this.drawPlayer(ctx);
    this.drawHazards(ctx);
    this.drawProjectiles(ctx);
    this.drawEBullets(ctx);
    this.drawEffects(ctx);
    this.drawTexts(ctx);
    ctx.restore();

    this.drawVignette(ctx);
    this.drawHUDCanvas(ctx);
  }

  drawGround(ctx, sx, sy) {
    const W = this.W, H = this.H;
    const st = this.stage;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, st.sky[0]);
    g.addColorStop(1, st.sky[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 타일 텍스처(패턴) 스크롤
    const pat = this.groundPattern(st);
    const ox = -(((sx % 256) + 256) % 256);
    const oy = -(((sy % 256) + 256) % 256);
    ctx.save();
    ctx.translate(ox, oy);
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W + 256, H + 256);
    ctx.restore();

    // 장식물
    const T = 148;
    const x0 = Math.floor(sx / T), x1 = Math.ceil((sx + W) / T);
    const y0 = Math.floor(sy / T), y1 = Math.ceil((sy + H) / T);
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const h = hash2(tx * 7 + 13, ty * 11 + 5);
        if (h > 0.62) continue;
        const jx = hash2(tx + 33, ty + 71), jy = hash2(tx + 91, ty + 17);
        const px = tx * T - sx + jx * T * 0.9 + 14;
        const py = ty * T - sy + jy * T * 0.9 + 14;
        const kind = st.deco;
        ctx.save();
        if (kind === 'grass') {
          const n = 2 + ((h * 10) | 0) % 3;
          ctx.strokeStyle = h < 0.28 ? '#7dd3a0' : '#3f9e6a';
          ctx.globalAlpha = 0.35 + h * 0.3;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          for (let i = 0; i < n; i++) {
            const bx = px + i * 6 - n * 2;
            ctx.beginPath();
            ctx.moveTo(bx, py);
            ctx.quadraticCurveTo(bx - 4, py - 10, bx + 5, py - 17 - h * 10);
            ctx.stroke();
          }
        } else if (kind === 'rock') {
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = h < 0.3 ? '#5b5b6e' : '#3a3a48';
          ctx.beginPath();
          ctx.ellipse(px, py, 9 + h * 8, 6 + h * 5, h * 3, 0, TAU);
          ctx.fill();
          ctx.globalAlpha = 0.25; ctx.fillStyle = '#a5b4fc';
          ctx.beginPath(); ctx.ellipse(px - 2, py - 3, 4, 2.5, 0, 0, TAU); ctx.fill();
        } else {
          ctx.globalAlpha = 0.55 + h * 0.3;
          ctx.fillStyle = h < 0.2 ? '#fef08a' : '#e9d5ff';
          ctx.beginPath(); ctx.arc(px, py, 1.8 + h * 2, 0, TAU); ctx.fill();
          if (h < 0.12) {
            ctx.globalAlpha = 0.2;
            ctx.beginPath(); ctx.arc(px, py, 9, 0, TAU); ctx.fill();
          }
        }
        ctx.restore();
      }
    }

    // 월드 경계
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 6;
    ctx.strokeRect(-sx, -sy, WORLD, WORLD);
    ctx.restore();
  }

  groundPattern(stage) {
    if (!this._groundPat) this._groundPat = {};
    if (this._groundPat[stage.key]) return this._groundPat[stage.key];
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = stage.ground[1];
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 26; i++) {
      const px = Math.random() * 256, py = Math.random() * 256, r = 26 + Math.random() * 54;
      for (let ox = -256; ox <= 256; ox += 256) {
        for (let oy = -256; oy <= 256; oy += 256) {
          const g2 = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, r);
          g2.addColorStop(0, stage.ground[0]);
          g2.addColorStop(1, 'rgba(0,0,0,0)');
          x.globalAlpha = 0.5;
          x.fillStyle = g2;
          x.beginPath(); x.arc(px + ox, py + oy, r, 0, TAU); x.fill();
        }
      }
    }
    x.globalAlpha = 0.22;
    for (let i = 0; i < 240; i++) {
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
    const img = getSprite(id, shiny);
    const bob = optsNow.bob || 0;
    const flash = optsNow.flash || 0;
    const alpha = optsNow.alpha == null ? 1 : optsNow.alpha;
    const feet = optsNow.feet == null ? y + visibleH * 0.18 : optsNow.feet;
    ctx.save();
    ctx.globalAlpha = alpha;
    // 그림자
    ctx.fillStyle = 'rgba(0,0,0,0.32)';
    ctx.beginPath();
    ctx.ellipse(x, feet + 2, visibleH * 0.30, visibleH * 0.10, 0, 0, TAU);
    ctx.fill();
    ctx.translate(x, feet + Math.sin(bob) * visibleH * 0.02);
    if (facing < 0) ctx.scale(-1, 1);
    if (img) {
      const b = spriteBounds(img);
      const sc = visibleH / b.h;
      const dw = img.width * sc, dh = img.height * sc;
      const dx = -(b.x + b.w / 2) * sc;
      const dy = -(b.y + b.h) * sc;
      if (flash > 0) {
        ctx.save();
        try { ctx.filter = 'brightness(0) invert(1)'; } catch (e) { /* noop */ }
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      }
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      fallbackDraw(ctx, id, 0, -visibleH * 0.5, visibleH, optsNow.color, shiny);
    }
    ctx.restore();
  }

  drawPlayer(ctx) {
    const p = this.player;
    const visH = 94 + this.evoStage * 9;
    const id = this.currentStage();
    // 플레이어 발치 글로우
    ctx.save();
    const gg = ctx.createRadialGradient(p.x, p.y + 22, 0, p.x, p.y + 22, 62);
    gg.addColorStop(0, 'rgba(147,197,253,0.20)');
    gg.addColorStop(1, 'rgba(147,197,253,0)');
    ctx.fillStyle = gg;
    ctx.beginPath(); ctx.ellipse(p.x, p.y + 22, 62, 30, 0, 0, TAU); ctx.fill();
    ctx.restore();
    if (p.shiny) {
      const t = performance.now() / 300;
      for (let i = 0; i < 3; i++) {
        const a = t + i * TAU / 3;
        const px = p.x + Math.cos(a) * 28, py = p.y + Math.sin(a) * 22 - 10;
        ctx.save();
        ctx.fillStyle = '#fde68a';
        ctx.globalAlpha = 0.7 + Math.sin(t * 3 + i) * 0.3;
        ctx.beginPath();
        for (let k = 0; k < 4; k++) {
          const ang = k * Math.PI / 2;
          ctx.lineTo(px + Math.cos(ang) * 5, py + Math.sin(ang) * 5);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
    if (p.inv > 0 && Math.floor(performance.now() / 60) % 2 === 0) ctx.globalAlpha = 0.55;
    this.drawSpriteEntity(ctx, p.x, p.y, visH * p.scale, id, p.shiny, p.face, { bob: p.t * 9, flash: p.hitFlash > 0 ? 1 : 0, color: '#93c5fd', feet: p.y + 26 });
    ctx.globalAlpha = 1;
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
    this.drawSpriteEntity(ctx, e.x, e.y, visH, e.def.id, e.shiny, e.facing, {
      bob: e.bob, flash: e.flash, color: e.typeColor || '#f87171', feet: e.y + e.r * 0.55
    });
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
      ctx.globalAlpha = 0.5;
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
      ctx.save();
      ctx.globalAlpha = Math.min(0.35, h.life * 0.2);
      ctx.fillStyle = h.color;
      ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  drawProjectiles(ctx) {
    for (const b of this.projectiles) {
      ctx.save();
      if (b.kind === 'flame') {
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 2);
        g.addColorStop(0, '#fff7ed'); g.addColorStop(0.4, b.color); g.addColorStop(1, 'rgba(249,115,22,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 2, 0, TAU); ctx.fill();
      } else if (b.kind === 'shadow' || b.kind === 'aura') {
        ctx.shadowColor = b.color; ctx.shadowBlur = 14;
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.beginPath(); ctx.arc(b.x - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.35, 0, TAU); ctx.fill();
      } else if (b.kind === 'water') {
        ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 10;
        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath(); ctx.ellipse(b.x, b.y, b.r * 1.5, b.r, Math.atan2(b.vy, b.vx), 0, TAU); ctx.fill();
      } else if (b.kind === 'ice') {
        ctx.strokeStyle = '#e0f2fe'; ctx.lineWidth = 2;
        ctx.fillStyle = 'rgba(125,211,252,0.7)';
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * TAU;
          ctx.lineTo(b.x + Math.cos(a) * b.r, b.y + Math.sin(a) * b.r);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
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
      ctx.lineWidth = r.wide ? 8 * a : 3 + 4 * a;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, TAU);
      ctx.stroke();
      if (r.kind === 'meteor' && r.done) {
        ctx.globalAlpha = a * 0.3;
        ctx.fillStyle = r.color;
        ctx.beginPath(); ctx.arc(r.x, r.y, r.r1 * 0.8, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    for (const b of this.bolts) {
      const a = b.life / b.max;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = '#fef08a';
      ctx.shadowColor = '#fbbf24'; ctx.shadowBlur = 14;
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
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = g;
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

  drawHUDCanvas(ctx) {
    /* 조이스틱은 DOM 대신 캔버스에 그린다 */
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
