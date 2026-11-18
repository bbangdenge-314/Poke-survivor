/* ============================================================
   POKE SURVIVOR — 데이터 계층
   포켓몬 / 기술 / 패시브 / 적 / 스테이지 / 영구강화 정의
   ============================================================ */

export const TYPE_COLORS = {
  노말: '#b9b9a0', 불꽃: '#f08030', 물: '#6890f0', 풀: '#78c850', 전기: '#f7d02c',
  에스퍼: '#f85888', 악: '#8a6a58', 드래곤: '#7038f8', 얼음: '#8fd6d6', 독: '#a040a0',
  땅: '#d9b45a', 바위: '#b8a038', 비행: '#a890f0', 강철: '#a8a8c0', 격투: '#c03028',
  고스트: '#705898', 벌레: '#a8b820', 페어리: '#ee99ac'
};

/* ---------- 도감: 등장하는 모든 포켓몬 ---------- */
export const DEX = {
  1:{n:'이상해씨',t:['풀','독']}, 2:{n:'이상해풀',t:['풀','독']}, 3:{n:'이상해꽃',t:['풀','독']},
  4:{n:'파이리',t:['불꽃']}, 5:{n:'리자드',t:['불꽃']}, 6:{n:'리자몽',t:['불꽃','비행']},
  7:{n:'꼬부기',t:['물']}, 8:{n:'어니부기',t:['물']}, 9:{n:'거북왕',t:['물']},
  10:{n:'캐터피',t:['벌레']}, 11:{n:'단데기',t:['벌레']}, 13:{n:'뿔충이',t:['벌레','독']},
  14:{n:'딱충이',t:['벌레','독']}, 16:{n:'피죤',t:['노말','비행']}, 17:{n:'피죤투',t:['노말','비행']},
  19:{n:'꼬렛',t:['노말']}, 20:{n:'레트라',t:['노말']}, 24:{n:'아보크',t:['독']},
  27:{n:'샌드',t:['땅']}, 29:{n:'니드런♀',t:['독']}, 30:{n:'니드리노♀',t:['독']},
  32:{n:'니드런♂',t:['독']}, 33:{n:'니드리노♂',t:['독']}, 34:{n:'니드킹',t:['독','땅']},
  35:{n:'삐삐',t:['페어리']}, 39:{n:'푸린',t:['노말','페어리']},
  25:{n:'피카츄',t:['전기']}, 26:{n:'라이츄',t:['전기']},
  41:{n:'주뱃',t:['독','비행']}, 42:{n:'골뱃',t:['독','비행']},
  43:{n:'뚜벅쵸',t:['풀','독']}, 44:{n:'냄새꼬',t:['풀','독']},
  48:{n:'콘팡',t:['벌레','독']}, 49:{n:'도나리',t:['벌레','독']},
  50:{n:'디그다',t:['땅']}, 51:{n:'닥트리오',t:['땅']}, 52:{n:'나옹',t:['노말']},
  54:{n:'고라파덕',t:['물']}, 55:{n:'골덕',t:['물']}, 56:{n:'망키',t:['격투']}, 57:{n:'성원숭',t:['격투']},
  60:{n:'왕눈해',t:['물']}, 61:{n:'슈륙챙이',t:['물']},
  63:{n:'케이시',t:['에스퍼']}, 64:{n:'윤겔라',t:['에스퍼']}, 65:{n:'후딘',t:['에스퍼']},
  66:{n:'알통몬',t:['격투']}, 67:{n:'근육몬',t:['격투']}, 68:{n:'괴력몬',t:['격투']},
  72:{n:'왕눈해',t:['물','독']}, 77:{n:'포니타',t:['불꽃']},
  98:{n:'크랩',t:['물']}, 100:{n:'찌리리공',t:['전기']}, 106:{n:'시라소몬',t:['격투']},
  120:{n:'별가사리',t:['물']}, 123:{n:'스라크',t:['벌레','비행']}, 125:{n:'에레브',t:['전기']},
  126:{n:'마그마',t:['불꽃']}, 127:{n:'쁘사이저',t:['벌레']},
  69:{n:'모다피',t:['풀','독']}, 70:{n:'우츠동',t:['풀','독']},
  74:{n:'꼬마돌',t:['바위','땅']}, 75:{n:'데구리',t:['바위','땅']}, 76:{n:'딱구리',t:['바위','땅']},
  81:{n:'코일',t:['전기','강철']}, 82:{n:'레어코일',t:['전기','강철']},
  88:{n:'질퍽이',t:['독']}, 89:{n:'질뻐기',t:['독']},
  92:{n:'고오스',t:['고스트','독']}, 93:{n:'고우스트',t:['고스트','독']}, 94:{n:'팬텀',t:['고스트','독']},
  95:{n:'롱스톤',t:['바위','땅']}, 96:{n:'슬리프',t:['에스퍼']}, 97:{n:'슬리퍼',t:['에스퍼']},
  104:{n:'탕구리',t:['땅']}, 105:{n:'텅구리',t:['땅']},
  109:{n:'또가스',t:['독']}, 110:{n:'또도가스',t:['독']},
  111:{n:'뿔카노',t:['땅','바위']}, 112:{n:'코뿌리',t:['땅','바위']},
  118:{n:'콘치',t:['물']}, 119:{n:'왕콘치',t:['물']}, 128:{n:'켄타로스',t:['노말']},
  129:{n:'잉어킹',t:['물']}, 130:{n:'갸라도스',t:['물','비행']}, 131:{n:'라프라스',t:['물','얼음']},
  133:{n:'이브이',t:['노말']}, 134:{n:'샤미드',t:['물']}, 135:{n:'쥬피썬더',t:['전기']},
  136:{n:'부스터',t:['불꽃']}, 143:{n:'잠만보',t:['노말']},
  144:{n:'프리져',t:['얼음','비행']}, 145:{n:'썬더',t:['전기','비행']}, 146:{n:'파이어',t:['불꽃','비행']},
  147:{n:'미뇽',t:['드래곤']}, 148:{n:'신뇽',t:['드래곤']}, 149:{n:'망나뇽',t:['드래곤','비행']},
  150:{n:'뮤츠',t:['에스퍼']}, 151:{n:'뮤',t:['에스퍼']},
  196:{n:'에브이',t:['에스퍼']}, 197:{n:'블래키',t:['악']},
  212:{n:'핫삼',t:['벌레','강철']},
  243:{n:'라이코',t:['전기']}, 244:{n:'앤테이',t:['불꽃']}, 245:{n:'스이쿤',t:['물']},
  248:{n:'마기라스',t:['바위','악']}, 249:{n:'루기아',t:['에스퍼','비행']},
  251:{n:'세레비',t:['에스퍼','풀']},
  376:{n:'메타그로스',t:['강철','에스퍼']}, 384:{n:'레쿠쟈',t:['드래곤','비행']},
  385:{n:'지라치',t:['강철','에스퍼']}, 445:{n:'한카리아스',t:['드래곤','땅']},
  448:{n:'루카리오',t:['격투','강철']}, 491:{n:'다크라이',t:['악']},
  480:{n:'유크시',t:['에스퍼']}, 481:{n:'엠라이트',t:['에스퍼']}, 482:{n:'아그놈',t:['에스퍼']}
};

