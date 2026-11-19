/* ============================================================
   UI — 밝고 산뜻한 로비 / 도감 / 조합표 / 퀘스트 / 설정 / HUD
   ============================================================ */
import {
  CHARACTERS, CHAR_BY_KEY, STAGES, DEX, WEAPONS, PASSIVES, UPGRADES,
  TYPE_COLORS, BRANCH_NAMES, FIELD_ITEMS, SUPER_AWAKENS, QUESTS, QUEST_BY_KEY, VIEW_MODES
} from './data.js?v=22';
import { spriteURL } from './sprites.js?v=22';
import { setCryEnabled } from './sprites.js?v=22';
import { setSfxEnabled } from './audio.js?v=22';
import {
  getSave, upgradeCost, buyUpgrade, isUnlocked, isStageUnlocked, isPassiveUnlocked,
  isFieldUnlocked, questState, claimQuest, questRewardText, setSetting, toggleSetting, persist
} from './save.js?v=22';

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
              <p>26마리의 포켓몬 · 7개 세계 · 각성과 초각성의 생존 모험</p>
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
    return div;
  }

  nextQuest() {
    for (const q of QUESTS) {
      const st = questState(q);
      if (st.done && !st.claimed) return q;
    }
    return null;
  }
  unclaimedCount() {
    return QUESTS.filter(q => { const st = questState(q); return st.done && !st.claimed; }).length;
  }

  /* ---------------- 모험 준비 ---------------- */
  showSelect() {
    const s = getSave();
    const stageChips = STAGES.map(st => {
      const open = isStageUnlocked(st);
      const cleared = s.cleared.includes(st.key);
      return `<button class="stage-chip ${this.selectedStage === st.key ? 'on' : ''} ${open ? '' : 'locked'}" data-stage="${st.key}">
        <span class="sc-emoji">${st.emoji}</span>
        <span class="sc-nm">${st.name}</span>
        ${cleared ? '<span class="sc-clear">CLEAR</span>' : open ? `<span class="sc-diff">${'◆'.repeat(Math.min(4, st.reward))}</span>` : '<span class="sc-lock">잠금</span>'}
      </button>`;
    }).join('');

    const charCards = CHARACTERS.map(c => {
      const unlocked = isUnlocked(c);
      const owned = !!s.shiny[c.key];
      const on = this.selectedChar === c.key;
      const unlockedNow = c.unlockQuest && questState(questOf(c.unlockQuest)).claimed;
      return `<button class="char-card ${on ? 'on' : ''} ${unlocked ? '' : 'locked'} ${unlockedNow ? 'newly' : ''}" data-char="${c.key}">
        ${owned ? '<span class="shiny-dot">✦</span>' : ''}
        <img loading="lazy" src="${spriteURL(c.id, false)}" alt="${c.chain[0].name}">
        <div class="cc-name">${c.chain[0].name}</div>
        <div class="cc-rank ${c.rank === '전설' ? 'legend' : c.rank === '환상' ? 'myth' : ''}">${unlocked ? c.rank : '퀘스트'}</div>
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
        <div class="section-title">포켓몬 <span class="cnt">${s.unlocked.length} / ${CHARACTERS.length} 해금</span></div>
        <div class="char-grid">${charCards}</div>
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
    this.root.querySelectorAll('[data-char]').forEach(el => {
      el.onclick = () => {
        const c = CHAR_BY_KEY[el.dataset.char];
        if (!isUnlocked(c)) {
          const q = questOf(c.unlockQuest);
          this.toast(`잠금 · ${q ? q.name : '퀘스트'} 달성 후 해금!`, 'bad');
          return;
        }
        this.selectedChar = c.key;
        if (!getSave().shiny[c.key]) this.shinyPref = false;
        this.root.querySelectorAll('.char-card').forEach(x => x.classList.toggle('on', x.dataset.char === c.key));
        this.renderStartPanel();
      };
    });
    $('backBtn').onclick = () => this.showTitle();
    this.renderStartPanel();
  }

  renderStartPanel() {
    const c = CHAR_BY_KEY[this.selectedChar];
    const s = getSave();
    const st = STAGE_BY_KEY[this.selectedStage];
    const owned = !!s.shiny[c.key];
    if (!owned) this.shinyPref = false;
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
  showQuests() {
    const s = getSave();
    const cats = [...new Set(QUESTS.map(q => q.cat))];
    const rows = cats.map(cat => {
      const list = QUESTS.filter(q => q.cat === cat).map(q => {
        const st = questState(q);
        const q2 = questOf(q.key);
        const rw = questRewardText(q);
        return `<div class="quest-row ${st.claimed ? 'claimed' : st.done ? 'done' : ''}">
          <div class="q-ico">${q.icon}</div>
          <div class="q-body">
            <div class="q-top"><b>${q.name}</b>${st.claimed ? '<span class="q-tag">수령 완료</span>' : st.done ? '<span class="q-tag ready">보상 수령 가능!</span>' : `<span class="q-prog">${st.cur} / ${st.need}</span>`}</div>
            <div class="q-desc">${q.desc}</div>
            <div class="q-bar"><i style="width:${st.claimed ? 100 : st.pct}%"></i></div>
            <div class="q-reward">보상: ${rw || '—'}</div>
          </div>
          <div class="q-act">${st.claimed ? '<span class="pill">✓</span>' : `<button class="btn sm ${st.done ? 'gold' : 'ghost'}" data-claim="${q.key}" ${st.done ? '' : 'disabled'}>${st.done ? '수령' : '진행 중'}</button>`}</div>
        </div>`;
      }).join('');
      return `<div class="section-title">${cat} <span class="cnt">${QUESTS.filter(q => q.cat === cat && questState(q).claimed).length} / ${QUESTS.filter(q => q.cat === cat).length}</span></div><div class="quest-list">${list}</div>`;
    }).join('');

    this.screen(`
      <div class="wrap">
        <div class="topbar">
          <h1>📜 퀘스트</h1><span class="spacer"></span>
          <span class="pill">🪙 <b id="qCoins">${s.coins}</b></span>
          <button class="btn sm ghost" id="backBtn">← 로비</button>
        </div>
        <p class="lead">퀘스트를 달성하면 캐릭터·스테이지·패시브·필드 아이템이 해금됩니다. 진행도는 자동으로 기록돼요.</p>
        <div class="claim-all-bar"><span>수령 가능 <b id="claimCount">${this.unclaimedCount()}</b>개</span><button class="btn sm gold" id="claimAllBtn" ${this.unclaimedCount() ? '' : 'disabled'}>모두 수령</button></div>
        ${rows}
      </div>`);

    $('backBtn').onclick = () => this.showTitle();
    const claim = key => {
      const q = QUEST_BY_KEY[key];
      const r = claimQuest(q);
      if (r.ok) {
        this.toast(`🎉 ${q.name} 보상 획득! ${questRewardText(q)}`, 'good');
        this.showQuests();
      } else this.toast(r.reason === 'notyet' ? '아직 달성하지 못했어요' : '이미 받았어요', 'bad');
    };
    this.root.querySelectorAll('[data-claim]').forEach(el => { el.onclick = () => claim(el.dataset.claim); });
    const allBtn = $('claimAllBtn');
    if (allBtn) allBtn.onclick = () => {
      for (const q of QUESTS) {
        const st = questState(q);
        if (st.done && !st.claimed) claimQuest(q);
      }
      this.toast('모든 보상을 수령했어요!', 'good');
      this.showQuests();
    };
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
        <div class="section-title">2단계 · 초각성 트리 <span class="cnt">각성 + 각성 → 궁극기</span></div>
        <div class="combo-note super">각성 기술 <b>2개</b>를 보유하면 레벨업·상자에서 <b>초각성</b> 카드가 등장합니다. 두 기술이 하나로 합쳐져 훨씬 강력해집니다.</div>
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
          <div class="set-row"><div><b>저장 데이터</b><small>진행 상황은 브라우저 localStorage에 저장됩니다</small></div><span class="pill">v4</span></div>
          <div class="set-row"><div><b>누적 플레이</b><small>${Math.floor((s.stats.playTime || 0) / 60)}분 · 모험 ${s.stats.runs}회</small></div></div>
        </div>
      </div>`);
    $('backBtn').onclick = () => this.showTitle();
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
