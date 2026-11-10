import { databaseReady, passwordAuth } from "../../../src/server/database.js";
import { allowAttempt } from "../../../src/server/rate-limit.js";
import { audit } from "../../../src/server/audit.js";
import { validUsername } from "../../../src/access.js";

export async function POST(request) {
  const reply = (data, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
  if (request.headers.get("origin") !== new URL(request.url).origin) return reply({ error: "허용되지 않은 요청입니다." }, 403);
  if (!databaseReady()) return reply({ error: "회원가입 서비스를 준비 중입니다." }, 503);
  if (Number(request.headers.get("content-length") || 0) > 4096) return reply({ error: "요청이 너무 큽니다." }, 413);
  try {
    const { email, username = "", password } = await request.json();
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const cleanUsername = typeof username === "string" ? username.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || cleanEmail.length > 254 ||
      (cleanUsername && !validUsername(cleanUsername)) || typeof password !== "string" || password.length < 12 || password.length > 128) {
      return reply({ error: "이메일, 아이디 형식과 비밀번호 길이를 확인해 주세요." }, 400);
    }
    if (!await allowAttempt(request.headers, cleanEmail)) return reply({ error: "잠시 후 다시 시도해 주세요." }, 429);
    await passwordAuth().auth.signUp({
      email: cleanEmail, password,
      options: { data: { username: cleanUsername || null }, emailRedirectTo: `${new URL(request.url).origin}/login?verified=1` },
    });
    await audit("signup.requested");
    // 기존 이메일이나 아이디 등록 여부를 공개하지 않는다.
    return reply({ message: "가입 가능한 정보라면 인증 메일을 보냈습니다. 받은 메일에서 인증한 뒤 로그인해 주세요." });
  } catch {
    return reply({ error: "회원가입 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 400);
  }
}