/* ---------- 기술(무기) ---------- */
/* s(lv) : 레벨별 수치.  max=6, 6레벨에서 각성 */
export const WEAPONS = {
  thunder: {
    name:'10만볼트', icon:'⚡', type:'전기', color:'#fbbf24', max:6,
    desc:'가장 가까운 적에게 연쇄 번개. 레벨이 오르면 연쇄 수가 늘어난다.',
    stats: lv => ({ dmg: 22 + 9 * lv, cd: Math.max(0.32, 1.15 - lv * 0.09), count: 1 + Math.floor(lv / 3), chains: 2 + lv, range: 540 }),
    awake:'천둥의 심판 — 화면 전체 적에게 번개가 내리친다.'
  },
  flame: {
    name:'화염방사', icon:'🔥', type:'불꽃', color:'#fb923c', max:6,
    desc:'전방으로 화염을 뿌려 화상을 입힌다.',
    stats: lv => ({ dmg: 11 + 5.2 * lv, cd: Math.max(0.2, 0.62 - lv * 0.05), count: 3 + lv, range: 300 + lv * 22 }),
    awake:'불대문자 — 회오리 불꽃이 사방을 태운다.'
  },
  water: {
    name:'물대포', icon:'💧', type:'물', color:'#38bdf8', max:6,
    desc:'관통하는 물줄기를 발사한다.',
    stats: lv => ({ dmg: 16 + 6.5 * lv, cd: Math.max(0.35, 1.05 - lv * 0.08), count: 1 + Math.floor(lv / 2), pierce: 3 + lv }),
    awake:'하이드로펌프 — 거대한 물기둥이 전장을 가른다.'
  },
  leaf: {
    name:'잎날가르기', icon:'🍃', type:'풀', color:'#4ade80', max:6,
    desc:'주변을 회전하는 잎날이 적을 벤다.',
    stats: lv => ({ dmg: 12 + 5.5 * lv, cd: 0.42, count: 2 + lv, radius: 78 + lv * 9, spin: 2.4 + lv * 0.16 }),
    awake:'리프스톰 — 잎날 폭풍이 두 배로 늘어난다.'
  },
  shadow: {
    name:'섀도볼', icon:'🌑', type:'고스트', color:'#a78bfa', max:6,
    desc:'적을 추적하는 그림자 구체가 폭발한다.',
    stats: lv => ({ dmg: 26 + 11 * lv, cd: Math.max(0.5, 1.5 - lv * 0.1), count: 1 + Math.floor(lv / 2), blast: 52 + lv * 6 }),
    awake:'섀도다이브 — 모든 그림자가 적을 삼킨다.'
  },
  psychic: {
    name:'사이코키네시스', icon:'🔮', type:'에스퍼', color:'#f472b6', max:6,
    desc:'주변을 뒤흔드는 염동력 파동.',
    stats: lv => ({ dmg: 18 + 7.5 * lv, cd: Math.max(0.6, 1.9 - lv * 0.12), radius: 150 + lv * 26 }),
    awake:'사이코브레이크 — 공간을 뒤틀어 적을 끌어당긴다.'
  },
  quake: {
    name:'지진', icon:'🌍', type:'땅', color:'#d9b45a', max:6,
    desc:'지면을 강타해 주변을 밀어낸다.',
    stats: lv => ({ dmg: 30 + 12 * lv, cd: Math.max(0.8, 2.4 - lv * 0.15), radius: 150 + lv * 22 }),
    awake:'대지진 — 전장이 갈라지고 충격파가 연쇄한다.'
  },
  beam: {
    name:'파괴광선', icon:'☄️', type:'노말', color:'#fde68a', max:6,
    desc:'전방을 향해 굵은 광선을 발사한다.',
    stats: lv => ({ dmg: 40 + 20 * lv, cd: Math.max(1.1, 3.2 - lv * 0.25), width: 44 + lv * 5, length: 720 + lv * 60 }),
    awake:'기가임팩트 — 광선이 폭발해 주변을 휩쓴다.'
  },
  claw: {
    name:'드래곤클로', icon:'🐉', type:'드래곤', color:'#818cf8', max:6,
    desc:'전방을 크게 베는 참격. 치명타가 잘 터진다.',
    stats: lv => ({ dmg: 34 + 16 * lv, cd: Math.max(0.4, 1.05 - lv * 0.07), count: 1 + Math.floor(lv / 3), range: 150 + lv * 12 }),
    awake:'역린 — 연속 참격이 폭풍처럼 몰아친다.'
  },
  ice: {
    name:'냉동빔', icon:'❄️', type:'얼음', color:'#7dd3fc', max:6,
    desc:'관통하는 냉기를 발사해 적을 얼린다.',
    stats: lv => ({ dmg: 15 + 6 * lv, cd: Math.max(0.4, 1.25 - lv * 0.09), count: 1 + Math.floor(lv / 2), pierce: 4 + lv, slow: 0.35 + lv * 0.05 }),
    awake:'블리자드 — 전장이 얼어붙고 적이 멈춘다.'
  },
  aura: {
    name:'파동탄', icon:'💫', type:'격투', color:'#60a5fa', max:6,
    desc:'적을 추적하는 파동 구체. 관통하며 폭발한다.',
    stats: lv => ({ dmg: 24 + 10 * lv, cd: Math.max(0.42, 1.3 - lv * 0.1), count: 1 + Math.floor(lv / 2), blast: 44 + lv * 5 }),
    awake:'파동폭발 — 파동이 연쇄 폭발한다.'
  },
  star: {
    name:'소원의별', icon:'🌟', type:'강철', color:'#fcd34d', max:6,
    desc:'하늘에서 별이 떨어져 적을 압사시킨다.',
    stats: lv => ({ dmg: 34 + 15 * lv, cd: Math.max(0.6, 1.7 - lv * 0.12), count: 1 + lv, blast: 60 + lv * 5 }),
    awake:'유성군 — 별의 비가 쏟아진다.'
  },
  dash: {
    name:'전광석화', icon:'💨', type:'노말', color:'#fca5a5', max:6,
    desc:'전방으로 돌진해 지나가는 적을 벤다.',
    stats: lv => ({ dmg: 28 + 13 * lv, cd: Math.max(0.38, 1.2 - lv * 0.1), dist: 160 + lv * 14 }),
    awake:'신속 — 잔상을 남기며 연속 돌진한다.'
  },
  slam: {
    name:'바디프레스', icon:'💥', type:'노말', color:'#fbbf24', max:6,
    desc:'몸 전체로 내리찍어 기절시킨다.',
    stats: lv => ({ dmg: 36 + 16 * lv, cd: Math.max(0.9, 2.6 - lv * 0.16), radius: 150 + lv * 18 }),
    awake:'기가임팩트급 충격 — 착지 충격파가 2연타.'
  },
  nightmare: {
    name:'악몽', icon:'😈', type:'악', color:'#c084fc', max:6,
    desc:'주변에 악몽의 장막을 펼쳐 지속 피해를 준다.',
    stats: lv => ({ dmg: 8 + 4 * lv, cd: 0.5, radius: 120 + lv * 14 }),
    awake:'암흑세계 — 장막이 넓어지고 적이 공포에 질린다.'
  }
};

