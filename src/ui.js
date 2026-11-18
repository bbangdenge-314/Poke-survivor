/* ============================================================
   UI — 화면(타이틀/선택/상점/도감/결과) 및 HUD
   ============================================================ */
import { CHARACTERS, CHAR_BY_KEY, STAGES, DEX, WEAPONS, PASSIVES, UPGRADES, TYPE_COLORS, BRANCH_NAMES } from './data.js?v=18';
import { spriteURL, getSprite } from './sprites.js?v=18';
import { getSave, upgradeCost, buyUpgrade, isUnlocked, unlockChar, metaMods } from './save.js?v=18';

const $ = id => document.getElementById(id);

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
        <p class="tagline">20종의 포켓몬 · 진화와 이로치 · 전설의 강림<br>15분을 버텨 최종 보스를 쓰러뜨려라</p>
        <div class="title-menu">
          <button class="btn primary" id="btnPlay">⚔️ 모험 시작<span class="sub">포켓몬 선택</span></button>
          <button class="btn blue" id="btnShop">💠 영구 강화<span class="sub">${s.coins} 코인</span></button>
          <button class="btn ghost" id="btnDex">📖 포켓몬 도감<span class="sub">${Object.keys(s.dexCaught).length} / ${Object.keys(DEX).length}</span></button>
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
    const meta = metaMods();
    const owned = !!s.shiny[c.key];
    if (!owned) this.shinyPref = false;
    const pv = $('preview');
    if (!pv) return;
    const chainHtml = `<div class="chain">${c.chain.map(ch => `<img src="${spriteURL(ch.id, false)}" title="${ch.name}">`).join('<span>›</span>')}${c.branch ? `<span>›</span><span style="color:#fbbf24">5가지 분기</span>` : ''}</div>`;
    pv.innerHTML = `
      <img class="big" src="${spriteURL(c.id, this.shinyPref && owned)}" alt="${c.chain[0].name}">
      <div class="p-info">
        <h3>${c.chain[0].name}${this.shinyPref && owned ? ' <span style="color:#fde68a;font-size:14px">✦이로치</span>' : ''}</h3>
        <div class="types">${DEX[c.id].t.map(t => `<span class="type-chip" style="background:${TYPE_COLORS[t]}">${t}</span>`).join('')}</div>
        <p class="p-desc">체력 ${c.hp} · 이동 ${c.speed} · 공격 ${Math.round(c.dmg * 100)}%</p>
        <div class="sig"><b>${c.sigName}</b> — ${c.sigDesc}</div>
        ${chainHtml}
      </div>`;
    const startEl = $('startPanel');
    startEl.innerHTML = `
      <div class="row"><span>스테이지</span><b>${st.name}</b></div>
      <div class="row"><span>제한 시간</span><b>${Math.round(st.duration / 60)}분</b></div>
      <div class="row"><span>기본 기술</span><b>${WEAPONS[c.weapon].icon} ${WEAPONS[c.weapon].name}</b></div>
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
    void meta;
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

  /* ---------------- 도감 ---------------- */
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
    this.screen(`
      <div class="wrap">
        <div class="topbar">
          <h1>📖 포켓몬 도감</h1>
          <span class="spacer"></span>
          <span class="pill">포획 <b>${caught}</b> / ${ids.length}</span>
          <button class="btn sm ghost" id="backBtn">← 로비</button>
        </div>
        <div class="dex-grid">${cells}</div>
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

    const sig = p.weaponList.map(w => `${w.id}${w.lv}`).join(',');
    if (sig !== this.lastWeaponSig) {
      this.lastWeaponSig = sig;
      $('weaponRow').innerHTML = p.weaponList.map(w => {
        const d = WEAPONS[w.id];
        return `<div class="wp ${w.lv >= d.max ? 'awake' : ''}" title="${d.name} Lv.${w.lv}"><span>${d.icon}</span><b>${w.lv}</b></div>`;
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
    const list = $('cardList');
    list.innerHTML = cards.map((c, i) => {
      const kind = c.type === 'weapon' ? '기술' : c.type === 'passive' ? '패시브' : '보너스';
      const lvTxt = c.type === 'heal' || c.type === 'coin' ? '즉시'
        : c.isNew ? 'Lv.1 습득' : `Lv.${c.lv} → ${c.lv + 1}`;
      return `<button class="card" data-i="${i}" style="--cc:${c.color || '#60a5fa'}">
        <div class="c-top">
          <div class="c-icon">${c.icon}</div>
          <div><div class="c-name">${c.name}</div><div class="c-kind">${kind}</div></div>
        </div>
        <div class="c-desc">${c.desc}</div>
        <div class="c-foot">
          <span class="lvchip">${lvTxt}</span>
          ${c.isNew ? '<span class="newchip">NEW</span>' : c.awake ? '<span class="awake">각성!</span>' : ''}
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
    $('evoKicker').textContent = info.awaken ? 'AWAKENING' : 'EVOLUTION';
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
    $('pauseOverlay').classList.remove('hidden');
    $('soundBtn').textContent = '효과음: ' + (settings.sfx ? '켜짐' : '꺼짐');
    $('cryBtn').textContent = '울음소리: ' + (settings.cries ? '켜짐' : '꺼짐');
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
          <div class="rg"><b>${r.legends}</b><span>환상 포획</span></div>
          <div class="rg"><b>${r.shinies}</b><span>이로치</span></div>
        </div>
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
