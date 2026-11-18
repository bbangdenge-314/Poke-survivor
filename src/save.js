/* 영구 저장(localStorage) · 로그라이크 메타 진행 */
import { CHARACTERS, UPGRADES, SAVE_KEY } from './data.js?v=19';

const defaultSave = () => ({
  v: 3,
  coins: 0,
  dust: 0,
  upgrades: Object.fromEntries(UPGRADES.map(u => [u.key, 0])),
  unlocked: CHARACTERS.filter(c => !c.cost).map(c => c.key),
  shiny: {},          // charKey -> true (이로치 획득)
  dexSeen: {},
  dexCaught: {},
  cleared: [],        // stage keys
  runs: 0,
  wins: 0,
  kills: 0,
  bestStage: null,
  settings: { sfx: true, cries: true },
  createdAt: Date.now()
});

let data = null;

export function getSave() {
  if (data) return data;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      data = Object.assign(defaultSave(), p);
      data.upgrades = Object.assign(Object.fromEntries(UPGRADES.map(u => [u.key, 0])), p.upgrades || {});
      data.settings = Object.assign({ sfx: true, cries: true }, p.settings || {});
      if (!Array.isArray(data.unlocked) || !data.unlocked.length) data.unlocked = defaultSave().unlocked;
    } else {
      data = defaultSave();
    }
  } catch (e) {
    data = defaultSave();
  }
  return data;
}

export function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(getSave())); } catch (e) { /* quota */ }
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
  return !char.cost || getSave().unlocked.includes(char.key);
}

export function unlockCost(char) { return char.cost || 0; }

export function unlockChar(char) {
  const s = getSave();
  if (isUnlocked(char)) return { ok: false, reason: 'owned' };
  if (s.coins < char.cost) return { ok: false, reason: 'poor', cost: char.cost };
  s.coins -= char.cost;
  s.unlocked.push(char.key);
  persist();
  return { ok: true, cost: char.cost };
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

export function recordRun({ win, stageKey, time, kills, coins, dust, charKey, shiny, finalLevel, seenIds }) {
  const s = getSave();
  s.runs += 1;
  s.kills += kills;
  s.coins += coins;
  s.dust += dust;
  if (win) {
    s.wins += 1;
    if (!s.cleared.includes(stageKey)) s.cleared.push(stageKey);
  }
  if (charKey && shiny) s.shiny[charKey] = true;
  (seenIds || []).forEach(id => { s.dexSeen[id] = 1; });
  persist();
  return s;
}

export function toggleSetting(k) {
  const s = getSave();
  s.settings[k] = !s.settings[k];
  persist();
  return s.settings[k];
}
