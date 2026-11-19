/* ============================================================
   캐릭터 해금 퀘스트 — 기본 스타터 5종을 뺀 104종
   각 포켓몬의 타입 · 주 기술 · 진화 · 전설 여부에 맞춘 개별 목표
   난이도(tier): 1 입문 / 2 중반 / 3 후반 / 4 엔드게임
   ============================================================ */

/* ---------- 목표 헬퍼 ---------- */
const K = n => ({ stat: 'kills', n });                              // 누적 처치
const KT = (type, n) => ({ stat: 'killsType', type, n });            // 타입별 처치
const KW = (weapon, n) => ({ stat: 'killsWeapon', weapon, n });      // 기술별 처치
const CLEAR = key => ({ stat: 'clears', key, n: 1 });                // 스테이지 클리어
const BOSS = n => ({ stat: 'bossKills', n });
const ELITE = n => ({ stat: 'elites', n });
const CH = n => ({ stat: 'chests', n });                             // 보물 상자
const SHINY = n => ({ stat: 'shinies', n });                         // 이로치 처치
const LEG = n => ({ stat: 'legends', n });                           // 환상 포획
const AWK = n => ({ stat: 'awakens', n });
const SUP = n => ({ stat: 'supers', n });
const MEGA = n => ({ stat: 'megas', n });
const LV = n => ({ stat: 'maxLevel', n });
const BK = n => ({ stat: 'bestKills', n });
const NH = n => ({ stat: 'noHit', n });                              // 무피격 최고 기록(초)
const COIN = n => ({ stat: 'coins', n });                            // 누적 코인
const EVO = n => ({ stat: 'evolutions', n });                        // 진화 달성 횟수
const DEXN = n => ({ stat: 'dexCaught', n });
const TIME = n => ({ stat: 'bestTime', n });                         // 한 판 최고 생존(초)

