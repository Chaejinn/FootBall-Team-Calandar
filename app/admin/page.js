import { notFound } from "next/navigation";
import AccountNav from "../components/account-nav.js";
import AdminDashboard from "./dashboard.js";
import { administrator } from "../../src/server/session.js";

export const metadata = { title: "관리자", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!await administrator()) notFound();
  return <main className="admin-main"><AccountNav /><h1>서비스 관리</h1><p className="sub">가입 계정과 서비스 활동 기록을 확인합니다.</p><AdminDashboard /></main>;
}
