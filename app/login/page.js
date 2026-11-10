import Link from "next/link";
import LoginForm from "./login-form.js";
import { databaseReady } from "../../src/server/database.js";

export const metadata = { title: "로그인 · 축구 일정 캘린더" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }) {
  const params = await searchParams;
  const ready = databaseReady();
  const providers = ["google", "naver", "kakao"].filter((name) => ready && process.env[`AUTH_${name.toUpperCase()}_ID`] && process.env[`AUTH_${name.toUpperCase()}_SECRET`]);
  return <main><Link href="/" className="back">← 캘린더로 돌아가기</Link><section className="panel auth-panel">
    <h1>로그인</h1><p className="sub">이메일이나 직접 만든 아이디로 로그인하세요.</p>
    {params.error && <p role="alert">로그인을 완료하지 못했습니다. 계정 정보와 로그인 방식을 확인해 주세요.</p>}
    {params.verified && <p role="status">이메일 인증을 마쳤다면 아래에서 로그인해 주세요.</p>}
    <LoginForm ready={ready} providers={providers} />
  </section></main>;
}
