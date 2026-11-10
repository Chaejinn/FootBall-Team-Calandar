import { administrator } from "../../../../src/server/session.js";
import { database } from "../../../../src/server/database.js";
import { audit } from "../../../../src/server/audit.js";

export async function GET(request) {
  const headers = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };
  try {
    const admin = await administrator();
    if (!admin) return Response.json({ error: "접근할 수 없습니다." }, { status: 403, headers });
    const params = new URL(request.url).searchParams;
    const page = Math.max(1, Math.min(100000, Number.parseInt(params.get("page"), 10) || 1));
    let query = database().from("activity_logs").select("id,actor_id,action,outcome,created_at", { count: "exact" });
    if (params.get("actor")) {
      if (!/^[0-9a-f-]{36}$/i.test(params.get("actor"))) return Response.json({ error: "잘못된 계정 ID입니다." }, { status: 400, headers });
      query = query.eq("actor_id", params.get("actor"));
    }
    const { data, count, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).range((page - 1) * 25, page * 25 - 1);
    if (error) throw error;
    await audit("admin.logs.view", admin.id);
    return Response.json({ logs: data, page, total: count }, { headers });
  } catch { return Response.json({ error: "활동 기록을 불러오지 못했습니다." }, { status: 503, headers }); }
}
