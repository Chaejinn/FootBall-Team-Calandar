// 팀/대회 이름 한국어 변환
// 키는 영어 이름이며, normalize()를 거쳐 비교하므로 "FC", 악센트, 대소문자 차이는 무시됩니다.
// 빠진 팀은 이 표에 한 줄 추가하면 됩니다. 표에 없으면 원래 이름이 그대로 나옵니다.

const TEAMS_KO = {
  // 스페인
  "Athletic Club": "아틀레틱 빌바오", "Athletic Bilbao": "아틀레틱 빌바오",
  "Real Madrid": "레알 마드리드", "Barcelona": "바르셀로나",
  "Atletico Madrid": "아틀레티코 마드리드", "Club Atletico de Madrid": "아틀레티코 마드리드",
  "Sevilla": "세비야", "Real Betis": "레알 베티스", "Real Betis Balompie": "레알 베티스",
  "Real Sociedad": "레알 소시에다드", "Real Sociedad de Futbol": "레알 소시에다드",
  "Villarreal": "비야레알", "Valencia": "발렌시아", "Celta Vigo": "셀타 비고", "RC Celta de Vigo": "셀타 비고",
  "Osasuna": "오사수나", "CA Osasuna": "오사수나", "Getafe": "헤타페", "Rayo Vallecano": "라요 바예카노",
  "Rayo Vallecano de Madrid": "라요 바예카노", "Alaves": "알라베스", "Deportivo Alaves": "알라베스",
  "Mallorca": "마요르카", "RCD Mallorca": "마요르카", "Girona": "지로나", "Espanyol": "에스파뇰",
  "RCD Espanyol de Barcelona": "에스파뇰", "Las Palmas": "라스 팔마스", "UD Las Palmas": "라스 팔마스",
  "Leganes": "레가네스", "Valladolid": "바야돌리드", "Real Valladolid": "바야돌리드",
  "Levante": "레반테", "Levante UD": "레반테", "Elche": "엘체", "Granada": "그라나다", "Cadiz": "카디스",
  "Almeria": "알메리아", "Malaga": "말라가", "Racing Santander": "라싱 산탄데르", "Real Racing Club": "라싱 산탄데르",
  "Deportivo La Coruna": "데포르티보 라코루냐", "RC Deportivo": "데포르티보 라코루냐", "Real Oviedo": "레알 오비에도",
  "Real Zaragoza": "레알 사라고사", "Sporting Gijon": "스포르팅 히혼", "Eibar": "에이바르",
  // 잉글랜드
  "Manchester City": "맨체스터 시티", "Manchester United": "맨체스터 유나이티드",
  "Liverpool": "리버풀", "Arsenal": "아스널", "Chelsea": "첼시", "Tottenham": "토트넘",
  "Tottenham Hotspur": "토트넘", "Newcastle": "뉴캐슬", "Newcastle United": "뉴캐슬",
  "Aston Villa": "애스턴 빌라", "Brighton": "브라이턴", "Brighton & Hove Albion": "브라이턴",
  "West Ham": "웨스트햄", "West Ham United": "웨스트햄", "Everton": "에버턴",
  "Wolves": "울버햄튼", "Wolverhampton Wanderers": "울버햄튼", "Crystal Palace": "크리스털 팰리스",
  "Fulham": "풀럼", "Brentford": "브렌트퍼드", "Bournemouth": "본머스", "AFC Bournemouth": "본머스",
  "Nottingham Forest": "노팅엄 포레스트", "Leicester": "레스터 시티", "Leicester City": "레스터 시티",
  "Southampton": "사우샘프턴", "Ipswich": "입스위치", "Ipswich Town": "입스위치",
  "Leeds": "리즈 유나이티드", "Leeds United": "리즈 유나이티드", "Burnley": "번리",
  "Sunderland": "선덜랜드", "Sheffield United": "셰필드 유나이티드", "Luton": "루턴 타운", "Luton Town": "루턴 타운",
  "Watford": "왓퍼드", "Norwich": "노리치", "Norwich City": "노리치",
  // 독일
  "Bayern Munich": "바이에른 뮌헨", "Bayern Munchen": "바이에른 뮌헨", "FC Bayern Munchen": "바이에른 뮌헨",
  "Borussia Dortmund": "보루시아 도르트문트", "RB Leipzig": "RB 라이프치히",
  "Bayer Leverkusen": "바이어 레버쿠젠", "Bayer 04 Leverkusen": "바이어 레버쿠젠",
  "Eintracht Frankfurt": "아인트라흐트 프랑크푸르트", "VfB Stuttgart": "슈투트가르트",
  "SC Freiburg": "프라이부르크", "VfL Wolfsburg": "볼프스부르크", "Borussia Monchengladbach": "묀헨글라트바흐",
  "Union Berlin": "우니온 베를린", "1. FC Union Berlin": "우니온 베를린", "Werder Bremen": "베르더 브레멘",
  "SV Werder Bremen": "베르더 브레멘", "Mainz 05": "마인츠", "1. FSV Mainz 05": "마인츠",
  "FC Augsburg": "아우크스부르크", "1899 Hoffenheim": "호펜하임", "TSG 1899 Hoffenheim": "호펜하임",
  "1. FC Heidenheim": "하이덴하임", "FC Heidenheim": "하이덴하임", "FC St. Pauli": "장크트 파울리",
  "Holstein Kiel": "홀슈타인 킬", "1. FC Koln": "쾰른", "FC Koln": "쾰른", "Hamburger SV": "함부르크",
  "Hertha Berlin": "헤르타 베를린", "Schalke 04": "샬케 04", "VfL Bochum": "보훔",
  // 이탈리아
  "Inter": "인터 밀란", "Inter Milan": "인터 밀란", "FC Internazionale Milano": "인터 밀란",
  "AC Milan": "AC 밀란", "Juventus": "유벤투스", "Napoli": "나폴리", "SSC Napoli": "나폴리",
  "AS Roma": "AS 로마", "Roma": "AS 로마", "Lazio": "라치오", "SS Lazio": "라치오",
  "Atalanta": "아탈란타", "Fiorentina": "피오렌티나", "ACF Fiorentina": "피오렌티나",
  "Bologna": "볼로냐", "Torino": "토리노", "Genoa": "제노아", "Udinese": "우디네세",
  "Como": "코모", "Como 1907": "코모", "Cagliari": "칼리아리", "Lecce": "레체", "Parma": "파르마",
  "Verona": "엘라스 베로나", "Hellas Verona": "엘라스 베로나", "Empoli": "엠폴리",
  "Venezia": "베네치아", "Monza": "몬차", "Sassuolo": "사수올로", "Pisa": "피사", "Cremonese": "크레모네세",
  // 프랑스
  "Paris Saint Germain": "파리 생제르맹", "Paris Saint-Germain": "파리 생제르맹", "PSG": "파리 생제르맹",
  "Marseille": "마르세유", "Olympique de Marseille": "마르세유", "Lyon": "리옹", "Olympique Lyonnais": "리옹",
  "Monaco": "AS 모나코", "AS Monaco": "AS 모나코", "Lille": "릴", "LOSC Lille": "릴",
  "Nice": "니스", "OGC Nice": "니스", "Lens": "랑스", "RC Lens": "랑스", "Rennes": "렌", "Stade Rennais": "렌",
  "Nantes": "낭트", "Strasbourg": "스트라스부르", "Toulouse": "툴루즈", "Brest": "브레스트",
  "Stade Brestois 29": "브레스트", "Reims": "랭스", "Stade de Reims": "랭스", "Montpellier": "몽펠리에",
  "Auxerre": "오세르", "Angers": "앙제", "Le Havre": "르아브르", "Saint Etienne": "생테티엔",
  "Lorient": "로리앙", "Metz": "메스", "Paris FC": "파리 FC",
  // 기타 유럽
  "Ajax": "아약스", "AFC Ajax": "아약스", "PSV": "PSV 에인트호번", "PSV Eindhoven": "PSV 에인트호번",
  "Feyenoord": "페예노르트", "AZ Alkmaar": "AZ 알크마르", "Twente": "트벤터",
  "Benfica": "벤피카", "SL Benfica": "벤피카", "Porto": "포르투", "FC Porto": "포르투",
  "Sporting CP": "스포르팅 CP", "Sporting Lisbon": "스포르팅 CP", "Braga": "브라가", "SC Braga": "브라가",
  "Celtic": "셀틱", "Rangers": "레인저스", "Galatasaray": "갈라타사라이", "Fenerbahce": "페네르바흐체",
  "Besiktas": "베식타스", "Club Brugge": "클뤼프 브뤼허", "Club Brugge KV": "클뤼프 브뤼허",
  "Anderlecht": "안데를레흐트", "Red Bull Salzburg": "레드불 잘츠부르크", "RB Salzburg": "레드불 잘츠부르크",
  "Shakhtar Donetsk": "샤흐타르 도네츠크", "Dinamo Zagreb": "디나모 자그레브", "Olympiacos": "올림피아코스",
  "Crvena Zvezda": "츠르베나 즈베즈다", "Red Star Belgrade": "츠르베나 즈베즈다",
  "Young Boys": "영 보이스", "BSC Young Boys": "영 보이스", "Midtjylland": "미트윌란", "FC Copenhagen": "코펜하겐",
  // K리그
  "Ulsan Hyundai": "울산 HD", "Ulsan HD": "울산 HD", "Jeonbuk Motors": "전북 현대", "Jeonbuk Hyundai Motors": "전북 현대",
  "Pohang Steelers": "포항 스틸러스", "FC Seoul": "FC 서울", "Seoul": "FC 서울", "Suwon Bluewings": "수원 삼성",
  "Suwon Samsung Bluewings": "수원 삼성", "Suwon FC": "수원 FC", "Gangwon": "강원 FC", "Gangwon FC": "강원 FC",
  "Gwangju": "광주 FC", "Gwangju FC": "광주 FC", "Daegu": "대구 FC", "Daegu FC": "대구 FC",
  "Daejeon Citizen": "대전 하나 시티즌", "Daejeon Hana Citizen": "대전 하나 시티즌",
  "Incheon United": "인천 유나이티드", "Jeju United": "제주 SK", "Jeju SK": "제주 SK",
  "Gimcheon Sangmu": "김천 상무", "Seongnam": "성남 FC", "Seongnam FC": "성남 FC", "Busan IPark": "부산 아이파크",
  "Jeonnam Dragons": "전남 드래곤즈", "Anyang": "FC 안양", "FC Anyang": "FC 안양", "Bucheon FC 1995": "부천 FC",
  // 아시아/기타
  "Al Hilal": "알 힐랄", "Al-Hilal": "알 힐랄", "Al Nassr": "알 나스르", "Al-Nassr": "알 나스르",
  "Al Ittihad": "알 이티하드", "Al-Ittihad": "알 이티하드", "Inter Miami": "인터 마이애미", "LA Galaxy": "LA 갤럭시",
  "Los Angeles FC": "LAFC", "Boca Juniors": "보카 주니어스", "River Plate": "리버 플레이트",
  "Flamengo": "플라멩구", "Palmeiras": "파우메이라스",
  // 국가대표
  "South Korea": "대한민국", "Korea Republic": "대한민국", "Japan": "일본", "Spain": "스페인", "England": "잉글랜드",
  "France": "프랑스", "Germany": "독일", "Italy": "이탈리아", "Brazil": "브라질", "Argentina": "아르헨티나",
  "Portugal": "포르투갈", "Netherlands": "네덜란드", "Belgium": "벨기에", "Croatia": "크로아티아", "USA": "미국",
  "United States": "미국", "Mexico": "멕시코", "Australia": "호주", "China PR": "중국", "China": "중국",
  "Saudi Arabia": "사우디아라비아", "Iran": "이란", "Qatar": "카타르", "Uzbekistan": "우즈베키스탄",
};

