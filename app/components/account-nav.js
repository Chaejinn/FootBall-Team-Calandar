import Link from "next/link";
import { currentAccount } from "../../src/server/session.js";
import { isAdminIdentity } from "../../src/access.js";
import { signOut } from "../../auth.js";

export default async function AccountNav() {
  const account = await currentAccount();
  return <nav className="account-nav" aria-label="계정">
    <Link href="/">⚽ 축구 일정 캘린더</Link>
    <div>{account ? <>
      <span>{account.username || "회원"}</span>
      {isAdminIdentity(account, process.env.ADMIN_EMAIL) && <Link href="/admin">관리자</Link>}
      <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}><button className="btn ghost" type="submit">로그아웃</button></form>
    </> : <Link href="/login">로그인 / 회원가입</Link>}</div>
  </nav>;
}
