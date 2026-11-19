/* 영구 저장(localStorage) · 메타 진행 · 퀘스트 해금 */
import {
  CHARACTERS, STARTER_KEYS, UPGRADES, QUESTS, QUEST_BY_KEY, PASSIVES, FIELD_ITEMS, WEAPONS, STAGES,
  LOCKED_PASSIVES, LOCKED_FIELDS, SAVE_KEY, LEGACY_SAVE_KEYS
} from './data.js?v=26';

const SAVE_VERSION = 5;

const baseSettings = () => ({ sfx: true, cries: true, shake: true, view: 'wide' });

const baseStats = () => ({
  runs: 0, wins: 0, kills: 0, bossKills: 0, awakens: 0, supers: 0, megas: 0,
  chests: 0, shinies: 0, maxLevel: 1, playTime: 0, clears: {}, bestKills: 0,
  /* v5 확장 집계 */
  elites: 0, legends: 0, evolutions: 0, coinsEarned: 0, noHitBest: 0, bestTime: 0,
  killsByType: {}, killsByWeapon: {}
});

const defaultSave = () => ({
  v: SAVE_VERSION,
  coins: 0,
  dust: 0,
  upgrades: Object.fromEntries(UPGRADES.map(u => [u.key, 0])),
  unlocked: [...STARTER_KEYS],
  stages: ['meadow'],
  fields: Object.keys(FIELD_ITEMS).filter(k => !LOCKED_FIELDS[k]),
  passives: Object.keys(PASSIVES).filter(k => !LOCKED_PASSIVES[k]),
  questsClaimed: {},
  shiny: {},
  dexSeen: {},
  dexCaught: {},
  stats: baseStats(),
  cleared: [],
  settings: baseSettings(),
  createdAt: Date.now()
});

let data = null;

const STAGE_KEYS = STAGES.map(s => s.key);

/* 구버전 공통 병합: 맵/배열이 비어 있어도 새 필드가 사라지지 않게 */
function normalizeStats(raw) {
  const st = Object.assign(baseStats(), raw || {});
  st.clears = Object.assign({}, (raw && raw.clears) || {});
  st.killsByType = Object.assign({}, (raw && raw.killsByType) || {});
  st.killsByWeapon = Object.assign({}, (raw && raw.killsByWeapon) || {});
  return st;
}

function normalize(d) {
  d.v = SAVE_VERSION;
  d.upgrades = Object.assign(Object.fromEntries(UPGRADES.map(u => [u.key, 0])), d.upgrades || {});
  d.settings = Object.assign(baseSettings(), d.settings || {});
  d.stats = normalizeStats(d.stats);
  if (!Array.isArray(d.unlocked) || !d.unlocked.length) d.unlocked = [...STARTER_KEYS];
  else d.unlocked = [...new Set([...d.unlocked.filter(k => CHARACTERS.some(c => c.key === k)), ...STARTER_KEYS])];
  if (!Array.isArray(d.stages) || !d.stages.length) d.stages = ['meadow'];
  else d.stages = [...new Set(['meadow', ...d.stages.filter(k => STAGE_KEYS.includes(k))])];
  if (!Array.isArray(d.fields) || !d.fields.length) d.fields = Object.keys(FIELD_ITEMS).filter(k => !LOCKED_FIELDS[k]);
  if (!Array.isArray(d.passives) || !d.passives.length) d.passives = Object.keys(PASSIVES).filter(k => !LOCKED_PASSIVES[k]);
  if (!d.questsClaimed || typeof d.questsClaimed !== 'object') d.questsClaimed = {};
  if (!Array.isArray(d.cleared)) d.cleared = [];
  if (!d.shiny || typeof d.shiny !== 'object') d.shiny = {};
  if (!d.dexSeen || typeof d.dexSeen !== 'object') d.dexSeen = {};
  if (!d.dexCaught || typeof d.dexCaught !== 'object') d.dexCaught = {};
  return d;
}