const COMPETITIONS_KO = {
  "La Liga": "라리가", "Primera Division": "라리가", "LaLiga": "라리가",
  "Premier League": "프리미어리그", "Bundesliga": "분데스리가", "Serie A": "세리에 A",
  "Ligue 1": "리그 1", "Eredivisie": "에레디비시", "Primeira Liga": "프리메이라 리가",
  "UEFA Champions League": "챔피언스리그", "Champions League": "챔피언스리그",
  "UEFA Europa League": "유로파리그", "Europa League": "유로파리그",
  "UEFA Europa Conference League": "컨퍼런스리그", "UEFA Conference League": "컨퍼런스리그",
  "Conference League": "컨퍼런스리그", "UEFA Super Cup": "UEFA 슈퍼컵",
  "Copa del Rey": "코파 델 레이", "Super Cup": "슈퍼컵", "Supercopa de Espana": "수페르코파",
  "FA Cup": "FA컵", "League Cup": "리그컵", "EFL Cup": "리그컵", "Carabao Cup": "리그컵",
  "Community Shield": "커뮤니티 실드", "DFB Pokal": "DFB 포칼", "Coppa Italia": "코파 이탈리아",
  "Coupe de France": "쿠프 드 프랑스", "Championship": "챔피언십",
  "K League 1": "K리그1", "K League 2": "K리그2", "Korean FA Cup": "코리아컵",
  "AFC Champions League": "AFC 챔피언스리그", "AFC Champions League Elite": "AFC 챔피언스리그 엘리트",
  "World Cup": "월드컵", "FIFA World Cup": "월드컵", "FIFA Club World Cup": "클럽 월드컵",
  "Friendlies": "친선경기", "Friendlies Clubs": "클럽 친선경기", "Club Friendlies": "클럽 친선경기",
  "UEFA Nations League": "UEFA 네이션스리그", "Euro Championship": "유로", "European Championship": "유로",
  "Asian Cup": "아시안컵", "AFC Asian Cup": "아시안컵", "Copa America": "코파 아메리카",
  "World Cup - Qualification Asia": "월드컵 아시아 예선", "World Cup - Qualification Europe": "월드컵 유럽 예선",
};