export const PASSIVES = {
  power:    { name:'힘의 머리띠', icon:'🎽', max:5, desc:'공격력 +12%', color:'#f87171' },
  vitality: { name:'남은 밥알',   icon:'🍚', max:5, desc:'최대 체력 +22', color:'#4ade80' },
  speed:    { name:'신속의 신발', icon:'👟', max:5, desc:'이동 속도 +8%', color:'#38bdf8' },
  cooldown: { name:'선제공격',   icon:'⏱️', max:5, desc:'공격 속도 +10%', color:'#facc15' },
  magnet:   { name:'수정의 구슬', icon:'🔮', max:5, desc:'경험치 흡수 범위 +25%', color:'#a78bfa' },
  crit:     { name:'예리한 발톱', icon:'🩸', max:5, desc:'치명타 확률 +9%, 피해 +18%', color:'#fb7185' },
  regen:    { name:'먹다남은 음식', icon:'🍖', max:5, desc:'초당 체력 +0.9 회복', color:'#86efac' },
  armor:    { name:'방호대',     icon:'🛡️', max:5, desc:'받는 피해 -7%', color:'#94a3b8' },
  xp:       { name:'경험 공유',   icon:'📖', max:5, desc:'경험치 획득 +14%', color:'#60a5fa' },
  coin:     { name:'부적금화',   icon:'🪙', max:5, desc:'코인 획득 +22%', color:'#fbbf24' }
};