/* v4 → v5 : 캐릭터 해금이 '전원 개방'에서 '퀘스트 해금'으로 바뀐 세이브 변환.
   코인·영구강화·클리어 기록·도감·퀘스트 수령 기록은 유지하고,
   캐릭터는 스타터 5종 + 이미 수령한 퀘스트 보상만 남긴다. */
function migrateV4(o) {
  const d = defaultSave();
  d.coins = o.coins || 0;
  d.dust = o.dust || 0;
  d.upgrades = Object.assign(d.upgrades, o.upgrades || {});
  d.stats = normalizeStats(o.stats);
  d.cleared = Array.isArray(o.cleared) ? o.cleared.filter(k => STAGE_KEYS.includes(k)) : [];
  d.stages = [...new Set(['meadow', ...d.cleared, ...(Array.isArray(o.stages) ? o.stages.filter(k => STAGE_KEYS.includes(k)) : [])])];
  d.fields = Array.isArray(o.fields) && o.fields.length ? [...d.fields, ...o.fields] : d.fields;
  d.passives = Array.isArray(o.passives) && o.passives.length ? [...d.passives, ...o.passives] : d.passives;
  d.questsClaimed = o.questsClaimed && typeof o.questsClaimed === 'object' ? o.questsClaimed : {};
  d.shiny = o.shiny || {};
  d.dexSeen = o.dexSeen || {};
  d.dexCaught = o.dexCaught || {};
  d.settings = Object.assign(baseSettings(), o.settings || {});
  d.createdAt = o.createdAt || Date.now();
  const earned = [];
  for (const key of Object.keys(d.questsClaimed)) {
    const q = QUEST_BY_KEY[key];
    if (q && q.reward && q.reward.char) earned.push(q.reward.char);
  }
  d.unlocked = [...new Set([...STARTER_KEYS, ...earned])];
  d.notice = 'v5_unlock';
  return normalize(d);
}

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function getSave() {
  if (data) return data;
  const cur = readJSON(SAVE_KEY);
  if (cur) {
    data = normalize(Object.assign(defaultSave(), cur));
    return data;
  }
  /* v5 이전 세이브 이전 */
  const v4 = readJSON(LEGACY_SAVE_KEYS[0]);
  if (v4) {
    data = migrateV4(v4);
    persist();
    return data;
  }
  const v3 = readJSON(LEGACY_SAVE_KEYS[1]);
  if (v3) {
    data = defaultSave();
    data.coins = v3.coins || 0;
    data.dust = v3.dust || 0;
    data.upgrades = Object.assign(data.upgrades, v3.upgrades || {});
    data.shiny = v3.shiny || {};
    data.dexSeen = v3.dexSeen || {};
    data.dexCaught = v3.dexCaught || {};
    data.cleared = Array.isArray(v3.cleared) ? v3.cleared.filter(k => STAGE_KEYS.includes(k)) : [];
    data.stages = [...new Set(['meadow', ...data.cleared])];
    data.settings = Object.assign(data.settings, v3.settings || {});
    data.stats.runs = v3.runs || 0;
    data.stats.wins = v3.wins || 0;
    data.stats.kills = v3.kills || 0;
    data.stats.maxLevel = v3.maxLevel || 1;
    data.stats.bestKills = v3.kills || 0;
    data.cleared.forEach(k => { data.stats.clears[k] = data.stats.clears[k] || 1; });
    data.wins = v3.wins || 0;
    data.notice = 'v5_unlock';
    data = normalize(data);
    persist();
    return data;
  }
  data = defaultSave();
  return data;
}

export function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(getSave())); } catch (e) { /* quota */ }
}

/* ---------- 진행사항 초기화 ---------- */
/* 설정(효과음·시야 등)만 남기고 모든 진행을 처음 상태로 되돌린다. */
export function resetProgress() {
  const keepSettings = Object.assign(baseSettings(), (data && data.settings) || baseSettings());
  data = defaultSave();
  data.settings = keepSettings;
  try {
    localStorage.removeItem(SAVE_KEY);
    LEGACY_SAVE_KEYS.forEach(k => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } });
  } catch (e) { /* ignore */ }
  persist();
  return data;
}

