import { calendarHandler } from "../../../src/handlers.js";
import { currentAccount } from "../../../src/server/session.js";
import { audit } from "../../../src/server/audit.js";

export async function GET(request) {
  const response = await calendarHandler(new URL(request.url), process.env);
  const account = await currentAccount();
  if (account) {
    await audit("calendar.preview", account.id, response.ok ? "success" : "failure");
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}
