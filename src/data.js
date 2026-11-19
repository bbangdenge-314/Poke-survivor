/* ============================================================
   POKE SURVIVOR — 데이터 계층 (확장판)
   포켓몬 26종 / 기술 22종 + 초각성 6종 / 적 기믹 / 7개 스테이지
   메가진화·거다이맥스 / 인게임 진화 퀘스트 / 메타 퀘스트
   ============================================================ */

export const TYPE_COLORS = {
  노말: '#b9b9a0', 불꽃: '#f08030', 물: '#6890f0', 풀: '#78c850', 전기: '#f7d02c',
  에스퍼: '#f85888', 악: '#8a6a58', 드래곤: '#7038f8', 얼음: '#8fd6d6', 독: '#a040a0',
  땅: '#d9b45a', 바위: '#b8a038', 비행: '#a890f0', 강철: '#a8a8c0', 격투: '#c03028',
  고스트: '#705898', 벌레: '#a8b820', 페어리: '#ee99ac'
};

/* ---------- 도감 (등장 포켓몬 전부) ---------- */
export const DEX = {
  1:{n:'이상해씨',t:['풀','독']}, 2:{n:'이상해풀',t:['풀','독']}, 3:{n:'이상해꽃',t:['풀','독']},
  4:{n:'파이리',t:['불꽃']}, 5:{n:'리자드',t:['불꽃']}, 6:{n:'리자몽',t:['불꽃','비행']},
  7:{n:'꼬부기',t:['물']}, 8:{n:'어니부기',t:['물']}, 9:{n:'거북왕',t:['물']},
  10:{n:'캐터피',t:['벌레']}, 11:{n:'단데기',t:['벌레']}, 13:{n:'뿔충이',t:['벌레','독']},
  14:{n:'딱충이',t:['벌레','독']}, 16:{n:'피죤',t:['노말','비행']}, 17:{n:'피죤투',t:['노말','비행']},
  19:{n:'꼬렛',t:['노말']}, 20:{n:'레트라',t:['노말']}, 24:{n:'아보크',t:['독']},
  25:{n:'피카츄',t:['전기']}, 26:{n:'라이츄',t:['전기']},
  27:{n:'샌드',t:['땅']}, 29:{n:'니드런♀',t:['독']}, 30:{n:'니드리노♀',t:['독']},
  32:{n:'니드런♂',t:['독']}, 33:{n:'니드리노♂',t:['독']}, 34:{n:'니드킹',t:['독','땅']},
  35:{n:'삐삐',t:['페어리']}, 39:{n:'푸린',t:['노말','페어리']},
  41:{n:'주뱃',t:['독','비행']}, 42:{n:'골뱃',t:['독','비행']},
  43:{n:'뚜벅쵸',t:['풀','독']}, 44:{n:'냄새꼬',t:['풀','독']},
  48:{n:'콘팡',t:['벌레','독']}, 49:{n:'도나리',t:['벌레','독']},
  50:{n:'디그다',t:['땅']}, 51:{n:'닥트리오',t:['땅']}, 52:{n:'나옹',t:['노말']},
  54:{n:'고라파덕',t:['물']}, 55:{n:'골덕',t:['물']}, 56:{n:'망키',t:['격투']}, 57:{n:'성원숭',t:['격투']},
  58:{n:'가디',t:['불꽃']}, 59:{n:'윈디',t:['불꽃']},
  60:{n:'발챙이',t:['물']}, 61:{n:'슈륙챙이',t:['물']}, 62:{n:'강챙이',t:['물','격투']},
  63:{n:'케이시',t:['에스퍼']}, 64:{n:'윤겔라',t:['에스퍼']}, 65:{n:'후딘',t:['에스퍼']},
  66:{n:'알통몬',t:['격투']}, 67:{n:'근육몬',t:['격투']}, 68:{n:'괴력몬',t:['격투']},
  72:{n:'왕눈해',t:['물','독']}, 73:{n:'독파리',t:['물','독']},
  74:{n:'꼬마돌',t:['바위','땅']}, 75:{n:'데구리',t:['바위','땅']}, 76:{n:'딱구리',t:['바위','땅']},
  77:{n:'포니타',t:['불꽃']}, 78:{n:'날쌩마',t:['불꽃']},
  81:{n:'코일',t:['전기','강철']}, 82:{n:'레어코일',t:['전기','강철']},
  88:{n:'질퍽이',t:['독']}, 89:{n:'질뻐기',t:['독']},
  90:{n:'셀러',t:['물']}, 91:{n:'파르셀',t:['물','얼음']},
  92:{n:'고오스',t:['고스트','독']}, 93:{n:'고우스트',t:['고스트','독']}, 94:{n:'팬텀',t:['고스트','독']},
  95:{n:'롱스톤',t:['바위','땅']}, 96:{n:'슬리프',t:['에스퍼']}, 97:{n:'슬리퍼',t:['에스퍼']},
  98:{n:'크랩',t:['물']}, 99:{n:'킹크랩',t:['물']},
  100:{n:'찌리리공',t:['전기']}, 101:{n:'붐볼',t:['전기']},
  104:{n:'탕구리',t:['땅']}, 105:{n:'텅구리',t:['땅']},
  106:{n:'시라소몬',t:['격투']}, 107:{n:'홍수몬',t:['격투']},
  109:{n:'또가스',t:['독']}, 110:{n:'또도가스',t:['독']},
  111:{n:'뿔카노',t:['땅','바위']}, 112:{n:'코뿌리',t:['땅','바위']},
  113:{n:'럭키',t:['노말']}, 116:{n:'쏘드라',t:['물']}, 117:{n:'시드라',t:['물']},
  118:{n:'콘치',t:['물']}, 119:{n:'왕콘치',t:['물']}, 120:{n:'별가사리',t:['물']}, 121:{n:'아쿠스타',t:['물','에스퍼']},
  123:{n:'스라크',t:['벌레','비행']}, 125:{n:'에레브',t:['전기']}, 126:{n:'마그마',t:['불꽃']}, 127:{n:'쁘사이저',t:['벌레']},
  128:{n:'켄타로스',t:['노말']}, 129:{n:'잉어킹',t:['물']}, 130:{n:'갸라도스',t:['물','비행']},
  131:{n:'라프라스',t:['물','얼음']}, 133:{n:'이브이',t:['노말']}, 134:{n:'샤미드',t:['물']},
  135:{n:'쥬피썬더',t:['전기']}, 136:{n:'부스터',t:['불꽃']}, 143:{n:'잠만보',t:['노말']},
  144:{n:'프리져',t:['얼음','비행']}, 145:{n:'썬더',t:['전기','비행']}, 146:{n:'파이어',t:['불꽃','비행']},
  147:{n:'미뇽',t:['드래곤']}, 148:{n:'신뇽',t:['드래곤']}, 149:{n:'망나뇽',t:['드래곤','비행']},
  150:{n:'뮤츠',t:['에스퍼']}, 151:{n:'뮤',t:['에스퍼']},
  196:{n:'에브이',t:['에스퍼']}, 197:{n:'블래키',t:['악']},
  208:{n:'강철톤',t:['강철','땅']}, 211:{n:'침뱀',t:['물','독']}, 212:{n:'핫삼',t:['벌레','강철']},
  219:{n:'마그카르고',t:['불꽃','바위']}, 222:{n:'코산호',t:['물','바위']},
  223:{n:'총어',t:['물']}, 224:{n:'대포무노',t:['물']},
  243:{n:'라이코',t:['전기']}, 244:{n:'앤테이',t:['불꽃']}, 245:{n:'스이쿤',t:['물']},
  246:{n:'애버라스',t:['바위','땅']}, 247:{n:'데기라스',t:['바위','땅']}, 248:{n:'마기라스',t:['바위','악']},
  249:{n:'루기아',t:['에스퍼','비행']}, 250:{n:'칠색조',t:['불꽃','비행']}, 251:{n:'세레비',t:['에스퍼','풀']},
  302:{n:'깜까미',t:['악','고스트']},
  320:{n:'고래왕자',t:['물']}, 321:{n:'고래왕',t:['물']}, 323:{n:'폭타',t:['불꽃','땅']}, 324:{n:'코터스',t:['불꽃']},
  353:{n:'어둠대신',t:['고스트']}, 354:{n:'다크펫',t:['고스트']}, 355:{n:'해골몽',t:['고스트']},
  356:{n:'미라몽',t:['고스트']}, 359:{n:'앱솔',t:['악']},
  363:{n:'대굴레오',t:['얼음','물']}, 365:{n:'씨카이저',t:['얼음','물']}, 366:{n:'진주몽',t:['물']},
  367:{n:'헌테일',t:['물']}, 368:{n:'분홍장이',t:['물']}, 369:{n:'시라이유',t:['물','바위']},
  376:{n:'메타그로스',t:['강철','에스퍼']}, 382:{n:'가이오가',t:['물']}, 383:{n:'그란돈',t:['땅']},
  384:{n:'레쿠쟈',t:['드래곤','비행']}, 385:{n:'지라치',t:['강철','에스퍼']}, 386:{n:'테오키스',t:['에스퍼']},
  429:{n:'무우마직',t:['고스트']}, 436:{n:'동미러',t:['강철','에스퍼']}, 442:{n:'화강돌',t:['고스트','악']},
  443:{n:'딥상어동',t:['드래곤','땅']}, 444:{n:'한바이트',t:['드래곤','땅']}, 445:{n:'한카리아스',t:['드래곤','땅']},
  448:{n:'루카리오',t:['격투','강철']}, 467:{n:'마그마번',t:['불꽃']},
  477:{n:'야느와르몽',t:['고스트']}, 480:{n:'유크시',t:['에스퍼']}, 481:{n:'엠라이트',t:['에스퍼']},
  482:{n:'아그놈',t:['에스퍼']}, 483:{n:'디아루가',t:['강철','드래곤']}, 484:{n:'펄기아',t:['물','드래곤']},
  485:{n:'히드런',t:['불꽃','강철']}, 487:{n:'기라티나',t:['고스트','드래곤']},
  489:{n:'피오네',t:['물']}, 490:{n:'마나피',t:['물']}, 491:{n:'다크라이',t:['악']},
  493:{n:'아르세우스',t:['노말']}, 531:{n:'다부니',t:['노말']},
  582:{n:'바닐프티',t:['얼음']}, 607:{n:'불켜미',t:['고스트','불꽃']}, 608:{n:'램프라',t:['고스트','불꽃']},
  609:{n:'샹델라',t:['고스트','불꽃']}, 633:{n:'모노두',t:['악','드래곤']}, 634:{n:'디헤드',t:['악','드래곤']},
  703:{n:'멜리시',t:['바위','페어리']}, 704:{n:'미끄메라',t:['드래곤']}, 705:{n:'미끄네일',t:['드래곤']},
  707:{n:'클레피',t:['강철','페어리']}, 714:{n:'음뱃',t:['비행']}, 715:{n:'음번',t:['비행','드래곤']},
  778:{n:'따라큐',t:['고스트','페어리']},
  813:{n:'염버니',t:['불꽃']}, 814:{n:'래비풋',t:['불꽃']}, 815:{n:'에이스번',t:['불꽃']},
  /* 메가진화 · 거다이맥스 전용 스프라이트 */
  10033:{n:'메가이상해꽃',t:['풀','독'],form:'메가'}, 10034:{n:'메가리자몽X',t:['불꽃','드래곤'],form:'메가'},
  10035:{n:'메가리자몽Y',t:['불꽃','비행'],form:'메가'}, 10036:{n:'메가거북왕',t:['물'],form:'메가'},
  10037:{n:'메가후딘',t:['에스퍼'],form:'메가'}, 10038:{n:'메가팬텀',t:['고스트','독'],form:'메가'},
  10041:{n:'메가갸라도스',t:['물','악'],form:'메가'}, 10043:{n:'메가뮤츠Y',t:['에스퍼'],form:'메가'},
  10049:{n:'메가마기라스',t:['바위','악'],form:'메가'}, 10058:{n:'메가한카리아스',t:['드래곤','땅'],form:'메가'},
  10059:{n:'메가루카리오',t:['격투','강철'],form:'메가'}, 10076:{n:'메가메타그로스',t:['강철','에스퍼'],form:'메가'},
  10079:{n:'메가레쿠쟈',t:['드래곤','비행'],form:'메가'},
  10195:{n:'거다이이상해꽃',t:['풀','독'],form:'거다이'}, 10196:{n:'거다이리자몽',t:['불꽃','비행'],form:'거다이'},
  10197:{n:'거다이거북왕',t:['물'],form:'거다이'}, 10199:{n:'거다이피카츄',t:['전기'],form:'거다이'},
  10201:{n:'거다이괴력몬',t:['격투'],form:'거다이'}, 10202:{n:'거다이팬텀',t:['고스트','독'],form:'거다이'},
  10204:{n:'거다이라프라스',t:['물','얼음'],form:'거다이'}, 10205:{n:'거다이이브이',t:['노말'],form:'거다이'},
  10206:{n:'거다이잠만보',t:['노말'],form:'거다이'}, 10210:{n:'거다이에이스번',t:['불꽃'],form:'거다이'}
};

