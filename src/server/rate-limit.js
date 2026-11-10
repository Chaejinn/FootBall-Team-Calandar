import "server-only";
import { createHmac } from "node:crypto";
import { database } from "./database.js";

export async function allowAttempt(headers, identifier = "") {
  const ip = process.env.VERCEL ? headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || "unknown" : "local";
  const digest = (value) => createHmac("sha256", process.env.AUTH_SECRET).update(value).digest("hex");
  for (const [key, limit] of [[`ip:${ip}`, 30], ...(identifier ? [[`account:${identifier.toLowerCase()}`, 10]] : [])]) {
    const { data, error } = await database().rpc("consume_auth_attempt", { bucket_key: digest(key), max_attempts: limit });
    if (error || data !== true) return false;
  }
  return true;
}
