import { administrator } from "../../../../src/server/session.js";
import { database } from "../../../../src/server/database.js";
import { safeAccount } from "../../../../src/access.js";
import { audit } from "../../../../src/server/audit.js";

export async function GET(request) {
  const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };
  try {
    const admin = await administrator();
    if (!admin) return Response.json({ error: "접근할 수 없습니다." }, { status: 403, headers });
    const page = Math.max(1, Math.min(100000, Number.parseInt(new URL(request.url).searchParams.get("page"), 10) || 1));
    const { data, count, error } = await database().from("app_accounts")
      .select("id,email,username,provider,email_verified,disabled,created_at,last_login_at", { count: "exact" })
      .order("created_at", { ascending: false }).order("id").range((page - 1) * 25, page * 25 - 1);
    if (error) throw error;
    await audit("admin.users.view", admin.id);
    return Response.json({ users: data.map(safeAccount), page, total: count }, { headers });
  } catch { return Response.json({ error: "계정 목록을 불러오지 못했습니다." }, { status: 503, headers }); }
}
