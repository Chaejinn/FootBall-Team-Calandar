import "server-only";
import { database, databaseReady } from "./database.js";

const actions = new Set(["login.success", "login.failure", "logout", "signup.requested", "admin.users.view", "admin.logs.view", "team.search", "calendar.preview"]);

export async function audit(action, actorId = null, outcome = "success") {
  if (!actions.has(action)) throw new Error("INVALID_AUDIT_ACTION");
  if (!databaseReady()) return;
  const { error } = await database().from("activity_logs").insert({
    action, actor_id: actorId, outcome: outcome === "success" ? "success" : "failure",
  });
  // 사용자 입력, 이메일, 비밀번호, 쿠키, OAuth 토큰은 기록하지 않는다.
  if (error) console.error("Activity log write failed", error.code);
}
