/* ============================================================
   UI — 밝고 산뜻한 로비 / 도감 / 조합표 / 퀘스트 / 설정 / HUD
   ============================================================ */
import {
  CHARACTERS, CHAR_BY_KEY, STAGES, DEX, WEAPONS, PASSIVES, UPGRADES,
  TYPE_COLORS, BRANCH_NAMES, FIELD_ITEMS, SUPER_AWAKENS, QUESTS, QUEST_BY_KEY, VIEW_MODES, STARTER_KEYS
} from './data.js?v=26';
import { spriteURL } from './sprites.js?v=26';
import { setCryEnabled } from './sprites.js?v=26';
import { setSfxEnabled } from './audio.js?v=26';
import {
  getSave, upgradeCost, buyUpgrade, isUnlocked, isStageUnlocked, isPassiveUnlocked,
  isFieldUnlocked, questState, questProgress, questGoalText, questRewardText, questForChar, claimQuest,
  resetProgress, consumeNotice, setSetting, toggleSetting, persist
} from './save.js?v=26';

const $ = id => document.getElementById(id);
const AFFINITY_LABEL = id => WEAPONS[id] ? `${WEAPONS[id].icon}${WEAPONS[id].name}` : id;
const STAGE_BY_KEY = Object.fromEntries(STAGES.map(s => [s.key, s]));

function questOf(key) { return QUEST_BY_KEY[key] || null; }

export class UI {
  constructor() {
    this.root = $('screenRoot');
    this.selectedChar = CHARACTERS[0].key;
    this.selectedStage = STAGES[0].key;
    this.shinyPref = false;
    this.onStart = null;
    this.lastWeaponSig = '';
    this.game = null;
    this.pauseTabName = 'pause';
    this.charFilter = { gen: 'all', type: 'all', unlock: 'all', q: '' };
  }

  /* ---------------- 공통 ---------------- */
  clear() { this.root.innerHTML = ''; }
  screen(html, cls = '') {
    this.clear();
    const d = document.createElement('div');
    d.className = 'screen ' + cls;
    d.innerHTML = html;
    this.root.appendChild(d);
    return d;
  }
  toast(msg, kind = '') {
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.textContent = msg;
    $('toastRoot').appendChild(t);
    setTimeout(() => t.remove(), 2400);
  }
  fmtTime(t) {
    const m = Math.floor(t / 60), s = Math.floor(t % 60);
    return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
  }
  sprite(id, shiny) { return spriteURL(id, !!shiny); }

  /* ---------------- 로비 ---------------- */
  showTitle() {
    const s = getSave();
    const cleared = s.cleared.length;
    const dexCaught = Object.keys(s.dexCaught).length;
    const nextQuest = this.nextQuest();
    const nextUnlock = this.nextUnlock();
    const div = this.screen(`
      <div class="lobby">
        <div class="lobby-deco">
          <span class="cloud c1"></span><span class="cloud c2"></span><span class="cloud c3"></span>
          <span class="sun"></span><span class="hill h1"></span><span class="hill h2"></span>
        </div>
        <header class="lobby-head">
          <div class="brand">
            <div class="mascot"><img src="${spriteURL(25, false)}" alt="피카츄"></div>
            <div class="brand-text">
              <div class="brand-kicker">POKÉMON ROGUELIKE SURVIVOR</div>
              <h1>포켓 서바이버</h1>
              <p>${CHARACTERS.length}마리의 포켓몬 · ${STAGES.length}개 세계 · 각성과 초각성의 생존 모험</p>
            </div>
          </div>
          <div class="head-right">
            <div class="coin-pill">🪙 <b>${s.coins.toLocaleString()}</b></div>
            <div class="coin-pill soft">✨ <b>${s.dust}</b></div>
          </div>
        </header>

        <div class="lobby-grid">
          <button class="menu-card play" id="btnPlay"><span class="mc-ico">⚔️</span><b>모험 시작</b><small>포켓몬을 고르고 출발!</small></button>
          <button class="menu-card" id="btnChars"><span class="mc-ico">🐾</span><b>포켓몬 선택</b><small>${s.unlocked.length} / ${CHARACTERS.length} 해금</small></button>
          <button class="menu-card" id="btnStages"><span class="mc-ico">🗺️</span><b>스테이지</b><small>${s.stages.length} / ${STAGES.length} 개방</small></button>
          <button class="menu-card" id="btnShop"><span class="mc-ico">💠</span><b>영구 강화</b><small>코인으로 영구 성장</small></button>
          <button class="menu-card quest" id="btnQuests"><span class="mc-ico">📜</span><b>퀘스트</b><small>${this.unclaimedCount() ? `<em>${this.unclaimedCount()}개 수령 가능!</em>` : '보상과 해금'}</small></button>
          <button class="menu-card" id="btnDex"><span class="mc-ico">📖</span><b>도감</b><small>${dexCaught} / ${Object.keys(DEX).length} 포획</small></button>
          <button class="menu-card" id="btnCombo"><span class="mc-ico">🔗</span><b>조합표</b><small>각성 · 초각성 트리</small></button>
          <button class="menu-card" id="btnSettings"><span class="mc-ico">⚙️</span><b>설정</b><small>화면 흔들림 · 시야</small></button>
        </div>

        <div class="lobby-stats">
          <div><b>${s.stats.wins || 0}</b><span>클리어</span></div>
          <div><b>${s.stats.runs}</b><span>도전</span></div>
          <div><b>${s.stats.kills.toLocaleString()}</b><span>처치</span></div>
          <div><b>${cleared}/${STAGES.length}</b><span>스테이지</span></div>
          <div><b>${s.stats.awakens + s.stats.supers}</b><span>각성</span></div>
          <div><b>${s.stats.megas}</b><span>메가·거다이</span></div>
        </div>

        <div class="lobby-next">
          ${nextQuest
            ? `<span class="ln-tag">다음 퀘스트</span> <b>${nextQuest.icon} ${nextQuest.name}</b> <span>${nextQuest.desc}</span>
               <button class="btn sm gold" id="btnNextQuest">보상 받기</button>`
            : nextUnlock
              ? `<span class="ln-tag">다음 해금</span> <b>${CHAR_BY_KEY[nextUnlock.q.reward.char].chain[0].name}</b>
                 <span>${nextUnlock.q.icon} ${nextUnlock.q.name} · ${nextUnlock.st.pct}% 진행</span>
                 <button class="btn sm gold" id="btnNextUnlock">퀘스트 보기</button>`
              : `<span class="ln-tag">TIP</span> <span>액티브 Lv.6 + 짝 패시브로 <b>각성</b>, 각성 2개를 모으면 <b>초각성</b>!</span>`}
        </div>
        <p class="tiny center">WASD·방향키 이동 / 모바일은 화면 드래그 · 공격은 자동 · ESC 일시정지</p>
      </div>`);

    $('btnPlay').onclick = () => this.showSelect();
    $('btnChars').onclick = () => this.showSelect();
    $('btnStages').onclick = () => this.showStages();
    $('btnShop').onclick = () => this.showShop();
    $('btnQuests').onclick = () => this.showQuests();
    $('btnDex').onclick = () => this.showDex();
    $('btnCombo').onclick = () => this.showCombo();
    $('btnSettings').onclick = () => this.showSettings();
    if ($('btnNextQuest')) $('btnNextQuest').onclick = () => this.showQuests();
    if ($('btnNextUnlock')) $('btnNextUnlock').onclick = () => { this.questFilter = { status: 'all', cat: '캐릭터 해금', q: '' }; this.showQuests(); };
    this.maybeShowNotice();
    return div;
  }

  /* ---------------- 세이브 개편 안내 ---------------- */
  maybeShowNotice() {
    const n = consumeNotice();
    if (!n) return;
    const locked = CHARACTERS.filter(c => !isUnlocked(c)).length;
    this.showPanel('noticePanel', `
      <div class="np-kicker">UPDATE · 퀘스트 해금</div>
      <h2>포켓몬 해금 방식이 바뀌었어요</h2>
      <p class="np-lead">이제 <b>스타터 ${STARTER_KEYS.length}종</b>만 처음부터 열리고,
        나머지 <b>${locked}종</b>은 포켓몬마다 다른 전용 퀘스트를 달성하면 하나씩 열립니다.</p>
      <div class="np-box">
        <div><b>그대로 보존</b><span>코인 · 영구강화 · 스테이지 개방 · 클리어 기록 · 도감 · 이로치</span></div>
        <div><b>새로 시작</b><span>캐릭터 해금 퀘스트 ${locked}종 · 퀘스트 필터와 모두 수령</span></div>
        <div><b>처음부터</b><span>설정 → 진행사항 초기화로 언제든 리셋할 수 있어요</span></div>
      </div>
      <div class="np-actions">
        <button class="btn primary" id="npQuests">퀘스트 보기</button>
        <button class="btn ghost" id="npOk">알겠어요</button>
      </div>`);
    const close = () => $('noticeOverlay').classList.add('hidden');
    $('npOk').onclick = close;
    $('npQuests').onclick = () => { close(); this.showQuests(); };
  }

  showPanel(bodyId, html) {
    const body = $(bodyId);
    if (!body) return null;
    body.innerHTML = html;
    const ov = body.closest('.overlay');
    if (ov) ov.classList.remove('hidden');
    return body;
  }
  hidePanel(id) {
    const el = $(id);
    if (!el) return;
    const ov = el.closest('.overlay');
    if (ov) ov.classList.add('hidden');
  }