/* [캐릭터 key, 퀘스트 이름, 아이콘, 난이도, 목표] */
const ROWS = [
  /* ---------- 난이도 1 · 입문 (26) ---------- */
  ['butterfree', '첫 날갯짓', '🦋', 1, [KW('tornado', 250)]],
  ['beedrill', '독침의 맹세', '🐝', 1, [KT('독', 200)]],
  ['pidgeot', '바람의 질주', '🕊️', 1, [K(300), NH(20)]],
  ['raichu', '백만 볼트', '⚡', 1, [KW('thunder', 300)]],
  ['nidoking', '독니의 왕좌', '🦏', 1, [KT('독', 250)]],
  ['clefable', '달빛 소원', '🌙', 1, [CH(10)]],
  ['ninetales', '아홉 꼬리 불꽃', '🦊', 1, [KT('불꽃', 150)]],
  ['arcanine', '전설의 충견', '🐕', 1, [KW('flame', 350)]],
  ['golem', '바위 굴리기', '🪨', 1, [KT('바위', 200)]],
  ['slowbro', '느긋한 4분', '🦥', 1, [TIME(240)]],
  ['cloyster', '단단한 껍데기', '🐚', 1, [CH(10), K(250)]],
  ['chansey', '행운의 알', '🥚', 1, [CH(12)]],
  ['starmie', '별의 핵', '⭐', 1, [TIME(180), K(200)]],
  ['scyther', '사마귀의 칼날', '🗡️', 1, [KW('claw', 250)]],
  ['vaporeon', '물의 숨결', '💧', 1, [KW('water', 300), EVO(3)]],
  ['jolteon', '스파크 질주', '⚡', 1, [KW('thunder', 300), EVO(3)]],
  ['flareon', '불꽃 갈기', '🔥', 1, [KW('flame', 300), EVO(3)]],
  ['aerodactyl', '고대의 날개', '🦅', 1, [KT('바위', 180)]],
  ['crobat', '밤하늘의 독니', '🦇', 1, [KT('독', 250)]],
  ['espeon', '햇살의 예지', '🔮', 1, [KT('에스퍼', 80), EVO(4)]],
  ['umbreon', '달빛의 그림자', '🌑', 1, [KW('nightmare', 250), EVO(4)]],
  ['steelix', '강철의 뱀', '⛓️', 1, [KT('강철', 60)]],
  ['heracross', '뿔의 일격', '🪲', 1, [KT('격투', 100)]],
  ['houndoom', '지옥의 사냥개', '🐺', 1, [KT('불꽃', 250)]],
  ['sableye', '보석 도둑', '💎', 1, [COIN(2500)]],
  ['absol', '재앙의 예고', '🌘', 1, [BOSS(3)]],

  /* ---------- 난이도 2 · 중반 (41) ---------- */
  ['gengar', '그림자 속의 웃음', '👻', 2, [KT('고스트', 250), AWK(2)]],
  ['lucario', '파동을 읽는 눈', '🐾', 2, [KW('aura', 500)]],
  ['garchomp', '모래 폭풍의 이빨', '🦈', 2, [K(900), KT('드래곤', 60)]],
  ['gyarados', '분노의 물고기', '🐉', 2, [KW('water', 600)]],
  ['snorlax', '잠만보의 식탐', '🍙', 2, [CH(25)]],
  ['charizard', '불꽃의 날개', '🔥', 2, [KT('불꽃', 450)]],
  ['blastoise', '쌍포의 물대포', '💦', 2, [KW('water', 700)]],
  ['venusaur', '꽃잎의 광합성', '🌺', 2, [KW('leaf', 600)]],
  ['machamp', '네 팔의 주먹', '🥊', 2, [KT('격투', 150)]],
  ['alakazam', '초능력의 정점', '🥄', 2, [AWK(3)]],
  ['lapras', '바다의 노래', '🎵', 2, [TIME(300)]],
  ['dragonite', '다정한 폭군', '🪽', 2, [BOSS(8)]],
  ['cinderace', '불꽃의 에이스', '⚽', 2, [K(900), CH(15)]],
  ['typhlosion', '분화구의 포효', '🌋', 2, [KT('불꽃', 400)]],
  ['feraligatr', '턱의 악어', '🐊', 2, [KW('water', 600)]],
  ['ampharos', '등대의 빛', '🔆', 2, [KW('thunder', 600)]],
  ['scizor', '붉은 집게', '🦀', 2, [KW('claw', 500)]],
  ['kingdra', '용의 물결', '🌊', 2, [KW('water', 400), KT('드래곤', 80)]],
  ['sceptile', '숲의 검', '🍃', 2, [KW('leaf', 600)]],
  ['blaziken', '불꽃 발차기', '🦵', 2, [K(900), NH(25)]],
  ['swampert', '대지의 파도', '🌊', 2, [KT('땅', 500)]],
  ['gardevoir', '수호의 마음', '💮', 2, [K(800), CH(20)]],
  ['aggron', '철벽 갑옷', '🛡️', 2, [KT('바위', 450)]],
  ['milotic', '아름다운 역전', '🧜', 2, [TIME(360)]],
  ['salamence', '하늘의 포효', '🐲', 2, [KT('비행', 200)]],
  ['roserade', '가시 장미', '🌹', 2, [KT('독', 600)]],
  ['electivire', '고압 전류', '🔌', 2, [KW('thunder', 800)]],
  ['togekiss', '축복의 날개', '🕊️', 2, [CH(30), TIME(240)]],
  ['zoroark', '환영술사', '🎭', 2, [K(1000)]],
  ['chandelure', '촛불의 혼', '🕯️', 2, [KT('고스트', 400)]],
  ['greninja', '물수리검', '🌀', 2, [KW('water', 700), NH(25)]],
  ['sylveon', '달콤한 리본', '🎀', 2, [KW('fairy', 500)]],
  ['corviknight', '검은 강철 날개', '🐦‍⬛', 2, [KT('강철', 150)]],
  ['toxtricity', '록스타의 전율', '🎸', 2, [KW('thunder', 700)]],
  ['meowscarada', '가면의 마술사', '🎩', 2, [KW('leaf', 700)]],
  ['skeledirge', '노래하는 불꽃', '🎤', 2, [KT('불꽃', 500)]],
  ['ceruledge', '푸른 불꽃 검', '⚔️', 2, [KW('shadow', 600)]],
  ['decidueye', '밤의 저격수', '🏹', 2, [KW('shadow', 600), BOSS(6)]],
  ['incineroar', '링 위의 파이터', '🤼', 2, [KT('격투', 200)]],
  ['primarina', '바다의 가수', '🎶', 2, [KW('water', 600)]],
  ['excadrill', '드릴의 강철', '🪛', 2, [KT('땅', 550)]],

  /* ---------- 난이도 3 · 후반 (25) ---------- */
  ['metagross', '강철의 두뇌', '🤖', 3, [CLEAR('sky')]],
  ['darkrai', '악몽의 시작', '😈', 3, [CLEAR('forest')]],
  ['jirachi', '별에게 비는 소원', '🌠', 3, [CH(40)]],
  ['lugia', '심해의 수호신', '🌊', 3, [CLEAR('aqua')]],
  ['articuno', '얼음의 성소', '❄️', 3, [CLEAR('sky'), KT('얼음', 60)]],
  ['zapdos', '천둥의 정점', '🌩️', 3, [SUP(1)]],
  ['moltres', '불꽃의 날개', '🔥', 3, [CLEAR('volcano')]],
  ['raikou', '번개의 야수', '🐆', 3, [KW('thunder', 1500)]],
  ['entei', '화산의 포효', '🦁', 3, [CLEAR('volcano'), MEGA(1)]],
  ['suicune', '정화의 물결', '💠', 3, [CLEAR('aqua'), TIME(420)]],
  ['hooh', '무지개 깃털', '🌈', 3, [CLEAR('sky'), SHINY(2)]],
  ['celebi', '시간의 요정', '🍀', 3, [DEXN(45)]],
  ['latias', '붉은 쌍둥이', '❤️', 3, [CLEAR('forest'), KT('드래곤', 100)]],
  ['latios', '푸른 쌍둥이', '💙', 3, [CLEAR('sky'), BK(800)]],
  ['kyogre', '대해의 창조', '🐋', 3, [CLEAR('aqua')]],
  ['groudon', '대지의 창조', '🌋', 3, [CLEAR('volcano')]],
  ['deoxys', '우주 바이러스', '🧬', 3, [SUP(1), LV(30)]],
  ['tyranitar', '모래의 폭군', '🦖', 3, [CLEAR('rift')]],
  ['weavile', '얼음 발톱', '🧊', 3, [KT('얼음', 200), SHINY(1)]],
  ['gliscor', '밤의 활공', '🦂', 3, [NH(35), K(2000)]],
  ['mimikyu', '들키지 않은 밤', '🧵', 3, [NH(40)]],
  ['gholdengo', '황금의 유령', '🪙', 3, [COIN(15000)]],
  ['hydreigon', '세 머리의 포효', '🐲', 3, [KT('악', 300), K(2500)]],
  ['aegislash', '왕의 방패', '🛡️', 3, [ELITE(40)]],
  ['dragapult', '유령 드래곤', '✈️', 3, [BK(900), KT('드래곤', 150)]],

  /* ---------- 난이도 4 · 엔드게임 (12) ---------- */
  ['mewtwo', '유전자의 왕', '🧠', 4, [CLEAR('rift'), MEGA(2)]],
  ['rayquaza', '대기의 지배자', '🌪️', 4, [SUP(2), LEG(3)]],
  ['mew', '모든 것을 배우는 자', '🌟', 4, [DEXN(60), AWK(6)]],
  ['arceus', '창조신의 증명', '🌌', 4, [CLEAR('rift'), DEXN(55)]],
  ['dialga', '시간의 신', '⏳', 4, [CLEAR('rift'), LV(40)]],
  ['palkia', '공간의 신', '🌐', 4, [CLEAR('rift'), BK(1500)]],
  ['giratina', '반물질의 군주', '🕳️', 4, [CLEAR('rift'), SHINY(4)]],
  ['zacian', '검의 왕', '🗡️', 4, [ELITE(80), MEGA(2)]],
  ['zamazenta', '방패의 왕', '🛡️', 4, [BOSS(25), MEGA(2)]],
  ['eternatus', '무한의 독', '☠️', 4, [SUP(3), K(5000)]],
  ['koraidon', '태고의 질주', '🦎', 4, [CLEAR('rift'), K(4000)]],
  ['miraidon', '미래의 번개', '🔋', 4, [CLEAR('rift'), KW('thunder', 2500)]]
];

const TIER_COINS = { 1: 120, 2: 250, 3: 450, 4: 800 };

export const UNLOCK_QUESTS = ROWS.map(([char, name, icon, tier, goals]) => ({
  key: 'unlock_' + char,
  cat: '캐릭터 해금',
  char, icon, name, tier,
  desc: '',
  goal: goals.length > 1 ? { all: goals } : goals[0],
  reward: { char, coins: TIER_COINS[tier] }
}));

export const UNLOCK_BY_CHAR = Object.fromEntries(UNLOCK_QUESTS.map(q => [q.char, q]));