/* ---------- 플레이어블 포켓몬 ---------- */
/* chain: 진화 단계 (lv = 이 레벨에 도달하면 진화) */
export const CHARACTERS = [
  { key:'bulbasaur', id:1, rank:'스타터', weapon:'leaf', sig:'photosynthesis', sigName:'광합성',
    sigDesc:'초당 체력 1.6 회복', hp:120, speed:198, dmg:1.0,
    chain:[{id:1,name:'이상해씨',lv:1},{id:2,name:'이상해풀',lv:6},{id:3,name:'이상해꽃',lv:14}] },
  { key:'charmander', id:4, rank:'스타터', weapon:'flame', sig:'blaze', sigName:'맹화',
    sigDesc:'불꽃 피해 +25%', hp:100, speed:208, dmg:1.08,
    chain:[{id:4,name:'파이리',lv:1},{id:5,name:'리자드',lv:6},{id:6,name:'리자몽',lv:14}] },
  { key:'squirtle', id:7, rank:'스타터', weapon:'water', sig:'shell', sigName:'단단한 껍질',
    sigDesc:'받는 피해 18% 감소', hp:136, speed:200, dmg:0.95,
    chain:[{id:7,name:'꼬부기',lv:1},{id:8,name:'어니부기',lv:6},{id:9,name:'거북왕',lv:14}] },
  { key:'pikachu', id:25, rank:'스타터', weapon:'thunder', sig:'static', sigName:'정전기',
    sigDesc:'접촉한 적에게 감전 피해', hp:95, speed:222, dmg:1.05,
    chain:[{id:25,name:'피카츄',lv:1},{id:26,name:'라이츄',lv:6}] },
  { key:'eevee', id:133, rank:'스타터', weapon:'dash', sig:'adapt', sigName:'적응력',
    sigDesc:'경험치 +20%, 선택지 1장 추가', hp:104, speed:215, dmg:1.0,
    chain:[{id:133,name:'이브이',lv:1}],
    awaken:[12,20],
    branch:{ lv:6, options:[134,135,136,196,197] } },
  { key:'gengar', id:94, rank:'스타터', weapon:'shadow', sig:'levitate', sigName:'부유',
    sigDesc:'이동속도 +12%, 접촉 피해 15% 회피', hp:100, speed:210, dmg:1.1,
    chain:[{id:94,name:'팬텀',lv:1}], awaken:[8,18] },
  { key:'lucario', id:448, rank:'스타터', weapon:'aura', sig:'innerfocus', sigName:'정신집중',
    sigDesc:'치명타 확률 +15%', hp:108, speed:214, dmg:1.12,
    chain:[{id:448,name:'루카리오',lv:1}], awaken:[8,18] },
  { key:'garchomp', id:445, rank:'스타터', weapon:'claw', sig:'roughskin', sigName:'깎이는 살갗',
    sigDesc:'접촉한 적에게 반사 피해', hp:130, speed:205, dmg:1.1,
    chain:[{id:445,name:'한카리아스',lv:1}], awaken:[8,18] },
  { key:'gyarados', id:130, rank:'스타터', weapon:'water', sig:'intimidate', sigName:'위협',
    sigDesc:'주변 적 이동속도 -18%', hp:142, speed:196, dmg:1.1,
    chain:[{id:130,name:'갸라도스',lv:1}], awaken:[8,18] },
  { key:'snorlax', id:143, rank:'스타터', weapon:'slam', sig:'thickfat', sigName:'두꺼운 지방',
    sigDesc:'최대 HP +25%, 받는 피해 8% 감소', hp:180, speed:175, dmg:0.95,
    chain:[{id:143,name:'잠만보',lv:1}], awaken:[8,18] },

  { key:'charizard', id:6, rank:'해금', weapon:'flame', sig:'blaze', sigName:'맹화',
    sigDesc:'불꽃 피해 +25%', hp:120, speed:218, dmg:1.15, cost:1200,
    chain:[{id:6,name:'리자몽',lv:1}], awaken:[8,18] },
  { key:'blastoise', id:9, rank:'해금', weapon:'water', sig:'shell', sigName:'단단한 껍질',
    sigDesc:'받는 피해 18% 감소', hp:156, speed:205, dmg:1.0, cost:1200,
    chain:[{id:9,name:'거북왕',lv:1}], awaken:[8,18] },
  { key:'venusaur', id:3, rank:'해금', weapon:'leaf', sig:'photosynthesis', sigName:'광합성',
    sigDesc:'초당 체력 1.9 회복', hp:146, speed:200, dmg:1.05, cost:1200,
    chain:[{id:3,name:'이상해꽃',lv:1}], awaken:[8,18] },
  { key:'metagross', id:376, rank:'해금', weapon:'star', sig:'clearbody', sigName:'클리어바디',
    sigDesc:'방어 +12%, 둔화 무시', hp:150, speed:196, dmg:1.1, cost:2600,
    chain:[{id:376,name:'메타그로스',lv:1}], awaken:[8,18] },
  { key:'darkrai', id:491, rank:'환상', weapon:'nightmare', sig:'baddreams', sigName:'나쁜꿈',
    sigDesc:'주변 적에게 지속 피해', hp:118, speed:214, dmg:1.12, cost:3200,
    chain:[{id:491,name:'다크라이',lv:1}], awaken:[8,18] },
  { key:'jirachi', id:385, rank:'환상', weapon:'star', sig:'wish', sigName:'소원',
    sigDesc:'25초마다 체력 12 회복 + 코인', hp:112, speed:208, dmg:1.08, cost:3600,
    chain:[{id:385,name:'지라치',lv:1}], awaken:[8,18] },
  { key:'lugia', id:249, rank:'전설', weapon:'beam', sig:'multiscale', sigName:'멀티스케일',
    sigDesc:'HP 70% 이상일 때 피해 -25%', hp:160, speed:206, dmg:1.15, cost:3800,
    chain:[{id:249,name:'루기아',lv:1}], awaken:[8,18] },
  { key:'mewtwo', id:150, rank:'전설', weapon:'psychic', sig:'pressure', sigName:'프레셔',
    sigDesc:'공격력 +20%', hp:132, speed:220, dmg:1.2, cost:4200,
    chain:[{id:150,name:'뮤츠',lv:1}], awaken:[8,18] },
  { key:'rayquaza', id:384, rank:'전설', weapon:'claw', sig:'airlock', sigName:'에어록',
    sigDesc:'공격력 +15%, 이동 +8%', hp:146, speed:226, dmg:1.25, cost:4800,
    chain:[{id:384,name:'레쿠쟈',lv:1}], awaken:[8,18] },
  { key:'mew', id:151, rank:'환상', weapon:'aura', sig:'transform', sigName:'변신',
    sigDesc:'모든 기술 레벨 +1', hp:116, speed:230, dmg:1.1, cost:5200,
    chain:[{id:151,name:'뮤',lv:1}], awaken:[8,18] }
];