  nextQuest() {
    for (const q of QUESTS) {
      const st = questState(q);
      if (st.done && !st.claimed) return q;
    }
    return null;
  }
  nextUnlock() {
    let best = null;
    for (const q of QUESTS) {
      if (!(q.reward && q.reward.char)) continue;
      const st = questState(q);
      if (st.claimed || st.done) continue;
      if (!best || st.pct > best.st.pct) best = { q, st };
    }
    return best;
  }
  unclaimedCount() {
    return QUESTS.filter(q => { const st = questState(q); return st.done && !st.claimed; }).length;
  }

  /* ---------------- 모험 준비 ---------------- */
  showSelect() {
    const s = getSave();
    this.charFilter = { gen: 'all', type: 'all', unlock: 'all', q: '' };
    const stageChips = STAGES.map(st => {
      const open = isStageUnlocked(st);
      const cleared = s.cleared.includes(st.key);
      return `<button class="stage-chip ${this.selectedStage === st.key ? 'on' : ''} ${open ? '' : 'locked'}" data-stage="${st.key}">
        <span class="sc-emoji">${st.emoji}</span>
        <span class="sc-nm">${st.name}</span>
        ${cleared ? '<span class="sc-clear">CLEAR</span>' : open ? `<span class="sc-diff">${'◆'.repeat(Math.min(4, st.reward))}</span>` : '<span class="sc-lock">잠금</span>'}
      </button>`;
    }).join('');


    this.screen(`
      <div class="wrap">
        <div class="topbar">
          <h1>🐾 모험 준비</h1>
          <span class="spacer"></span>
          <span class="pill gold">🪙 <b>${s.coins}</b></span>
          <button class="btn sm ghost" id="backBtn">← 로비</button>
        </div>
        <div class="section-title">스테이지 <span class="cnt">7개 세계</span></div>
        <div class="stage-row">${stageChips}</div>
        <div class="section-title">포켓몬 <span class="cnt" id="charCount">${s.unlocked.length} / ${CHARACTERS.length} 해금</span></div>
        <div class="filter-bar">
          <div class="fb-search">
            <span class="fb-ico">🔍</span>
            <input id="charSearch" type="search" placeholder="이름으로 찾기 (한글 · 영문)" autocomplete="off">
          </div>
          <div class="fb-row" id="genChips"></div>
          <div class="fb-row scroll" id="typeChips"></div>
          <div class="fb-row" id="unlockChips"></div>
        </div>
        <div class="char-grid" id="charGrid"></div>
        <div class="char-empty hidden" id="charEmpty">조건에 맞는 포켓몬이 없어요. 필터를 바꿔 보세요.</div>
        <div class="select-bottom">
          <div class="preview" id="preview"></div>
          <div class="start-panel" id="startPanel"></div>
        </div>
      </div>`);

    this.root.querySelectorAll('[data-stage]').forEach(el => {
      el.onclick = () => {
        const st = STAGE_BY_KEY[el.dataset.stage];
        if (!isStageUnlocked(st)) {
          const q = questOf(st.unlock);
          this.toast(`잠금 · ${q ? q.name + ' 퀘스트로 해금!' : '아직 잠겨 있어요'}`, 'bad');
          return;
        }
        this.selectedStage = st.key;
        this.root.querySelectorAll('.stage-chip').forEach(x => x.classList.toggle('on', x.dataset.stage === this.selectedStage));
        this.renderStartPanel();
      };
    });
    this.renderCharFilters();
    this.renderCharGrid();
    $('charSearch').oninput = e => {
      this.charFilter.q = e.target.value.trim().toLowerCase();
      this.renderCharGrid();
    };
    $('backBtn').onclick = () => this.showTitle();
    this.renderStartPanel();
  }