/* ---------- 기술(액티브) 22종 ---------- */
export const WEAPONS = {
  thunder: {
    name:'10만볼트', icon:'⚡', type:'전기', color:'#fbbf24', max:6, pair:'cooldown',
    desc:'가장 가까운 적에게 연쇄 번개. 레벨이 오르면 연쇄 수가 늘어난다.',
    stats: lv => ({ dmg: 22 + 9 * lv, cd: Math.max(0.32, 1.15 - lv * 0.09), count: 1 + Math.floor(lv / 3), chains: 2 + lv, range: 540 }),
    awakeName:'천둥의 심판', awakeIcon:'🌩️', awakeColor:'#fde047',
    awakeDesc:'화면 전체의 적에게 번개가 내리치고, 연쇄가 2배로 늘어난다.'
  },
  flame: {
    name:'화염방사', icon:'🔥', type:'불꽃', color:'#fb923c', max:6, pair:'power',
    desc:'전방으로 화염을 뿌려 화상을 입힌다.',
    stats: lv => ({ dmg: 11 + 5.2 * lv, cd: Math.max(0.2, 0.62 - lv * 0.05), count: 3 + lv, range: 300 + lv * 22 }),
    awakeName:'불대문자', awakeIcon:'🔥', awakeColor:'#fdba74',
    awakeDesc:'회오리 불꽃이 사방을 태우고 화상 피해가 두 배가 된다.'
  },
  water: {
    name:'물대포', icon:'💧', type:'물', color:'#38bdf8', max:6, pair:'speed',
    desc:'관통하는 물줄기를 발사한다.',
    stats: lv => ({ dmg: 16 + 6.5 * lv, cd: Math.max(0.35, 1.05 - lv * 0.08), count: 1 + Math.floor(lv / 2), pierce: 3 + lv }),
    awakeName:'하이드로펌프', awakeIcon:'🌊', awakeColor:'#7dd3fc',
    awakeDesc:'거대한 물기둥이 전장을 가르며 적을 밀어낸다.'
  },
  leaf: {
    name:'잎날가르기', icon:'🍃', type:'풀', color:'#4ade80', max:6, pair:'regen',
    desc:'주변을 회전하는 잎날이 적을 벤다.',
    stats: lv => ({ dmg: 12 + 5.5 * lv, cd: 0.42, count: 2 + lv, radius: 78 + lv * 9, spin: 2.4 + lv * 0.16 }),
    awakeName:'리프스톰', awakeIcon:'🌿', awakeColor:'#86efac',
    awakeDesc:'잎날 폭풍이 두 배로 늘고 회전이 빨라진다.'
  },
  shadow: {
    name:'섀도볼', icon:'🌑', type:'고스트', color:'#a78bfa', max:6, pair:'crit',
    desc:'적을 추적하는 그림자 구체가 폭발한다.',
    stats: lv => ({ dmg: 26 + 11 * lv, cd: Math.max(0.5, 1.5 - lv * 0.1), count: 1 + Math.floor(lv / 2), blast: 52 + lv * 6 }),
    awakeName:'섀도다이브', awakeIcon:'🕳️', awakeColor:'#c4b5fd',
    awakeDesc:'모든 그림자가 적을 삼키고, 폭발이 연쇄한다.'
  },
  psychic: {
    name:'사이코키네시스', icon:'🔮', type:'에스퍼', color:'#f472b6', max:6, pair:'magnet',
    desc:'주변을 뒤흔드는 염동력 파동.',
    stats: lv => ({ dmg: 18 + 7.5 * lv, cd: Math.max(0.6, 1.9 - lv * 0.12), radius: 150 + lv * 26 }),
    awakeName:'사이코브레이크', awakeIcon:'🌀', awakeColor:'#f9a8d4',
    awakeDesc:'공간을 뒤틀어 적을 끌어당기고 광역 피해를 준다.'
  },
  quake: {
    name:'지진', icon:'🌍', type:'땅', color:'#d9b45a', max:6, pair:'armor',
    desc:'지면을 강타해 주변을 밀어낸다.',
    stats: lv => ({ dmg: 30 + 12 * lv, cd: Math.max(0.8, 2.4 - lv * 0.15), radius: 150 + lv * 22 }),
    awakeName:'대지진', awakeIcon:'⛰️', awakeColor:'#eab308',
    awakeDesc:'전장이 갈라지고 충격파가 3연타로 연쇄한다.'
  },
  beam: {
    name:'파괴광선', icon:'☄️', type:'노말', color:'#fde68a', max:6, pair:'power',
    desc:'전방을 향해 굵은 광선을 발사한다.',
    stats: lv => ({ dmg: 40 + 20 * lv, cd: Math.max(1.1, 3.2 - lv * 0.25), width: 44 + lv * 5, length: 720 + lv * 60 }),
    awakeName:'기가임팩트', awakeIcon:'💥', awakeColor:'#fef08a',
    awakeDesc:'광선이 폭발해 주변을 휩쓸고 적을 날려버린다.'
  },
  claw: {
    name:'드래곤클로', icon:'🐉', type:'드래곤', color:'#818cf8', max:6, pair:'crit',
    desc:'전방을 크게 베는 참격. 치명타가 잘 터진다.',
    stats: lv => ({ dmg: 34 + 16 * lv, cd: Math.max(0.4, 1.05 - lv * 0.07), count: 1 + Math.floor(lv / 3), range: 150 + lv * 12 }),
    awakeName:'역린', awakeIcon:'⚔️', awakeColor:'#a5b4fc',
    awakeDesc:'연속 참격이 폭풍처럼 몰아치고 잔상이 적을 벤다.'
  },
  ice: {
    name:'냉동빔', icon:'❄️', type:'얼음', color:'#7dd3fc', max:6, pair:'armor',
    desc:'관통하는 냉기를 발사해 적을 얼린다.',
    stats: lv => ({ dmg: 15 + 6 * lv, cd: Math.max(0.4, 1.25 - lv * 0.09), count: 1 + Math.floor(lv / 2), pierce: 4 + lv, slow: 0.35 + lv * 0.05 }),
    awakeName:'블리자드', awakeIcon:'🌨️', awakeColor:'#e0f2fe',
    awakeDesc:'전장이 얼어붙고 주변 적이 멈춘다.'
  },
  aura: {
    name:'파동탄', icon:'💫', type:'격투', color:'#60a5fa', max:6, pair:'vitality',
    desc:'적을 추적하는 파동 구체. 관통하며 폭발한다.',
    stats: lv => ({ dmg: 24 + 10 * lv, cd: Math.max(0.42, 1.3 - lv * 0.1), count: 1 + Math.floor(lv / 2), blast: 44 + lv * 5 }),
    awakeName:'파동폭발', awakeIcon:'🌊', awakeColor:'#93c5fd',
    awakeDesc:'파동이 연쇄 폭발하며 사방으로 퍼진다.'
  },
  star: {
    name:'소원의별', icon:'🌟', type:'강철', color:'#fcd34d', max:6, pair:'coin',
    desc:'하늘에서 별이 떨어져 적을 압사시킨다.',
    stats: lv => ({ dmg: 34 + 15 * lv, cd: Math.max(0.6, 1.7 - lv * 0.12), count: 1 + lv, blast: 60 + lv * 5 }),
    awakeName:'유성군', awakeIcon:'🌠', awakeColor:'#fde68a',
    awakeDesc:'별의 비가 쏟아지고 착탄점이 폭발한다.'
  },
  dash: {
    name:'전광석화', icon:'💨', type:'노말', color:'#fca5a5', max:6, pair:'speed',
    desc:'전방으로 돌진해 지나가는 적을 벤다.',
    stats: lv => ({ dmg: 34 + 15 * lv, cd: Math.max(0.34, 1.0 - lv * 0.09), dist: 170 + lv * 16 }),
    awakeName:'신속', awakeIcon:'⚡', awakeColor:'#fecaca',
    awakeDesc:'잔상을 남기며 연속으로 두 번 돌진한다.'
  },
  slam: {
    name:'바디프레스', icon:'💥', type:'노말', color:'#fbbf24', max:6, pair:'vitality',
    desc:'몸 전체로 내리찍어 기절시킨다.',
    stats: lv => ({ dmg: 44 + 18 * lv, cd: Math.max(0.85, 2.4 - lv * 0.19), radius: 155 + lv * 22 }),
    awakeName:'기가프레스', awakeIcon:'🪨', awakeColor:'#fcd34d',
    awakeDesc:'착지 충격파가 2연타로 터지고 적을 기절시킨다.'
  },
  nightmare: {
    name:'악몽', icon:'😈', type:'악', color:'#c084fc', max:6, pair:'xp',
    desc:'주변에 악몽의 장막을 펼쳐 지속 피해를 준다.',
    stats: lv => ({ dmg: 8 + 4 * lv, cd: 0.5, radius: 120 + lv * 14 }),
    awakeName:'암흑세계', awakeIcon:'🌌', awakeColor:'#d8b4fe',
    awakeDesc:'장막이 넓어지고 적이 공포에 질려 도망친다.'
  },
  poison: {
    name:'독액살포', icon:'🧪', type:'독', color:'#a855f7', max:6, pair:'xp',
    desc:'발밑에 독 웅덩이를 뿌려 지속 피해를 준다.',
    stats: lv => ({ dmg: 8 + 4.2 * lv, cd: Math.max(0.7, 1.5 - lv * 0.1), radius: 84 + lv * 12, count: 1 + Math.floor(lv / 3) }),
    awakeName:'독의 왕좌', awakeIcon:'☠️', awakeColor:'#d8b4fe',
    awakeDesc:'독구름이 사방으로 퍼지고 적을 중독시켜 약화시킨다.'
  },
  tornado: {
    name:'회오리', icon:'🌪️', type:'비행', color:'#a5f3fc', max:6, pair:'speed',
    desc:'몸 주위를 도는 회오리가 적을 끌어당겨 베어낸다.',
    stats: lv => ({ dmg: 10 + 5 * lv, cd: Math.max(0.5, 1.1 - lv * 0.07), radius: 96 + lv * 12, spin: 1.6 + lv * 0.12, count: 1 + Math.floor(lv / 2) }),
    awakeName:'폭풍의 눈', awakeIcon:'🌀', awakeColor:'#67e8f9',
    awakeDesc:'거대한 회오리가 전장을 휩쓸고 적을 빨아들인다.'
  },
  bone: {
    name:'뼈다귀부메랑', icon:'🦴', type:'땅', color:'#e7d3a1', max:6, pair:'armor',
    desc:'뼈다귀를 던져 적을 맞히고 되돌아온다.',
    stats: lv => ({ dmg: 26 + 12 * lv, cd: Math.max(0.5, 1.2 - lv * 0.08), count: 1 + Math.floor(lv / 2), dist: 300 + lv * 24 }),
    awakeName:'유골의 춤', awakeIcon:'☠️', awakeColor:'#fde68a',
    awakeDesc:'뼈 회오리가 사방을 돌며 연속으로 내리친다.'
  },
  curse: {
    name:'저주', icon:'👁️', type:'고스트', color:'#8b5cf6', max:6, pair:'magnet',
    desc:'적의 발밑에 저주 장판을 깔아 계속 피해를 준다.',
    stats: lv => ({ dmg: 9 + 4.5 * lv, cd: Math.max(0.9, 2.0 - lv * 0.12), radius: 96 + lv * 14 }),
    awakeName:'원한의 늪', awakeIcon:'🕯️', awakeColor:'#c4b5fd',
    awakeDesc:'저주가 전장에 스며들어 적을 묶고 체력을 빨아온다.'
  },
  echo: {
    name:'에코보이스', icon:'🔊', type:'노말', color:'#fda4af', max:6, pair:'magnet',
    desc:'고리 모양의 음파를 퍼뜨려 주변을 밀어낸다.',
    stats: lv => ({ dmg: 14 + 6.5 * lv, cd: Math.max(0.55, 1.35 - lv * 0.09), radius: 130 + lv * 18 }),
    awakeName:'음파붕괴', awakeIcon:'📢', awakeColor:'#fecdd3',
    awakeDesc:'음파가 3중으로 겹쳐 터지며 적을 기절시킨다.'
  },
  fairy: {
    name:'문포스', icon:'🌙', type:'페어리', color:'#f9a8d4', max:6, pair:'regen',
    desc:'달빛 구슬이 적을 추적해 폭발한다.',
    stats: lv => ({ dmg: 20 + 9 * lv, cd: Math.max(0.5, 1.3 - lv * 0.09), count: 1 + Math.floor(lv / 2), blast: 50 + lv * 5 }),
    awakeName:'달의 축복', awakeIcon:'🌕', awakeColor:'#fbcfe8',
    awakeDesc:'달빛이 쏟아져 적을 정화하고 아군을 회복시킨다.'
  },
  mirror: {
    name:'거울샷', icon:'🪞', type:'강철', color:'#cbd5e1', max:6, pair:'crit',
    desc:'거울 조각이 튕기며 여러 적을 꿰뚫는다.',
    stats: lv => ({ dmg: 18 + 8 * lv, cd: Math.max(0.4, 1.1 - lv * 0.08), count: 1 + Math.floor(lv / 3), pierce: 3 + lv }),
    awakeName:'프리즘 캐논', awakeIcon:'💎', awakeColor:'#e2e8f0',
    awakeDesc:'프리즘 광선이 반사되어 화면을 가로지른다.'
  }
};

