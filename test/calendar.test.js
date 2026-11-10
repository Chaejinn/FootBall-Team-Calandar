import { test } from "node:test";
import assert from "node:assert/strict";
import { fixturesToIcs } from "../src/calendar.js";
import { foldLine, escapeText } from "../src/ics.js";
import { teamName, normalize, koreanQueryToEnglish, roundName, competitionName } from "../src/i18n.js";
import { ApiFootball } from "../src/providers/apifootball.js";
import { calendarHandler, searchHandler } from "../src/handlers.js";

const fx = [
  {
    id: "1", start: new Date("2026-11-20T20:00:00Z"), timeConfirmed: true, status: "scheduled",
    competition: "La Liga", round: "Regular Season - 13",
    home: { id: "531", name: "Athletic Club" }, away: { id: "540", name: "Espanyol" },
    venue: "San Mamés", city: "Bilbao", score: { home: null, away: null },
  },
  {
    id: "2", start: new Date("2026-12-06T15:00:00Z"), timeConfirmed: false, status: "scheduled",
    competition: "La Liga", round: "Regular Season - 15",
    home: { id: "531", name: "Athletic Club" }, away: { id: "541", name: "Real Madrid" },
    venue: "San Mamés", city: "Bilbao", score: { home: null, away: null },
  },
  {
    id: "3", start: new Date("2026-11-08T17:00:00Z"), timeConfirmed: true, status: "finished",
    competition: "La Liga", round: "Regular Season - 12",
    home: { id: "727", name: "Osasuna" }, away: { id: "531", name: "Athletic Club" },
    venue: "El Sadar", city: "Pamplona", score: { home: 1, away: 2 },
  },
];

test("한국어 캘린더 생성", () => {
  const { ics, teamName: n } = fixturesToIcs({ provider: "t", teamId: "531", fixtures: fx, lang: "ko", alarm: 30 });
  assert.equal(n, "아틀레틱 빌바오");
  assert.match(ics, /X-WR-CALNAME:아틀레틱 빌바오 경기 일정/);
  assert.match(ics, /SUMMARY:⚽ 아틀레틱 빌바오 vs 에스파뇰\r\n/);
  assert.match(ics, /DTSTART:20261120T200000Z/);
  assert.match(ics, /SUMMARY:⚽ 아틀레틱 빌바오 vs 레알 마드리드 \(시간 미정\)/);
  assert.match(ics, /DTSTART;VALUE=DATE:20261206/);
  assert.match(ics, /SUMMARY:⚽ 오사수나 1-2 아틀레틱 빌바오/);
  assert.match(ics, /DESCRIPTION:라리가 · 13라운드/);
  assert.equal((ics.match(/BEGIN:VALARM/g) || []).length, 1); // 끝난 경기엔 알림 없음
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  // 경기는 시간순 정렬
  assert.ok(ics.indexOf("오사수나") < ics.indexOf("에스파뇰"));
});

test("영어 캘린더", () => {
  const { ics } = fixturesToIcs({ provider: "t", teamId: "531", fixtures: fx, lang: "en", emoji: false });
  assert.match(ics, /SUMMARY:Athletic Club vs Real Madrid \(TBD\)/);
  assert.match(ics, /DESCRIPTION:La Liga · Regular Season - 13/);
});

test("모든 줄이 75바이트 이하", () => {
  const long = { ...fx[0], venue: "가".repeat(80) };
  const { ics } = fixturesToIcs({ provider: "t", teamId: "531", fixtures: [long], lang: "ko" });
  for (const line of ics.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75, line);
  assert.equal(foldLine("abc"), "abc");
  assert.equal(escapeText("a,b;c\nd"), "a\\,b\\;c\\nd");
});

test("이름 정규화와 번역", () => {
  assert.equal(normalize("Atlético Madrid"), "atletico madrid");
  assert.equal(teamName("Manchester United FC", "ko"), "맨체스터 유나이티드");
  assert.equal(teamName("Unknown Town", "ko"), "Unknown Town");
  assert.equal(teamName("Tottenham", "en"), "Tottenham");
  assert.deepEqual(koreanQueryToEnglish("토트넘"), ["Tottenham"]);
  assert.equal(koreanQueryToEnglish("Arsenal"), null);
  assert.equal(roundName("Regular Season - 7", "ko"), "7라운드");
  assert.equal(roundName("Quarter-finals", "ko"), "8강");
  assert.equal(roundName("League Stage - 3", "ko"), "리그 페이즈 3차전");
  assert.equal(competitionName("UEFA Champions League", "ko"), "챔피언스리그");
});

test("API-Football 응답 변환 (TBD 처리)", async () => {
  const fakeFetch = async (url) => {
    const u = new URL(url);
    const body = u.searchParams.has("next")
      ? { errors: [], response: [{
          fixture: { id: 9, date: "2026-12-06T15:00:00+00:00", status: { short: "TBD" }, venue: { name: "San Mamés", city: "Bilbao" } },
          league: { name: "La Liga", round: "Regular Season - 15" },
          teams: { home: { id: 531, name: "Athletic Club" }, away: { id: 541, name: "Real Madrid" } },
          goals: { home: null, away: null } }] }
      : { errors: { plan: "Free plans do not have access to this season" }, response: [] };
    return new Response(JSON.stringify(body));
  };
  const p = new ApiFootball("k", fakeFetch);
  const list = await p.getFixtures("531"); // last 요청 에러는 무시
  assert.equal(list.length, 1);
  assert.equal(list[0].timeConfirmed, false);
  // next 요청이 요금제 에러면 사유가 그대로 올라와야 함
  const p2 = new ApiFootball("k", async () => new Response(JSON.stringify({ errors: { plan: "no access" }, response: [] })));
  await assert.rejects(p2.getFixtures("1"), /no access/);
});

test("핸들러: 키 없음 / 잘못된 ID", async () => {
  const r1 = await calendarHandler(new URL("https://x.app/api/cal?id=531"), {});
  assert.equal(r1.status, 502);
  assert.match((await r1.json()).error, /API_FOOTBALL_KEY/);
  const r2 = await calendarHandler(new URL("https://x.app/api/cal?id=../etc"), {});
  assert.equal(r2.status, 400);
  const r3 = await searchHandler(new URL("https://x.app/api/search?q="), {});
  assert.deepEqual(await r3.json(), { results: [] });
});
