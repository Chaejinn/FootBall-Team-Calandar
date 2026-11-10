export function isAdminIdentity(account, adminEmail = "") {
  if (!adminEmail.trim() || !account || account.disabled || !account.email_verified) return false;
  // 관리자 권한은 소유권이 검증된 Google 또는 이메일 계정으로만 부여한다.
  if (!["google", "credentials"].includes(account.provider)) return false;
  return account.email?.toLowerCase() === adminEmail.trim().toLowerCase();
}

export function validUsername(value) {
  return typeof value === "string" && /^[a-z][a-z0-9_]{3,23}$/.test(value);
}

export function safeAccount(account) {
  return {
    id: account.id,
    email: account.email,
    username: account.username,
    provider: account.provider,
    emailVerified: account.email_verified,
    disabled: account.disabled,
    createdAt: account.created_at,
    lastLoginAt: account.last_login_at,
  };
}
