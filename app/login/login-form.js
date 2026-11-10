"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

const names = { google: "구글", naver: "네이버", kakao: "카카오" };

export default function LoginForm({ ready, providers }) {
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault(); setBusy(true); setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      if (signup) {
        const response = await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
        const data = await response.json(); setMessage(data.message || data.error);
      } else {
        const result = await signIn("credentials", { identifier: form.get("identifier"), password: form.get("password"), redirect: false });
        if (result?.error) setMessage("로그인 정보를 확인해 주세요. 이메일 인증 후 로그인할 수 있습니다.");
        else window.location.assign("/");
      }
    } catch { setMessage("요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요."); }
    finally { setBusy(false); }
  }

  return <>
    {!ready && <p role="status" className="notice">회원 서비스를 준비 중입니다. 경기 검색과 캘린더 구독은 로그인 없이 이용할 수 있어요.</p>}
    <div className="social-buttons">{Object.entries(names).map(([id, name]) => <button key={id} className={`social ${id}`} disabled={!providers.includes(id) || busy} onClick={() => signIn(id, { redirectTo: "/" })}>{name}로 계속하기{!providers.includes(id) && " · 준비 중"}</button>)}</div>
    <hr />
    <div className="tabs"><button className={!signup ? "" : "btn ghost"} onClick={() => { setSignup(false); setMessage(""); }}>로그인</button><button className={signup ? "" : "btn ghost"} onClick={() => { setSignup(true); setMessage(""); }}>회원가입</button></div>
    <form onSubmit={submit} className="account-form" key={String(signup)}>
      {signup ? <>
        <label>이메일<input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
        <label>아이디 (선택)<input name="username" autoComplete="username" pattern="[a-z][a-z0-9_]{3,23}" minLength={4} maxLength={24} /><small>영문 소문자로 시작하는 4~24자의 영문·숫자·밑줄</small></label>
      </> : <label>이메일 또는 아이디<input name="identifier" autoComplete="username" maxLength={254} required /></label>}
      <label>비밀번호<input name="password" type="password" autoComplete={signup ? "new-password" : "current-password"} minLength={signup ? 12 : 1} maxLength={128} required />{signup && <small>12자 이상 입력해 주세요. 가입 후 이메일 인증이 필요합니다.</small>}</label>
      <button disabled={!ready || busy} type="submit">{busy ? "처리 중…" : signup ? "인증 메일 받고 가입하기" : "로그인"}</button>
    </form>
    <p role="status" className="status">{message}</p>
    <p className="meta">계정 관리와 서비스 운영을 위해 가입·로그인 및 서비스 이용 기록이 저장됩니다. 서로 다른 로그인 방식의 계정은 자동으로 합쳐지지 않습니다.</p>
  </>;
}