export const CHAR_BY_KEY = Object.fromEntries(CHARACTERS.map(c => [c.key, c]));

/* 이브이 분기 진화 표시용 */
export const BRANCH_NAMES = { 134:'샤미드', 135:'쥬피썬더', 136:'부스터', 196:'에브이', 197:'블래키' };

/* ---------- 적 포켓몬 ---------- */
/* hp: 기본 체력, spd: 이동속도, r: 반지름, dmg: 접촉피해, xp: 경험치, ai: 행동 */
export const ENEMIES = {
  caterpie:  { id:10, n:'캐터피', hp:22,  spd:52,  r:15, dmg:6,  xp:1, ai:'chase' },
  weedle:    { id:13, n:'뿔충이', hp:26,  spd:58,  r:15, dmg:7,  xp:1, ai:'chase' },
  pidgey:    { id:16, n:'피죤',   hp:30,  spd:74,  r:16, dmg:7,  xp:1, ai:'zigzag' },
  rattata:   { id:19, n:'꼬렛',   hp:28,  spd:88,  r:15, dmg:8,  xp:1, ai:'chase' },
  zubat:     { id:41, n:'주뱃',   hp:34,  spd:96,  r:15, dmg:8,  xp:2, ai:'zigzag' },
  oddish:    { id:43, n:'뚜벅쵸', hp:42,  spd:48,  r:17, dmg:9,  xp:2, ai:'chase' },
  sandshrew: { id:27, n:'샌드',   hp:56,  spd:62,  r:17, dmg:10, xp:2, ai:'chase' },
  nidoranf:  { id:29, n:'니드런♀',hp:46,  spd:80,  r:16, dmg:9,  xp:2, ai:'dash' },
  nidoranm:  { id:32, n:'니드런♂',hp:50,  spd:82,  r:16, dmg:10, xp:2, ai:'dash' },
  diglett:   { id:50, n:'디그다', hp:38,  spd:104, r:14, dmg:9,  xp:2, ai:'chase' },
  meowth:    { id:52, n:'나옹',   hp:52,  spd:92,  r:16, dmg:10, xp:3, ai:'dash' },
  psyduck:   { id:54, n:'고라파덕',hp:64, spd:70,  r:17, dmg:10, xp:3, ai:'ranged' },
  machop:    { id:66, n:'알통몬', hp:78,  spd:76,  r:18, dmg:13, xp:3, ai:'chase' },
  geodude:   { id:74, n:'꼬마돌', hp:96,  spd:48,  r:19, dmg:14, xp:3, ai:'tank' },
  gastly:    { id:92, n:'고오스', hp:54,  spd:88,  r:17, dmg:11, xp:3, ai:'zigzag' },
  koffing:   { id:109, n:'또가스', hp:82,  spd:58,  r:19, dmg:12, xp:3, ai:'poison' },
  voltorb:   { id:100, n:'찌리리공',hp:60, spd:116, r:16, dmg:11, xp:3, ai:'dash', selfDestruct:true },
  onix:      { id:95, n:'롱스톤', hp:150, spd:66,  r:24, dmg:17, xp:5, ai:'tank' },
  drowzee:   { id:96, n:'슬리프', hp:86,  spd:62,  r:18, dmg:12, xp:4, ai:'ranged' },
  krabby:    { id:98, n:'크랩',   hp:72,  spd:84,  r:17, dmg:13, xp:3, ai:'chase' },
  cubone:    { id:104, n:'탕구리',hp:92,  spd:74,  r:18, dmg:14, xp:4, ai:'chase' },
  magikarp:  { id:129, n:'잉어킹',hp:46,  spd:44,  r:16, dmg:6,  xp:2, ai:'flop' },
  tentacool: { id:72, n:'왕눈해', hp:70,  spd:66,  r:18, dmg:12, xp:3, ai:'poison' },
  ponyta:    { id:77, n:'포니타', hp:88,  spd:118, r:18, dmg:14, xp:4, ai:'dash' },
  magnemite: { id:81, n:'코일',   hp:78,  spd:74,  r:17, dmg:12, xp:4, ai:'ranged' },
  gloom:     { id:44, n:'냄새꼬', hp:104, spd:56,  r:20, dmg:14, xp:4, ai:'poison' },
  haunter:   { id:93, n:'고우스트',hp:96, spd:98,  r:19, dmg:15, xp:5, ai:'zigzag' },
  arbok:     { id:24, n:'아보크', hp:130, spd:86,  r:22, dmg:17, xp:6, ai:'chase' },
  staryu:    { id:120, n:'별가사리',hp:100, spd:80, r:18, dmg:14, xp:5, ai:'ranged' },
  scyther:   { id:123, n:'스라크', hp:118, spd:132, r:20, dmg:18, xp:6, ai:'dash' },
  pinsir:    { id:127, n:'쁘사이저',hp:150, spd:90, r:22, dmg:19, xp:6, ai:'chase' },
  tauros:    { id:128, n:'켄타로스',hp:170, spd:116, r:23, dmg:20, xp:7, ai:'dash' },
  gyaradosE: { id:130, n:'갸라도스',hp:240, spd:78, r:28, dmg:24, xp:10, ai:'chase' },
  lapras:    { id:131, n:'라프라스',hp:260, spd:60, r:27, dmg:22, xp:10, ai:'ranged' },
  electabuzz:{ id:125, n:'에레브', hp:160, spd:96, r:21, dmg:19, xp:7, ai:'ranged' },
  magmar:    { id:126, n:'마그마', hp:165, spd:92, r:21, dmg:20, xp:7, ai:'ranged' },
  dragonair: { id:148, n:'신뇽',  hp:210, spd:88, r:25, dmg:22, xp:9, ai:'zigzag' },
  golem:     { id:76, n:'딱구리', hp:320, spd:52,  r:30, dmg:28, xp:14, ai:'tank' },
  rhydon:    { id:112, n:'코뿌리',hp:340, spd:64,  r:30, dmg:30, xp:15, ai:'dash' },
  hitmonlee: { id:106, n:'시라소몬',hp:230,spd:120, r:22, dmg:24, xp:9, ai:'dash' },
  pinsirE:   { id:127, n:'쁘사이저',hp:290, spd:104, r:25, dmg:26, xp:11, ai:'dash' },
  /* 보스 */
  boss_nidoking:{ id:34,  n:'니드킹',  hp:1400, spd:72,  r:42, dmg:34, xp:60, ai:'boss', boss:true },
  boss_alakazam:{ id:65, n:'후딘',    hp:1900, spd:84,  r:40, dmg:32, xp:70, ai:'boss', boss:true, ranged:true },
  boss_gyarados:{ id:130, n:'갸라도스',hp:2800, spd:66,  r:48, dmg:40, xp:90, ai:'boss', boss:true },
  boss_dragonite:{ id:149,n:'망나뇽',  hp:3600, spd:88,  r:46, dmg:42, xp:110, ai:'boss', boss:true, ranged:true },
  boss_tyranitar:{ id:248,n:'마기라스',hp:4600, spd:74,  r:50, dmg:48, xp:130, ai:'boss', boss:true },
  boss_scizor:  { id:212, n:'핫삼',    hp:2600, spd:120, r:38, dmg:36, xp:90, ai:'boss', boss:true },
  boss_metagross:{ id:376,n:'메타그로스',hp:5400,spd:70,  r:50, dmg:50, xp:150, ai:'boss', boss:true },
  boss_garchomp:{ id:445, n:'한카리아스',hp:6000,spd:100,r:50, dmg:52, xp:160, ai:'boss', boss:true },
  boss_snorlax: { id:143, n:'잠만보',  hp:7000, spd:44,  r:56, dmg:56, xp:170, ai:'boss', boss:true },
  boss_mewtwo:  { id:150, n:'뮤츠',    hp:12000,spd:96,  r:56, dmg:60, xp:260, ai:'boss', boss:true, ranged:true, final:true },
  boss_rayquaza:{ id:384, n:'레쿠쟈',  hp:14000,spd:104, r:60, dmg:64, xp:300, ai:'boss', boss:true, final:true },
  /* 환상 조우 */
  legend_mew:   { id:151, n:'뮤',      hp:900, spd:170, r:26, dmg:10, xp:120, ai:'flee', legend:true },
  legend_jirachi:{ id:385,n:'지라치',  hp:1100,spd:150, r:26, dmg:10, xp:140, ai:'flee', legend:true },
  legend_darkrai:{ id:491,n:'다크라이', hp:1600,spd:130, r:30, dmg:22, xp:170, ai:'flee', legend:true },
  legend_celebi:{ id:251, n:'세레비',  hp:1000,spd:160, r:26, dmg:10, xp:130, ai:'flee', legend:true },
  legend_articuno:{id:144,n:'프리져',  hp:1800,spd:110, r:32, dmg:24, xp:180, ai:'flee', legend:true },
  legend_zapdos: { id:145,n:'썬더',    hp:1800,spd:140, r:32, dmg:24, xp:180, ai:'flee', legend:true },
  legend_moltres:{ id:146,n:'파이어',  hp:1800,spd:120, r:32, dmg:24, xp:180, ai:'flee', legend:true }
};

