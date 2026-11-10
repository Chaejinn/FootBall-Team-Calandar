# FootBall Team Calendar

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Chaejinn/FootBall-Team-Calandar&env=API_FOOTBALL_KEY&envDescription=API-Football%20API%20Key)

좋아하는 축구팀을 검색하면 그 팀 경기 일정을 **캘린더 구독 URL**로 받을 수 있는 서비스.
아이폰/맥 캘린더, 구글 캘린더에 한 번 구독해두면 킥오프 시간이 확정되거나 바뀔 때 알아서 갱신된다.

- 팀 검색 (한국어 `토트넘`, 영어 `Tottenham` 둘 다 됨)
- 일정 제목 한국어 / 영어 선택 (`아틀레틱 빌바오 vs 레알 마드리드`)
- 시간 미정 경기는 종일 일정으로 표시, 확정되면 시간 있는 일정으로 바뀜
- 끝난 경기는 스코어 표시 (`오사수나 1-2 아틀레틱 빌바오`)
- 경기 전 알림 옵션 (15분 / 30분 / 1시간)

## 구조

```
public/index.html          검색 페이지
api/search.js              팀 검색 API
api/cal.js                 캘린더(.ics) API
src/handlers.js            API 공통 로직, 캐시
src/calendar.js            경기 목록 → 캘린더 이벤트
src/ics.js                 iCalendar(.ics) 생성
src/i18n.js                팀/대회 이름 한국어 변환표
src/providers/             데이터 API 어댑터 (API-Football, football-data.org)
```

| 경로 | 설명 |
| --- | --- |
| `GET /api/search?q=토트넘` | 팀 검색 |
| `GET /cal/{팀ID}.ics?lang=ko&alarm=30` | 구독용 캘린더 |

API 호출 수를 아끼려고 응답을 Vercel CDN에 캐시한다 (팀 일정 6시간, 검색 1일).

## 데이터

경기 데이터는 외부 API를 쓴다. 환경 변수 `PROVIDER`로 고를 수 있다.

| PROVIDER | 서비스 | 무료 플랜 |
| --- | --- | --- |
| `apifootball` (기본) | [API-Football](https://www.api-football.com/) | 하루 100회, 전 세계 리그 |
| `footballdata` | [football-data.org](https://www.football-data.org/) | 분당 10회, 유럽 주요 리그 위주 |

API-Football 무료 플랜에서 현재 시즌 조회가 막혀 있으면 `footballdata`로 바꾸면 된다.

## 배포 (Vercel)

1. [Vercel](https://vercel.com/)에 GitHub 계정으로 로그인
2. **Add New → Project** → 이 저장소 Import
3. Framework Preset은 **Other** 그대로, 빌드 설정은 건드리지 않음
4. **Environment Variables**에 추가
   - `API_FOOTBALL_KEY` = 발급받은 키
   - (football-data.org를 쓸 경우) `PROVIDER` = `footballdata`, `FOOTBALL_DATA_KEY` = 키
5. **Deploy**

이후 `main`에 push할 때마다 자동으로 다시 배포된다.
환경 변수를 나중에 바꿨다면 Deployments에서 **Redeploy**를 한 번 해줘야 적용된다.

## 한국어 이름 추가

`src/i18n.js`의 `TEAMS_KO`에 한 줄 추가하면 된다. 표에 없는 팀은 원래 이름으로 나온다.

```js
"Athletic Club": "아틀레틱 빌바오",
```

## 아이폰에서 구독하기

검색 페이지에서 팀 선택 → **아이폰·맥 캘린더에 구독** → 구독.
또는 URL 복사 후 설정 → 캘린더 → 캘린더 계정 → 계정 추가 → 기타 → 구독 캘린더 추가.
