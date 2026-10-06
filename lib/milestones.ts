import { nf0, nf1 } from "./dates";
import { GOAL_PACE, MARATHON_KM, goalPaceStr } from "./goal";
import type { Entry } from "./types";

type Metric = "longest" | "total" | "count" | "goal5" | "goal10";

export interface Milestone {
  id: string;
  group: string;
  title: string;
  desc: string;
  metric: Metric;
  target: number;
}

export interface MilestoneState extends Milestone {
  /** Datum waarop behaald, of null */
  date: string | null;
  /** Training waarmee het behaald werd */
  entryId: string | null;
  /** Huidige stand van de meetwaarde */
  value: number;
}

const GP = goalPaceStr();

export const MILESTONES: Milestone[] = [
  { id: "first", group: "Start", title: "Eerste training", desc: "Het begin van 51 weken.", metric: "count", target: 1 },
  { id: "run5", group: "Afstand", title: "5 km", desc: "Eerste run van 5 km of meer.", metric: "longest", target: 5 },
  { id: "run10", group: "Afstand", title: "10 km", desc: "Dubbele cijfers in één run.", metric: "longest", target: 10 },
  { id: "run15", group: "Afstand", title: "15 km", desc: "Een echte duurloop.", metric: "longest", target: 15 },
  { id: "half", group: "Afstand", title: "Halve marathon", desc: "21,1 km in één keer.", metric: "longest", target: 21.0975 },
  { id: "run25", group: "Afstand", title: "25 km", desc: "Over de helft van Berlijn.", metric: "longest", target: 25 },
  { id: "run30", group: "Afstand", title: "30 km", desc: "Waar de man met de hamer woont.", metric: "longest", target: 30 },
  { id: "run32", group: "Afstand", title: "32 km", desc: "De langste duurloop van het schema.", metric: "longest", target: 32 },
  { id: "full", group: "Berlijn", title: "Marathon", desc: "42,195 km. Finish onder de Brandenburger Tor.", metric: "longest", target: MARATHON_KM },
  { id: "tot42", group: "Totaal", title: "42 km totaal", desc: "Eén marathon bij elkaar gelopen.", metric: "total", target: MARATHON_KM },
  { id: "tot100", group: "Totaal", title: "100 km totaal", desc: "De eerste drie cijfers.", metric: "total", target: 100 },
  { id: "tot250", group: "Totaal", title: "250 km totaal", desc: "Tweehonderdvijftig kilometer in de benen.", metric: "total", target: 250 },
  { id: "tot500", group: "Totaal", title: "500 km totaal", desc: "Een halve duizend.", metric: "total", target: 500 },
  { id: "tot1000", group: "Totaal", title: "1.000 km totaal", desc: "Vier cijfers.", metric: "total", target: 1000 },
  { id: "n25", group: "Trainingen", title: "25 trainingen", desc: "Het wordt een gewoonte.", metric: "count", target: 25 },
  { id: "n50", group: "Trainingen", title: "50 trainingen", desc: "Vijftig keer de deur uit.", metric: "count", target: 50 },
  { id: "n100", group: "Trainingen", title: "100 trainingen", desc: "Honderd keer gekozen voor Berlijn.", metric: "count", target: 100 },
  { id: "goal5", group: "Doeltempo", title: `5 km op ${GP}`, desc: `5 km of meer in één run, op of onder je doeltempo van ${GP} /km.`, metric: "goal5", target: 1 },
  { id: "goal10", group: "Doeltempo", title: `10 km op ${GP}`, desc: `10 km of meer in één run, op of onder ${GP} /km.`, metric: "goal10", target: 1 },
];

/** Speelt alle trainingen in datumvolgorde af en bepaalt per mijlpaal wanneer die behaald werd. */
export function computeMilestones(entries: Entry[]): MilestoneState[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date) || a.created - b.created);
  const v: Record<Metric, number> = { longest: 0, total: 0, count: 0, goal5: 0, goal10: 0 };
  const hit = new Map<string, { date: string; entryId: string }>();
  // Kleine marge zodat 21,1 km en 42,2 km uit een horloge ook tellen.
  const reached = (m: Milestone) => v[m.metric] >= m.target - 0.005;
  for (const e of sorted) {
    v.count++;
    if (e.type === "loop" && e.km > 0) {
      v.total += e.km;
      v.longest = Math.max(v.longest, e.km);
      const onGoal = e.min > 0 && e.min / e.km <= GOAL_PACE + 1e-9;
      if (onGoal && e.km >= 5) v.goal5++;
      if (onGoal && e.km >= 10) v.goal10++;
    }
    for (const m of MILESTONES) if (!hit.has(m.id) && reached(m)) hit.set(m.id, { date: e.date, entryId: e.id });
  }
  return MILESTONES.map((m) => ({ ...m, date: hit.get(m.id)?.date ?? null, entryId: hit.get(m.id)?.entryId ?? null, value: v[m.metric] }));
}

/** "Nog 3,4 km" of "Nog 12 trainingen" voor een mijlpaal die nog open staat. */
export function remainingLabel(m: MilestoneState): string {
  const left = Math.max(0, m.target - m.value);
  if (m.metric === "count") return `Nog ${nf0.format(Math.ceil(left))} ${Math.ceil(left) === 1 ? "training" : "trainingen"}`;
  if (m.metric === "total") return `Nog ${nf1.format(left)} km`;
  if (m.metric === "longest") return `Langste nu ${nf1.format(m.value)} km`;
  return "Nog niet gelopen";
}

/** Voortgang 0–1 richting een open mijlpaal. */
export const progressOf = (m: MilestoneState) => (m.metric === "goal5" || m.metric === "goal10" ? 0 : Math.min(1, m.value / m.target));