/* ---------- 스테이지 ---------- */
export const STAGES = [
  {
    key:'meadow', name:'관동 초원', sub:'초보 트레이너의 첫 모험', duration:900,
    desc:'15분간 버텨라. 마지막에 뮤츠가 강림한다.',
    sky:['#0d1b2a','#16324f'], ground:['#1b4332','#14322a'], accent:'#4ade80', deco:'grass',
    pools:[
      { t:0,   list:['caterpie','rattata','pidgey','weedle'] },
      { t:45,  list:['zubat','oddish','nidoranf','diglett'] },
      { t:100, list:['nidoranm','meowth','psyduck','gastly','magikarp'] },
      { t:170, list:['machop','geodude','koffing','tentacool','voltorb'] },
      { t:250, list:['onix','drowzee','cubone','ponyta','magnemite'] },
      { t:330, list:['gloom','haunter','arbok','staryu','krabby'] },
      { t:420, list:['scyther','pinsir','tauros','electabuzz','magmar'] },
      { t:520, list:['gyaradosE','lapras','dragonair','hitmonlee','pinsirE'] },
      { t:640, list:['golem','rhydon','dragonair','gyaradosE','tauros'] }
    ],
    bosses:[{t:120,k:'boss_nidoking'},{t:300,k:'boss_alakazam'},{t:480,k:'boss_gyarados'},{t:660,k:'boss_dragonite'},{t:810,k:'boss_tyranitar'}],
    final:{t:900,k:'boss_mewtwo'},
    legends:[{t:210,k:'legend_mew'},{t:390,k:'legend_jirachi'},{t:570,k:'legend_celebi'},{t:750,k:'legend_darkrai'}],
    reward:1
  },
  {
    key:'cave', name:'은빛 동굴', sub:'빛도 들지 않는 깊은 동굴', duration:900,
    desc:'더 강한 적이 몰려온다. 보상도 두 배.',
    sky:['#14121f','#241d33'], ground:['#2b2b38','#1d1d26'], accent:'#a5b4fc', deco:'rock',
    pools:[
      { t:0,   list:['geodude','zubat','diglett','sandshrew'] },
      { t:45,  list:['onix','machop','koffing','cubone'] },
      { t:100, list:['gastly','drowzee','magnemite','voltorb'] },
      { t:170, list:['haunter','golem','arbok','ponyta'] },
      { t:250, list:['rhydon','magmar','electabuzz','lapras'] },
      { t:330, list:['gyaradosE','scyther','pinsir','dragonair'] },
      { t:420, list:['golem','rhydon','tauros','hitmonlee'] },
      { t:520, list:['dragonair','gyaradosE','lapras','pinsirE'] },
      { t:640, list:['rhydon','golem','gyaradosE','tauros'] }
    ],
    bosses:[{t:120,k:'boss_scizor'},{t:300,k:'boss_gyarados'},{t:480,k:'boss_dragonite'},{t:660,k:'boss_metagross'},{t:810,k:'boss_garchomp'}],
    final:{t:900,k:'boss_rayquaza'},
    legends:[{t:210,k:'legend_articuno'},{t:390,k:'legend_zapdos'},{t:570,k:'legend_moltres'},{t:750,k:'legend_darkrai'}],
    reward:2
  },
  {
    key:'sky', name:'하늘 제단', sub:'전설이 잠든 구름 위의 성소', duration:900,
    desc:'최종 스테이지. 모든 것이 가장 강하다.',
    sky:['#1a1030','#3b1d5c'], ground:['#2d1b4e','#20143a'], accent:'#c084fc', deco:'star',
    pools:[
      { t:0,   list:['pidgey','zubat','gastly','ponyta'] },
      { t:45,  list:['haunter','magnemite','drowzee','voltorb'] },
      { t:100, list:['arbok','staryu','gloom','electabuzz'] },
      { t:170, list:['scyther','tauros','pinsir','dragonair'] },
      { t:250, list:['gyaradosE','lapras','rhydon','magmar'] },
      { t:330, list:['golem','hitmonlee','dragonair','pinsirE'] },
      { t:420, list:['gyaradosE','lapras','tauros','rhydon'] },
      { t:520, list:['golem','dragonair','gyaradosE','hitmonlee'] },
      { t:640, list:['rhydon','golem','gyaradosE','lapras'] }
    ],
    bosses:[{t:120,k:'boss_alakazam'},{t:300,k:'boss_scizor'},{t:480,k:'boss_garchomp'},{t:660,k:'boss_snorlax'},{t:810,k:'boss_metagross'}],
    final:{t:900,k:'boss_rayquaza'},
    legends:[{t:180,k:'legend_mew'},{t:360,k:'legend_jirachi'},{t:540,k:'legend_celebi'},{t:720,k:'legend_darkrai'}],
    reward:3
  }
];

