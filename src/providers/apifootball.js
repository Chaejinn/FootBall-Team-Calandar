// API-Football (api-sports.io) 어댑터
// 문서: https://www.api-football.com/documentation-v3

const BASE = "https://v3.football.api-sports.io";

export class ApiFootball {
  constructor(apiKey, fetchImpl = fetch) {
    if (!apiKey) throw new Error("API_FOOTBALL_KEY가 설정되지 않았어요.");
    this.key = apiKey;
    this.fetch = fetchImpl;
    this.name = "apifootball";
  }

  async #get(path, params) {
    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await this.fetch(url, { headers: { "x-apisports-key": this.key } });
    if (!res.ok) throw new Error(`API-Football ${res.status}`);
    const body = await res.json();
    // API-Football은 200으로 응답하면서 errors에 사유를 담아 보내기도 함 (요금제 제한 등)
    const errs = body.errors && (Array.isArray(body.errors) ? body.errors : Object.values(body.errors));
    if (errs && errs.length) throw new Error(`API-Football: ${errs.join(" / ")}`);
    return body.response ?? [];
  }

  async searchTeams(query) {
    if (query.trim().length < 3) return [];
    const rows = await this.#get("/teams", { search: query.trim() });
    return rows.map(({ team, venue }) => ({
      id: String(team.id),
      name: team.name,
      country: team.country ?? "",
      logo: team.logo ?? "",
      national: !!team.national,
      venue: venue?.name ?? "",
    }));
  }

  async getFixtures(teamId) {
    const [next, last] = await Promise.all([
      this.#get("/fixtures", { team: teamId, next: 50 }),
      this.#get("/fixtures", { team: teamId, last: 5 }).catch(() => []),
    ]);
    const seen = new Set();
    const out = [];
    for (const f of [...last, ...next]) {
      if (seen.has(f.fixture.id)) continue;
      seen.add(f.fixture.id);
      const st = f.fixture.status?.short;
      out.push({
        id: String(f.fixture.id),
        start: new Date(f.fixture.date),
        timeConfirmed: st !== "TBD",
        status: mapStatus(st),
        competition: f.league?.name ?? "",
        round: f.league?.round ?? "",
        home: { id: String(f.teams.home.id), name: f.teams.home.name },
        away: { id: String(f.teams.away.id), name: f.teams.away.name },
        venue: f.fixture.venue?.name ?? "",
        city: f.fixture.venue?.city ?? "",
        score: { home: f.goals?.home ?? null, away: f.goals?.away ?? null },
      });
    }
    return out;
  }
}

function mapStatus(s) {
  if (["FT", "AET", "PEN"].includes(s)) return "finished";
  if (["PST"].includes(s)) return "postponed";
  if (["CANC", "ABD", "AWD", "WO"].includes(s)) return "cancelled";
  if (["1H", "HT", "2H", "ET", "BT", "P", "SUSP", "INT", "LIVE"].includes(s)) return "live";
  return "scheduled";
}
