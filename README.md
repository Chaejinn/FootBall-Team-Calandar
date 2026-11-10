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
app/page.js                검색 페이지
app/login/                 로그인·회원가입
app/admin/                 관리자 계정·활동 기록 화면
app/api/                   Next.js BFF (검색, 캘린더, 인증, 관리자 API)
auth.js                    소셜 로그인 및 세션
src/server/                서버 전용 계정·권한·로그 처리
supabase/migrations/       계정·활동 기록 DB 스키마
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
3. Framework Preset은 **Next.js**, 빌드 명령은 `npm run build`
4. **Environment Variables**에 추가
   - `API_FOOTBALL_KEY` = 발급받은 키
   - (football-data.org를 쓸 경우) `PROVIDER` = `footballdata`, `FOOTBALL_DATA_KEY` = 키
5. **Deploy**

Vercel의 Git 연결을 완료하면 `main`에 push할 때마다 자동으로 다시 배포된다.
환경 변수를 나중에 바꿨다면 Deployments에서 **Redeploy**를 한 번 해줘야 적용된다.

## 계정 및 관리자 설정

브라우저는 Next.js BFF를 통해 인증과 데이터를 요청한다. 계정과 활동 기록은 Supabase PostgreSQL에 저장한다. 관리자 화면은 `/admin`이며 서버에서 매번 권한을 검사한다.

1. Supabase 프로젝트에서 `supabase/migrations/001_accounts.sql`을 실행한다.
2. Supabase Auth에서 이메일 인증을 활성화하고 비밀번호 최소 길이를 12자로 설정한다. 운영용 SMTP와 배포 도메인의 Site URL 및 `/login` 리다이렉트 URL을 등록한다.
3. Vercel에 `.env.example`의 서버 전용 환경 변수를 설정한다. `AUTH_SECRET`은 충분히 긴 무작위 값, `AUTH_URL`은 배포 도메인이다. `ADMIN_EMAIL`은 관리할 계정의 이메일이며 공개 파일에 기입하지 않는다.
4. Google, Naver, Kakao 개발자 콘솔에서 앱을 생성하고 ID와 Secret을 설정한다. 콜백 주소는 `https://도메인/api/auth/callback/google`, `/naver`, `/kakao`이다. 제공자별 동의 항목과 서비스 공개 설정도 완료해야 한다.
5. 관리자는 지정한 이메일의 Google 계정 또는 이메일 인증을 완료한 계정으로 로그인한다. 소셜 계정은 제공자별로 구분하며 이메일만으로 자동 연결하지 않는다.

회원가입 시 이메일은 필수이고 아이디는 선택이다. 아이디를 등록하면 이메일 대신 아이디로도 로그인할 수 있다. 비밀번호는 Supabase Auth에서 관리하며 앱 DB나 로그에 저장하지 않는다. 로그인 시도는 DB 기반으로 제한한다.

관리자는 가입 계정, 가입일, 최근 로그인, 상태 및 사용자별 활동 기록을 조회할 수 있다. 로그에는 활동 종류와 계정 ID만 저장하며 비밀번호, 토큰, 검색어, 원본 IP는 저장하지 않는다. 기록은 서버에서 처리한 요청 기준이며 캘린더 앱의 CDN 캐시 조회 등 모든 외부 접속을 추적하는 용도는 아니다.

인증 설정이 없으면 로그인은 준비 중으로 표시하고 관리자 접근은 차단한다. 팀 검색과 캘린더 구독은 로그인 없이 계속 사용할 수 있다.

## 한국어 이름 추가

`src/i18n.js`의 `TEAMS_KO`에 한 줄 추가하면 된다. 표에 없는 팀은 원래 이름으로 나온다.

```js
"Athletic Club": "아틀레틱 빌바오",
```

## 아이폰에서 구독하기

검색 페이지에서 팀 선택 → **아이폰·맥 캘린더에 구독** → 구독.
또는 URL 복사 후 설정 → 캘린더 → 캘린더 계정 → 계정 추가 → 기타 → 구독 캘린더 추가.
