// iCalendar(RFC 5545) 생성기

const CRLF = "\r\n";

/** 텍스트 값 이스케이프 (RFC 5545 3.3.11) */
export function escapeText(s = "") {
  return String(s)
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

/** 75바이트 줄 접기 (UTF-8 멀티바이트 문자가 잘리지 않게) */
export function foldLine(line) {
  const enc = new TextEncoder();
  const bytes = enc.encode(line);
  if (bytes.length <= 75) return line;
  const parts = [];
  let cur = "";
  let curLen = 0;
  let limit = 75; // 첫 줄 75, 이후 줄은 앞의 공백 1바이트 포함 75
  for (const ch of line) {
    const len = enc.encode(ch).length;
    if (curLen + len > limit) {
      parts.push(cur);
      cur = "";
      curLen = 0;
      limit = 74;
    }
    cur += ch;
    curLen += len;
  }
  parts.push(cur);
  return parts.join(CRLF + " ");
}

const pad = (n) => String(n).padStart(2, "0");

function utcStamp(d) {
  return (
    d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + "T" +
    pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + "Z"
  );
}

function dateOnly(d) {
  return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate());
}

/** 경기 시작 시각이 '현지 날짜' 기준 어느 날인지 (시간 미정 경기용, 유럽 기준 UTC+1로 근사) */
function localDateForTbd(d) {
  return new Date(d.getTime() + 60 * 60 * 1000);
}

/**
 * @param {object} opts
 * @param {string} opts.calName 캘린더 이름
 * @param {Array<object>} opts.events 표준화된 경기 목록
 *   { uid, start: Date, timeConfirmed: boolean, durationMin, summary, location, description, url }
 * @param {number} [opts.alarmMinutes] 확정된 경기의 알림(분 전). 0이면 알림 없음
 * @param {Date} [opts.now]
 */
export function buildCalendar({ calName, events, alarmMinutes = 0, now = new Date() }) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//football-cal//KO",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calName)}`,
    `NAME:${escapeText(calName)}`,
    // 구독 앱에 갱신 주기 힌트 (6시간)
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "X-PUBLISHED-TTL:PT6H",
  ];
  const stamp = utcStamp(now);

  for (const ev of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${ev.uid}`);
    lines.push(`DTSTAMP:${stamp}`);
    if (ev.timeConfirmed) {
      const end = new Date(ev.start.getTime() + (ev.durationMin ?? 120) * 60000);
      lines.push(`DTSTART:${utcStamp(ev.start)}`);
      lines.push(`DTEND:${utcStamp(end)}`);
    } else {
      const day = localDateForTbd(ev.start);
      const next = new Date(day.getTime() + 24 * 3600 * 1000);
      lines.push(`DTSTART;VALUE=DATE:${dateOnly(day)}`);
      lines.push(`DTEND;VALUE=DATE:${dateOnly(next)}`);
      lines.push("TRANSP:TRANSPARENT");
    }
    lines.push(`SUMMARY:${escapeText(ev.summary)}`);
    if (ev.location) lines.push(`LOCATION:${escapeText(ev.location)}`);
    if (ev.description) lines.push(`DESCRIPTION:${escapeText(ev.description)}`);
    if (ev.url) lines.push(`URL:${ev.url}`);
    if (ev.timeConfirmed && alarmMinutes > 0 && !ev.noAlarm) {
      lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${escapeText(ev.summary)}`,
        `TRIGGER:-PT${alarmMinutes}M`, "END:VALARM");
    }
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join(CRLF) + CRLF;
}
