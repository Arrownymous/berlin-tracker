import { DAY, START, addDays, iso, parse } from "./dates";
import type { Entry, Session, Week } from "./types";

export interface WeekActual {
  km: number;
  kracht: number;
  /** min per km over lopen met tijd */
  pace: number | null;
  /** meter per hartslag-minuut op rustige lopen */
  ef: number | null;
}

/** Werkelijke cijfers van week i (0 = eerste schemaweek). */
export function weekActualOf(entries: Entry[], i: number): WeekActual {
  const s = iso(addDays(START, i * 7));
  const e = iso(addDays(START, i * 7 + 6));
  const es = entries.filter((x) => x.date >= s && x.date <= e);
  const timed = es.filter((x) => x.type === "loop" && x.km > 0 && x.min > 0);
  const timedKm = timed.reduce((a, x) => a + x.km, 0);
  const timedMin = timed.reduce((a, x) => a + x.min, 0);
  // Efficiëntie op basis van rustige lopen (RPE ≤ 5) met hartslagdata,
  // zodat zware/tempo-trainingen de vergelijking niet vertekenen.
  const easy = timed.filter((x) => x.avgHr && x.rpe <= 5);
  const easyKm = easy.reduce((a, x) => a + x.km, 0);
  const hrMinutes = easy.reduce((a, x) => a + x.avgHr! * x.min, 0);
  return {
    km: es.filter((x) => x.type === "loop").reduce((a, x) => a + (x.km || 0), 0),
    kracht: es.filter((x) => x.type === "kracht").length,
    pace: timedKm > 0 ? timedMin / timedKm : null,
    ef: hrMinutes > 0 ? (easyKm * 1000) / hrMinutes : null,
  };
}

/** Memo-vriendelijke variant: berekent elke week hooguit één keer. */
export function weekActualCache(entries: Entry[]) {
  const cache = new Map<number, WeekActual>();
  return (i: number) => {
    let r = cache.get(i);
    if (!r) cache.set(i, (r = weekActualOf(entries, i)));
    return r;
  };
}

/**
 * Duur uit een vrij invulveld: "45" = minuten, "45:30" = mm:ss, "1:05:30" = u:mm:ss.
 * Geeft minuten terug (met decimalen), of null als het niet te lezen is.
 */
export function parseDuration(raw: string): number | null {
  const v = raw.trim().replace(",", ".");
  if (!v) return null;
  if (/^\d+(\.\d+)?$/.test(v)) return Number(v);
  const parts = v.split(/[:.]/);
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return null;
  const n = parts.map(Number);
  if (n.slice(1).some((x) => x >= 60)) return null;
  return n.length === 2 ? n[0] + n[1] / 60 : n[0] * 60 + n[1] + n[2] / 60;
}

/** Minuten terug naar "45:30" of "1:05:30" voor het invulveld en de tabel. */
export function fmtDuration(min: number): string {
  if (!min) return "";
  const total = Math.round(min * 60);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const p = (x: number) => String(x).padStart(2, "0");
  return h ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
}

/* ---------- Schema afvinken ---------- */

export const sessionKey = (s: Session) => `${s.date}|${s.kind}`;

/**
 * Koppelt gelogde trainingen aan geplande sessies binnen dezelfde schemaweek (ma–zo).
 * Per week en soort wordt de koppeling gekozen met zo veel mogelijk gekoppelde sessies
 * en daarna zo min mogelijk dagen verschil. Een training op de geplande dag wint dus altijd,
 * en een training die je een dag later inhaalt telt alsnog voor die sessie.
 */
export function matchSessions(entries: Entry[], plan: Week[]): Map<string, Entry> {
  const out = new Map<string, Entry>();
  const dayNo = (d: string) => Math.round(parse(d).getTime() / DAY);
  for (const w of plan) {
    const s0 = iso(w.start);
    const s6 = iso(addDays(w.start, 6));
    const inWeek = entries.filter((e) => e.date >= s0 && e.date <= s6);
    for (const kind of ["loop", "kracht"] as const) {
      const ses = w.sessions.filter((s) => s.kind === kind).sort((a, b) => a.date.localeCompare(b.date));
      const ent = inWeek
        .filter((e) => e.type === kind)
        .sort((a, b) => a.date.localeCompare(b.date) || a.created - b.created);
      if (!ses.length || !ent.length) continue;
      for (const [si, ei] of bestMatch(ses.map((s) => dayNo(s.date)), ent.map((e) => dayNo(e.date)))) {
        out.set(sessionKey(ses[si]), ent[ei]);
      }
    }
  }
  return out;
}

/**
 * Volgordebewarende koppeling tussen twee gesorteerde lijsten dagnummers (in 1D is dat optimaal):
 * eerst maximaal aantal paren, dan minimale totale afstand. Lijsten zijn hooguit 7 lang.
 */
function bestMatch(a: number[], b: number[]): [number, number][] {
  // Afstand in dagen; bij gelijke afstand liever inhalen (training na de sessie) dan vooruit afvinken.
  const cost = (session: number, entry: number) => Math.abs(session - entry) * 10 + (entry < session ? 1 : 0);
  const n = a.length, m = b.length;
  // dp[i][j] = [aantal paren, totale afstand] voor a[i..] en b[j..]
  const dp: [number, number][][] = Array.from({ length: n + 1 }, () => Array.from({ length: m + 1 }, () => [0, 0] as [number, number]));
  const better = (x: [number, number], y: [number, number]) => x[0] > y[0] || (x[0] === y[0] && x[1] < y[1]);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      let best = dp[i + 1][j];
      if (better(dp[i][j + 1], best)) best = dp[i][j + 1];
      const take: [number, number] = [dp[i + 1][j + 1][0] + 1, dp[i + 1][j + 1][1] + cost(a[i], b[j])];
      if (better(take, best)) best = take;
      dp[i][j] = best;
    }
  }
  const pairs: [number, number][] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    const take: [number, number] = [dp[i + 1][j + 1][0] + 1, dp[i + 1][j + 1][1] + cost(a[i], b[j])];
    if (take[0] === dp[i][j][0] && take[1] === dp[i][j][1]) {
      pairs.push([i, j]);
      i++, j++;
    } else if (dp[i + 1][j][0] === dp[i][j][0] && dp[i + 1][j][1] === dp[i][j][1]) i++;
    else j++;
  }
  return pairs;
}
