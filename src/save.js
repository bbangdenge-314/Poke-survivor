/* 영구 저장(localStorage) · 메타 진행 · 퀘스트 해금 */
import { CHARACTERS, UPGRADES, QUESTS, QUEST_BY_KEY, PASSIVES, FIELD_ITEMS, LOCKED_PASSIVES, LOCKED_FIELDS, SAVE_KEY } from './data.js?v=25';

const baseSettings = () => ({ sfx: true, cries: true, shake: true, view: 'wide' });

const baseStats = () => ({
  runs: 0, wins: 0, kills: 0, bossKills: 0, awakens: 0, supers: 0, megas: 0,
  chests: 0, shinies: 0, maxLevel: 1, playTime: 0, clears: {}, bestKills: 0
});

const defaultSave = () => ({
  v: 4,
  coins: 0,
  dust: 0,
  upgrades: Object.fromEntries(UPGRADES.map(u => [u.key, 0])),
  unlocked: CHARACTERS.filter(c => !c.unlockQuest).map(c => c.key),
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

export function getSave() {
  if (data) return data;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      data = Object.assign(defaultSave(), p);
      data.upgrades = Object.assign(Object.fromEntries(UPGRADES.map(u => [u.key, 0])), p.upgrades || {});
      data.settings = Object.assign(baseSettings(), p.settings || {});
      data.stats = Object.assign(baseStats(), p.stats || {});
      // 구버전(코인 해금) 세이브 호환
      // 새 로스터가 추가돼도 기존 세이브가 그대로 이어지도록, 기본 해금 목록은 항상 합집합으로 병합한다.
      const baseUnlocked = defaultSave().unlocked;
      if (!Array.isArray(data.unlocked) || !data.unlocked.length) data.unlocked = baseUnlocked;
      else data.unlocked = [...new Set([...data.unlocked, ...baseUnlocked])];
      if (!Array.isArray(data.stages) || !data.stages.length) data.stages = ['meadow'];
      if (!Array.isArray(data.fields) || !data.fields.length) data.fields = Object.keys(FIELD_ITEMS).filter(k => !LOCKED_FIELDS[k]);
      if (!Array.isArray(data.passives) || !data.passives.length) data.passives = Object.keys(PASSIVES).filter(k => !LOCKED_PASSIVES[k]);
      if (!data.questsClaimed || typeof data.questsClaimed !== 'object') data.questsClaimed = {};
      if (!Array.isArray(data.cleared)) data.cleared = [];
    } else {
      data = defaultSave();
      // v3 세이브 마이그레이션 (코인 해금 시절 진행도 보존)
      try {
        const oldRaw = localStorage.getItem('pokeSurvivor.save.v3');
        if (oldRaw) {
          const o = JSON.parse(oldRaw);
          data.coins = o.coins || 0;
          data.dust = o.dust || 0;
          data.upgrades = Object.assign(data.upgrades, o.upgrades || {});
          if (Array.isArray(o.unlocked)) data.unlocked = [...new Set([...data.unlocked, ...o.unlocked])];
          data.shiny = o.shiny || {};
          data.dexSeen = o.dexSeen || {};
          data.dexCaught = o.dexCaught || {};
          data.cleared = Array.isArray(o.cleared) ? o.cleared : [];
          data.stages = [...new Set(['meadow', ...data.cleared])];
          data.settings = Object.assign(data.settings, o.settings || {});
          data.stats.runs = o.runs || 0;
          data.stats.wins = o.wins || 0;
          data.stats.kills = o.kills || 0;
          data.stats.playTime = 0;
          data.cleared.forEach(k => { data.stats.clears[k] = data.stats.clears[k] || 1; });
          data.wins = o.wins || 0;
          persist();
        }
      } catch (e) { /* ignore */ }
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

export function recordRun(run) {
  const s = getSave();
  const st = s.stats;
  s.coins += Math.round(run.coins || 0);
  s.dust += Math.round(run.dust || 0);
  st.runs += 1;
  st.kills += run.kills || 0;
  st.bossKills += run.bosses || 0;
  st.awakens += run.awakens || 0;
  st.supers += run.supers || 0;
  st.megas += run.megas || 0;
  st.chests += run.chests || 0;
  st.shinies += run.shinies || 0;
  st.maxLevel = Math.max(st.maxLevel, run.level || 1);
  st.bestKills = Math.max(st.bestKills, run.kills || 0);
  st.playTime += Math.round(run.time || 0);
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
export function questValue(q) {
  const s = getSave();
  const g = q.goal || {};
  if (g.stat === 'clears') return s.stats.clears[g.key] || 0;
  if (g.stat === 'wins') return s.stats.wins || s.wins || 0;
  if (g.stat === 'stageCount') return s.stages.length;
  return s.stats[g.stat] || 0;
}

export function questState(q) {
  const s = getSave();
  const need = (q.goal && q.goal.n) || 1;
  const cur = Math.min(need, questValue(q));
  const done = cur >= need;
  const claimed = !!s.questsClaimed[q.key];
  return { cur, need, done, claimed, pct: Math.min(100, Math.round(cur / need * 100)) };
}

export function questRewardText(q) {
  const r = q.reward || {};
  const bits = [];
  if (r.coins) bits.push(`🪙 ${r.coins}`);
  if (r.char) {
    const c = CHARACTERS.find(x => x.key === r.char);
    bits.push(`해금 ${c ? c.chain[0].name : r.char}`);
  }
  if (r.stage) bits.push(`스테이지 ${r.stage === 'cave' ? '은빛 동굴' : r.stage === 'sky' ? '하늘 제단' : r.stage === 'forest' ? '보라타운 유령숲' : r.stage === 'aqua' ? '심해 아쿠아 신전' : r.stage === 'volcano' ? '태초의 마그마 화산' : '뒤틀린 시공의 틈'}`);
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
