import { calendarHandler } from "../src/handlers.js";

export function GET(request) {
  return calendarHandler(new URL(request.url), process.env);
}
