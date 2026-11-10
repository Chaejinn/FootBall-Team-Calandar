import { searchHandler } from "../src/handlers.js";

export function GET(request) {
  return searchHandler(new URL(request.url), process.env);
}
