/* ============================================================
   UI — 화면(타이틀/선택/상점/도감/결과) 및 HUD
   ============================================================ */
import { CHARACTERS, CHAR_BY_KEY, STAGES, DEX, WEAPONS, PASSIVES, UPGRADES, TYPE_COLORS, BRANCH_NAMES, FIELD_ITEMS } from './data.js?v=20';
import { spriteURL, getSprite } from './sprites.js?v=20';
import { getSave, upgradeCost, buyUpgrade, isUnlocked, unlockChar, metaMods } from './save.js?v=20';

const $ = id => document.getElementById(id);

const AFFINITY_LABEL = id => WEAPONS[id] ? `${WEAPONS[id].icon}${WEAPONS[id].name}` : id;

export class UI {
  constructor() {
    this.root = $('screenRoot');
    this.selectedChar = CHARACTERS[0].key;
    this.selectedStage = STAGES[0].key;
    this.shinyPref = false;
    this.onStart = null;
    this.onShop = null;
    this.onTitle = null;
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

  /* ---------------- 타이틀 ---------------- */
  showTitle() {
    const s = getSave();
    const cleared = s.cleared.length;
    const div = this.screen(`
      <div class="title-screen">
        <div class="ball-anim"><div class="pokeball"></div></div>
        <div class="logo-badge">POKÉMON ROGUELIKE SURVIVOR</div>
        <h1 class="logo">포켓 서바이버<small>POKE SURVIVOR</small></h1>
        <p class="tagline">20종의 포켓몬 · 기술 조합 각성 · 진화와 이로치<br>15분을 버텨 최종 보스를 쓰러뜨려라</p>
        <div class="title-menu">
          <button class="btn primary" id="btnPlay">⚔️ 모험 시작<span class="sub">포켓몬 선택</span></button>
          <button class="btn blue" id="btnShop">💠 영구 강화<span class="sub">${s.coins} 코인</span></button>
          <button class="btn ghost" id="btnDex">📖 도감 · 조합표<span class="sub">${Object.keys(s.dexCaught).length} / ${Object.keys(DEX).length}</span></button>
        </div>
        <div class="title-stats">
          <div class="stat"><b>${s.wins}</b><span>클리어</span></div>
          <div class="stat"><b>${s.runs}</b><span>도전</span></div>
          <div class="stat"><b>${s.kills.toLocaleString()}</b><span>처치</span></div>
          <div class="stat"><b>${s.coins}</b><span>코인</span></div>
          <div class="stat"><b>${s.dust}</b><span>별의모래</span></div>
          <div class="stat"><b>${cleared}/3</b><span>스테이지</span></div>
        </div>
        <p class="tiny" style="margin-top:20px">WASD·방향키 이동 / 모바일은 화면을 드래그 · 공격은 자동</p>
      </div>`);
    $('btnPlay').onclick = () => this.showSelect();
    $('btnShop').onclick = () => this.showShop();
    $('btnDex').onclick = () => this.showDex();
    return div;
  }

  /* ---------------- 선택 ---------------- */
  showSelect() {
    const s = getSave();
    const stageCards = STAGES.map(st => {
      const cleared = s.cleared.includes(st.key);
      const diff = st.reward;
      return `<button class="stage-card ${this.selectedStage === st.key ? 'on' : ''}" data-stage="${st.key}">
        ${cleared ? '<span class="clear-badge">CLEAR</span>' : ''}
        <div class="sc-name">${st.name}</div>
        <div class="sc-sub">${st.sub}</div>
        <div class="sc-diff">${'◆'.repeat(diff)}${'◇'.repeat(3 - diff)}</div>
      </button>`;
    }).join('');

    const charCards = CHARACTERS.map(c => {
      const unlocked = isUnlocked(c);
      const owned = !!s.shiny[c.key];
      const on = this.selectedChar === c.key;
      const rankCls = c.rank === '전설' ? 'legend' : c.rank === '환상' ? 'myth' : '';
      return `<button class="char-card ${on ? 'on' : ''} ${unlocked ? '' : 'locked'}" data-char="${c.key}">
        ${owned ? '<span class="shiny-dot">✦</span>' : ''}
        <img loading="lazy" src="${spriteURL(c.id, false)}" alt="${c.chain[0].name}">
        <div class="cc-name">${c.chain[0].name}</div>
        <div class="cc-rank ${rankCls}">${unlocked ? c.rank : `<span style="color:#fbbf24">🔒 ${c.cost}</span>`}</div>
      </button>`;
    }).join('');

    this.screen(`
      <div class="wrap">
        <div class="topbar">
          <h1>⚔️ 모험 준비</h1>
          <span class="spacer"></span>
          <span class="pill">🪙 <b>${s.coins}</b></span>
          <button class="btn sm ghost" id="backBtn">← 로비</button>
        </div>
        <div class="stage-row">${stageCards}</div>
        <div class="char-grid">${charCards}</div>
        <div class="select-bottom">
          <div class="preview" id="preview"></div>
          <div class="start-panel" id="startPanel"></div>
        </div>
      </div>`);

    this.root.querySelectorAll('[data-stage]').forEach(el => {
      el.onclick = () => {
        this.selectedStage = el.dataset.stage;
        this.root.querySelectorAll('.stage-card').forEach(x => x.classList.toggle('on', x.dataset.stage === this.selectedStage));
        this.renderStartPanel();
      };
    });
    this.root.querySelectorAll('[data-char]').forEach(el => {
      el.onclick = () => {
        const c = CHAR_BY_KEY[el.dataset.char];
        if (!isUnlocked(c)) {
          this.toast(`상점에서 ${c.cost} 코인으로 해금할 수 있어요`, 'bad');
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
    const st = STAGES.find(x => x.key === this.selectedStage);
    const owned = !!s.shiny[c.key];
    if (!owned) this.shinyPref = false;
    const pv = $('preview');
    if (!pv) return;
    const chainHtml = `<div class="chain">${c.chain.map(ch => `<img src="${spriteURL(ch.id, false)}" title="${ch.name}">`).join('<span>›</span>')}${c.branch ? `<span>›</span><span style="color:#fbbf24">5가지 분기</span>` : ''}</div>`;
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
    pv.innerHTML = `
      <img class="big" src="${spriteURL(c.id, this.shinyPref && owned)}" alt="${c.chain[0].name}">
      <div class="p-info">
        <h3>${c.chain[0].name}${this.shinyPref && owned ? ' <span style="color:#fde68a;font-size:14px">✦이로치</span>' : ''}</h3>
        <div class="types">${DEX[c.id].t.map(t => `<span class="type-chip" style="background:${TYPE_COLORS[t]}">${t}</span>`).join('')}</div>
        <p class="p-desc">체력 ${c.hp} · 이동 ${c.speed} · 공격 ${Math.round(c.dmg * 100)}%</p>
        <div class="sig"><b>${c.sigName}</b> — ${c.sigDesc}</div>
        <div class="p-meta"><span class="meta-label">친화 기술</span><div class="chips">${aff}</div></div>
        <div class="p-meta"><span class="meta-label">타입 보너스</span><div class="chips">${mastery}</div></div>
        ${wb ? `<div class="p-meta"><span class="meta-label">전용 강화</span><div class="chips">${wb}</div></div>` : ''}
        <p class="trait-line">✦ ${c.trait}</p>
        ${chainHtml}
      </div>`;
    const startEl = $('startPanel');
    startEl.innerHTML = `
      <div class="row"><span>스테이지</span><b>${st.name}</b></div>
      <div class="row"><span>제한 시간</span><b>${Math.round(st.duration / 60)}분</b></div>
      <div class="row"><span>기본 기술</span><b>${WEAPONS[c.weapon].icon} ${WEAPONS[c.weapon].name}</b></div>
      <div class="row"><span>첫 각성 조합</span><b>${WEAPONS[c.weapon].pair ? PASSIVES[WEAPONS[c.weapon].pair].icon + PASSIVES[WEAPONS[c.weapon].pair].name : '—'}</b></div>
      <label class="shiny-toggle ${owned ? '' : 'off'}" id="shinyToggle">
        <input type="checkbox" id="shinyChk" ${this.shinyPref ? 'checked' : ''} ${owned ? '' : 'disabled'}>
        <span>✦ 이로치로 시작 ${owned ? '' : '(미보유)'}</span>
      </label>
      <button class="btn primary" id="goBtn" style="margin-top:4px">🚀 출발!</button>`;
    $('shinyChk').onchange = e => {
      this.shinyPref = e.target.checked;
      this.renderStartPanel();
    };
    $('goBtn').onclick = () => {
      if (this.onStart) this.onStart({ charKey: this.selectedChar, stageKey: this.selectedStage, shiny: this.shinyPref && owned });
    };
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
          ? '<span class="pill" style="color:#34d399">MAX</span>'
          : `<button class="btn sm ${s.coins >= cost ? 'gold' : 'ghost'}" data-up="${u.key}" ${s.coins >= cost ? '' : 'disabled'}>🪙 ${cost}</button>`}
        </div>
      </div>`;
    }).join('');

    const unlocks = CHARACTERS.filter(c => c.cost).map(c => {
      const owned = isUnlocked(c);
      return `<div class="unlock-card ${owned ? 'owned' : ''}">
        <img loading="lazy" src="${spriteURL(c.id, false)}" alt="${c.chain[0].name}">
        <div class="un">${c.chain[0].name}</div>
        <div class="cost">${c.rank} · ${WEAPONS[c.weapon].name}</div>
        ${owned ? '<div class="owned-tag">보유 중</div>'
          : `<button class="btn sm ${s.coins >= c.cost ? 'gold' : 'ghost'}" data-unlock="${c.key}" ${s.coins >= c.cost ? '' : 'disabled'}>🪙 ${c.cost}</button>`}
      </div>`;
    }).join('');

    this.screen(`
      <div class="wrap">
        <div class="topbar">
          <h1>💠 영구 강화</h1>
          <span class="spacer"></span>
          <span class="pill">🪙 <b id="shopCoins">${s.coins}</b></span>
          <span class="pill">✨ <b>${s.dust}</b></span>
          <button class="btn sm ghost" id="backBtn">← 로비</button>
        </div>
        <p style="color:#94a3b8;font-size:12.5px;margin:-6px 0 4px">코인은 모든 모험에서 획득하며, 강화는 영구히 유지됩니다.</p>
        <div class="section-title">능력 강화 <span class="cnt">${Object.values(s.upgrades).reduce((a, b) => a + b, 0)} 레벨</span></div>
        <div class="shop-grid">${ups}</div>
        <div class="section-title">포켓몬 해금 <span class="cnt">${CHARACTERS.filter(c => c.cost && isUnlocked(c)).length} / ${CHARACTERS.filter(c => c.cost).length}</span></div>
        <div class="unlock-grid">${unlocks}</div>
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
    this.root.querySelectorAll('[data-unlock]').forEach(el => {
      el.onclick = () => {
        const c = CHAR_BY_KEY[el.dataset.unlock];
        const r = unlockChar(c);
        if (r.ok) { this.toast(`${c.chain[0].name} 해금!`, 'good'); this.showShop(); }
        else this.toast('코인이 부족해요', 'bad');
      };
    });
  }

  /* ---------------- 도감 + 조합표 ---------------- */
  showDex() {
    const s = getSave();
    const ids = Object.keys(DEX).map(Number).sort((a, b) => a - b);
    const caught = Object.keys(s.dexCaught).length;
    const cells = ids.map(id => {
      const seen = !!s.dexSeen[id];
      const c = !!s.dexCaught[id];
      const d = DEX[id];
      return `<div class="dex-cell ${seen ? '' : 'unseen'} ${c ? 'caught' : ''}">
        <span class="did">#${String(id).padStart(3, '0')}</span>
        <img loading="lazy" src="${spriteURL(id, false)}" alt="">
        <div class="dn">${seen ? d.n : '???'}</div>
      </div>`;
    }).join('');

    const combos = Object.keys(WEAPONS).map(id => {
      const w = WEAPONS[id];
      const p = PASSIVES[w.pair];
      return `<div class="combo-row">
        <span class="ci" style="--cc:${w.color}">${w.icon}</span>
        <div class="cb">
          <b>${w.name}<em>Lv.${w.max}</em></b>
          <small>${w.desc}</small>
        </div>
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

    this.screen(`
      <div class="wrap">
        <div class="topbar">
          <h1>📖 포켓몬 도감</h1>
          <span class="spacer"></span>
          <span class="pill">포획 <b>${caught}</b> / ${ids.length}</span>
          <button class="btn sm ghost" id="backBtn">← 로비</button>
        </div>
        <div class="dex-grid">${cells}</div>
        <div class="section-title">기술 조합표 <span class="cnt">액티브 Lv.6 + 짝 패시브 → 각성</span></div>
        <div class="combo-table">${combos}</div>
      </div>`);
    $('backBtn').onclick = () => this.showTitle();
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
    $('stageTag').textContent = g.stage.name;
    $('killCount').textContent = g.kills;
    $('coinCount').textContent = Math.round(g.runCoins);
    const xpPct = Math.min(100, p.xp / p.xpNext * 100);
    $('xpBar').style.width = xpPct + '%';
    $('xpText').textContent = Math.floor(xpPct) + '%';

    const portrait = $('hudPortrait');
    const src = spriteURL(g.currentStage(), p.shiny);
    if (portrait.getAttribute('src') !== src) portrait.setAttribute('src', src);

    const sig = p.weaponList.map(w => `${w.id}${w.lv}${w.awake ? '!' : ''}`).join(',') + `#${g.awakenCount}`;
    if (sig !== this.lastWeaponSig) {
      this.lastWeaponSig = sig;
      $('weaponRow').innerHTML = p.weaponList.map(w => {
        const d = WEAPONS[w.id];
        const ready = g.canAwaken(w);
        return `<div class="wp ${w.awake ? 'awake' : ''} ${ready ? 'ready' : ''}" title="${w.awake ? d.awakeName : d.name} Lv.${w.lv}${ready ? ' · 각성 가능!' : ''}">
          <span>${w.awake ? d.awakeIcon : d.icon}</span><b>${w.awake ? '★' : w.lv}</b>
        </div>`;
      }).join('');
    }

    let boss = null;
    for (const e of g.enemies) if (e.boss && !e.dead && (!boss || e.hp > boss.hp)) boss = e;
    const bb = $('bossBar');
    if (boss) {
      bb.classList.remove('hidden');
      $('bossName').textContent = (boss.final ? '👑 ' : '') + boss.name;
      $('bossFill').style.width = Math.max(0, boss.hp / boss.maxHp * 100) + '%';
      $('bossHpText').textContent = `${Math.max(0, Math.ceil(boss.hp))} / ${Math.round(boss.maxHp)}`;
    } else bb.classList.add('hidden');
  }

  /* ---------------- 레벨업 ---------------- */
  showLevelUp(g, cards) {
    this.game = g;
    const list = $('cardList');
    list.innerHTML = cards.map((c, i) => {
      const kind = c.type === 'weapon' ? '액티브 기술' : c.type === 'passive' ? '패시브' : c.type === 'awaken' ? '각성 기술' : '보너스';
      const lvTxt = c.type === 'heal' || c.type === 'coin' ? '즉시'
        : c.type === 'awaken' ? 'Lv.6 → 각성'
        : c.isNew ? 'Lv.1 습득' : `Lv.${c.lv} → ${c.lv + 1}`;
      const combo = c.type === 'awaken'
        ? `<div class="c-combo ready"><b>조합 완성!</b> ${c.pairIcon}${c.pairName} Lv.1 보유 — 지금 바로 각성</div>`
        : c.type === 'passive' && c.comboHint
          ? `<div class="c-combo ${c.comboReady && c.comboReady.length ? 'ready' : ''}">${c.comboReady && c.comboReady.length ? '⚡ ' : ''}${c.comboHint}</div>`
          : c.type === 'weapon' && c.hint
            ? `<div class="c-combo ${c.pairOk ? 'ready' : ''}">${c.hint}</div>` : '';
      return `<button class="card ${c.type === 'awaken' ? 'card-awake' : ''}" data-i="${i}" style="--cc:${c.color || '#60a5fa'}">
        <div class="c-top">
          <div class="c-icon">${c.icon}</div>
          <div style="min-width:0">
            <div class="c-name">${c.name}${c.affinity ? ' <span class="aff-star">★</span>' : ''}</div>
            <div class="c-kind">${kind}${c.type === 'awaken' ? ' · 진화 무기' : ''}</div>
          </div>
        </div>
        ${c.type === 'awaken' ? `<div class="c-formula">${c.fromIcon}${c.fromName} <b>Lv.6</b> + ${c.pairIcon}${c.pairName} <b>Lv.1</b></div>` : ''}
        <div class="c-desc">${c.desc}</div>
        ${combo}
        <div class="c-foot">
          <span class="lvchip">${lvTxt}</span>
          ${c.isNew ? '<span class="newchip">NEW</span>' : c.type === 'awaken' ? '<span class="awakechip">각성 해금</span>' : c.awake ? '<span class="awake">Lv.6 MAX</span>' : ''}
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

  /* ---------------- 진화 ---------------- */
  showEvolve(g, info) {
    $('evoKicker').textContent = info.awaken ? 'LIMIT BREAK' : 'EVOLUTION';
    $('evoFrom').src = spriteURL(info.from, g.player.shiny);
    $('evoTo').src = spriteURL(info.to, g.player.shiny);
    $('evoName').textContent = info.name;
    $('evoDesc').textContent = info.awaken
      ? '잠재된 힘이 폭발한다! 모든 능력과 기술이 강화되었다.'
      : '새로운 모습으로 진화했다! 체력·공격·기술이 모두 강화된다.';
    $('evoOverlay').classList.remove('hidden');
    const close = () => {
      $('evoOverlay').classList.add('hidden');
      $('evoOk').onclick = null;
      g.resumeFromEvo();
    };
    $('evoOk').onclick = close;
  }

  showBranch(g, options) {
    $('branchList').innerHTML = options.map(id => `
      <button class="branch" data-id="${id}">
        <img src="${spriteURL(id, false)}" alt="${BRANCH_NAMES[id]}">
        <b>${BRANCH_NAMES[id]}</b>
        <small>${WEAPONS[{ 134: 'water', 135: 'thunder', 136: 'flame', 196: 'psychic', 197: 'nightmare' }[id]].name} 습득</small>
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
    this.renderRunSummary();
    this.renderComboTable();
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
  }

  renderRunSummary() {
    const g = this.game;
    const el = $('runSummary');
    if (!el || !g || !g.player) return;
    const p = g.player;
    const list = p.weaponList.map(w => {
      const d = WEAPONS[w.id];
      return `<span class="sum-w ${w.awake ? 'on' : ''}">${w.awake ? d.awakeIcon : d.icon}${w.name}<em>${w.awake ? '각성' : 'Lv.' + w.lv}</em></span>`;
    }).join('');
    el.innerHTML = `<div class="sum-top"><b>${g.currentStageName()}</b><span>Lv.${p.level} · ${this.fmtTime(g.time)} · 처치 ${g.kills}</span></div>
      <div class="sum-weapons">${list}</div>
      <div class="sum-meta">각성 ${g.awakenCount}개 · 아이템 ${g.itemsCollected}개 · 코인 ${Math.round(g.runCoins)}</div>`;
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
    const rows = Object.keys(WEAPONS).map(id => {
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
    const aff = (g.char.affinity || []).map(id => `<span class="aff-chip">${AFFINITY_LABEL(id)}</span>`).join('');
    el.innerHTML = `<div class="combo-hintline">액티브 기술 <b>Lv.6</b> + 짝 패시브 <b>Lv.1</b>을 맞추면 레벨업·상자에서 <b>각성 기술</b>이 해금됩니다.</div>
      <div class="combo-aff">${g.char.chain[0].name} 친화 기술: ${aff}</div>
      <div class="combo-scroll">${rows}</div>`;
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
          <div class="rg"><b>${r.awakens || 0}</b><span>각성 기술</span></div>
          <div class="rg"><b>${r.items || 0}</b><span>필드 아이템</span></div>
        </div>
        <div class="res-weapons">${(r.weapons || []).map(w => {
          const d = WEAPONS[w.id];
          return `<span class="rw ${w.awake ? 'on' : ''}">${w.awake ? d.awakeIcon : d.icon}${w.awake ? d.awakeName : d.name}<em>${w.awake ? '각성' : 'Lv.' + w.lv}</em></span>`;
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
    d.className = 'screen';
    d.style.display = 'flex'; d.style.alignItems = 'center'; d.style.justifyContent = 'center';
    d.innerHTML = html;
    this.root.appendChild(d);
    $('againBtn').onclick = () => this.onStart && this.onStart({ charKey: r.charKey, stageKey: r.stageKey, shiny: r.shiny });
    $('lobbyBtn').onclick = () => { this.clear(); this.showTitle(); };
  }

  hideAllOverlays() {
    ['levelupOverlay', 'evoOverlay', 'branchOverlay', 'pauseOverlay'].forEach(id => $(id).classList.add('hidden'));
    $('hud').classList.add('hidden');
    this.clear();
  }
}
void FIELD_ITEMS;
void getSprite;
void metaMods;
void TYPE_COLORS;
