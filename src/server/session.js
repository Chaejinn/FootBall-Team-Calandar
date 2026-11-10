import "server-only";
import { auth } from "../../auth.js";
import { database, databaseReady } from "./database.js";
import { isAdminIdentity } from "../access.js";

export async function currentAccount() {
  if (!databaseReady()) return null;
  const session = await auth();
  if (!session?.user?.id) return null;
  const { data, error } = await database().from("app_accounts").select("*").eq("id", session.user.id).maybeSingle();
  if (error) throw new Error("ACCOUNT_SERVICE_UNAVAILABLE");
  return data && !data.disabled ? data : null;
}

export async function administrator() {
  const account = await currentAccount();
  return isAdminIdentity(account, process.env.ADMIN_EMAIL) ? account : null;
}