/** 비교용 정규화: 악센트·대소문자·FC 같은 꼬리표 제거 */
export function normalize(name = "") {
  return name
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/[-_/]/g, " ")
    .replace(/\b(fc|cf|afc|sc|sad|club de futbol|futbol club)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const buildIndex = (obj) => new Map(Object.entries(obj).map(([k, v]) => [normalize(k), v]));
const TEAM_INDEX = buildIndex(TEAMS_KO);
const COMP_INDEX = buildIndex(COMPETITIONS_KO);

export function teamName(name, lang) {
  if (lang !== "ko" || !name) return name;
  return TEAM_INDEX.get(normalize(name)) ?? name;
}

export function competitionName(name, lang) {
  if (lang !== "ko" || !name) return name;
  return COMP_INDEX.get(normalize(name)) ?? name;
}

/** 한국어로 검색했을 때 영어 이름으로 바꿔주기 (예: "토트넘" → "Tottenham") */
export function koreanQueryToEnglish(q) {
  const t = q.trim();
  if (!/[가-힣]/.test(t)) return null;
  const hits = new Set();
  for (const [en, ko] of Object.entries(TEAMS_KO)) {
    if (ko.replace(/\s/g, "").includes(t.replace(/\s/g, ""))) hits.add(en);
  }
  // 같은 팀의 여러 영어 표기 중 가장 짧은 것 하나씩만
  const byKo = new Map();
  for (const en of hits) {
    const ko = TEAMS_KO[en];
    if (!byKo.has(ko) || en.length < byKo.get(ko).length) byKo.set(ko, en);
  }
  return [...byKo.values()];
}

/** 라운드 표기 다듬기 ("Regular Season - 13" → "13라운드") */
export function roundName(round, lang) {
  if (!round) return "";
  if (lang !== "ko") return round;
  const m = String(round).match(/^Regular Season - (\d+)$/i) || String(round).match(/^Matchday (\d+)$/i);
  if (m) return `${m[1]}라운드`;
  const map = [
    [/round of 16|8th finals/i, "16강"], [/quarter/i, "8강"], [/semi/i, "4강"], [/^final$/i, "결승"],
    [/round of 32|16th finals/i, "32강"], [/group stage - (\d+)/i, "조별리그 $1차전"],
    [/league stage - (\d+)/i, "리그 페이즈 $1차전"], [/play-?offs?/i, "플레이오프"],
  ];
  for (const [re, ko] of map) {
    const hit = String(round).match(re);
    if (hit) return ko.replace("$1", hit[1] ?? "");
  }
  return round;
}