/* ---------- 영구 강화 상점 ---------- */
export const UPGRADES = [
  { key:'power',   name:'공격력',      icon:'⚔️', desc:'모든 기술 피해 +6%',         max:20, cost:60,  grow:1.16 },
  { key:'health',  name:'최대 체력',   icon:'❤️', desc:'최대 체력 +12',             max:20, cost:55,  grow:1.15 },
  { key:'speed',   name:'이동 속도',   icon:'👟', desc:'이동 속도 +3%',             max:10, cost:70,  grow:1.18 },
  { key:'haste',   name:'공격 속도',   icon:'⏱️', desc:'기술 쿨다운 -3%',           max:15, cost:80,  grow:1.18 },
  { key:'magnet',  name:'자석 범위',   icon:'🧲', desc:'경험치 흡수 범위 +10%',      max:10, cost:45,  grow:1.14 },
  { key:'growth',  name:'경험치 획득', icon:'📈', desc:'경험치 획득 +6%',           max:15, cost:65,  grow:1.16 },
  { key:'greed',   name:'코인 획득',   icon:'🪙', desc:'코인 획득 +8%',             max:15, cost:70,  grow:1.17 },
  { key:'armor',   name:'방어력',      icon:'🛡️', desc:'받는 피해 -3%',             max:10, cost:75,  grow:1.18 },
  { key:'revive',  name:'부활',        icon:'✨', desc:'한 판에 1회 부활',           max:3,  cost:400, grow:2.1 },
  { key:'shiny',   name:'이로치 확률', icon:'💠', desc:'시작 이로치 확률 +1.5%',     max:10, cost:120, grow:1.25 },
  { key:'luck',    name:'행운',        icon:'🍀', desc:'상자·드롭 확률 증가',        max:10, cost:90,  grow:1.2 },
  { key:'startLv', name:'동료의 가호', icon:'🎁', desc:'시작 시 랜덤 기술 1개 추가',  max:3,  cost:300, grow:2.2 }
];

export const SAVE_KEY = 'pokeSurvivor.save.v3';
