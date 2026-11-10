// 표준화된 경기 목록 → 캘린더 이벤트
import { buildCalendar } from "./ics.js";
import { teamName, competitionName, roundName } from "./i18n.js";

const TXT = {
  ko: { tbd: "시간 미정", postponed: "연기", cancelled: "취소", fixtures: "경기 일정", tbdNote: "킥오프 시간 미정 (확정되면 자동으로 바뀌어요)" },
  en: { tbd: "TBD", postponed: "Postponed", cancelled: "Cancelled", fixtures: "Fixtures", tbdNote: "Kick-off time to be confirmed" },
};

/**
 * @param {object} p
 * @param {string} p.provider 데이터 제공자 이름 (UID용)
 * @param {string} p.teamId
 * @param {string} [p.teamNameHint] 경기가 없을 때 캘린더 이름에 쓸 팀 이름
 * @param {Array} p.fixtures
 * @param {"ko"|"en"} p.lang
 * @param {number} [p.alarm] 분
 * @param {boolean} [p.emoji]
 */
export function fixturesToIcs({ provider, teamId, teamNameHint, fixtures, lang = "ko", alarm = 0, emoji = true, now }) {
  const t = TXT[lang] ?? TXT.ko;
  const sorted = [...fixtures].sort((a, b) => a.start - b.start);

  const self = sorted.map((f) => (f.home.id === teamId ? f.home : f.away.id === teamId ? f.away : null)).find(Boolean);
  const myName = teamName(self?.name ?? teamNameHint ?? `Team ${teamId}`, lang);

  const events = sorted.map((f) => {
    const home = teamName(f.home.name, lang);
    const away = teamName(f.away.name, lang);
    let summary =
      f.status === "finished" && f.score.home != null
        ? `${home} ${f.score.home}-${f.score.away} ${away}`
        : `${home} vs ${away}`;
    if (emoji) summary = `⚽ ${summary}`;
    const tags = [];
    if (f.status === "postponed") tags.push(t.postponed);
    else if (f.status === "cancelled") tags.push(t.cancelled);
    else if (!f.timeConfirmed && f.status === "scheduled") tags.push(t.tbd);
    if (tags.length) summary += ` (${tags.join(", ")})`;

    const comp = [competitionName(f.competition, lang), roundName(f.round, lang)].filter(Boolean).join(" · ");
    const desc = [comp, !f.timeConfirmed && f.status === "scheduled" ? t.tbdNote : ""].filter(Boolean).join("\n");

    return {
      uid: `${provider}-${f.id}@football-cal`,
      start: f.start,
      timeConfirmed: f.timeConfirmed && f.status !== "postponed",
      durationMin: 120,
      noAlarm: f.status === "finished" || f.status === "cancelled",
      summary,
      location: [f.venue, f.city].filter(Boolean).join(", "),
      description: desc,
    };
  });

  return {
    teamName: myName,
    ics: buildCalendar({ calName: `${myName} ${t.fixtures}`, events, alarmMinutes: alarm, now }),
  };
}
