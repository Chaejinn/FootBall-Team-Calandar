import { test } from "node:test";
import assert from "node:assert/strict";
import { isAdminIdentity, validUsername, safeAccount } from "../src/access.js";

const adminEmail = "owner@example.test";
const account = { id: "123", email: adminEmail, provider: "google", email_verified: true, disabled: false };

test("관리자 권한은 확인된 소유자 계정으로 제한", () => {
  assert.equal(isAdminIdentity(account, adminEmail), true);
  assert.equal(isAdminIdentity({ ...account, provider: "credentials" }, adminEmail), true);
  for (const change of [{ email_verified: false }, { disabled: true }, { provider: "naver" }, { provider: "kakao" }, { email: "visitor@example.test" }]) {
    assert.equal(isAdminIdentity({ ...account, ...change }, adminEmail), false);
  }
  assert.equal(isAdminIdentity(null, adminEmail), false);
  assert.equal(isAdminIdentity(account, ""), false);
});

test("아이디 형식 및 관리자 응답의 필드 제한", () => {
  assert.equal(validUsername("my_team123"), true);
  for (const value of ["abc", "Ateam", "x@y.com", "team space", "<script>", "a".repeat(25), null]) assert.equal(validUsername(value), false);
  const exposed = safeAccount({ ...account, subject: "provider-private-id", password: "private", access_token: "secret", refresh_token: "secret" });
  for (const key of ["subject", "password", "access_token", "refresh_token"]) assert.equal(key in exposed, false);
});
