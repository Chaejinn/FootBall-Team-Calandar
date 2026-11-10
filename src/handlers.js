import { ApiFootball } from "./providers/apifootball.js";
import { FootballData } from "./providers/footballdata.js";
import { fixturesToIcs } from "./calendar.js";
import { koreanQueryToEnglish, teamName } from "./i18n.js";

const FIXTURES_TTL = 6 * 3600;
const SEARCH_TTL = 7 * 24 * 3600;

// 서버리스 인스턴스가 살아 있는 동안만 유지되는 간단한 메모리 캐시
const store = new Map();
export async function cached(key, ttl, fn) {
  const hit = store.get(key);
  if (hit && hit.exp > Date.now()) return hit.value;
  const value = await fn();
  store.set(key, { value, exp: Date.now() + ttl * 1000 });
  if (store.size > 500) store.delete(store.keys().next().value);
  return value;
}

function getProvider(env) {
  const which = (env.PROVIDER || "apifootball").toLowerCase();
  if (which === "footballdata") return new FootballData(env.FOOTBALL_DATA_KEY, cached);
  return new ApiFootball(env.API_FOOTBALL_KEY);
}

export async function searchHandler(url, env) {
  try {
    const q = (url.searchParams.get("q") || "").trim().slice(0, 50);
    const lang = url.searchParams.get("lang") === "en" ? "en" : "ko";
    if (!q) return json({ results: [] });
    const provider = getProvider(env);

    // 한국어로 검색하면 영어 이름으로 바꿔서 검색
    const queries = koreanQueryToEnglish(q) ?? [q];
    const lists = await Promise.all(
      queries.slice(0, 3).map((qq) =>
        cached(`${provider.name}:search:${qq.toLowerCase()}`, SEARCH_TTL, () => provider.searchTeams(qq)),
      ),
    );
    const seen = new Set();
    const results = lists.flat()
      .filter((t) => !seen.has(t.id) && seen.add(t.id))
      .map((t) => ({ ...t, displayName: teamName(t.name, lang) }));
    // CDN에서 하루 캐시
    return json({ results }, 200, { "cache-control": "public, s-maxage=86400, stale-while-revalidate=604800" });
  } catch (err) {
    return json({ error: String(err.message ?? err) }, 502);
  }
}

export async function calendarHandler(url, env) {
  try {
    const teamId = url.searchParams.get("id") || "";
    if (!/^[A-Za-z0-9_-]{1,20}$/.test(teamId)) return json({ error: "잘못된 팀 ID" }, 400);
    const lang = url.searchParams.get("lang") === "en" ? "en" : "ko";
    const alarm = Math.min(Math.max(parseInt(url.searchParams.get("alarm") || "0", 10) || 0, 0), 1440);
    const emoji = url.searchParams.get("emoji") !== "0";
    const provider = getProvider(env);

    const raw = await cached(`${provider.name}:fixtures:${teamId}`, FIXTURES_TTL, () => provider.getFixtures(teamId));
    const fixtures = raw.map((f) => ({ ...f, start: new Date(f.start) }));
    const { ics, teamName: name } = fixturesToIcs({
      provider: provider.name, teamId, teamNameHint: url.searchParams.get("name") || undefined,
      fixtures, lang, alarm, emoji,
    });

    return new Response(ics, {
      headers: {
        "content-type": "text/calendar; charset=utf-8",
        "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(name)}.ics`,
        // CDN에서 6시간 캐시 → 같은 팀은 6시간에 API 1~2번만 호출
        "cache-control": `public, s-maxage=${FIXTURES_TTL}, stale-while-revalidate=86400`,
        "access-control-allow-origin": "*",
      },
    });
  } catch (err) {
    return json({ error: String(err.message ?? err) }, 502);
  }
}

function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", ...extra },
  });
}
