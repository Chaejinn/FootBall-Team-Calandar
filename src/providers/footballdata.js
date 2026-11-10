// football-data.org v4 어댑터
// 무료 요금제는 주요 대회(프리미어리그, 라리가, 분데스리가 등)만 제공하고,
// 팀 검색 API가 없어서 리그별 팀 목록을 모아 검색 색인을 만듭니다.

const BASE = "https://api.football-data.org/v4";
// 무료 요금제에서 쓸 수 있는 리그 (분당 10회 제한이라 9개만)
const LEAGUES = ["PL", "PD", "BL1", "SA", "FL1", "DED", "PPL", "ELC", "BSA"];

export class FootballData {
  /**
   * @param {string} apiKey
   * @param {(key:string, ttl:number, fn:()=>Promise<any>)=>Promise<any>} cached 캐시 헬퍼
   */
  constructor(apiKey, cached, fetchImpl = fetch) {
    if (!apiKey) throw new Error("FOOTBALL_DATA_KEY가 설정되지 않았어요.");
    this.key = apiKey;
    this.cached = cached;
    this.fetch = fetchImpl;
    this.name = "footballdata";
  }

  async #get(path, params = {}) {
    const url = new URL(BASE + path);
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
    const res = await this.fetch(url, { headers: { "X-Auth-Token": this.key } });
    if (!res.ok) {
      let msg = "";
      try { msg = (await res.json()).message ?? ""; } catch {}
      throw new Error(`football-data.org ${res.status} ${msg}`.trim());
    }
    return res.json();
  }

  async #teamIndex() {
    return this.cached("fd:teams-index", 7 * 24 * 3600, async () => {
      const all = new Map();
      for (const code of LEAGUES) {
        try {
          const { teams = [], competition } = await this.#get(`/competitions/${code}/teams`);
          for (const t of teams) {
            all.set(String(t.id), {
              id: String(t.id),
              name: t.name,
              shortName: t.shortName ?? "",
              tla: t.tla ?? "",
              country: t.area?.name ?? competition?.area?.name ?? "",
              logo: t.crest ?? "",
              national: false,
              venue: t.venue ?? "",
            });
          }
        } catch {
          // 한 리그가 실패해도 나머지는 계속
        }
      }
      return [...all.values()];
    });
  }

  async searchTeams(query) {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const idx = await this.#teamIndex();
    return idx
      .filter((t) => [t.name, t.shortName, t.tla].some((s) => s.toLowerCase().includes(q)))
      .slice(0, 30)
      .map(({ shortName, tla, ...t }) => t);
  }

  async getFixtures(teamId) {
    const day = 24 * 3600 * 1000;
    const iso = (d) => d.toISOString().slice(0, 10);
    const now = Date.now();
    const { matches = [] } = await this.#get(`/teams/${encodeURIComponent(teamId)}/matches`, {
      dateFrom: iso(new Date(now - 21 * day)),
      dateTo: iso(new Date(now + 330 * day)),
    });
    return matches.map((m) => ({
      id: String(m.id),
      start: new Date(m.utcDate),
      // SCHEDULED = 날짜만 잡힘, TIMED = 킥오프 시간 확정
      timeConfirmed: m.status !== "SCHEDULED",
      status: mapStatus(m.status),
      competition: m.competition?.name ?? "",
      round: m.matchday ? `Matchday ${m.matchday}` : (m.stage ?? "").replace(/_/g, " ").toLowerCase(),
      home: { id: String(m.homeTeam?.id ?? ""), name: m.homeTeam?.shortName || m.homeTeam?.name || "TBD" },
      away: { id: String(m.awayTeam?.id ?? ""), name: m.awayTeam?.shortName || m.awayTeam?.name || "TBD" },
      venue: m.venue ?? "",
      city: "",
      score: { home: m.score?.fullTime?.home ?? null, away: m.score?.fullTime?.away ?? null },
    }));
  }
}

function mapStatus(s) {
  if (s === "FINISHED" || s === "AWARDED") return "finished";
  if (s === "POSTPONED") return "postponed";
  if (s === "CANCELLED" || s === "SUSPENDED") return "cancelled";
  if (s === "IN_PLAY" || s === "PAUSED" || s === "LIVE") return "live";
  return "scheduled";
}
