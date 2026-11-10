"use client";

import { useEffect, useRef, useState } from "react";

function upcoming(ics) {
  const text = ics.replace(/\r\n[ \t]/g, "");
  return text.split("BEGIN:VEVENT").slice(1).map((block) => {
    const get = (key) => (block.match(new RegExp(`^${key}[^:]*:([^\\r\\n]*)`, "m")) || [])[1] || "";
    const raw = get("DTSTART");
    const allDay = /^\d{8}$/.test(raw);
    const date = allDay ? new Date(+raw.slice(0, 4), +raw.slice(4, 6) - 1, +raw.slice(6, 8))
      : new Date(Date.UTC(+raw.slice(0, 4), +raw.slice(4, 6) - 1, +raw.slice(6, 8), +raw.slice(9, 11), +raw.slice(11, 13)));
    return { date, allDay, title: get("SUMMARY").replace(/\\([,;\\])/g, "$1") };
  }).filter((event) => event.date.getTime() + (event.allDay ? 86400000 : 10800000) > Date.now())
    .sort((a, b) => a.date - b.date).slice(0, 5);
}

export default function CalendarSearch() {
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState("ko");
  const [alarm, setAlarm] = useState("0");
  const [results, setResults] = useState([]);
  const [team, setTeam] = useState(null);
  const [status, setStatus] = useState("");
  const [events, setEvents] = useState([]);
  const [previewStatus, setPreviewStatus] = useState("");
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const searchRequest = useRef(null);

  useEffect(() => {
    setOrigin(location.origin);
    try {
      const saved = JSON.parse(localStorage.getItem("fc-opts") || "{}");
      if (["ko", "en"].includes(saved.lang)) setLang(saved.lang);
      if (["0", "15", "30", "60"].includes(saved.alarm)) setAlarm(saved.alarm);
    } catch {}
    return () => searchRequest.current?.abort();
  }, []);

  const params = new URLSearchParams({ lang, name: team?.name || "" });
  if (alarm !== "0") params.set("alarm", alarm);
  const url = team && origin ? `${origin}/cal/${encodeURIComponent(team.id)}.ics?${params}` : "";
  const webcal = url.replace(/^https?:/, "webcal:");

  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    setEvents([]); setPreviewStatus("다가오는 경기 불러오는 중…"); setCopied(false);
    fetch(url, { signal: controller.signal }).then(async (response) => {
      if (!response.ok) throw new Error("일정을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
      const list = upcoming(await response.text());
      setEvents(list); setPreviewStatus(list.length ? "" : "예정된 경기가 없어요.");
    }).catch((error) => { if (error.name !== "AbortError") setPreviewStatus(error.message); });
    return () => controller.abort();
  }, [url]);

  async function search(event) {
    event.preventDefault();
    if (!query.trim()) return;
    searchRequest.current?.abort();
    const controller = new AbortController(); searchRequest.current = controller;
    setTeam(null); setResults([]); setStatus("검색 중…");
    try {
      const response = await fetch(`/api/search?${new URLSearchParams({ q: query, lang })}`, { signal: controller.signal });
      const data = await response.json();
      if (!response.ok) throw new Error("검색에 실패했어요. 잠시 후 다시 시도해 주세요.");
      setResults(data.results); setStatus(data.results.length ? `${data.results.length}개 팀` : "검색 결과가 없어요. 영어 이름으로도 검색해 보세요.");
    } catch (error) { if (error.name !== "AbortError") setStatus(error.message); }
  }

  function changeOption(key, value) {
    if (key === "lang") setLang(value); else setAlarm(value);
    try { localStorage.setItem("fc-opts", JSON.stringify({ lang, alarm, [key]: value })); } catch {}
  }

  return <>
    <h1>내 팀의 다음 경기, 내 캘린더에서.</h1>
    <p className="sub">팀을 검색하고 구독하면 경기 시간이 바뀔 때 알아서 갱신돼요.</p>
    <form className="search" onSubmit={search}>
      <label className="sr-only" htmlFor="team-query">팀 이름</label>
      <input id="team-query" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="팀 이름 (예: 토트넘, Athletic Club)" maxLength={50} required />
      <button type="submit">검색</button>
    </form>
    <div className="opts">
      <label>언어 <select value={lang} onChange={(e) => changeOption("lang", e.target.value)}><option value="ko">한국어</option><option value="en">English</option></select></label>
      <label>알림 <select value={alarm} onChange={(e) => changeOption("alarm", e.target.value)}><option value="0">없음</option><option value="15">15분 전</option><option value="30">30분 전</option><option value="60">1시간 전</option></select></label>
    </div>
    <p className="status" role="status">{team ? "" : status}</p>
    {!team ? <ul className="results">{results.map((item) => <li key={item.id}>
      <button className="team" onClick={() => setTeam(item)}>
        {item.logo && <img src={item.logo} alt="" loading="lazy" />}
        <span>{item.displayName}<br /><span className="meta">{[item.country, item.venue].filter(Boolean).join(" · ")}</span></span>
      </button>
    </li>)}</ul> : <section className="panel">
      <button className="back" onClick={() => setTeam(null)}>← 검색 결과</button>
      <div className="panel-head">{team.logo && <img src={team.logo} alt="" />}<div><h2>{team.displayName}</h2><div className="meta">{team.country}</div></div></div>
      <div className="url"><input aria-label="캘린더 구독 주소" readOnly value={url} /><button className="btn ghost" onClick={async () => {
        try { await navigator.clipboard.writeText(url); setCopied(true); } catch { setPreviewStatus("주소를 선택해서 복사해 주세요."); }
      }}>{copied ? "복사됨" : "복사"}</button></div>
      <div className="actions"><a className="btn" href={webcal}>아이폰·맥 캘린더에 구독</a><a className="btn ghost" href={`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(webcal)}`} target="_blank" rel="noopener noreferrer">구글 캘린더에 추가</a></div>
      <p role="status" className="status">{previewStatus}</p>
      <ul className="upcoming">{events.map((event, i) => <li key={i}><time>{event.date.toLocaleDateString(lang === "ko" ? "ko-KR" : "en-GB", { month: "short", day: "numeric", weekday: "short" })}{!event.allDay && ` ${event.date.toLocaleTimeString(lang === "ko" ? "ko-KR" : "en-GB", { hour: "2-digit", minute: "2-digit", hour12: false })}`}</time><span>{event.title}</span></li>)}</ul>
    </section>}
    <footer>언어나 알림을 바꾸면 구독 주소도 바뀌어요. 이미 구독한 캘린더는 지우고 다시 구독해 주세요.</footer>
  </>;
}