/* 세이브 개편 안내 (1회 표시) */
export function consumeNotice() {
  const s = getSave();
  const n = s.notice || null;
  if (n) { delete s.notice; persist(); }
  return n;
}

export function upgradeCost(u) {
  const lv = getSave().upgrades[u.key] || 0;
  if (lv >= u.max) return null;
  return Math.round(u.cost * Math.pow(u.grow, lv));
}

export function buyUpgrade(u) {
  const s = getSave();
  const lv = s.upgrades[u.key] || 0;
  if (lv >= u.max) return { ok: false, reason: 'max' };
  const cost = upgradeCost(u);
  if (s.coins < cost) return { ok: false, reason: 'poor', cost };
  s.coins -= cost;
  s.upgrades[u.key] = lv + 1;
  persist();
  return { ok: true, cost, level: lv + 1 };
}

export function isUnlocked(char) {
  return !char.unlockQuest || getSave().unlocked.includes(char.key);
}
export function unlockChar(char) {
  const s = getSave();
  if (s.unlocked.includes(char.key)) return false;
  s.unlocked.push(char.key);
  persist();
  return true;
}
export function isStageUnlocked(stage) {
  return !stage.unlock || getSave().stages.includes(stage.key);
}
export function isPassiveUnlocked(id) {
  return getSave().passives.includes(id);
}
export function isFieldUnlocked(id) {
  return getSave().fields.includes(id);
}

/* 메타 업그레이드 → 런 시작 보정값 */
export function metaMods() {
  const s = getSave();
  const lv = k => s.upgrades[k] || 0;
  return {
    dmg: 1 + lv('power') * 0.06,
    hp: lv('health') * 12,
    speed: 1 + lv('speed') * 0.03,
    haste: 1 + lv('haste') * 0.03,
    magnet: 1 + lv('magnet') * 0.10,
    xp: 1 + lv('growth') * 0.06,
    coin: 1 + lv('greed') * 0.08,
    armor: Math.min(0.6, lv('armor') * 0.03),
    revive: lv('revive'),
    shinyChance: 0.01 + lv('shiny') * 0.015,
    luck: lv('luck') * 0.03,
    startLv: lv('startLv')
  };
}

export function markSeen(id) {
  const s = getSave();
  if (!s.dexSeen[id]) { s.dexSeen[id] = 1; return true; }
  return false;
}
export function markCaught(id) {
  const s = getSave();
  const isNew = !s.dexCaught[id];
  s.dexCaught[id] = (s.dexCaught[id] || 0) + 1;
  s.dexSeen[id] = 1;
  if (isNew) queuePersist();
  return isNew;
}
let persistTimer = null;
function queuePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => { persistTimer = null; persist(); }, 400);
}

function addMap(dst, src) {
  if (!src) return;
  for (const k of Object.keys(src)) {
    const v = Number(src[k]) || 0;
    if (v) dst[k] = (dst[k] || 0) + v;
  }
}

export function recordRun(run) {
  const s = getSave();
  const st = s.stats;
  s.coins += Math.round(run.coins || 0);
  s.dust += Math.round(run.dust || 0);
  st.runs += 1;
  st.kills += run.kills || 0;
  st.bossKills += run.bosses || 0;
  st.elites += run.elites || 0;
  st.legends += run.legends || 0;
  st.awakens += run.awakens || 0;
  st.supers += run.supers || 0;
  st.megas += run.megas || 0;
  st.evolutions += run.evolutions || 0;
  st.chests += run.chests || 0;
  st.shinies += run.shinies || 0;
  st.coinsEarned = (st.coinsEarned || 0) + Math.round(run.coins || 0);
  st.maxLevel = Math.max(st.maxLevel, run.level || 1);
  st.bestKills = Math.max(st.bestKills, run.kills || 0);
  st.bestTime = Math.max(st.bestTime || 0, Math.round(run.time || 0));
  st.noHitBest = Math.max(st.noHitBest || 0, Math.round(run.noHitBest || 0));
  st.playTime += Math.round(run.time || 0);
  addMap(st.killsByType, run.killsByType);
  addMap(st.killsByWeapon, run.killsByWeapon);
  if (run.win) {
    s.wins = (s.wins || 0) + 1;
    st.wins = s.wins;
    if (run.stageKey && !s.cleared.includes(run.stageKey)) s.cleared.push(run.stageKey);
    if (run.stageKey) st.clears[run.stageKey] = (st.clears[run.stageKey] || 0) + 1;
  }
  if (run.charKey && run.shiny) s.shiny[run.charKey] = true;
  (run.seenIds || []).forEach(id => { s.dexSeen[id] = 1; });
  persist();
  return s;
}