/* ---------- 초각성(각성 + 각성 → 궁극기) ---------- */
export const SUPER_AWAKENS = [
  { key:'storm', name:'폭풍의 심판', icon:'🌩️', color:'#fde047', from:['thunder', 'flame'],
    desc:'천둥과 불꽃이 뒤섞여 전장에 뇌염 폭풍을 부른다.', stats: lv => ({ dmg: 90 + 30 * lv, cd: 2.0 }) },
  { key:'tsunami', name:'빙하 해일', icon:'🌊', color:'#7dd3fc', from:['water', 'ice'],
    desc:'얼어붙은 거대 파도가 화면을 가로지르며 적을 얼린다.', stats: lv => ({ dmg: 85 + 28 * lv, cd: 2.1 }) },
  { key:'gaia', name:'세계수의 심판', icon:'🌳', color:'#86efac', from:['leaf', 'star'],
    desc:'세계수의 잎과 별이 함께 쏟아져 대지를 뒤덮는다.', stats: lv => ({ dmg: 88 + 30 * lv, cd: 2.2 }) },
  { key:'void', name:'영원한 어둠', icon:'🕳️', color:'#c084fc', from:['shadow', 'curse'],
    desc:'특이점이 열려 적을 빨아들이고 산산조각 낸다.', stats: lv => ({ dmg: 95 + 32 * lv, cd: 2.3 }) },
  { key:'pulse', name:'무한의 파동', icon:'💠', color:'#93c5fd', from:['aura', 'claw'],
    desc:'파동 참격이 사방으로 무한히 뻗어나간다.', stats: lv => ({ dmg: 92 + 30 * lv, cd: 2.0 }) },
  { key:'genesis', name:'천지개벽', icon:'🌋', color:'#fbbf24', from:['quake', 'slam'],
    desc:'대지가 갈라지고 하늘이 무너져 전장이 재편된다.', stats: lv => ({ dmg: 110 + 36 * lv, cd: 2.5 }) }
];

/* 초각성 기술을 WEAPONS에 등록해 UI/전투가 동일한 경로로 처리되게 한다 */
for (const s of SUPER_AWAKENS) {
  WEAPONS['super_' + s.key] = {
    name: s.name, icon: s.icon, type: '초각성', color: s.color, max: 3, pair: null,
    super: true, superKey: s.key, desc: s.desc, stats: s.stats,
    awakeName: s.name, awakeIcon: s.icon, awakeColor: s.color, awakeDesc: s.desc
  };
}
export const SUPER_IDS = SUPER_AWAKENS.map(s => 'super_' + s.key);
export const WEAPON_IDS = Object.keys(WEAPONS).filter(k => !WEAPONS[k].super);

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
export const PASSIVE_KEYS = Object.keys(PASSIVES);

/* ---------- 필드 아이템 ---------- */
export const FIELD_ITEMS = {
  berry:  { name:'오랭열매',   icon:'🍒', color:'#f87171', desc:'체력 22% 회복' },
  magnet: { name:'자석 오브',  icon:'🧲', color:'#a78bfa', desc:'경험치·아이템 흡수' },
  coin:   { name:'코인 주머니', icon:'🪙', color:'#fbbf24', desc:'코인 +28' },
  bomb:   { name:'충격파 폭탄', icon:'💣', color:'#fb923c', desc:'화면 전체 피해' },
  guard:  { name:'수호의 방패', icon:'🛡️', color:'#7dd3fc', desc:'4초 무적' },
  haste:  { name:'가속의 깃털', icon:'🪶', color:'#34d399', desc:'6초 이동 +50%' },
  candy:  { name:'경험치 사탕', icon:'🍬', color:'#60a5fa', desc:'경험치 +26' }
};
export const FIELD_ITEM_KEYS = Object.keys(FIELD_ITEMS);

/* 파괴 가능한 오브젝트 */
export const PROP_TYPES = {
  crate:  { name:'상자', hp:60,  r:22, drop:'item' },
  rock:   { name:'바위', hp:95,  r:26, drop:'coin' },
  crystal:{ name:'수정', hp:75,  r:20, drop:'candy' }
};

/* ---------- 플레이어블 포켓몬 (26종) ---------- */
/* chain : 실제 진화 단계 (스프라이트/이름)
   evoQuests : [1차 진화 퀘스트, 2차 진화 퀘스트] — 인게임 퀘스트 달성 시 진화
   special : 메가진화 / 거다이맥스 (전용 퀘스트 달성 시 발동)
   unlockQuest : 메타 퀘스트 키 (없으면 기본 해금) */
