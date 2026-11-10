"use client";

import { useEffect, useState } from "react";

const time = (date) => date ? new Date(date).toLocaleString("ko-KR") : "—";
const actions = { "login.success": "로그인", "login.failure": "로그인 실패", logout: "로그아웃", "signup.requested": "가입 요청", "admin.users.view": "계정 목록 조회", "admin.logs.view": "활동 기록 조회", "team.search": "팀 검색", "calendar.preview": "경기 일정 조회" };

export default function AdminDashboard() {
  const [tab, setTab] = useState("users");
  const [page, setPage] = useState(1);
  const [actor, setActor] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError("");
    fetch(`/api/admin/${tab}?${new URLSearchParams({ page: String(page), ...(actor && tab === "logs" ? { actor } : {}) })}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error); setData(body); })
      .catch((err) => { if (err.name !== "AbortError") setError(err.message); });
    return () => controller.abort();
  }, [tab, page, actor, refresh]);

  return <section className="panel">
    <div className="tabs"><button className={tab === "users" ? "" : "btn ghost"} onClick={() => { setTab("users"); setPage(1); setActor(""); }}>계정</button><button className={tab === "logs" ? "" : "btn ghost"} onClick={() => { setTab("logs"); setPage(1); setActor(""); }}>활동 기록</button><button className="btn ghost" onClick={() => setRefresh(refresh + 1)}>새로고침</button></div>
    {actor && <p>선택 계정: <code>{actor}</code> <button className="btn ghost" onClick={() => { setActor(""); setPage(1); }}>필터 해제</button></p>}
    <p role="status">{error || (!data ? "불러오는 중…" : `총 ${data.total}건`)}</p>
    {data && <><div className="table-wrap"><table><thead><tr>{(tab === "users" ? ["계정", "로그인 방식", "이메일 인증", "상태", "가입일", "최근 로그인", "기록"] : ["시간", "계정 ID", "활동", "결과"]).map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>
      {tab === "users" ? data.users.map((user) => <tr key={user.id}><td>{user.username || "—"}<br />{user.email || "이메일 미제공"}<br /><small>{user.id}</small></td><td>{user.provider}</td><td>{user.emailVerified ? "확인" : "미확인"}</td><td>{user.disabled ? "정지" : "정상"}</td><td>{time(user.createdAt)}</td><td>{time(user.lastLoginAt)}</td><td><button className="btn ghost" onClick={() => { setActor(user.id); setTab("logs"); setPage(1); }}>기록 보기</button></td></tr>)
        : data.logs.map((log) => <tr key={log.id}><td>{time(log.created_at)}</td><td><code>{log.actor_id || "비로그인"}</code></td><td>{actions[log.action] || log.action}</td><td>{log.outcome === "success" ? "완료" : "실패"}</td></tr>)}
    </tbody></table></div>{(tab === "users" ? data.users : data.logs).length === 0 && <p>표시할 기록이 없습니다.</p>}
      <div className="pagination"><button disabled={page === 1} onClick={() => setPage(page - 1)}>이전</button><span>{page} 페이지</span><button disabled={page * 25 >= data.total} onClick={() => setPage(page + 1)}>다음</button></div></>}
  </section>;
}