/* ---------- 퀘스트 ---------- */
const STAGE_LABEL = {
  meadow: '관동 초원', cave: '은빛 동굴', sky: '하늘 제단', forest: '보라타운 유령숲',
  aqua: '심해 아쿠아 신전', volcano: '태초의 마그마 화산', rift: '뒤틀린 시공의 틈'
};

export function questValue(g) {
  const s = getSave();
  const st = s.stats;
  switch (g.stat) {
    case 'clears': return st.clears[g.key] || 0;
    case 'wins': return st.wins || s.wins || 0;
    case 'stageCount': return s.stages.length;
    case 'killsType': return (st.killsByType && st.killsByType[g.type]) || 0;
    case 'killsWeapon': return (st.killsByWeapon && st.killsByWeapon[g.weapon]) || 0;
    case 'elites': return st.elites || 0;
    case 'legends': return st.legends || 0;
    case 'evolutions': return st.evolutions || 0;
    case 'coins': return st.coinsEarned || 0;
    case 'dexCaught': return Object.keys(s.dexCaught || {}).length;
    case 'stageCleared': return (s.cleared || []).length;
    case 'noHit': return st.noHitBest || 0;
    case 'bestTime': return st.bestTime || 0;
    case 'bestKills': return st.bestKills || 0;
    default: return st[g.stat] || 0;
  }
}

/* 목표 한 줄 이름 — 캐릭터 선택/퀘스트 화면 공용 */
export function goalLabel(g) {
  switch (g.stat) {
    case 'kills': return '누적 처치';
    case 'killsType': return `${g.type} 타입 적`;
    case 'killsWeapon': return `${(WEAPONS[g.weapon] && WEAPONS[g.weapon].name) || g.weapon}로 처치`;
    case 'clears': return `${STAGE_LABEL[g.key] || g.key} 클리어`;
    case 'wins': return '스테이지 클리어';
    case 'bossKills': return '보스 처치';
    case 'elites': return '엘리트 처치';
    case 'chests': return '보물 상자';
    case 'shinies': return '이로치 처치';
    case 'legends': return '환상 포획';
    case 'awakens': return '각성 기술 해금';
    case 'supers': return '초각성 완성';
    case 'megas': return '메가·거다이 달성';
    case 'maxLevel': return '한 판 최고 레벨';
    case 'bestKills': return '한 판 최다 처치';
    case 'bestTime': return '한 판 최고 생존';
    case 'noHit': return '무피격 생존';
    case 'coins': return '누적 코인 획득';
    case 'evolutions': return '진화 달성';
    case 'dexCaught': return '도감 포획';
    case 'playTime': return '누적 플레이';
    case 'runs': return '모험 횟수';
    case 'stageCount': return '스테이지 개방';
    default: return g.stat;
  }
}

/* 값 표기: 시간형은 m:ss, 코인은 천 단위 */
export function goalValueText(g, v) {
  if (g.stat === 'bestTime' || g.stat === 'noHit') {
    const t = Math.max(0, Math.round(v));
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  }
  if (g.stat === 'playTime') return `${Math.floor(v / 60)}분`;
  if (g.stat === 'coins') return v.toLocaleString();
  return String(Math.floor(v));
}