export const CHARACTERS = [
  { key:'bulbasaur', id:1, rank:'스타터', weapon:'leaf', sig:'photosynthesis', sigName:'광합성',
    sigDesc:'초당 체력 1.6 회복', hp:120, speed:198, dmg:1.0,
    affinity:['leaf','poison','fairy'], mastery:{'풀':0.18,'독':0.08},
    weaponBonus:{ leaf:{ count:1 } }, trait:'풀 기술을 쓰면 잎날이 하나 더 돈다',
    chain:[{id:1,name:'이상해씨'},{id:2,name:'이상해풀'},{id:3,name:'이상해꽃'}],
    evoQuests:[{label:'적 22마리 처치', goals:{kills:22}}, {label:'적 85마리 처치 · 2분 생존', goals:{kills:85, time:120}}],
    special:{ kind:'mega', id:10033, name:'메가이상해꽃', aura:'#86efac', bonus:{dmg:1.5, hp:1.45, speed:1.06},
      quest:{label:'보스 2마리 · 25초 무피격 · 적 240마리', goals:{bosses:2, noHit:25, kills:240}} } },
  { key:'charmander', id:4, rank:'스타터', weapon:'flame', sig:'blaze', sigName:'맹화',
    sigDesc:'불꽃 기술 피해 +30%', hp:100, speed:208, dmg:1.08,
    affinity:['flame','dash','quake'], mastery:{'불꽃':0.30},
    weaponBonus:{ flame:{ count:1 } }, trait:'불꽃 기술의 화상 피해가 2배',
    chain:[{id:4,name:'파이리'},{id:5,name:'리자드'},{id:6,name:'리자몽'}],
    evoQuests:[{label:'적 24마리 처치', goals:{kills:24}}, {label:'적 90마리 · 엘리트 1마리', goals:{kills:90, elites:1}}],
    special:{ kind:'mega', id:10034, name:'메가리자몽 X', aura:'#7dd3fc', bonus:{dmg:1.62, hp:1.4, speed:1.08},
      quest:{label:'보스 2마리 · 25초 무피격 · 적 250마리', goals:{bosses:2, noHit:25, kills:250}} } },
  { key:'squirtle', id:7, rank:'스타터', weapon:'water', sig:'shell', sigName:'단단한 껍질',
    sigDesc:'받는 피해 18% 감소', hp:136, speed:200, dmg:0.95,
    affinity:['water','ice','mirror'], mastery:{'물':0.28},
    weaponBonus:{ water:{ pierce:2 } }, trait:'물 기술이 적을 밀어낸다',
    chain:[{id:7,name:'꼬부기'},{id:8,name:'어니부기'},{id:9,name:'거북왕'}],
    evoQuests:[{label:'적 24마리 처치', goals:{kills:24}}, {label:'적 95마리 · 상자 1개', goals:{kills:95, chests:1}}],
    special:{ kind:'mega', id:10036, name:'메가거북왕', aura:'#7dd3fc', bonus:{dmg:1.52, hp:1.5, speed:1.04},
      quest:{label:'보스 2마리 · 25초 무피격 · 적 240마리', goals:{bosses:2, noHit:25, kills:240}} } },
  { key:'pikachu', id:25, rank:'스타터', weapon:'thunder', sig:'static', sigName:'정전기',
    sigDesc:'접촉한 적에게 감전 피해', hp:95, speed:222, dmg:1.05,
    affinity:['thunder','dash','echo'], mastery:{'전기':0.35},
    weaponBonus:{ thunder:{ chains:2 } }, trait:'번개 연쇄가 2회 더 튄다',
    chain:[{id:25,name:'피카츄'},{id:26,name:'라이츄'}],
    evoQuests:[{label:'적 30마리 처치', goals:{kills:30}}, {label:'적 120마리 · 엘리트 1마리', goals:{kills:120, elites:1}}],
    special:{ kind:'gmax', id:10199, name:'거다이피카츄', aura:'#fde047', bonus:{dmg:1.55, hp:1.42, speed:1.06},
      quest:{label:'보스 2마리 · 30초 무피격 · 적 250마리', goals:{bosses:2, noHit:30, kills:250}} } },
  { key:'eevee', id:133, rank:'스타터', weapon:'dash', sig:'adapt', sigName:'적응력',
    sigDesc:'경험치 +20%, 선택지 1장 추가', hp:104, speed:215, dmg:1.0,
    affinity:['dash','aura','fairy'], mastery:{'노말':0.16},
    weaponBonus:{ dash:{ dist:30 } }, trait:'모든 기술을 고르게 성장시킨다',
    chain:[{id:133,name:'이브이'}],
    evoQuests:[{label:'적 20마리 처치', goals:{kills:20}}, {label:'적 80마리 · 2분 30초', goals:{kills:80, time:150}}],
    branch:{ options:[134,135,136,196,197] },
    special:{ kind:'gmax', id:10205, name:'거다이이브이', aura:'#fde68a', bonus:{dmg:1.5, hp:1.45, speed:1.1},
      quest:{label:'보스 2마리 · 25초 무피격 · 적 230마리', goals:{bosses:2, noHit:25, kills:230}} } },
  { key:'gengar', id:94, rank:'스타터', weapon:'shadow', sig:'levitate', sigName:'부유',
    sigDesc:'이동속도 +12%, 접촉 피해 15% 회피', hp:100, speed:210, dmg:1.1,
    affinity:['shadow','nightmare','curse'], mastery:{'고스트':0.30,'독':0.10},
    weaponBonus:{ shadow:{ blast:1.2, count:1, pierce:1 } }, trait:'그림자 구체가 폭발하며 관통한다',
    chain:[{id:94,name:'팬텀'}],
    evoQuests:[{label:'적 35마리 · 10초 무피격', goals:{kills:35, noHit:10}}, {label:'적 140마리 · 엘리트 2마리', goals:{kills:140, elites:2}}],
    special:{ kind:'mega', id:10038, name:'메가팬텀', aura:'#c084fc', bonus:{dmg:1.6, hp:1.4, speed:1.08},
      quest:{label:'보스 2마리 · 30초 무피격 · 적 250마리', goals:{bosses:2, noHit:30, kills:250}} } },
  { key:'lucario', id:448, rank:'스타터', weapon:'aura', sig:'innerfocus', sigName:'정신집중',
    sigDesc:'치명타 확률 +15%', hp:108, speed:214, dmg:1.12,
    affinity:['aura','claw','mirror'], mastery:{'격투':0.28,'강철':0.10},
    weaponBonus:{ aura:{ count:1 } }, trait:'파동탄이 하나 더 발사된다',
    chain:[{id:448,name:'루카리오'}],
    evoQuests:[{label:'적 30마리 · 기술 200회 명중', goals:{kills:30, skillHits:200}}, {label:'적 130마리 · 보스 1마리', goals:{kills:130, bosses:1}}],
    special:{ kind:'mega', id:10059, name:'메가루카리오', aura:'#93c5fd', bonus:{dmg:1.65, hp:1.38, speed:1.1},
      quest:{label:'보스 2마리 · 25초 무피격 · 적 240마리', goals:{bosses:2, noHit:25, kills:240}} } },
  { key:'garchomp', id:445, rank:'스타터', weapon:'claw', sig:'roughskin', sigName:'깎이는 살갗',
    sigDesc:'접촉한 적에게 반사 피해', hp:130, speed:205, dmg:1.1,
    affinity:['claw','quake','bone'], mastery:{'드래곤':0.30,'땅':0.12},
    weaponBonus:{ claw:{ count:1 } }, trait:'참격이 한 번 더 터진다',
    chain:[{id:445,name:'한카리아스'}],
    evoQuests:[{label:'적 40마리 처치', goals:{kills:40}}, {label:'적 150마리 · 엘리트 2마리', goals:{kills:150, elites:2}}],
    special:{ kind:'mega', id:10058, name:'메가한카리아스', aura:'#a5b4fc', bonus:{dmg:1.6, hp:1.45, speed:1.08},
      quest:{label:'보스 2마리 · 25초 무피격 · 적 260마리', goals:{bosses:2, noHit:25, kills:260}} } },
  { key:'gyarados', id:130, rank:'스타터', weapon:'water', sig:'intimidate', sigName:'위협',
    sigDesc:'주변 적 이동속도 -18%', hp:142, speed:196, dmg:1.1,
    affinity:['water','slam','beam'], mastery:{'물':0.24,'비행':0.12},
    weaponBonus:{ water:{ count:1 } }, trait:'물대포가 한 줄 더 뻗는다',
    chain:[{id:130,name:'갸라도스'}],
    evoQuests:[{label:'적 35마리 처치', goals:{kills:35}}, {label:'적 140마리 · 3분 생존', goals:{kills:140, time:180}}],
    special:{ kind:'mega', id:10041, name:'메가갸라도스', aura:'#38bdf8', bonus:{dmg:1.6, hp:1.45, speed:1.06},
      quest:{label:'보스 2마리 · 25초 무피격 · 적 250마리', goals:{bosses:2, noHit:25, kills:250}} } },
  { key:'snorlax', id:143, rank:'스타터', weapon:'slam', sig:'thickfat', sigName:'두꺼운 지방',
    sigDesc:'최대 HP +25%, 받는 피해 8% 감소', hp:180, speed:175, dmg:0.95,
    affinity:['slam','quake','echo'], mastery:{'노말':0.24},
    weaponBonus:{ slam:{ radius:1.18 } }, trait:'착지 충격파 범위가 넓다',
    chain:[{id:143,name:'잠만보'}],
    evoQuests:[{label:'적 25마리 처치', goals:{kills:25}}, {label:'적 100마리 · 2분 30초', goals:{kills:100, time:150}}],
    special:{ kind:'gmax', id:10206, name:'거다이잠만보', aura:'#86efac', bonus:{dmg:1.5, hp:1.6, speed:1.0},
      quest:{label:'보스 2마리 · 30초 무피격 · 적 240마리', goals:{bosses:2, noHit:30, kills:240}} } },

  { key:'charizard', id:6, rank:'해금', weapon:'flame', sig:'blaze', sigName:'맹화',
    sigDesc:'불꽃 기술 피해 +30%', hp:120, speed:218, dmg:1.15, unlockQuest:'q_clear_meadow',
    affinity:['flame','beam','tornado'], mastery:{'불꽃':0.32,'비행':0.10},
    weaponBonus:{ flame:{ count:2 } }, trait:'화염방사가 두 줄 더 뿜어진다',
    chain:[{id:6,name:'리자몽'}],
    evoQuests:[{label:'적 40마리 처치', goals:{kills:40}}, {label:'적 160마리 · 보스 1마리', goals:{kills:160, bosses:1}}],
    special:{ kind:'mega', id:10034, name:'메가리자몽 X', aura:'#7dd3fc', bonus:{dmg:1.7, hp:1.42, speed:1.1},
      quest:{label:'보스 2마리 · 30초 무피격 · 적 280마리', goals:{bosses:2, noHit:30, kills:280}} } },
  { key:'blastoise', id:9, rank:'해금', weapon:'water', sig:'shell', sigName:'단단한 껍질',
    sigDesc:'받는 피해 18% 감소', hp:156, speed:205, dmg:1.0, unlockQuest:'q_kills_300',
    affinity:['water','beam','mirror'], mastery:{'물':0.30},
    weaponBonus:{ water:{ pierce:2, count:1 } }, trait:'물대포가 두 줄로 발사된다',
    chain:[{id:9,name:'거북왕'}],
    evoQuests:[{label:'적 40마리 처치', goals:{kills:40}}, {label:'적 160마리 · 엘리트 2마리', goals:{kills:160, elites:2}}],
    special:{ kind:'mega', id:10036, name:'메가거북왕', aura:'#7dd3fc', bonus:{dmg:1.6, hp:1.55, speed:1.05},
      quest:{label:'보스 2마리 · 30초 무피격 · 적 280마리', goals:{bosses:2, noHit:30, kills:280}} } },
  { key:'venusaur', id:3, rank:'해금', weapon:'leaf', sig:'photosynthesis', sigName:'광합성',
    sigDesc:'초당 체력 1.9 회복', hp:146, speed:200, dmg:1.05, unlockQuest:'q_clear_cave',
    affinity:['leaf','nightmare','fairy'], mastery:{'풀':0.32,'독':0.10},
    weaponBonus:{ leaf:{ count:1, radius:1.1 } }, trait:'잎날이 크고 하나 더 돈다',
    chain:[{id:3,name:'이상해꽃'}],
    evoQuests:[{label:'적 40마리 처치', goals:{kills:40}}, {label:'적 160마리 · 3분 20초', goals:{kills:160, time:200}}],
    special:{ kind:'mega', id:10033, name:'메가이상해꽃', aura:'#86efac', bonus:{dmg:1.6, hp:1.5, speed:1.06},
      quest:{label:'보스 2마리 · 30초 무피격 · 적 280마리', goals:{bosses:2, noHit:30, kills:280}} } },
  { key:'metagross', id:376, rank:'해금', weapon:'star', sig:'clearbody', sigName:'클리어바디',
    sigDesc:'방어 +12%, 둔화 무시', hp:150, speed:196, dmg:1.1, unlockQuest:'q_clear_sky',
    affinity:['star','psychic','mirror'], mastery:{'강철':0.30,'에스퍼':0.12},
    weaponBonus:{ star:{ count:1 } }, trait:'떨어지는 별이 하나 더 많다',
    chain:[{id:376,name:'메타그로스'}],
    evoQuests:[{label:'적 45마리 처치', goals:{kills:45}}, {label:'적 170마리 · 상자 2개', goals:{kills:170, chests:2}}],
    special:{ kind:'mega', id:10076, name:'메가메타그로스', aura:'#a5f3fc', bonus:{dmg:1.62, hp:1.5, speed:1.05},
      quest:{label:'보스 2마리 · 30초 무피격 · 적 280마리', goals:{bosses:2, noHit:30, kills:280}} } },
  { key:'darkrai', id:491, rank:'환상', weapon:'nightmare', sig:'baddreams', sigName:'나쁜꿈',
    sigDesc:'주변 적에게 지속 피해', hp:118, speed:214, dmg:1.12, unlockQuest:'q_clear_forest',
    affinity:['nightmare','shadow','curse'], mastery:{'악':0.35,'고스트':0.10},
    weaponBonus:{ nightmare:{ radius:1.15 } }, trait:'악몽 장막이 넓고 깊다',
    chain:[{id:491,name:'다크라이'}],
    evoQuests:[{label:'적 40마리 · 15초 무피격', goals:{kills:40, noHit:15}}, {label:'적 150마리 · 보스 1마리', goals:{kills:150, bosses:1}}] },
  { key:'jirachi', id:385, rank:'환상', weapon:'star', sig:'wish', sigName:'소원',
    sigDesc:'25초마다 체력 12 회복 + 코인', hp:112, speed:208, dmg:1.08, unlockQuest:'q_chest_20',
    affinity:['star','aura','fairy'], mastery:{'강철':0.28,'에스퍼':0.12},
    weaponBonus:{ star:{ cd:0.88 } }, trait:'별이 더 자주 떨어진다',
    chain:[{id:385,name:'지라치'}],
    evoQuests:[{label:'적 30마리 · 상자 1개', goals:{kills:30, chests:1}}, {label:'적 120마리 · 2분 30초', goals:{kills:120, time:150}}] },
  { key:'lugia', id:249, rank:'전설', weapon:'beam', sig:'multiscale', sigName:'멀티스케일',
    sigDesc:'HP 70% 이상일 때 피해 -25%', hp:160, speed:206, dmg:1.15, unlockQuest:'q_clear_aqua',
    affinity:['beam','water','psychic'], mastery:{'에스퍼':0.28,'비행':0.14},
    weaponBonus:{ beam:{ width:1.2 } }, trait:'파괴광선이 더 굵다',
    chain:[{id:249,name:'루기아'}],
    evoQuests:[{label:'적 45마리 처치', goals:{kills:45}}, {label:'적 170마리 · 20초 무피격', goals:{kills:170, noHit:20}}] },
  { key:'mewtwo', id:150, rank:'전설', weapon:'psychic', sig:'pressure', sigName:'프레셔',
    sigDesc:'공격력 +20%', hp:132, speed:220, dmg:1.2, unlockQuest:'q_clear_volcano',
    affinity:['psychic','aura','curse'], mastery:{'에스퍼':0.38},
    weaponBonus:{ psychic:{ radius:1.15, cd:0.9 } }, trait:'염동력 파동이 넓게 퍼진다',
    chain:[{id:150,name:'뮤츠'}],
    evoQuests:[{label:'적 50마리 처치', goals:{kills:50}}, {label:'적 200마리 · 보스 1마리', goals:{kills:200, bosses:1}}],
    special:{ kind:'mega', id:10043, name:'메가뮤츠 Y', aura:'#f9a8d4', bonus:{dmg:1.75, hp:1.45, speed:1.12},
      quest:{label:'보스 2마리 · 30초 무피격 · 적 300마리', goals:{bosses:2, noHit:30, kills:300}} } },
  { key:'rayquaza', id:384, rank:'전설', weapon:'claw', sig:'airlock', sigName:'에어록',
    sigDesc:'공격력 +15%, 이동 +8%', hp:146, speed:226, dmg:1.25, unlockQuest:'q_super_1',
    affinity:['claw','beam','tornado'], mastery:{'드래곤':0.34,'비행':0.14},
    weaponBonus:{ claw:{ dmg:1.12, count:1 } }, trait:'참격이 강하고 하나 더 터진다',
    chain:[{id:384,name:'레쿠쟈'}],
    evoQuests:[{label:'적 50마리 처치', goals:{kills:50}}, {label:'적 200마리 · 엘리트 3마리', goals:{kills:200, elites:3}}],
    special:{ kind:'mega', id:10079, name:'메가레쿠쟈', aura:'#fde047', bonus:{dmg:1.8, hp:1.5, speed:1.14},
      quest:{label:'보스 2마리 · 30초 무피격 · 적 300마리', goals:{bosses:2, noHit:30, kills:300}} } },
  { key:'mew', id:151, rank:'환상', weapon:'aura', sig:'transform', sigName:'변신',
    sigDesc:'모든 기술 레벨 +1', hp:116, speed:230, dmg:1.1, unlockQuest:'q_mega_1',
    affinity:['aura','psychic','fairy'], mastery:{'에스퍼':0.20,'노말':0.10,'풀':0.10,'불꽃':0.10,'물':0.10,'전기':0.10},
    weaponBonus:{ aura:{ count:1 } }, trait:'모든 기술을 하나씩 더 익힌다',
    chain:[{id:151,name:'뮤'}],
    evoQuests:[{label:'적 30마리 처치', goals:{kills:30}}, {label:'적 120마리 · 2분 30초', goals:{kills:120, time:150}}] },

  { key:'machamp', id:68, rank:'해금', weapon:'slam', sig:'guts', sigName:'근성', 
    sigDesc:'공격력 +18%, 상태이상 무시', hp:145, speed:200, dmg:1.14, unlockQuest:'q_kills_150',
    affinity:['slam','quake','bone'], mastery:{'격투':0.32},
    weaponBonus:{ slam:{ radius:1.1 } }, trait:'주먹 충격파가 사방으로 터진다',
    chain:[{id:66,name:'알통몬'},{id:67,name:'근육몬'},{id:68,name:'괴력몬'}],
    evoQuests:[{label:'적 35마리 처치', goals:{kills:35}}, {label:'적 140마리 · 엘리트 1마리', goals:{kills:140, elites:1}}],
    special:{ kind:'gmax', id:10201, name:'거다이괴력몬', aura:'#fca5a5', bonus:{dmg:1.7, hp:1.5, speed:1.06},
      quest:{label:'보스 2마리 · 30초 무피격 · 적 260마리', goals:{bosses:2, noHit:30, kills:260}} } },
  { key:'alakazam', id:65, rank:'해금', weapon:'psychic', sig:'magicguard', sigName:'매직가드',
    sigDesc:'받는 피해 15% 감소, 쿨다운 8% 감소', hp:106, speed:218, dmg:1.16, unlockQuest:'q_awakens_5',
    affinity:['psychic','mirror','curse'], mastery:{'에스퍼':0.36},
    weaponBonus:{ psychic:{ cd:0.88 } }, trait:'염동력이 더 자주 터진다',
    chain:[{id:63,name:'케이시'},{id:64,name:'윤겔라'},{id:65,name:'후딘'}],
    evoQuests:[{label:'적 25마리 · 기술 300회 명중', goals:{kills:25, skillHits:300}}, {label:'적 110마리 · 보스 1마리', goals:{kills:110, bosses:1}}],
    special:{ kind:'mega', id:10037, name:'메가후딘', aura:'#f9a8d4', bonus:{dmg:1.75, hp:1.35, speed:1.12},
      quest:{label:'보스 2마리 · 30초 무피격 · 적 260마리', goals:{bosses:2, noHit:30, kills:260}} } },
  { key:'lapras', id:131, rank:'해금', weapon:'ice', sig:'hydration', sigName:'수분보충',
    sigDesc:'3초마다 체력 4 회복', hp:168, speed:190, dmg:1.02, unlockQuest:'q_runs_10',
    affinity:['ice','water','echo'], mastery:{'얼음':0.28,'물':0.18},
    weaponBonus:{ ice:{ count:1, pierce:2 } }, trait:'냉동빔이 한 줄 더 뻗는다',
    chain:[{id:131,name:'라프라스'}],
    evoQuests:[{label:'적 30마리 처치', goals:{kills:30}}, {label:'적 120마리 · 3분 생존', goals:{kills:120, time:180}}],
    special:{ kind:'gmax', id:10204, name:'거다이라프라스', aura:'#7dd3fc', bonus:{dmg:1.6, hp:1.6, speed:1.04},
      quest:{label:'보스 2마리 · 30초 무피격 · 적 260마리', goals:{bosses:2, noHit:30, kills:260}} } },
  { key:'dragonite', id:149, rank:'해금', weapon:'tornado', sig:'innerfocus', sigName:'정신집중',
    sigDesc:'치명타 확률 +15%', hp:152, speed:212, dmg:1.12, unlockQuest:'q_boss_20',
    affinity:['tornado','claw','thunder'], mastery:{'드래곤':0.3,'비행':0.14},
    weaponBonus:{ tornado:{ count:1 } }, trait:'회오리가 하나 더 돈다',
    chain:[{id:147,name:'미뇽'},{id:148,name:'신뇽'},{id:149,name:'망나뇽'}],
    evoQuests:[{label:'적 40마리 처치', goals:{kills:40}}, {label:'적 160마리 · 엘리트 2마리', goals:{kills:160, elites:2}}] },
  { key:'tyranitar', id:248, rank:'해금', weapon:'bone', sig:'sandstream', sigName:'모래날림',
    sigDesc:'주변 적을 계속 긁어 피해', hp:168, speed:194, dmg:1.18, unlockQuest:'q_clear_rift',
    affinity:['bone','quake','nightmare'], mastery:{'바위':0.28,'악':0.18},
    weaponBonus:{ bone:{ count:1 } }, trait:'뼈가 하나 더 날아간다',
    chain:[{id:246,name:'애버라스'},{id:247,name:'데기라스'},{id:248,name:'마기라스'}],
    evoQuests:[{label:'적 45마리 · 보스 1마리', goals:{kills:45, bosses:1}}, {label:'적 180마리 · 보스 2마리', goals:{kills:180, bosses:2}}],
    special:{ kind:'mega', id:10049, name:'메가마기라스', aura:'#a8a29e', bonus:{dmg:1.75, hp:1.55, speed:1.04},
      quest:{label:'보스 2마리 · 30초 무피격 · 적 280마리', goals:{bosses:2, noHit:30, kills:280}} } },
  { key:'cinderace', id:815, rank:'해금', weapon:'flame', sig:'libero', sigName:'리베로',
    sigDesc:'이동 속도 +14%, 불꽃 피해 +20%', hp:110, speed:228, dmg:1.12, unlockQuest:'q_wins_3',
    affinity:['flame','tornado','dash'], mastery:{'불꽃':0.34},
    weaponBonus:{ flame:{ count:1, cd:0.9 } }, trait:'불꽃이 더 빠르고 넓게 터진다',
    chain:[{id:813,name:'염버니'},{id:814,name:'래비풋'},{id:815,name:'에이스번'}],
    evoQuests:[{label:'적 30마리 · 기술 250회 명중', goals:{kills:30, skillHits:250}}, {label:'적 130마리 · 2분 30초', goals:{kills:130, time:150}}],
    special:{ kind:'gmax', id:10210, name:'거다이에이스번', aura:'#fb923c', bonus:{dmg:1.7, hp:1.42, speed:1.12},
      quest:{label:'보스 2마리 · 30초 무피격 · 적 260마리', goals:{bosses:2, noHit:30, kills:260}} } }
];