  /* ---------------- 로스터 필터 · 검색 ---------------- */
  charTypes(c) {
    const d = DEX[c.id];
    return (d && d.t) || [];
  }
  charMatches(c) {
    const f = this.charFilter;
    const s = getSave();
    if (f.gen !== 'all' && String(c.gen || '') !== String(f.gen)) return false;
    if (f.type !== 'all' && !this.charTypes(c).includes(f.type)) return false;
    const unlocked = isUnlocked(c);
    if (f.unlock === 'open' && !unlocked) return false;
    if (f.unlock === 'locked' && unlocked) return false;
    if (f.q) {
      const hay = [c.key, ...c.chain.map(x => x.name), DEX[c.id] ? DEX[c.id].n : '', c.rank || '',
        ...(c.affinity || []), ...this.charTypes(c), c.sigName || ''].join(' ').toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    if (f.unlock === 'shiny' && !s.shiny[c.key]) return false;
    return true;
  }
  renderCharFilters() {
    const f = this.charFilter;
    const gens = [...new Set(CHARACTERS.map(c => c.gen || 0))].sort((a, b) => a - b);
    const genChips = [`<button class="fb-chip ${f.gen === 'all' ? 'on' : ''}" data-gen="all">전체 세대</button>`]
      .concat(gens.map(g => `<button class="fb-chip ${String(f.gen) === String(g) ? 'on' : ''}" data-gen="${g}">${g}세대<em>${CHARACTERS.filter(c => (c.gen || 0) === g).length}</em></button>`)).join('');
    $('genChips').innerHTML = genChips;
    const types = ['전체 타입', ...Object.keys(TYPE_COLORS)];
    $('typeChips').innerHTML = types.map(t => {
      const val = t === '전체 타입' ? 'all' : t;
      const on = String(f.type) === String(val);
      const col = t === '전체 타입' ? '#8296b4' : TYPE_COLORS[t];
      return `<button class="fb-chip type ${on ? 'on' : ''}" data-type="${val}" style="--tc:${col}">${t}</button>`;
    }).join('');
    const unlocks = [['all', '전체'], ['open', '해금'], ['locked', '잠금'], ['shiny', '✦ 이로치']];
    $('unlockChips').innerHTML = unlocks.map(([v, label]) =>
      `<button class="fb-chip ${f.unlock === v ? 'on' : ''}" data-unlock="${v}">${label}</button>`).join('');
    const bind = (sel, key, cast = x => x) => this.root.querySelectorAll(sel).forEach(el => {
      el.onclick = () => {
        this.charFilter[key] = cast(el.dataset[key]);
        this.renderCharFilters();
        this.renderCharGrid();
      };
    });
    bind('[data-gen]', 'gen', v => v === 'all' ? 'all' : Number(v));
    bind('[data-type]', 'type');
    bind('[data-unlock]', 'unlock');
  }
  renderCharGrid() {
    const grid = $('charGrid');
    if (!grid) return;
    const s = getSave();
    const list = CHARACTERS.filter(c => this.charMatches(c));
    grid.innerHTML = list.map(c => {
      const unlocked = isUnlocked(c);
      const owned = !!s.shiny[c.key];
      const on = this.selectedChar === c.key;
      const d = DEX[c.id] || { n: c.chain[0].name, t: [] };
      const q = unlocked ? null : questForChar(c.key);
      const qs = q ? questState(q) : null;
      return `<button class="char-card ${on ? 'on' : ''} ${unlocked ? '' : 'locked'}" data-char="${c.key}" title="${d.n} · ${c.rank}${unlocked ? '' : ' · 퀘스트 해금'}">
        ${owned ? '<span class="shiny-dot">✦</span>' : ''}
        <img loading="lazy" src="${spriteURL(c.id, false)}" alt="${c.chain[0].name}">
        <div class="cc-name">${c.chain[0].name}</div>
        <div class="cc-rank ${c.rank === '전설' ? 'legend' : c.rank === '환상' ? 'myth' : ''}">${unlocked ? c.rank : '퀘스트'}</div>
        ${unlocked ? '' : `<div class="cc-quest"><i style="width:${qs ? qs.pct : 0}%"></i></div><div class="cc-pct">${qs ? qs.pct : 0}%</div>`}
      </button>`;
    }).join('');
    const cnt = $('charCount');
    if (cnt) cnt.textContent = `${list.length}마리 표시 · ${s.unlocked.length}/${CHARACTERS.length} 해금`;
    const empty = $('charEmpty');
    if (empty) empty.classList.toggle('hidden', list.length > 0);
    grid.querySelectorAll('[data-char]').forEach(el => {
      el.onclick = () => {
        const c = CHAR_BY_KEY[el.dataset.char];
        this.selectedChar = c.key;
        if (!getSave().shiny[c.key]) this.shinyPref = false;
        grid.querySelectorAll('.char-card').forEach(x => x.classList.toggle('on', x.dataset.char === c.key));
        this.renderStartPanel();
        if (!isUnlocked(c)) this.showUnlockInfo(c);
      };
    });
  }

  /* 잠긴 포켓몬의 해금 퀘스트 + 현재 진행도 */
  showUnlockInfo(c) {
    const q = questForChar(c.key);
    const body = $('lockBody');
    if (!body) return;
    const d = DEX[c.id] || { n: c.chain[0].name, t: [] };
    if (!q) {
      body.innerHTML = `<div class="lock-head"><img src="${spriteURL(c.id, false)}" alt=""><div><div class="lock-kicker">잠금</div><h2>${d.n}</h2></div></div>
        <p class="np-lead">해금 조건이 준비되지 않았어요.</p>`;
      this.showPanel('lockBody', body.innerHTML);
      return;
    }
    const st = questState(q);
    this.lastLockChar = c.key;
    body.innerHTML = `
      <div class="lock-head">
        <img src="${spriteURL(c.id, false)}" alt="${d.n}">
        <div class="lock-title">
          <div class="lock-kicker">🔒 퀘스트로 해금</div>
          <h2>${d.n}</h2>
          <div class="lock-types">${(d.t || []).map(t => `<span class="type-chip" style="background:${TYPE_COLORS[t] || '#94a3b8'}">${t}</span>`).join('')}
            <span class="lock-rank">${c.rank}</span></div>
        </div>
        <div class="lock-pct">${st.claimed ? '해금 완료' : st.done ? '달성!' : st.pct + '%'}</div>
      </div>
      <div class="lock-quest ${st.done ? 'ready' : ''}">
        <div class="lq-top">
          <span class="lq-ico">${q.icon}</span>
          <div class="lq-name"><span>${q.cat} · 난이도 ${'◆'.repeat(q.tier || 1)}</span><b>${q.name}</b></div>
        </div>
        <div class="lq-parts">
          ${st.parts.map(p => `<div class="lq-part">
            <div class="lqp-top"><span>${p.label}</span><b>${p.curText} / ${p.needText}</b></div>
            <div class="q-bar"><i style="width:${p.pct}%"></i></div>
          </div>`).join('')}
        </div>
        <div class="q-reward">보상: ${questRewardText(q)}</div>
      </div>
      <div class="lock-actions">
        <button class="btn primary" id="lockGoQuests">📜 퀘스트 보기</button>
        <button class="btn ghost" id="lockClose">닫기</button>
      </div>`;
    this.showPanel('lockBody', body.innerHTML);
    $('lockClose').onclick = () => this.hidePanel('lockBody');
    $('lockGoQuests').onclick = () => { this.hidePanel('lockBody'); this.showQuests(); };
  }

  /* 잠긴 포켓몬용 미리보기 — 어떤 퀘스트를 깨면 열리는지 + 진행도 */
  renderLockedPanel(c, st) {
    const q = questForChar(c.key);
    const qs = q ? questState(q) : null;
    const d = DEX[c.id] || { n: c.chain[0].name, t: [] };
    const pv = $('preview');
    const startEl = $('startPanel');
    if (!pv || !startEl) return;
    pv.innerHTML = `
      <img class="big locked-img" src="${spriteURL(c.id, false)}" alt="${d.n}">
      <div class="p-info">
        <h3>${d.n} <span class="lock-label">🔒 잠금</span></h3>
        <div class="types">${(d.t || []).map(t => `<span class="type-chip" style="background:${TYPE_COLORS[t] || '#94a3b8'}">${t}</span>`).join('')}</div>
        <div class="sig"><b>${c.sigName}</b> — ${c.sigDesc}</div>
        <p class="trait-line">✦ ${c.trait}</p>
        <div class="lock-quest inline ${qs && qs.done ? 'ready' : ''}">
          <div class="lq-top"><span class="lq-ico">${q ? q.icon : '🔒'}</span>
            <div class="lq-name"><span>해금 퀘스트${q ? ' · 난이도 ' + '◆'.repeat(q.tier || 1) : ''}</span><b>${q ? q.name : '준비 중'}</b></div>
            <strong class="lq-pct">${qs ? (qs.done ? '달성!' : qs.pct + '%') : ''}</strong></div>
          ${qs ? `<div class="lq-parts">${qs.parts.map(p => `<div class="lq-part"><div class="lqp-top"><span>${p.label}</span><b>${p.curText} / ${p.needText}</b></div><div class="q-bar"><i style="width:${p.pct}%"></i></div></div>`).join('')}</div>` : ''}
          ${q ? `<div class="q-reward">보상: ${questRewardText(q)}</div>` : ''}
        </div>
      </div>`;
    startEl.innerHTML = `
      <div class="row"><span>스테이지</span><b>${st.emoji} ${st.name}</b></div>
      <div class="row"><span>기본 기술</span><b>${WEAPONS[c.weapon].icon} ${WEAPONS[c.weapon].name}</b></div>
      <div class="start-lock-note">${qs && qs.done ? '퀘스트를 달성했어요! 퀘스트 화면에서 보상을 수령하면 해금됩니다.' : '해금 퀘스트를 달성하면 선택할 수 있어요.'}</div>
      <button class="btn primary big-start" id="lockInfoBtn">🔒 해금 퀘스트 자세히</button>`;
    const open = () => this.showUnlockInfo(c);
    if ($('lockInfoBtn')) $('lockInfoBtn').onclick = open;
  }

  renderStartPanel() {
    const c = CHAR_BY_KEY[this.selectedChar];
    const s = getSave();
    const st = STAGE_BY_KEY[this.selectedStage];
    const owned = !!s.shiny[c.key];
    if (!owned) this.shinyPref = false;
    if (!isUnlocked(c)) { this.renderLockedPanel(c, st); return; }
    const pv = $('preview');
    if (!pv) return;
    const chainHtml = `<div class="chain">${c.chain.map(ch => `<img src="${spriteURL(ch.id, false)}" title="${ch.name}" alt="${ch.name}">`).join('<span>›</span>')}${c.branch ? '<span>›</span><span class="branch-tag">5가지 분기</span>' : ''}${c.special ? `<span>›</span><img class="sp-form" src="${spriteURL(c.special.id, false)}" title="${c.special.name}" alt="${c.special.name}">` : ''}</div>`;
    const mastery = Object.entries(c.mastery || {}).map(([t, v]) => `<span class="mastery-chip" style="--mc:${TYPE_COLORS[t] || '#94a3b8'}">${t} +${Math.round(v * 100)}%</span>`).join('');
    const aff = (c.affinity || []).map(id => `<span class="aff-chip">${AFFINITY_LABEL(id)}</span>`).join('');
    const wb = Object.entries(c.weaponBonus || {}).map(([id, b]) => {
      const d = WEAPONS[id];
      if (!d) return '';
      const bits = [];
      if (b.count) bits.push(`수 +${b.count}`);
      if (b.chains) bits.push(`연쇄 +${b.chains}`);
      if (b.radius) bits.push(`범위 +${Math.round((b.radius - 1) * 100)}%`);
      if (b.pierce) bits.push(`관통 +${b.pierce}`);
      if (b.blast) bits.push(`폭발 +${Math.round((b.blast - 1) * 100)}%`);
      if (b.width) bits.push(`굵기 +${Math.round((b.width - 1) * 100)}%`);
      if (b.dist) bits.push(`거리 +${b.dist}`);
      if (b.dmg) bits.push(`피해 +${Math.round((b.dmg - 1) * 100)}%`);
      if (b.cd) bits.push(`쿨 -${Math.round((1 - b.cd) * 100)}%`);
      return `<span class="wb-chip">${d.icon}${d.name} ${bits.join('·')}</span>`;
    }).join('');
    const evoLine = c.evoQuests.map((q, i) => {
      const next = c.chain[i + 1];
      return `<div class="evo-q"><b>${i + 1}차${next ? ' · ' + next.name : ' · 한계 개방'}</b> ${q.label}</div>`;
    }).join('');
    const specialLine = c.special ? `<div class="special-line ${c.special.kind}"><b>${c.special.kind === 'gmax' ? '거다이맥스' : '메가진화'} · ${c.special.name}</b><span>${c.special.quest.label}</span></div>` : '';
    pv.innerHTML = `
      <img class="big" src="${spriteURL(c.id, this.shinyPref && owned)}" alt="${c.chain[0].name}">
      <div class="p-info">
        <h3>${c.chain[0].name}${this.shinyPref && owned ? ' <span class="shiny-label">✦이로치</span>' : ''}</h3>
        <div class="types">${DEX[c.id].t.map(t => `<span class="type-chip" style="background:${TYPE_COLORS[t]}">${t}</span>`).join('')}</div>
        <p class="p-desc">체력 ${c.hp} · 이동 ${c.speed} · 공격 ${Math.round(c.dmg * 100)}%</p>
        <div class="sig"><b>${c.sigName}</b> — ${c.sigDesc}</div>
        <div class="p-meta"><span class="meta-label">친화 기술</span><div class="chips">${aff}</div></div>
        <div class="p-meta"><span class="meta-label">타입 보너스</span><div class="chips">${mastery}</div></div>
        ${wb ? `<div class="p-meta"><span class="meta-label">전용 강화</span><div class="chips">${wb}</div></div>` : ''}
        <p class="trait-line">✦ ${c.trait}</p>
        <div class="evo-block"><div class="meta-label">인게임 진화 퀘스트</div>${evoLine}${specialLine}</div>
        ${chainHtml}
      </div>`;
    const startEl = $('startPanel');
    startEl.innerHTML = `
      <div class="row"><span>스테이지</span><b>${st.emoji} ${st.name}</b></div>
      <div class="row"><span>제한 시간</span><b>${Math.round(st.duration / 60)}분</b></div>
      <div class="row"><span>기본 기술</span><b>${WEAPONS[c.weapon].icon} ${WEAPONS[c.weapon].name}</b></div>
      <div class="row"><span>위험도</span><b>${'◆'.repeat(Math.min(4, st.reward))}</b></div>
      <label class="shiny-toggle ${owned ? '' : 'off'}" id="shinyToggle">
        <input type="checkbox" id="shinyChk" ${this.shinyPref ? 'checked' : ''} ${owned ? '' : 'disabled'}>
        <span>✦ 이로치로 시작 ${owned ? '' : '(미보유)'}</span>
      </label>
      <button class="btn primary big-start" id="goBtn">🚀 출발!</button>`;
    $('shinyChk').onchange = e => {
      this.shinyPref = e.target.checked;
      this.renderStartPanel();
    };
    $('goBtn').onclick = () => {
      if (this.onStart) this.onStart({ charKey: this.selectedChar, stageKey: this.selectedStage, shiny: this.shinyPref && owned });
    };
  }

  /* ---------------- 스테이지 ---------------- */
  showStages() {
    const s = getSave();
    const cards = STAGES.map((st, i) => {
      const open = isStageUnlocked(st);
      const cleared = s.cleared.includes(st.key);
      return `<div class="stage-card-big ${open ? '' : 'locked'} ${this.selectedStage === st.key ? 'on' : ''}" data-stage="${st.key}">
        <div class="sb-top">
          <span class="sb-emoji">${st.emoji}</span>
          <div><b>${st.name}</b><small>${st.sub}</small></div>
          ${cleared ? '<span class="sb-clear">CLEAR</span>' : open ? '' : '<span class="sb-lock">잠금</span>'}
        </div>
        <p class="sb-desc">${st.desc}</p>
        <div class="sb-meta">
          <span>⏱ ${Math.round(st.duration / 60)}분</span>
          <span>위험도 ${'◆'.repeat(Math.min(4, st.reward))}</span>
          <span>보스 ${st.bosses.length} · 환상 ${st.legends.length}</span>
        </div>
        ${open ? '' : `<div class="sb-quest">잠금 · ${questOf(st.unlock) ? questOf(st.unlock).name + ' — ' + questOf(st.unlock).desc : '도전 과제'}</div>`}
      </div>`;
    }).join('');

    this.screen(`
      <div class="wrap">
        <div class="topbar">
          <h1>🗺️ 스테이지</h1><span class="spacer"></span>
          <span class="pill">${s.stages.length} / ${STAGES.length} 개방</span>
          <button class="btn sm ghost" id="backBtn">← 로비</button>
        </div>
        <p class="lead">스테이지를 고르면 모험 준비 화면으로 이동합니다. 각 스테이지는 전용 적 기믹과 보스를 가집니다.</p>
        <div class="stage-list">${cards}</div>
      </div>`);

    $('backBtn').onclick = () => this.showTitle();
    this.root.querySelectorAll('[data-stage]').forEach(el => {
      el.onclick = () => {
        const st = STAGE_BY_KEY[el.dataset.stage];
        if (!isStageUnlocked(st)) {
          const q = questOf(st.unlock);
          this.toast(`잠금 · ${q ? q.name + ' 퀘스트를 먼저 클리어하세요' : '잠겨 있어요'}`, 'bad');
          return;
        }
        this.selectedStage = st.key;
        this.showSelect();
      };
    });
  }

  /* ---------------- 상점 ---------------- */
  showShop() {
    const s = getSave();
    const ups = UPGRADES.map(u => {
      const lv = s.upgrades[u.key] || 0;
      const cost = upgradeCost(u);
      const pips = Array.from({ length: u.max }, (_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('');
      return `<div class="up-card">
        <div class="ico">${u.icon}</div>
        <div class="body">
          <div class="nm">${u.name}<em>${lv}/${u.max}</em></div>
          <div class="ds">${u.desc}</div>
          <div class="pips">${pips}</div>
        </div>
        <div class="buy">${cost == null
          ? '<span class="pill green">MAX</span>'
          : `<button class="btn sm ${s.coins >= cost ? 'gold' : 'ghost'}" data-up="${u.key}" ${s.coins >= cost ? '' : 'disabled'}>🪙 ${cost}</button>`}
        </div>
      </div>`;
    }).join('');
    const ownedChars = CHARACTERS.filter(c => isUnlocked(c));
    const lockedChars = CHARACTERS.filter(c => !isUnlocked(c));
    const ownedList = ownedChars.map(c => `<span class="owned-chip"><img src="${spriteURL(c.id, false)}" alt="">${c.chain[0].name}</span>`).join('');
    const lockedList = lockedChars.map(c => {
      const q = questOf(c.unlockQuest);
      return `<span class="locked-chip">${c.chain[0].name}<em>${q ? '퀘스트 · ' + q.name : '잠금'}</em></span>`;
    }).join('');

    this.screen(`
      <div class="wrap">
        <div class="topbar">
          <h1>💠 영구 강화</h1>
          <span class="spacer"></span>
          <span class="pill gold">🪙 <b>${s.coins}</b></span>
          <span class="pill">✨ <b>${s.dust}</b></span>
          <button class="btn sm ghost" id="backBtn">← 로비</button>
        </div>
        <p class="lead">코인은 모든 모험에서 획득하며, 강화는 영구히 유지됩니다.</p>
        <div class="section-title">능력 강화 <span class="cnt">${Object.values(s.upgrades).reduce((a, b) => a + b, 0)} 레벨</span></div>
        <div class="shop-grid">${ups}</div>
        <div class="section-title">보유 포켓몬 <span class="cnt">${ownedChars.length} / ${CHARACTERS.length}</span></div>
        <div class="owned-row">${ownedList}</div>
        ${lockedChars.length ? `<div class="section-title">퀘스트로 해금 <span class="cnt">${lockedChars.length}종 남음</span></div>
        <div class="locked-row">${lockedList}</div>` : ''}
      </div>`);

    $('backBtn').onclick = () => this.showTitle();
    this.root.querySelectorAll('[data-up]').forEach(el => {
      el.onclick = () => {
        const u = UPGRADES.find(x => x.key === el.dataset.up);
        const r = buyUpgrade(u);
        if (r.ok) { this.toast(`${u.name} Lv.${r.level} 강화!`, 'good'); this.showShop(); }
        else this.toast(r.reason === 'poor' ? '코인이 부족해요' : '이미 최대예요', 'bad');
      };
    });
  }

  /* ---------------- 퀘스트 ---------------- */
  questFilters() {
    if (!this.questFilter) this.questFilter = { status: 'all', cat: 'all', q: '' };
    return this.questFilter;
  }
  questStatus(q) {
    const st = questState(q);
    if (st.claimed) return 'done';
    if (st.done) return 'ready';
    return 'doing';
  }
  questMatches(q) {
    const f = this.questFilters();
    if (f.cat !== 'all' && q.cat !== f.cat) return false;
    const stt = this.questStatus(q);
    if (f.status === 'ready' && stt !== 'ready') return false;
    if (f.status === 'doing' && stt !== 'doing') return false;
    if (f.status === 'done' && stt !== 'done') return false;
    if (f.q) {
      const c = q.reward && q.reward.char ? CHAR_BY_KEY[q.reward.char] : null;
      const hay = [q.name, q.desc || '', q.cat, q.char || '', c ? c.chain[0].name : '', questGoalText(q)].join(' ').toLowerCase();
      if (!hay.includes(f.q)) return false;
    }
    return true;
  }
  countByStatus() {
    const out = { all: 0, ready: 0, doing: 0, done: 0 };
    for (const q of QUESTS) {
      out.all++;
      out[this.questStatus(q)]++;
    }
    return out;
  }

  showQuests() {
    const s = getSave();
    const f = this.questFilters();
    const cnt = this.countByStatus();
    const cats = ['all', ...new Set(QUESTS.map(q => q.cat))];
    this.screen(`
      <div class="wrap">
        <div class="topbar">
          <h1>📜 퀘스트</h1><span class="spacer"></span>
          <span class="pill gold">🪙 <b id="qCoins">${s.coins.toLocaleString()}</b></span>
          <button class="btn sm ghost" id="backBtn">← 로비</button>
        </div>
        <p class="lead">포켓몬 해금 퀘스트 <b>${QUESTS.filter(q => q.reward && q.reward.char).length}종</b> + 성장 퀘스트 <b>${QUESTS.filter(q => !(q.reward && q.reward.char)).length}종</b>. 수령한 보상은 캐릭터·스테이지에 바로 반영됩니다.</p>
        <div class="quest-summary">
          <div><b id="qsAll">${cnt.all}</b><span>전체</span></div>
          <div class="ready"><b id="qsReady">${cnt.ready}</b><span>수령 가능</span></div>
          <div><b id="qsDoing">${cnt.doing}</b><span>진행 중</span></div>
          <div><b id="qsDone">${cnt.done}</b><span>완료</span></div>
        </div>
        <div class="quest-tabs" id="questTabs">
          ${[['all', '전체'], ['ready', '수령 가능'], ['doing', '진행 중'], ['done', '완료']].map(([k, label]) =>
            `<button class="qt ${f.status === k ? 'on' : ''}" data-status="${k}">${label}<em>${cnt[k]}</em></button>`).join('')}
        </div>
        <div class="filter-bar quest-filter">
          <div class="fb-search">
            <span class="fb-ico">🔍</span>
            <input id="questSearch" type="search" placeholder="퀘스트 · 포켓몬 이름으로 찾기" autocomplete="off" value="${f.q.replace(/"/g, '&quot;')}">
          </div>
          <div class="fb-row scroll" id="questCats">
            ${cats.map(c => `<button class="fb-chip ${f.cat === c ? 'on' : ''}" data-cat="${c}">${c === 'all' ? '전체 카테고리' : c}</button>`).join('')}
          </div>
        </div>
        <div class="claim-all-bar">
          <span>수령 가능 <b id="claimCount">${cnt.ready}</b>개</span>
          <button class="btn sm gold" id="claimAllBtn" ${cnt.ready ? '' : 'disabled'}>🎁 보상 모두 수령</button>
        </div>
        <div class="quest-list" id="questList"></div>
        <div class="quest-empty hidden" id="questEmpty">조건에 맞는 퀘스트가 없어요. 필터를 바꿔 보세요.</div>
      </div>`);
    $('backBtn').onclick = () => this.showTitle();
    const onFilter = () => { this.questFilters(); this.renderQuestList(); };
    this.root.querySelectorAll('[data-status]').forEach(el => {
      el.onclick = () => { f.status = el.dataset.status; onFilter(); };
    });
    this.root.querySelectorAll('[data-cat]').forEach(el => {
      el.onclick = () => { f.cat = el.dataset.cat; onFilter(); };
    });
    $('questSearch').oninput = e => { f.q = e.target.value.trim().toLowerCase(); this.renderQuestList(); };
    $('claimAllBtn').onclick = () => {
      let n = 0, coins = 0;
      for (const q of QUESTS) {
        const st = questState(q);
        if (!st.done || st.claimed) continue;
        const r = claimQuest(q);
        if (r.ok) { n++; coins += (q.reward && q.reward.coins) || 0; }
      }
      if (n) this.toast(`🎉 퀘스트 ${n}개 보상 수령! 🪙 +${coins.toLocaleString()}`, 'good');
      else this.toast('수령할 보상이 없어요', 'bad');
      this.questFilters().status = 'all';
      this.showQuests();
    };
    this.renderQuestList();
  }

  renderQuestList() {
    const list = $('questList');
    if (!list) return;
    const f = this.questFilters();
    const cnt = this.countByStatus();
    const s = getSave();
    const rows = QUESTS.filter(q => this.questMatches(q));
    const rank = { ready: 0, doing: 1, done: 2 };
    rows.sort((a, b) => {
      const sa = this.questStatus(a), sb = this.questStatus(b);
      if (rank[sa] !== rank[sb]) return rank[sa] - rank[sb];
      const ta = a.tier || (a.char ? 2 : 0), tb = b.tier || (b.char ? 2 : 0);
      if (ta !== tb) return ta - tb;
      if (sa === 'doing') {
        const pa = questState(a).pct, pb = questState(b).pct;
        if (pa !== pb) return pb - pa;
      }
      return 0;
    });
    list.innerHTML = rows.map(q => {
      const st = questState(q);
      const stt = this.questStatus(q);
      const ch = q.reward && q.reward.char ? CHAR_BY_KEY[q.reward.char] : null;
      const unlocked = ch ? isUnlocked(ch) : true;
      const ico = ch
        ? `<div class="q-ico q-char ${unlocked ? 'open' : ''}"><img loading="lazy" src="${spriteURL(ch.id, false)}" alt=""><em>${q.icon}</em></div>`
        : `<div class="q-ico">${q.icon}</div>`;
      const title = ch ? `${ch.chain[0].name} 해금` : q.cat;
      const parts = st.parts.map(p => `
        <div class="q-part">
          <div class="qp-top"><span>${p.label}</span><b>${p.curText} / ${p.needText}</b></div>
          <div class="q-bar"><i style="width:${stt === 'done' ? 100 : p.pct}%"></i></div>
        </div>`).join('');
      return `<div class="quest-row ${stt}">
        ${ico}
        <div class="q-body">
          <div class="q-top">
            <b>${q.name}</b>
            <span class="q-cat">${title}${q.tier ? ' · ' + '◆'.repeat(q.tier) : ''}</span>
            ${stt === 'ready' ? '<span class="q-tag ready">보상 수령 가능!</span>'
              : stt === 'done' ? '<span class="q-tag">✓ 완료</span>'
              : `<span class="q-prog">${st.pct}%</span>`}
          </div>
          <div class="q-desc">${q.desc || questGoalText(q)}</div>
          <div class="q-parts">${parts}</div>
          <div class="q-reward">보상: ${questRewardText(q) || '—'}</div>
        </div>
        <div class="q-act">
          ${stt === 'done' ? '<span class="pill green">✓</span>'
            : `<button class="btn sm ${stt === 'ready' ? 'gold' : 'ghost'}" data-claim="${q.key}" ${stt === 'ready' ? '' : 'disabled'}>${stt === 'ready' ? '수령' : '진행 중'}</button>`}
        </div>
      </div>`;
    }).join('');
    list.querySelectorAll('[data-claim]').forEach(el => {
      el.onclick = () => {
        const q = QUEST_BY_KEY[el.dataset.claim];
        const r = claimQuest(q);
        if (r.ok) {
          this.toast(`🎉 ${q.name} 보상 획득! ${questRewardText(q)}`, 'good');
          this.showQuests();
        } else this.toast(r.reason === 'notyet' ? '아직 달성하지 못했어요' : '이미 받았어요', 'bad');
      };
    });
    const empty = $('questEmpty');
    if (empty) empty.classList.toggle('hidden', rows.length > 0);
    const all = this.countByStatus();
    if ($('qsAll')) $('qsAll').textContent = all.all;
    if ($('qsReady')) $('qsReady').textContent = all.ready;
    if ($('qsDoing')) $('qsDoing').textContent = all.doing;
    if ($('qsDone')) $('qsDone').textContent = all.done;
    if ($('claimCount')) $('claimCount').textContent = all.ready;
    if ($('qCoins')) $('qCoins').textContent = s.coins.toLocaleString();
    const allBtn = $('claimAllBtn');
    if (allBtn) allBtn.disabled = !all.ready;
    this.root.querySelectorAll('[data-status]').forEach(el => {
      el.classList.toggle('on', el.dataset.status === f.status);
      const n = all[el.dataset.status];
      const em = el.querySelector('em');
      if (em) em.textContent = n;
    });
    this.root.querySelectorAll('[data-cat]').forEach(el => el.classList.toggle('on', el.dataset.cat === f.cat));
  }

  /* ---------------- 도감 ---------------- */
  showDex() {
    const s = getSave();
    const ids = Object.keys(DEX).map(Number).sort((a, b) => a - b);
    const caught = ids.filter(id => s.dexCaught[id]).length;
    const cells = ids.map(id => {
      const seen = !!s.dexSeen[id];
      const c = !!s.dexCaught[id];
      const d = DEX[id];
      return `<div class="dex-cell ${seen ? '' : 'unseen'} ${c ? 'caught' : ''}" title="${seen ? d.n : '???'}">
        <span class="did">#${String(id).padStart(3, '0')}</span>
        <img loading="lazy" src="${spriteURL(id, false)}" alt="">
        <div class="dn">${seen ? d.n : '???'}</div>
      </div>`;
    }).join('');

    this.screen(`
      <div class="wrap">
        <div class="topbar">
          <h1>📖 포켓몬 도감</h1><span class="spacer"></span>
          <span class="pill">포획 <b>${caught}</b> / ${ids.length}</span>
          <button class="btn sm ghost" id="backBtn">← 로비</button>
        </div>
        <div class="dex-legend"><span class="dot caught"></span>포획 <span class="dot seen"></span>목격 <span class="dot"></span>미확인</div>
        <div class="dex-grid">${cells}</div>
      </div>`);
    $('backBtn').onclick = () => this.showTitle();
  }

  /* ---------------- 조합표 ---------------- */
  showCombo() {
    const rows = Object.keys(WEAPONS).filter(id => !WEAPONS[id].super).map(id => {
      const w = WEAPONS[id];
      const p = PASSIVES[w.pair];
      return `<div class="combo-row">
        <span class="ci" style="--cc:${w.color}">${w.icon}</span>
        <div class="cb"><b>${w.name}<em>Lv.${w.max}</em></b><small>${w.desc}</small></div>
        <span class="plus">+</span>
        <span class="ci" style="--cc:${p.color}">${p.icon}</span>
        <div class="cb"><b>${p.name}<em>Lv.1</em></b><small>${p.desc}</small></div>
        <span class="arrow">➜</span>
        <div class="awake-cell" style="--ac:${w.awakeColor}">
          <b>${w.awakeIcon} ${w.awakeName}</b>
          <small>${w.awakeDesc}</small>
        </div>
      </div>`;
    }).join('');

    const superRows = SUPER_AWAKENS.map(s => {
      const a = WEAPONS[s.from[0]], b = WEAPONS[s.from[1]];
      return `<div class="super-row" style="--sc:${s.color}">
        <div class="sr-src">
          <span class="ci" style="--cc:${a.awakeColor}">${a.awakeIcon}</span><b>${a.awakeName}</b>
          <span class="plus">+</span>
          <span class="ci" style="--cc:${b.awakeColor}">${b.awakeIcon}</span><b>${b.awakeName}</b>
        </div>
        <span class="arrow">➜</span>
        <div class="sr-out"><b>${s.icon} ${s.name}</b><small>${s.desc}</small></div>
      </div>`;
    }).join('');

    this.screen(`
      <div class="wrap">
        <div class="topbar">
          <h1>🔗 기술 조합표</h1><span class="spacer"></span>
          <span class="pill">각성 ${Object.keys(WEAPONS).length - SUPER_AWAKENS.length}종 · 초각성 ${SUPER_AWAKENS.length}종</span>
          <button class="btn sm ghost" id="backBtn">← 로비</button>
        </div>
        <div class="combo-note">액티브 기술 <b>Lv.6</b> + 짝 패시브 <b>Lv.1</b> → <b>각성 기술</b>. 레벨업 카드나 보물 상자에서 해금됩니다.</div>
        <div class="section-title">1단계 · 각성 조합 <span class="cnt">액티브 + 패시브</span></div>
        <div class="combo-table">${rows}</div>
        <div class="section-title">2단계 · 초각성 트리 <span class="cnt">각성 + 각성 → 궁극기 ${SUPER_AWAKENS.length}종</span></div>
        <div class="combo-note super">각성 기술 <b>2개</b>를 보유하면 레벨업·상자에서 <b>초각성</b> 카드가 등장합니다. 각성 22종이 모두 최소 하나의 초각성 조합에 쓰이며, 궁극기마다 전투 방식이 다릅니다.</div>
        <div class="super-table">${superRows}</div>
      </div>`);
    $('backBtn').onclick = () => this.showTitle();
  }

  /* ---------------- 설정 ---------------- */
  showSettings() {
    const s = getSave();
    const v = s.settings;
    this.screen(`
      <div class="wrap narrow">
        <div class="topbar">
          <h1>⚙️ 설정</h1><span class="spacer"></span>
          <button class="btn sm ghost" id="backBtn">← 로비</button>
        </div>
        <div class="settings-card">
          <div class="set-row"><div><b>효과음</b><small>공격·폭발 사운드</small></div><button class="btn sm ${v.sfx ? 'green' : 'ghost'}" id="setSfx">${v.sfx ? '켜짐' : '꺼짐'}</button></div>
          <div class="set-row"><div><b>울음소리</b><small>포켓몬 울음</small></div><button class="btn sm ${v.cries ? 'green' : 'ghost'}" id="setCry">${v.cries ? '켜짐' : '꺼짐'}</button></div>
          <div class="set-row"><div><b>화면 흔들림</b><small>피격·폭발 시 화면 진동</small></div><button class="btn sm ${v.shake !== false ? 'green' : 'ghost'}" id="setShake">${v.shake !== false ? 'ON' : 'OFF'}</button></div>
          <div class="set-row col">
            <div><b>시야 · 캐릭터 크기</b><small>캐릭터를 작게 보면 맵을 넓게 볼 수 있어요</small></div>
            <div class="view-opts" id="viewOpts">
              ${Object.entries(VIEW_MODES).map(([k, m]) => `<button class="btn sm ${v.view === k ? 'primary' : 'ghost'}" data-view="${k}">${m.name}</button>`).join('')}
            </div>
          </div>
        </div>
        <div class="settings-card soft">
          <div class="set-row"><div><b>저장 데이터</b><small>진행 상황은 브라우저 localStorage에 저장됩니다</small></div><span class="pill">v5</span></div>
          <div class="set-row"><div><b>누적 플레이</b><small>${Math.floor((s.stats.playTime || 0) / 60)}분 · 모험 ${s.stats.runs}회 · 해금 ${s.unlocked.length}/${CHARACTERS.length}종</small></div></div>
        </div>
        <div class="settings-card danger-zone">
          <div class="set-row">
            <div><b>🗑️ 진행사항 초기화</b><small>코인 · 영구강화 · 해금 포켓몬/스테이지 · 퀘스트 · 도감 · 기록을 모두 지우고 스타터 ${STARTER_KEYS.length}종으로 새로 시작합니다. (설정은 유지)</small></div>
            <button class="btn sm danger" id="resetBtn">진행사항 초기화</button>
          </div>
        </div>
      </div>`);
    $('backBtn').onclick = () => this.showTitle();
    const rb = $('resetBtn');
    if (rb) rb.onclick = () => this.confirmReset(1);
    $('setSfx').onclick = () => { const v = toggleSetting('sfx'); setSfxEnabled(v); this.showSettings(); };
    $('setCry').onclick = () => { const v = toggleSetting('cries'); setCryEnabled(v); this.showSettings(); };
    $('setShake').onclick = () => { toggleSetting('shake'); if (this.game) this.game.applySettings(); this.showSettings(); };
    this.root.querySelectorAll('[data-view]').forEach(el => {
      el.onclick = () => {
        setSetting('view', el.dataset.view);
        if (this.game) this.game.resize();
        this.showSettings();
      };
    });
  }

  /* ---------------- 진행사항 초기화 (2중 확인) ---------------- */
  confirmReset(step) {
    const s = getSave();
    if (step === 1) {
      this.showPanel('confirmPanel', `
        <div class="cf-kicker">DANGER ZONE</div>
        <h2>진행사항을 초기화할까요?</h2>
        <p class="np-lead">모든 진행이 사라지고 <b>스타터 ${STARTER_KEYS.length}종</b>만 열린 처음 상태가 됩니다.</p>
        <div class="cf-box">
          <div><span>🪙 코인</span><b>${s.coins.toLocaleString()}</b></div>
          <div><span>🐾 해금 포켓몬</span><b>${s.unlocked.length} / ${CHARACTERS.length}</b></div>
          <div><span>🗺️ 개방 스테이지</span><b>${s.stages.length} / ${STAGES.length}</b></div>
          <div><span>📜 수령한 퀘스트</span><b>${Object.keys(s.questsClaimed).length}</b></div>
          <div><span>📖 도감 포획</span><b>${Object.keys(s.dexCaught).length}</b></div>
          <div><span>⚔️ 모험 기록</span><b>${s.stats.runs}회</b></div>
        </div>
        <div class="cf-actions">
          <button class="btn ghost" id="cfCancel">취소</button>
          <button class="btn danger" id="cfNext">계속 →</button>
        </div>`);
      $('cfCancel').onclick = () => this.hidePanel('confirmPanel');
      $('cfNext').onclick = () => this.confirmReset(2);
      return;
    }
    this.showPanel('confirmPanel', `
      <div class="cf-kicker">LAST CHECK</div>
      <h2>정말 되돌릴 수 없어요</h2>
      <p class="np-lead">코인·영구강화·모든 해금과 기록이 즉시 삭제됩니다.<br>그래도 초기화하려면 아래 확인란을 체크하세요.</p>
      <label class="cf-check" id="cfCheckLabel">
        <input type="checkbox" id="cfCheck">
        <span>위 내용을 확인했고, 되돌릴 수 없음을 이해했습니다.</span>
      </label>
      <div class="cf-actions">
        <button class="btn ghost" id="cfCancel2">취소</button>
        <button class="btn danger" id="cfRun" disabled>🗑️ 초기화 실행</button>
      </div>`);
    $('cfCancel2').onclick = () => this.hidePanel('confirmPanel');
    $('cfCheck').onchange = e => { $('cfRun').disabled = !e.target.checked; };
    $('cfRun').onclick = () => {
      if (!$('cfCheck').checked) return;
      resetProgress();
      this.hidePanel('confirmPanel');
      this.selectedChar = STARTER_KEYS[0];
      this.selectedStage = STAGES[0].key;
      this.shinyPref = false;
      this.questFilter = { status: 'all', cat: 'all', q: '' };
      if (this.game) this.game.applySettings();
      this.toast('🗑️ 진행사항을 초기화했어요. 스타터 5종으로 새 출발!', 'good');
      this.showTitle();
    };
  }

  /* ---------------- HUD ---------------- */
  hudShow(v) { $('hud').classList.toggle('hidden', !v); }

  hudUpdate(g) {
    const p = g.player;
    if (!p) return;
    const hpPct = Math.max(0, p.hp / p.maxHp);
    const hpBar = $('hpBar');
    hpBar.style.width = (hpPct * 100) + '%';
    hpBar.classList.toggle('low', hpPct < 0.3);
    $('hpText').textContent = `${Math.ceil(p.hp)} / ${Math.round(p.maxHp)}`;
    $('hudLevel').textContent = 'Lv.' + p.level;
    $('hudName').textContent = g.currentStageName();
    $('timer').textContent = this.fmtTime(g.time);
    $('stageTag').textContent = g.stage.emoji ? g.stage.emoji + ' ' + g.stage.name : g.stage.name;
    $('killCount').textContent = g.kills;
    $('coinCount').textContent = Math.round(g.runCoins);
    const xpPct = Math.min(100, p.xp / p.xpNext * 100);
    $('xpBar').style.width = xpPct + '%';
    $('xpText').textContent = Math.floor(xpPct) + '%';

    const portrait = $('hudPortrait');
    const src = spriteURL(g.currentStage(), p.shiny);
    if (portrait.getAttribute('src') !== src) portrait.setAttribute('src', src);

    /* 진화/메가 퀘스트 패널 */
    const qi = g.questInfo ? g.questInfo() : null;
    const qEl = $('questHud');
    if (qEl && qi) {
      const key = qi.title + '|' + qi.prog.text + '|' + qi.prog.pct;
      if (qEl.dataset.k !== key) {
        qEl.dataset.k = key;
        qEl.className = 'quest-hud ' + qi.kind;
        qEl.innerHTML = `<div class="qh-top"><span>${qi.kind === 'special' ? '★' : qi.kind === 'done' ? '✓' : ''} ${qi.title}</span><b>${qi.prog.pct}%</b></div>
          <div class="qh-bar"><i style="width:${qi.prog.pct}%"></i></div>
          <div class="qh-text">${qi.prog.text}</div>`;
      }
    }

    const sig = p.weaponList.map(w => `${w.id}${w.lv}${w.awake ? '!' : ''}`).join(',') + `#${g.awakenCount}_${g.superCount}`;
    if (sig !== this.lastWeaponSig) {
      this.lastWeaponSig = sig;
      $('weaponRow').innerHTML = p.weaponList.map(w => {
        const d = WEAPONS[w.id];
        if (!d) return '';
        const ready = g.canAwaken(w);
        const isSuper = !!d.super;
        return `<div class="wp ${w.awake ? 'awake' : ''} ${ready ? 'ready' : ''} ${isSuper ? 'super' : ''}" title="${w.awake ? d.awakeName : d.name} Lv.${w.lv}${ready ? ' · 각성 가능!' : ''}">
          <span>${w.awake ? d.awakeIcon : d.icon}</span><b>${isSuper ? '★' : w.awake ? '★' : w.lv}</b>
        </div>`;
      }).join('');
    }

    /* 패시브 아이콘 (기술 HUD와 같은 스택 안, 별도 줄) */
    const pvList = Object.keys(p.passives || {});
    const pvSig = pvList.map(k => k + p.passives[k]).join(',');
    if (pvSig !== this.lastPassiveSig) {
      this.lastPassiveSig = pvSig;
      const pvRow = $('passiveRow');
      if (pvRow) pvRow.innerHTML = pvList.map(k => {
        const d = PASSIVES[k];
        if (!d) return '';
        return `<div class="wp pv" title="${d.name} Lv.${p.passives[k]}"><span>${d.icon}</span><b>${p.passives[k]}</b></div>`;
      }).join('');
    }

    let boss = null;
    for (const e of g.enemies) if (e.boss && !e.dead && (!boss || e.hp > boss.hp)) boss = e;
    const bb = $('bossBar');
    if (boss) {
      bb.classList.remove('hidden');
      $('bossName').textContent = (boss.final ? '👑 ' : '') + boss.name + (boss.pattern ? ` · ${({ring:'탄막',barrage:'탄막',charge:'돌진',beam:'빔',summon:'소환',all:'전체'})[boss.pattern] || ''}` : '');
      $('bossFill').style.width = Math.max(0, boss.hp / boss.maxHp * 100) + '%';
      $('bossHpText').textContent = `${Math.max(0, Math.ceil(boss.hp))} / ${Math.round(boss.maxHp)}`;
    } else bb.classList.add('hidden');
  }

  /* ---------------- 레벨업 ---------------- */
  showLevelUp(g, cards) {
    this.game = g;
    const list = $('cardList');
    list.innerHTML = cards.map((c, i) => {
      const kind = c.type === 'weapon' ? '액티브 기술' : c.type === 'passive' ? '패시브' : c.type === 'awaken' ? '각성 기술' : c.type === 'super' ? '초각성 기술' : '보너스';
      const lvTxt = c.type === 'heal' || c.type === 'coin' ? '즉시'
        : c.type === 'awaken' ? 'Lv.6 → 각성'
        : c.type === 'super' ? '각성 2개 합성'
        : c.isNew ? 'Lv.1 습득' : `Lv.${c.lv} → ${c.lv + 1}`;
      const combo = c.type === 'super'
        ? `<div class="c-combo super">★ ${c.from.map(w => w.awakeName).join(' + ')} → ${c.name}</div>`
        : c.type === 'awaken'
        ? `<div class="c-combo ready"><b>조합 완성!</b> ${c.pairIcon}${c.pairName} Lv.1 보유 — 지금 바로 각성</div>`
        : c.type === 'passive' && c.comboHint
          ? `<div class="c-combo ${c.comboReady && c.comboReady.length ? 'ready' : ''}">${c.comboReady && c.comboReady.length ? '⚡ ' : ''}${c.comboHint}</div>`
          : c.type === 'weapon' && c.hint
            ? `<div class="c-combo ${c.pairOk ? 'ready' : ''}">${c.hint}</div>` : '';
      const cls = c.type === 'awaken' ? 'card-awake' : c.type === 'super' ? 'card-super' : '';
      return `<button class="card ${cls}" data-i="${i}" style="--cc:${c.color || '#60a5fa'}">
        <div class="c-top">
          <div class="c-icon">${c.icon}</div>
          <div style="min-width:0">
            <div class="c-name">${c.name}${c.affinity ? ' <span class="aff-star">★</span>' : ''}</div>
            <div class="c-kind">${kind}</div>
          </div>
        </div>
        ${c.type === 'super' ? `<div class="c-formula">${c.from.map(w => w.icon + w.awakeName).join(' <b>+</b> ')}</div>` : ''}
        ${c.type === 'awaken' ? `<div class="c-formula">${c.fromIcon}${c.fromName} <b>Lv.6</b> + ${c.pairIcon}${c.pairName} <b>Lv.1</b></div>` : ''}
        <div class="c-desc">${c.desc}</div>
        ${combo}
        <div class="c-foot">
          <span class="lvchip">${lvTxt}</span>
          ${c.isNew ? '<span class="newchip">NEW</span>' : c.type === 'awaken' ? '<span class="awakechip">각성</span>' : c.type === 'super' ? '<span class="superchip">초각성</span>' : c.awake ? '<span class="awake">MAX</span>' : ''}
        </div>
      </button>`;
    }).join('');
    $('levelupOverlay').classList.remove('hidden');
    list.querySelectorAll('[data-i]').forEach(el => {
      el.onclick = () => {
        this.hideLevelUp();
        g.pickCard(cards[+el.dataset.i]);
      };
    });
    this.hudUpdate(g);
  }
  hideLevelUp() { $('levelupOverlay').classList.add('hidden'); }

  /* ---------------- 진화 / 메가 ---------------- */
  showEvolve(g, info) {
    const special = info.special;
    $('evoKicker').textContent = special ? (special === 'gmax' ? 'GIGANTAMAX' : 'MEGA EVOLUTION') : info.awaken ? 'LIMIT BREAK' : 'EVOLUTION';
    $('evoFrom').src = spriteURL(info.from, g.player.shiny);
    $('evoTo').src = spriteURL(info.to, g.player.shiny);
    $('evoName').textContent = info.name;
    $('evoDesc').textContent = special
      ? (special === 'gmax' ? '거다이맥스! 거대화한 힘이 전장을 뒤흔든다.' : '메가진화! 숨겨진 힘이 폭발한다.')
      : info.awaken ? '퀘스트를 달성해 한계를 넘어섰다! 모든 능력과 기술이 강화되었다.'
      : '진화 퀘스트 달성! 새로운 모습으로 진화했다. 체력·공격·기술이 모두 강화된다.';
    $('evoOverlay').classList.remove('hidden');
    const close = () => {
      $('evoOverlay').classList.add('hidden');
      $('evoOk').onclick = null;
      g.resumeFromEvo();
    };
    $('evoOk').onclick = close;
  }

  showBranch(g, options) {
    const wmap = { 134: 'water', 135: 'thunder', 136: 'flame', 196: 'psychic', 197: 'nightmare' };
    $('branchList').innerHTML = options.map(id => `
      <button class="branch" data-id="${id}">
        <img src="${spriteURL(id, false)}" alt="${BRANCH_NAMES[id]}">
        <b>${BRANCH_NAMES[id]}</b>
        <small>${WEAPONS[wmap[id]].name} 습득</small>
      </button>`).join('');
    $('branchOverlay').classList.remove('hidden');
    $('branchList').querySelectorAll('[data-id]').forEach(el => {
      el.onclick = () => {
        $('branchOverlay').classList.add('hidden');
        g.chooseBranch(+el.dataset.id);
      };
    });
  }

  /* ---------------- 일시정지 ---------------- */
  showPause(settings) {
    this.game = this.game || window.__game;
    $('pauseOverlay').classList.remove('hidden');
    $('soundBtn').textContent = '효과음: ' + (settings.sfx ? '켜짐' : '꺼짐');
    $('cryBtn').textContent = '울음소리: ' + (settings.cries ? '켜짐' : '꺼짐');
    const shakeBtn = $('shakeBtn');
    if (shakeBtn) shakeBtn.textContent = '화면 흔들림: ' + (settings.shake !== false ? 'ON' : 'OFF');
    const viewBtn = $('viewBtn');
    if (viewBtn) viewBtn.textContent = '시야: ' + (VIEW_MODES[settings.view] || VIEW_MODES.wide).name;
    this.renderRunSummary();
    this.renderComboTable();
    this.renderQuestPanel();
    this.pauseTab('pause');
  }

  pauseTab(name) {
    this.pauseTabName = name;
    ['pause', 'map', 'combo'].forEach(k => {
      const btn = $('ptab-' + k);
      if (btn) btn.classList.toggle('on', k === name);
      const panel = $('tab-' + k);
      if (panel) panel.classList.toggle('hidden', k !== name);
    });
    $('pausePanel').classList.toggle('wide', name !== 'pause');
    if (name === 'map') {
      requestAnimationFrame(() => {
        if (this.game) this.game.drawMinimapTo($('pauseMap'));
        this.renderMapInfo();
      });
    }
    if (name === 'combo') this.renderComboTable();
  }

  renderRunSummary() {
    const g = this.game;
    const el = $('runSummary');
    if (!el || !g || !g.player) return;
    const p = g.player;
    const list = p.weaponList.map(w => {
      const d = WEAPONS[w.id];
      if (!d) return '';
      return `<span class="sum-w ${w.awake ? 'on' : ''} ${d.super ? 'sup' : ''}">${w.awake ? d.awakeIcon : d.icon}${d.super ? d.name : (w.awake ? d.awakeName : d.name)}<em>${d.super ? '초각성' : w.awake ? '각성' : 'Lv.' + w.lv}</em></span>`;
    }).join('');
    el.innerHTML = `<div class="sum-top"><b>${g.currentStageName()}</b><span>Lv.${p.level} · ${this.fmtTime(g.time)} · 처치 ${g.kills}</span></div>
      <div class="sum-weapons">${list}</div>
      <div class="sum-meta">각성 ${g.awakenCount} · 초각성 ${g.superCount} · 메가/거다이 ${g.specialDone ? 1 : 0} · 아이템 ${g.itemsCollected} · 코인 ${Math.round(g.runCoins)}</div>`;
  }

  renderQuestPanel() {
    const g = this.game;
    const el = $('pauseQuest');
    if (!el || !g || !g.questInfo) return;
    const qi = g.questInfo();
    el.innerHTML = `<div class="pq-head"><b>${qi.kind === 'special' ? '★' : qi.kind === 'done' ? '✓' : ''} ${qi.title}</b><span>${qi.prog.pct}%</span></div>
      <div class="q-bar"><i style="width:${qi.prog.pct}%"></i></div>
      <div class="pq-text">${qi.prog.text}</div>
      <div class="pq-sub">${qi.quest ? '달성하면 자동으로 진화/변신합니다' : '모든 진화 퀘스트를 완료했습니다'}</div>`;
  }

  renderMapInfo() {
    const g = this.game;
    const el = $('mapInfo');
    if (!el || !g || !g.player) return;
    const bosses = g.enemies.filter(e => e.boss && !e.dead).length;
    const legends = g.enemies.filter(e => e.legend && !e.dead).length;
    const chests = g.pickups.filter(i => i.kind === 'chest').length;
    el.innerHTML = `
      <div class="mi"><b>${Math.round(g.player.x)}, ${Math.round(g.player.y)}</b><span>현재 위치</span></div>
      <div class="mi"><b>${bosses}</b><span>보스</span></div>
      <div class="mi"><b>${legends}</b><span>환상</span></div>
      <div class="mi"><b>${chests}</b><span>보물상자</span></div>
      <div class="mi"><b>${g.fieldItems.length}</b><span>필드 아이템</span></div>
      <div class="mi"><b>${g.props.filter(p => !p.dead).length}</b><span>파괴 오브젝트</span></div>`;
  }

  renderComboTable() {
    const g = this.game;
    const el = $('comboList');
    if (!el || !g || !g.player) return;
    const p = g.player;
    const owned = new Map(p.weaponList.map(w => [w.id, w]));
    const rows = Object.keys(WEAPONS).filter(id => !WEAPONS[id].super).map(id => {
      const d = WEAPONS[id];
      const pd = PASSIVES[d.pair];
      const w = owned.get(id);
      const pairLv = p.passives[d.pair] || 0;
      let state = 'locked', stateTxt = '미습득';
      if (w) {
        if (w.awake) { state = 'awake'; stateTxt = '각성 완료'; }
        else if (g.canAwaken(w)) { state = 'ready'; stateTxt = '각성 가능!'; }
        else if (w.lv >= d.max && pairLv < 1) { state = 'needpair'; stateTxt = '패시브 필요'; }
        else { state = 'grow'; stateTxt = `Lv.${w.lv} / ${d.max}`; }
      }
      return `<div class="combo-line ${state}">
        <span class="cl-icon">${d.icon}</span>
        <div class="cl-name"><b>${d.name}</b><small>${w ? (w.awake ? d.awakeIcon + ' ' + d.awakeName : 'Lv.' + w.lv + ' / ' + d.max) : '미습득'}</small></div>
        <span class="cl-plus">+</span>
        <span class="cl-icon">${pd.icon}</span>
        <div class="cl-name"><b>${pd.name}</b><small>Lv.${pairLv}${pairLv ? '' : ' (필요)'}</small></div>
        <span class="cl-state ${state}">${stateTxt}</span>
      </div>`;
    }).join('');
    const supers = SUPER_AWAKENS.map(s => {
      const ready = s.from.every(id => { const w = owned.get(id); return w && w.awake; });
      const done = owned.has('super_' + s.key);
      return `<div class="combo-line ${done ? 'awake' : ready ? 'ready' : 'locked'} super">
        <span class="cl-icon">${s.icon}</span>
        <div class="cl-name"><b>${s.name}</b><small>${s.from.map(id => WEAPONS[id].awakeName).join(' + ')}</small></div>
        <span class="cl-state ${done ? 'awake' : ready ? 'ready' : 'locked'}">${done ? '초각성 완료' : ready ? '합성 가능!' : '각성 2개 필요'}</span>
      </div>`;
    }).join('');
    const aff = (g.char.affinity || []).map(id => `<span class="aff-chip">${AFFINITY_LABEL(id)}</span>`).join('');
    el.innerHTML = `<div class="combo-hintline">액티브 <b>Lv.6</b> + 짝 패시브 <b>Lv.1</b> → <b>각성</b> · 각성 2개 보유 시 레벨업/상자에서 <b>초각성</b></div>
      <div class="combo-aff">${g.char.chain[0].name} 친화 기술: ${aff}</div>
      <div class="combo-scroll">${rows}</div>
      <div class="combo-subtitle">초각성</div>
      <div class="combo-scroll">${supers}</div>`;
  }

  hidePause() { $('pauseOverlay').classList.add('hidden'); }

  /* ---------------- 결과 ---------------- */
  showResult(g, r) {
    const win = r.win;
    this.hudShow(false);
    const html = `
      <div class="result-card ${win ? 'win' : 'lose'}">
        <div class="res-kicker">${win ? 'STAGE CLEAR' : 'GAME OVER'}</div>
        <h2>${win ? '승리!' : '모험 종료'}</h2>
        <div class="res-sub">${win ? r.stageName + ' 클리어 — 전설을 넘어섰다!' : '다시 도전하면 더 강해진다'}</div>
        <img class="res-hero" src="${spriteURL(r.charId, r.shiny)}" alt="">
        <div class="res-grid">
          <div class="rg"><b>${this.fmtTime(r.time)}</b><span>생존 시간</span></div>
          <div class="rg"><b>${r.level}</b><span>최종 레벨</span></div>
          <div class="rg"><b>${r.kills}</b><span>처치</span></div>
          <div class="rg"><b>${r.bosses}</b><span>보스</span></div>
          <div class="rg"><b>${r.awakens || 0}</b><span>각성</span></div>
          <div class="rg"><b>${r.supers || 0}</b><span>초각성</span></div>
          <div class="rg"><b>${r.megas || 0}</b><span>메가·거다이</span></div>
          <div class="rg"><b>${r.chests || 0}</b><span>상자</span></div>
        </div>
        <div class="res-weapons">${(r.weapons || []).map(w => {
          const d = WEAPONS[w.id];
          if (!d) return '';
          const nm = d.super ? d.name : w.awake ? d.awakeName : d.name;
          return `<span class="rw ${w.awake ? 'on' : ''}">${w.awake ? d.awakeIcon : d.icon}${nm}<em>${d.super ? '초각성' : w.awake ? '각성' : 'Lv.' + w.lv}</em></span>`;
        }).join('')}</div>
        <div class="reward">
          <div><b>+${r.coins}</b><span>🪙 코인</span></div>
          <div><b>+${r.dust}</b><span>✨ 별의모래</span></div>
        </div>
        <div class="res-actions">
          <button class="btn primary" id="againBtn">🔁 다시 도전</button>
          <button class="btn ghost" id="lobbyBtn">🏠 로비로</button>
        </div>
      </div>`;
    this.clear();
    const d = document.createElement('div');
    d.className = 'screen result-screen';
    d.innerHTML = html;
    this.root.appendChild(d);
    $('againBtn').onclick = () => this.onStart && this.onStart({ charKey: r.charKey, stageKey: r.stageKey, shiny: r.shiny });
    $('lobbyBtn').onclick = () => { this.clear(); this.showTitle(); };
  }

  hideAllOverlays() {
    ['levelupOverlay', 'evoOverlay', 'branchOverlay', 'pauseOverlay'].forEach(id => { const el = $(id); if (el) el.classList.add('hidden'); });
    $('hud').classList.add('hidden');
    this.clear();
  }
}

void FIELD_ITEMS; void isPassiveUnlocked; void isFieldUnlocked; void persist; void BRANCH_NAMES;
