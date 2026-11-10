import "server-only";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Naver from "next-auth/providers/naver";
import Kakao from "next-auth/providers/kakao";
import Credentials from "next-auth/providers/credentials";
import { database, passwordAuth, databaseReady } from "./src/server/database.js";
import { audit } from "./src/server/audit.js";
import { allowAttempt } from "./src/server/rate-limit.js";

const social = [
  ["GOOGLE", Google], ["NAVER", Naver], ["KAKAO", Kakao],
].filter(([name]) => process.env[`AUTH_${name}_ID`] && process.env[`AUTH_${name}_SECRET`])
  .map(([name, provider]) => provider({ clientId: process.env[`AUTH_${name}_ID`], clientSecret: process.env[`AUTH_${name}_SECRET`] }));

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [...social, Credentials({
    credentials: { identifier: {}, password: {} },
    async authorize(credentials, request) {
      if (!databaseReady()) return null;
      const identifier = String(credentials.identifier || "").trim().toLowerCase();
      const password = String(credentials.password || "");
      if (!identifier || identifier.length > 254 || password.length > 128 || !await allowAttempt(request.headers, identifier)) return null;
      let email = identifier;
      if (!identifier.includes("@")) {
        const { data } = await database().from("app_accounts").select("email").eq("provider", "credentials").eq("username", identifier).maybeSingle();
        email = data?.email || "invalid@invalid.example";
      }
      const { data, error } = await passwordAuth().auth.signInWithPassword({ email, password });
      if (error || !data.user?.email_confirmed_at) {
        await audit("login.failure", null, "failure");
        return null;
      }
      const { data: account, error: lookupError } = await database().from("app_accounts")
        .select("id,email,username,disabled").eq("provider", "credentials").eq("subject", data.user.id).single();
      if (lookupError || account.disabled) return null;
      return { id: account.id, email: account.email, name: account.username || "회원" };
    },
  })],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!databaseReady()) return false;
      if (account.provider === "credentials") return true;
      const email = profile?.email || profile?.response?.email || profile?.kakao_account?.email || null;
      const emailVerified = account.provider === "google" && profile?.email_verified === true;
      // 제공자 ID로 식별하며 이메일이 같아도 다른 제공자 계정을 자동 연결하지 않는다.
      const db = database();
      const { data: existing, error: lookupError } = await db.from("app_accounts").select("id,disabled")
        .eq("provider", account.provider).eq("subject", account.providerAccountId).maybeSingle();
      if (lookupError || existing?.disabled) return false;
      const { data, error } = await db.from("app_accounts").upsert({
        provider: account.provider, subject: account.providerAccountId, email,
        email_verified: emailVerified, last_login_at: new Date().toISOString(),
      }, { onConflict: "provider,subject" }).select("id").single();
      if (error) return false;
      user.id = data.id;
      return true;
    },
    async jwt({ token, user }) {
      if (user) token.accountId = user.id;
      return token;
    },
    async session({ session, token }) {
      // 권한은 JWT나 클라이언트에서 받은 role을 신뢰하지 않고 매번 DB에서 검사한다.
      session.user.id = token.accountId;
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      await database().from("app_accounts").update({ last_login_at: new Date().toISOString() }).eq("id", user.id);
      await audit("login.success", user.id);
    },
    async signOut(message) { await audit("logout", message.token?.accountId || null); },
  },
  logger: {
    error() { console.error("Authentication request failed"); },
    warn(code) { console.warn("Authentication warning", code); },
    debug() {},
  },
});