export const CHAR_BY_KEY = Object.fromEntries(CHARACTERS.map(c => [c.key, c]));
export const BRANCH_NAMES = { 134:'샤미드', 135:'쥬피썬더', 136:'부스터', 196:'에브이', 197:'블래키' };
export const BRANCH_WEAPON = { 134:'water', 135:'thunder', 136:'flame', 196:'psychic', 197:'nightmare' };

/* ---------- 적 포켓몬 ---------- */
/* ai : chase / zigzag / dash / tank / ranged / poison / flop / flee / boss
        charge(예고선 돌진) / barrage(탄막) / shield(보호막 탱커) / split(분열)
        healer(아군 버프·힐) / blink(순간이동 기습) / bomber(자폭) */
export const ENEMIES = {
  /* 초원 */
  caterpie:  { id:10, n:'캐터피', hp:26,  spd:54,  r:15, dmg:7,  xp:1, ai:'chase' },
  weedle:    { id:13, n:'뿔충이', hp:30,  spd:60,  r:15, dmg:8,  xp:1, ai:'chase' },
  pidgey:    { id:16, n:'피죤',   hp:34,  spd:78,  r:16, dmg:8,  xp:1, ai:'zigzag' },
  rattata:   { id:19, n:'꼬렛',   hp:32,  spd:92,  r:15, dmg:9,  xp:1, ai:'chase' },
  zubat:     { id:41, n:'주뱃',   hp:40,  spd:100, r:15, dmg:9,  xp:2, ai:'zigzag' },
  oddish:    { id:43, n:'뚜벅쵸', hp:48,  spd:50,  r:17, dmg:10, xp:2, ai:'chase' },
  sandshrew: { id:27, n:'샌드',   hp:64,  spd:64,  r:17, dmg:11, xp:2, ai:'shield', shield:0.45 },
  nidoranf:  { id:29, n:'니드런♀',hp:52,  spd:84,  r:16, dmg:10, xp:2, ai:'dash' },
  nidoranm:  { id:32, n:'니드런♂',hp:56,  spd:86,  r:16, dmg:11, xp:2, ai:'dash' },
  diglett:   { id:50, n:'디그다', hp:44,  spd:110, r:14, dmg:10, xp:2, ai:'chase' },
  meowth:    { id:52, n:'나옹',   hp:58,  spd:96,  r:16, dmg:11, xp:3, ai:'dash' },
  psyduck:   { id:54, n:'고라파덕',hp:70, spd:72,  r:17, dmg:11, xp:3, ai:'ranged' },
  machop:    { id:66, n:'알통몬', hp:86,  spd:80,  r:18, dmg:14, xp:3, ai:'chase' },
  geodude:   { id:74, n:'꼬마돌', hp:104, spd:50,  r:19, dmg:15, xp:3, ai:'shield', shield:0.5 },
  gastly:    { id:92, n:'고오스', hp:60,  spd:94,  r:17, dmg:12, xp:3, ai:'blink' },
  koffing:   { id:109, n:'또가스', hp:90,  spd:60,  r:19, dmg:13, xp:3, ai:'split', splitInto:'koffing' },
  voltorb:   { id:100, n:'찌리리공',hp:66, spd:120, r:16, dmg:12, xp:3, ai:'bomber', selfDestruct:true },
  onix:      { id:95, n:'롱스톤', hp:170, spd:68,  r:24, dmg:18, xp:5, ai:'shield', shield:0.6 },
  drowzee:   { id:96, n:'슬리프', hp:94,  spd:64,  r:18, dmg:13, xp:4, ai:'ranged' },
  krabby:    { id:98, n:'크랩',   hp:80,  spd:86,  r:17, dmg:14, xp:3, ai:'chase' },
  cubone:    { id:104, n:'탕구리',hp:100, spd:76,  r:18, dmg:15, xp:4, ai:'chase' },
  magikarp:  { id:129, n:'잉어킹',hp:50,  spd:46,  r:16, dmg:7,  xp:2, ai:'flop' },
  tentacool: { id:72, n:'왕눈해', hp:76,  spd:68,  r:18, dmg:13, xp:3, ai:'poison' },
  ponyta:    { id:77, n:'포니타', hp:96,  spd:122, r:18, dmg:15, xp:4, ai:'charge' },
  magnemite: { id:81, n:'코일',   hp:84,  spd:76,  r:17, dmg:13, xp:4, ai:'barrage' },
  gloom:     { id:44, n:'냄새꼬', hp:112, spd:58,  r:20, dmg:15, xp:4, ai:'poison' },
  haunter:   { id:93, n:'고우스트',hp:104, spd:102, r:19, dmg:16, xp:5, ai:'blink' },
  arbok:     { id:24, n:'아보크', hp:142, spd:88,  r:22, dmg:18, xp:6, ai:'chase' },
  staryu:    { id:120, n:'별가사리',hp:108, spd:82, r:18, dmg:15, xp:5, ai:'barrage' },
  scyther:   { id:123, n:'스라크', hp:126, spd:136, r:20, dmg:19, xp:6, ai:'charge' },
  pinsir:    { id:127, n:'쁘사이저',hp:160, spd:92, r:22, dmg:20, xp:6, ai:'chase' },
  tauros:    { id:128, n:'켄타로스',hp:182, spd:120, r:23, dmg:21, xp:7, ai:'charge' },
  clefairy:  { id:35, n:'삐삐',   hp:68,  spd:72,  r:17, dmg:9,  xp:4, ai:'healer', heal:0.06 },
  chansey:   { id:113, n:'럭키',  hp:200, spd:52,  r:20, dmg:8,  xp:6, ai:'healer', heal:0.09 },
  gyaradosE: { id:130, n:'갸라도스',hp:260, spd:80, r:28, dmg:25, xp:10, ai:'charge' },
  lapras:    { id:131, n:'라프라스',hp:280, spd:62, r:27, dmg:23, xp:10, ai:'barrage' },
  electabuzz:{ id:125, n:'에레브', hp:172, spd:98,  r:21, dmg:20, xp:7, ai:'barrage' },
  magmar:    { id:126, n:'마그마', hp:178, spd:94,  r:21, dmg:21, xp:7, ai:'barrage' },
  dragonair: { id:148, n:'신뇽',  hp:224, spd:90,  r:25, dmg:23, xp:9, ai:'zigzag' },
  golem:     { id:76, n:'딱구리', hp:340, spd:54,  r:30, dmg:29, xp:14, ai:'shield', shield:0.55 },
  rhydon:    { id:112, n:'코뿌리',hp:360, spd:66,  r:30, dmg:31, xp:15, ai:'charge' },
  hitmonlee: { id:106, n:'시라소몬',hp:244,spd:124, r:22, dmg:25, xp:9, ai:'dash' },
  pinsirE:   { id:127, n:'쁘사이저',hp:304, spd:106, r:25, dmg:27, xp:11, ai:'dash' },
  /* 동굴 */
  shellder:  { id:90, n:'셀러',   hp:96,  spd:52,  r:17, dmg:11, xp:3, ai:'shield', shield:0.55 },
  cloyster:  { id:91, n:'파르셀', hp:250, spd:46,  r:24, dmg:20, xp:9, ai:'shield', shield:0.7 },
  onixE:     { id:95, n:'롱스톤', hp:300, spd:70,  r:28, dmg:24, xp:9, ai:'shield', shield:0.62 },
  steelixE:  { id:208, n:'강철톤', hp:380, spd:58,  r:30, dmg:27, xp:12, ai:'charge' },
  bronzor:   { id:436, n:'동미러', hp:130, spd:58,  r:19, dmg:14, xp:5, ai:'shield', shield:0.5 },
  /* 유령숲 */
  shuppet:   { id:353, n:'어둠대신',hp:78, spd:100, r:16, dmg:13, xp:4, ai:'blink' },
  duskull:   { id:355, n:'해골몽', hp:100, spd:78,  r:17, dmg:14, xp:4, ai:'split', splitInto:'duskull' },
  sableye:   { id:302, n:'깜까미', hp:156, spd:104, r:19, dmg:17, xp:6, ai:'blink' },
  banette:   { id:354, n:'다크펫', hp:200, spd:112, r:21, dmg:20, xp:8, ai:'blink' },
  dusclops:  { id:356, n:'미라몽', hp:230, spd:60,  r:22, dmg:19, xp:8, ai:'shield', shield:0.6 },
  mismagius: { id:429, n:'무우마직',hp:210, spd:106, r:21, dmg:19, xp:9, ai:'barrage' },
  spiritomb: { id:442, n:'화강돌', hp:280, spd:64,  r:23, dmg:22, xp:10, ai:'shield', shield:0.66 },
  chandelure:{ id:609, n:'샹델라', hp:270, spd:86,  r:23, dmg:24, xp:12, ai:'barrage' },
  mimikyu:   { id:778, n:'따라큐', hp:190, spd:106, r:20, dmg:21, xp:10, ai:'blink' },
  /* 심해 */
  horsea:    { id:116, n:'쏘드라', hp:68,  spd:76,  r:16, dmg:11, xp:3, ai:'barrage' },
  seadra:    { id:117, n:'시드라', hp:160, spd:94,  r:21, dmg:18, xp:7, ai:'barrage' },
  starmie:   { id:121, n:'아쿠스타',hp:220, spd:98, r:22, dmg:21, xp:9, ai:'barrage' },
  qwilfish:  { id:211, n:'침뱀',  hp:130, spd:98,  r:18, dmg:16, xp:5, ai:'poison' },
  corsola:   { id:222, n:'코산호', hp:150, spd:58,  r:19, dmg:14, xp:5, ai:'shield', shield:0.55 },
  wailmer:   { id:320, n:'고래왕자',hp:280, spd:54, r:26, dmg:22, xp:9, ai:'chase' },
  relicanth: { id:369, n:'시라이유',hp:320, spd:50, r:26, dmg:24, xp:11, ai:'shield', shield:0.65 },
  huntail:   { id:367, n:'헌테일', hp:250, spd:108, r:23, dmg:23, xp:10, ai:'charge' },
  gorebyss:  { id:368, n:'분홍장이',hp:240, spd:98, r:22, dmg:22, xp:10, ai:'barrage' },
  spheal:    { id:363, n:'대굴레오',hp:120, spd:66, r:19, dmg:14, xp:5, ai:'chase' },
  walrein:   { id:365, n:'씨카이저',hp:300, spd:62, r:25, dmg:24, xp:11, ai:'shield', shield:0.6 },
  /* 화산 */
  growlithe: { id:58, n:'가디',   hp:90,  spd:104, r:17, dmg:14, xp:4, ai:'dash' },
  magcargo:  { id:219, n:'마그카르고',hp:220, spd:48, r:24, dmg:20, xp:8, ai:'shield', shield:0.5 },
  torkoal:   { id:324, n:'코터스', hp:300, spd:46,  r:25, dmg:23, xp:10, ai:'shield', shield:0.66 },
  camerupt:  { id:323, n:'폭타',   hp:280, spd:70,  r:26, dmg:26, xp:12, ai:'charge' },
  magmortar: { id:467, n:'마그마번',hp:320, spd:90, r:24, dmg:26, xp:13, ai:'barrage' },
  /* 시공의 틈 */
  noibat:    { id:714, n:'음뱃',   hp:96,  spd:120, r:16, dmg:14, xp:4, ai:'zigzag' },
  absol:     { id:359, n:'앱솔',   hp:190, spd:124, r:21, dmg:20, xp:8, ai:'charge' },
  noivern:   { id:715, n:'음번',   hp:270, spd:126, r:24, dmg:25, xp:12, ai:'barrage' },
  deino:     { id:633, n:'모노두', hp:150, spd:96,  r:19, dmg:17, xp:6, ai:'charge' },
  zweilous:  { id:634, n:'디헤드', hp:260, spd:100, r:23, dmg:23, xp:10, ai:'split', splitInto:'deino' },
  gible:     { id:443, n:'딥상어동',hp:110, spd:112, r:17, dmg:15, xp:5, ai:'dash' },
  gabite:    { id:444, n:'한바이트',hp:230, spd:118, r:22, dmg:22, xp:9, ai:'charge' },
  klefki:    { id:707, n:'클레피', hp:170, spd:88,  r:18, dmg:17, xp:7, ai:'shield', shield:0.6 },
  carbink:   { id:703, n:'멜리시', hp:260, spd:52,  r:22, dmg:20, xp:9, ai:'shield', shield:0.7 },

  /* 보스 — pattern: ring / barrage / charge / summon / beam */
  boss_nidoking:{ id:34,  n:'니드킹',  hp:1500, spd:78,  r:42, dmg:36, xp:70, ai:'boss', boss:true, pattern:'ring' },
  boss_alakazam:{ id:65,  n:'후딘',    hp:2200, spd:88,  r:38, dmg:34, xp:80, ai:'boss', boss:true, pattern:'barrage' },
  boss_gyarados:{ id:130, n:'갸라도스',hp:3200, spd:74,  r:46, dmg:42, xp:100, ai:'boss', boss:true, pattern:'charge' },
  boss_dragonite:{ id:149,n:'망나뇽',  hp:4200, spd:92,  r:44, dmg:44, xp:120, ai:'boss', boss:true, pattern:'barrage' },
  boss_tyranitar:{ id:248,n:'마기라스',hp:5600, spd:78,  r:48, dmg:50, xp:150, ai:'boss', boss:true, pattern:'charge' },
  boss_scizor:  { id:212, n:'핫삼',    hp:3000, spd:124, r:38, dmg:38, xp:100, ai:'boss', boss:true, pattern:'charge' },
  boss_steelix: { id:208, n:'강철톤',  hp:5200, spd:62,  r:50, dmg:46, xp:140, ai:'boss', boss:true, pattern:'ring' },
  boss_metagross:{ id:376,n:'메타그로스',hp:6800,spd:74,  r:50, dmg:52, xp:170, ai:'boss', boss:true, pattern:'summon' },
  boss_garchomp:{ id:445, n:'한카리아스',hp:7600,spd:104,r:50, dmg:54, xp:180, ai:'boss', boss:true, pattern:'charge' },
  boss_snorlax: { id:143, n:'잠만보',  hp:9000, spd:46,  r:56, dmg:58, xp:190, ai:'boss', boss:true, pattern:'ring' },
  boss_mewtwo:  { id:150, n:'뮤츠',    hp:12000,spd:96,  r:54, dmg:62, xp:280, ai:'boss', boss:true, pattern:'ring', final:true },
  boss_rayquaza:{ id:384, n:'레쿠쟈',  hp:15000,spd:106, r:58, dmg:66, xp:320, ai:'boss', boss:true, pattern:'all', final:true },
  boss_banette: { id:354, n:'다크펫',  hp:3600, spd:116, r:36, dmg:38, xp:110, ai:'boss', boss:true, pattern:'barrage' },
  boss_dusknoir:{ id:477, n:'야느와르몽',hp:5200,spd:78,r:46, dmg:44, xp:140, ai:'boss', boss:true, pattern:'summon' },
  boss_gengar:  { id:94,  n:'팬텀',    hp:3000, spd:120, r:38, dmg:36, xp:100, ai:'boss', boss:true, pattern:'barrage' },
  boss_mismagius:{ id:429,n:'무우마직',hp:4400, spd:102, r:40, dmg:42, xp:130, ai:'boss', boss:true, pattern:'beam' },
  boss_giratina:{ id:487, n:'기라티나',hp:14000,spd:96,  r:56, dmg:60, xp:300, ai:'boss', boss:true, pattern:'beam', final:true },
  boss_kingler: { id:99,  n:'킹크랩',  hp:3400, spd:92,  r:40, dmg:40, xp:110, ai:'boss', boss:true, pattern:'charge' },
  boss_lapras:  { id:131, n:'라프라스',hp:4600, spd:66,  r:46, dmg:42, xp:130, ai:'boss', boss:true, pattern:'barrage' },
  boss_cloyster:{ id:91,  n:'파르셀',  hp:5800, spd:52,  r:46, dmg:46, xp:150, ai:'boss', boss:true, pattern:'ring' },
  boss_kyogre:  { id:382, n:'가이오가',hp:16000,spd:92,  r:58, dmg:62, xp:330, ai:'boss', boss:true, pattern:'barrage', final:true },
  boss_heatran: { id:485, n:'히드런',  hp:5000, spd:80,  r:44, dmg:46, xp:140, ai:'boss', boss:true, pattern:'ring' },
  boss_magmortar:{ id:467,n:'마그마번',hp:6200, spd:92,  r:44, dmg:50, xp:160, ai:'boss', boss:true, pattern:'barrage' },
  boss_groudon: { id:383, n:'그란돈',  hp:18000,spd:84,  r:60, dmg:66, xp:350, ai:'boss', boss:true, pattern:'charge', final:true },
  boss_dialga:  { id:483, n:'디아루가',hp:8000, spd:88,  r:48, dmg:52, xp:180, ai:'boss', boss:true, pattern:'beam' },
  boss_palkia:  { id:484, n:'펄기아',  hp:8000, spd:92,  r:48, dmg:52, xp:180, ai:'boss', boss:true, pattern:'barrage' },
  boss_arceus:  { id:493, n:'아르세우스',hp:24000,spd:104,r:60, dmg:72, xp:420, ai:'boss', boss:true, pattern:'all', final:true },

  /* 환상 조우 */
  legend_mew:   { id:151, n:'뮤',      hp:1400, spd:170, r:26, dmg:12, xp:120, ai:'flee', legend:true },
  legend_jirachi:{ id:385,n:'지라치',  hp:1600, spd:150, r:26, dmg:12, xp:140, ai:'flee', legend:true },
  legend_darkrai:{ id:491,n:'다크라이', hp:2200, spd:130, r:30, dmg:24, xp:170, ai:'flee', legend:true },
  legend_celebi:{ id:251, n:'세레비',  hp:1500, spd:160, r:26, dmg:12, xp:130, ai:'flee', legend:true },
  legend_articuno:{id:144,n:'프리져',  hp:2600, spd:110, r:32, dmg:26, xp:180, ai:'flee', legend:true },
  legend_zapdos: { id:145,n:'썬더',    hp:2600, spd:140, r:32, dmg:26, xp:180, ai:'flee', legend:true },
  legend_moltres:{ id:146,n:'파이어',  hp:2600, spd:120, r:32, dmg:26, xp:180, ai:'flee', legend:true },
  legend_suicune:{ id:245,n:'스이쿤',  hp:2800, spd:118, r:32, dmg:26, xp:190, ai:'flee', legend:true },
  legend_entei: { id:244,n:'앤테이',  hp:2800, spd:130, r:32, dmg:28, xp:190, ai:'flee', legend:true },
  legend_hooh:  { id:250,n:'칠색조',  hp:3200, spd:126, r:34, dmg:30, xp:220, ai:'flee', legend:true },
  legend_manaphy:{ id:490,n:'마나피',  hp:2400, spd:120, r:28, dmg:22, xp:200, ai:'flee', legend:true },
  legend_phione:{ id:489, n:'피오네',  hp:2200, spd:112, r:28, dmg:22, xp:190, ai:'flee', legend:true },
  legend_deoxys:{ id:386, n:'테오키스',hp:3600, spd:140, r:32, dmg:34, xp:250, ai:'flee', legend:true }
};