export function goalNeedText(g) {
  const n = g.n || 1;
  if (g.stat === 'bestTime' || g.stat === 'noHit') {
    return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
  }
  if (g.stat === 'playTime') return `${Math.floor(n / 60)}분`;
  if (g.stat === 'coins') return n.toLocaleString();
  return String(n);
}

export function questGoalText(q) {
  const goals = (q.goal && q.goal.all) || [q.goal || {}];
  return goals.map(g => g.stat === 'clears' ? goalLabel(g) : `${goalLabel(g)} ${goalNeedText(g)}`).join(' · ');
}

export function questProgress(q) {
  const goals = (q.goal && q.goal.all) || [q.goal || {}];
  return goals.map(g => {
    const need = g.n || 1;
    const raw = questValue(g);
    const cur = Math.min(need, raw);
    return {
      goal: g, need, raw, cur,
      label: goalLabel(g),
      curText: goalValueText(g, cur),
      needText: goalValueText(g, need),
      pct: need > 0 ? Math.min(100, Math.round(cur / need * 100)) : 100,
      done: cur >= need
    };
  });
}

export function questState(q) {
  const s = getSave();
  const parts = questProgress(q);
  const done = parts.every(p => p.done);
  const claimed = !!s.questsClaimed[q.key];
  const pct = Math.round(parts.reduce((a, p) => a + p.pct, 0) / Math.max(1, parts.length));
  const cur = parts.reduce((a, p) => a + p.cur, 0);
  const need = parts.reduce((a, p) => a + p.need, 0);
  return { cur, need, done, claimed, pct: claimed ? 100 : pct, parts };
}

export function questRewardText(q) {
  const r = q.reward || {};
  const bits = [];
  if (r.coins) bits.push(`🪙 ${r.coins}`);
  if (r.char) {
    const c = CHARACTERS.find(x => x.key === r.char);
    bits.push(`해금 ${c ? c.chain[0].name : r.char}`);
  }
  if (r.stage) bits.push(`스테이지 ${STAGE_LABEL[r.stage] || r.stage}`);
  if (r.passive) bits.push(`패시브 ${PASSIVES[r.passive] ? PASSIVES[r.passive].name : r.passive}`);
  if (r.field) bits.push(`아이템 ${FIELD_ITEMS[r.field] ? FIELD_ITEMS[r.field].name : r.field}`);
  return bits.join(' · ');
}

export function claimQuest(q) {
  const s = getSave();
  const st = questState(q);
  if (!st.done) return { ok: false, reason: 'notyet' };
  if (st.claimed) return { ok: false, reason: 'done' };
  const r = q.reward || {};
  s.questsClaimed[q.key] = 1;
  if (r.coins) s.coins += r.coins;
  if (r.char && !s.unlocked.includes(r.char)) s.unlocked.push(r.char);
  if (r.stage && !s.stages.includes(r.stage)) s.stages.push(r.stage);
  if (r.passive && !s.passives.includes(r.passive)) s.passives.push(r.passive);
  if (r.field && !s.fields.includes(r.field)) s.fields.push(r.field);
  persist();
  return { ok: true, reward: r };
}

export function questUnlockedBy(res) {
  const out = [];
  const s = getSave();
  for (const q of QUESTS) {
    const r = q.reward || {};
    if (r[res.type] === res.key && s.questsClaimed[q.key]) out.push(q);
  }
  return out;
}

export function firstUnclaimedQuest() {
  for (const q of QUESTS) {
    const st = questState(q);
    if (st.done && !st.claimed) return q;
  }
  return null;
}

/* 캐릭터를 해금하는 퀘스트 */
export function questForChar(charKey) {
  for (const q of QUESTS) if (q.reward && q.reward.char === charKey) return q;
  return null;
}

export function toggleSetting(k) {
  const s = getSave();
  s.settings[k] = !s.settings[k];
  persist();
  return s.settings[k];
}
export function setSetting(k, v) {
  const s = getSave();
  s.settings[k] = v;
  persist();
  return v;
}

export { QUESTS, QUEST_BY_KEY };