/* ---------- 스테이지 (7개 테마) ---------- */
export const STAGES = [
  {
    key:'meadow', name:'관동 초원', sub:'초보 트레이너의 첫 모험', emoji:'🌱', duration:720, reward:1,
    desc:'끝없이 펼쳐진 초원. 마지막에 뮤츠가 강림한다.',
    unlock:null,
    sky:['#bfe6ff','#e8f7d6'], ground:['#7cc46a','#5aa957'], accent:'#3fbf6f', deco:'grass',
    terrain:{ theme:'meadow', water:'#4fb3ff', waterDeep:'#2f7fd1', waterEdge:'#bde9ff', path:'#d8c08a',
      foliage:['#3e9e5f','#56bb77','#7ad492'], mix:['grass','flower','pond','tree','rock','path'] },
    pools:[
      { t:0,   list:['gastly','pidgey','caterpie','zubat'] },
      { t:35,  list:['zubat','oddish','nidoranf','diglett'] },
      { t:90,  list:['nidoranm','meowth','psyduck','gastly','magikarp'] },
      { t:150, list:['machop','geodude','koffing','voltorb','clefairy'] },
      { t:230, list:['onix','drowzee','cubone','ponyta','clefairy','koffing'] },
      { t:320, list:['gloom','haunter','arbok','staryu','krabby','clefairy'] },
      { t:420, list:['scyther','pinsir','tauros','electabuzz','magmar'] },
      { t:540, list:['gyaradosE','lapras','dragonair','hitmonlee','pinsirE'] },
      { t:630, list:['golem','rhydon','dragonair','tauros','chansey'] }
    ],
    bosses:[{t:110,k:'boss_nidoking'},{t:280,k:'boss_alakazam'},{t:430,k:'boss_gyarados'},{t:570,k:'boss_dragonite'},{t:660,k:'boss_tyranitar'}],
    final:{t:720,k:'boss_mewtwo'},
    legends:[{t:200,k:'legend_mew'},{t:380,k:'legend_jirachi'},{t:540,k:'legend_celebi'},{t:640,k:'legend_darkrai'}]
  },
  {
    key:'cave', name:'은빛 동굴', sub:'빛도 들지 않는 깊은 동굴', emoji:'⛰️', duration:720, reward:2,
    desc:'보호막을 두른 바위 포켓몬이 길을 막는다. 보상 두 배.',
    unlock:'q_clear_meadow',
    sky:['#3b3152','#6b5b8f'], ground:['#8d8aa6','#6f6c88'], accent:'#b7b4ff', deco:'rock',
    terrain:{ theme:'cave', water:'#ff8a3d', waterDeep:'#c2410c', waterEdge:'#ffd0a1', path:'#a8a5c0',
      foliage:['#5d5a75','#726e8c','#8b87a4'], mix:['rock','crystal','lava','stalagmite','path','gravel'] },
    pools:[
      { t:0,   list:['geodude','zubat','diglett','sandshrew','shellder'] },
      { t:40,  list:['onix','machop','koffing','cubone','bronzor'] },
      { t:100, list:['gastly','drowzee','magnemite','voltorb'] },
      { t:170, list:['haunter','golem','arbok','ponyta'] },
      { t:250, list:['rhydon','magmar','electabuzz','cloyster'] },
      { t:330, list:['gyaradosE','scyther','steelixE','dragonair'] },
      { t:430, list:['golem','rhydon','tauros','hitmonlee','onixE'] },
      { t:540, list:['dragonair','gyaradosE','lapras','pinsirE','chansey'] },
      { t:640, list:['rhydon','golem','gyaradosE','steelixE','cloyster'] }
    ],
    bosses:[{t:110,k:'boss_scizor'},{t:280,k:'boss_steelix'},{t:430,k:'boss_metagross'},{t:570,k:'boss_garchomp'},{t:660,k:'boss_snorlax'}],
    final:{t:720,k:'boss_rayquaza'},
    legends:[{t:190,k:'legend_articuno'},{t:370,k:'legend_zapdos'},{t:540,k:'legend_moltres'},{t:640,k:'legend_darkrai'}]
  },
  {
    key:'sky', name:'하늘 제단', sub:'전설이 잠든 구름 위의 성소', emoji:'☁️', duration:780, reward:3,
    desc:'돌진하는 비행 포켓몬의 예고선을 피하라. 최종 스테이지급 난이도.',
    unlock:'q_clear_cave',
    sky:['#8fc8ff','#dcc4ff'], ground:['#b9a6e8','#9a86cf'], accent:'#a78bfa', deco:'star',
    terrain:{ theme:'sky', water:'#7dd3fc', waterDeep:'#6366f1', waterEdge:'#e0e7ff', path:'#d5c8ff',
      foliage:['#8b6fc4','#a184d6','#c0a8ef'], mix:['cloud','pillar','star','rainbow','path','flower'] },
    pools:[
      { t:0,   list:['pidgey','zubat','gastly','ponyta'] },
      { t:40,  list:['haunter','magnemite','drowzee','noibat'] },
      { t:100, list:['arbok','staryu','gloom','electabuzz'] },
      { t:170, list:['scyther','tauros','pinsir','dragonair'] },
      { t:250, list:['gyaradosE','lapras','rhydon','magmar','clefairy'] },
      { t:330, list:['golem','hitmonlee','dragonair','pinsirE'] },
      { t:430, list:['gyaradosE','lapras','tauros','noivern'] },
      { t:540, list:['golem','dragonair','gyaradosE','noivern','mismagius'] },
      { t:640, list:['rhydon','golem','gyaradosE','lapras','noivern'] }
    ],
    bosses:[{t:110,k:'boss_alakazam'},{t:280,k:'boss_scizor'},{t:430,k:'boss_garchomp'},{t:570,k:'boss_snorlax'},{t:660,k:'boss_metagross'}],
    final:{t:780,k:'boss_rayquaza'},
    legends:[{t:190,k:'legend_mew'},{t:370,k:'legend_jirachi'},{t:540,k:'legend_celebi'},{t:660,k:'legend_hooh'}]
  },
  {
    key:'forest', name:'보라타운 유령숲', sub:'안개가 자욱한 저주받은 숲', emoji:'👻', duration:780, reward:4,
    desc:'순간이동하는 유령과 분열하는 망령. 보스는 기라티나.',
    unlock:'q_clear_sky',
    sky:['#4a3d67','#7b5f9c'], ground:['#6d5f7f','#524760'], accent:'#c084fc', deco:'ghost',
    terrain:{ theme:'forest', water:'#7c3aed', waterDeep:'#4c1d95', waterEdge:'#c4b5fd', path:'#8b7fa0',
      foliage:['#4f6b52','#63856a','#7ea184'], mix:['tree','mist','grave','deathflower','mushroom','path'] },
    pools:[
      { t:0,   list:['shuppet','duskull','gastly','oddish'] },
      { t:40,  list:['haunter','sableye','mimikyu','koffing'] },
      { t:100, list:['banette','dusclops','arbok','gloom'] },
      { t:170, list:['mismagius','spiritomb','staryu','shuppet'] },
      { t:250, list:['banette','mismagius','dusclops','scyther','duskull'] },
      { t:330, list:['chandelure','banette','spiritomb','haunter'] },
      { t:430, list:['spiritomb','banette','chandelure','dusclops'] },
      { t:540, list:['banette','duskull','spiritomb','mismagius'] },
      { t:640, list:['chandelure','banette','spiritomb','dusclops','mismagius'] }
    ],
    bosses:[{t:110,k:'boss_gengar'},{t:280,k:'boss_banette'},{t:430,k:'boss_dusknoir'},{t:570,k:'boss_mismagius'},{t:660,k:'boss_garchomp'}],
    final:{t:780,k:'boss_giratina'},
    legends:[{t:190,k:'legend_darkrai'},{t:370,k:'legend_mew'},{t:540,k:'legend_celebi'},{t:660,k:'legend_jirachi'}]
  },
  {
    key:'aqua', name:'심해 아쿠아 신전', sub:'빛이 닿지 않는 심해의 신전', emoji:'🌊', duration:840, reward:5,
    desc:'탄막을 뿌리는 심해 포켓몬과 회복하는 지원병. 보스는 가이오가.',
    unlock:'q_clear_forest',
    sky:['#0e4a6b','#2a8fb8'], ground:['#3f8fa8','#2b7590'], accent:'#22d3ee', deco:'water',
    terrain:{ theme:'aqua', water:'#2dd4bf', waterDeep:'#0e7490', waterEdge:'#a5f3fc', path:'#c9f3ef',
      foliage:['#2f8f9d','#46b0b8','#7fd6d6'], mix:['coral','bubble','shell','seaweed','path','sand'] },
    pools:[
      { t:0,   list:['magikarp','tentacool','krabby','horsea'] },
      { t:40,  list:['shellder','staryu','psyduck','qwilfish'] },
      { t:100, list:['seadra','starmie','corsola','cloyster'] },
      { t:170, list:['wailmer','huntail','gorebyss','spheal'] },
      { t:250, list:['relicanth','cloyster','starmie','wailmer'] },
      { t:330, list:['gyaradosE','lapras','seadra','gorebyss','chansey'] },
      { t:430, list:['gyaradosE','lapras','wailmer','huntail'] },
      { t:540, list:['cloyster','relicanth','gyaradosE','starmie'] },
      { t:640, list:['lapras','gyaradosE','relicanth','cloyster','walrein'] }
    ],
    bosses:[{t:110,k:'boss_kingler'},{t:280,k:'boss_lapras'},{t:430,k:'boss_gyarados'},{t:570,k:'boss_cloyster'},{t:660,k:'boss_metagross'}],
    final:{t:840,k:'boss_kyogre'},
    legends:[{t:200,k:'legend_suicune'},{t:380,k:'legend_manaphy'},{t:560,k:'legend_phione'},{t:680,k:'legend_articuno'}]
  },
  {
    key:'volcano', name:'태초의 마그마 화산', sub:'대지가 끓는 태초의 분화구', emoji:'🌋', duration:840, reward:6,
    desc:'자폭하는 화산 포켓몬과 돌진하는 보스. 보스는 그란돈.',
    unlock:'q_clear_aqua',
    sky:['#5a1f1f','#c2410c'], ground:['#6b3a2e','#4a2620'], accent:'#fb923c', deco:'lava',
    terrain:{ theme:'volcano', water:'#f97316', waterDeep:'#b91c1c', waterEdge:'#fdba74', path:'#7c2d12',
      foliage:['#7f3b2a','#a45238','#c96b47'], mix:['lava','rock','ember','ash','path','obsidian'] },
    pools:[
      { t:0,   list:['growlithe','geodude','ponyta','cubone'] },
      { t:40,  list:['magcargo','torkoal','rhydon','cubone'] },
      { t:100, list:['camerupt','magmar','torkoal','voltorb'] },
      { t:170, list:['magmortar','magcargo','golem','rhydon'] },
      { t:250, list:['rhydon','golem','camerupt','magmortar'] },
      { t:330, list:['torkoal','magcargo','rhydon','magmortar'] },
      { t:430, list:['golem','rhydon','magmortar','camerupt'] },
      { t:540, list:['magmortar','torkoal','golem','rhydon'] },
      { t:640, list:['rhydon','golem','magmortar','torkoal','camerupt'] }
    ],
    bosses:[{t:110,k:'boss_heatran'},{t:280,k:'boss_magmortar'},{t:430,k:'boss_tyranitar'},{t:570,k:'boss_garchomp'},{t:660,k:'boss_snorlax'}],
    final:{t:840,k:'boss_groudon'},
    legends:[{t:200,k:'legend_entei'},{t:380,k:'legend_moltres'},{t:560,k:'legend_hooh'},{t:700,k:'legend_zapdos'}]
  },
  {
    key:'rift', name:'뒤틀린 시공의 틈', sub:'모든 세계가 뒤섞인 최종 균열', emoji:'🌌', duration:900, reward:8,
    desc:'전 기믹 총출동. 아르세우스가 기다린다. 최고 난이도.',
    unlock:'q_clear_volcano',
    sky:['#1b1140','#4c1d95'], ground:['#4b3f72','#332a56'], accent:'#f0abfc', deco:'rift',
    terrain:{ theme:'rift', water:'#a855f7', waterDeep:'#6b21a8', waterEdge:'#f5d0fe', path:'#8b5cf6',
      foliage:['#6d28d9','#7c3aed','#a78bfa'], mix:['rift','shard','star','void','path','crystal'] },
    pools:[
      { t:0,   list:['gastly','noibat','gible','deino'] },
      { t:40,  list:['zweilous','gabite','mimikyu','noivern'] },
      { t:100, list:['absol','banette','mismagius','klefki'] },
      { t:170, list:['gabite','zweilous','klefki','carbink'] },
      { t:250, list:['noivern','mismagius','banette','chandelure'] },
      { t:330, list:['gyaradosE','lapras','noivern','zweilous'] },
      { t:430, list:['gabite','zweilous','noivern','carbink'] },
      { t:540, list:['noivern','mismagius','carbink','klefki'] },
      { t:640, list:['gabite','zweilous','noivern','absol','carbink'] }
    ],
    bosses:[{t:100,k:'boss_dialga'},{t:260,k:'boss_palkia'},{t:420,k:'boss_metagross'},{t:560,k:'boss_garchomp'},{t:680,k:'boss_giratina'}],
    final:{t:900,k:'boss_arceus'},
    legends:[{t:180,k:'legend_deoxys'},{t:360,k:'legend_mew'},{t:540,k:'legend_celebi'},{t:720,k:'legend_darkrai'}]
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

/* ---------- 메타 퀘스트 (해금 시스템) ---------- */
/* goal.stat 은 save.stats 의 값을 본다. clears.<stageKey> 는 stagesCleared 로 집계 */
export const QUESTS = [
  { key:'q_first_run', cat:'모험', icon:'🚩', name:'첫 발걸음', desc:'모험을 1회 시작한다',
    goal:{ stat:'runs', n:1 }, reward:{ coins:150 } },
  { key:'q_win_1', cat:'모험', icon:'🏆', name:'첫 클리어', desc:'스테이지를 1회 클리어한다',
    goal:{ stat:'wins', n:1 }, reward:{ coins:200, passive:'coin' } },
  { key:'q_kills_50', cat:'전투', icon:'💥', name:'백전연마', desc:'누적 적 50마리 처치',
    goal:{ stat:'kills', n:50 }, reward:{ coins:120, passive:'crit' } },
  { key:'q_kills_150', cat:'전투', icon:'⚔️', name:'숙련된 트레이너', desc:'누적 적 150마리 처치',
    goal:{ stat:'kills', n:150 }, reward:{ char:'machamp', field:'bomb' } },
  { key:'q_kills_300', cat:'전투', icon:'🔥', name:'학살자', desc:'누적 적 300마리 처치',
    goal:{ stat:'kills', n:300 }, reward:{ char:'blastoise', coins:250 } },
  { key:'q_kills_1000', cat:'전투', icon:'☠️', name:'전설의 트레이너', desc:'누적 적 1000마리 처치',
    goal:{ stat:'kills', n:1000 }, reward:{ coins:1200 } },
  { key:'q_runs_3', cat:'모험', icon:'📘', name:'단골 손님', desc:'모험을 3회 완료',
    goal:{ stat:'runs', n:3 }, reward:{ passive:'regen', coins:120 } },
  { key:'q_runs_10', cat:'모험', icon:'🧭', name:'베테랑', desc:'모험을 10회 완료',
    goal:{ stat:'runs', n:10 }, reward:{ char:'lapras', coins:300 } },
  { key:'q_wins_3', cat:'모험', icon:'👑', name:'정복자', desc:'스테이지를 3회 클리어',
    goal:{ stat:'wins', n:3 }, reward:{ char:'cinderace', coins:400 } },
  { key:'q_clear_meadow', cat:'스테이지', icon:'🌱', name:'초원의 끝', desc:'관동 초원 클리어',
    goal:{ stat:'clears', key:'meadow', n:1 }, reward:{ stage:'cave', char:'charizard' } },
  { key:'q_clear_cave', cat:'스테이지', icon:'⛰️', name:'동굴의 비밀', desc:'은빛 동굴 클리어',
    goal:{ stat:'clears', key:'cave', n:1 }, reward:{ stage:'sky', char:'venusaur', field:'guard' } },
  { key:'q_clear_sky', cat:'스테이지', icon:'☁️', name:'하늘의 성소', desc:'하늘 제단 클리어',
    goal:{ stat:'clears', key:'sky', n:1 }, reward:{ stage:'forest', char:'metagross', field:'haste' } },
  { key:'q_clear_forest', cat:'스테이지', icon:'👻', name:'안개 너머', desc:'보라타운 유령숲 클리어',
    goal:{ stat:'clears', key:'forest', n:1 }, reward:{ stage:'aqua', char:'darkrai' } },
  { key:'q_clear_aqua', cat:'스테이지', icon:'🌊', name:'심해의 문', desc:'심해 아쿠아 신전 클리어',
    goal:{ stat:'clears', key:'aqua', n:1 }, reward:{ stage:'volcano', char:'lugia' } },
  { key:'q_clear_volcano', cat:'스테이지', icon:'🌋', name:'불의 정점', desc:'태초의 마그마 화산 클리어',
    goal:{ stat:'clears', key:'volcano', n:1 }, reward:{ stage:'rift', char:'mewtwo' } },
  { key:'q_clear_rift', cat:'스테이지', icon:'🌌', name:'시공의 지배자', desc:'뒤틀린 시공의 틈 클리어',
    goal:{ stat:'clears', key:'rift', n:1 }, reward:{ char:'tyranitar', coins:800 } },
  { key:'q_boss_10', cat:'보스', icon:'🦖', name:'보스 사냥꾼', desc:'보스 10마리 처치',
    goal:{ stat:'bossKills', n:10 }, reward:{ coins:400 } },
  { key:'q_boss_20', cat:'보스', icon:'🐲', name:'보스 킬러', desc:'보스 20마리 처치',
    goal:{ stat:'bossKills', n:20 }, reward:{ char:'dragonite', coins:300 } },
  { key:'q_awakens_3', cat:'조합', icon:'✨', name:'각성의 시작', desc:'각성 기술 3회 해금',
    goal:{ stat:'awakens', n:3 }, reward:{ coins:350 } },
  { key:'q_awakens_5', cat:'조합', icon:'🌟', name:'각성 마스터', desc:'각성 기술 5회 해금',
    goal:{ stat:'awakens', n:5 }, reward:{ char:'alakazam' } },
  { key:'q_super_1', cat:'조합', icon:'💠', name:'초각성', desc:'초각성 기술 1회 완성',
    goal:{ stat:'supers', n:1 }, reward:{ char:'rayquaza', coins:300 } },
  { key:'q_mega_1', cat:'진화', icon:'🔆', name:'한계 초월', desc:'메가진화 또는 거다이맥스 1회',
    goal:{ stat:'megas', n:1 }, reward:{ char:'mew', coins:400 } },
  { key:'q_chest_20', cat:'탐험', icon:'🎁', name:'보물 사냥꾼', desc:'보물 상자 20개 획득',
    goal:{ stat:'chests', n:20 }, reward:{ char:'jirachi', coins:200 } },
  { key:'q_level_30', cat:'성장', icon:'📈', name:'고수', desc:'한 판에서 Lv.30 달성',
    goal:{ stat:'maxLevel', n:30 }, reward:{ coins:500 } },
  { key:'q_shiny_1', cat:'탐험', icon:'💠', name:'빛나는 인연', desc:'이로치 포켓몬 1마리 처치',
    goal:{ stat:'shinies', n:1 }, reward:{ coins:400 } },
  { key:'q_time_3600', cat:'성장', icon:'⏳', name:'긴 여정', desc:'누적 1시간 플레이',
    goal:{ stat:'playTime', n:3600 }, reward:{ coins:1000 } }
];

export const QUEST_BY_KEY = Object.fromEntries(QUESTS.map(q => [q.key, q]));

/* 퀘스트로 해금되는 것들 (표시용) */
export const LOCKED_PASSIVES = { crit:'q_kills_50', regen:'q_runs_3', coin:'q_win_1' };
export const LOCKED_FIELDS = { bomb:'q_kills_150', guard:'q_clear_cave', haste:'q_clear_sky' };

export const VIEW_MODES = {
  wide:    { name:'넓게', zoom:0.82, scale:0.86 },
  normal:  { name:'기본', zoom:1.0,  scale:1.0 },
  big:     { name:'크게', zoom:1.16, scale:1.12 },
  huge:    { name:'아주 크게', zoom:1.3, scale:1.24 }
};

export const SAVE_KEY = 'pokeSurvivor.save.v4';
