import { DAYS, DAYS_LONG, MON, addDays, dowOf, iso, parse } from "./dates";

export const TYPE_LABEL: Record<string, string> = { loop: "Loop", kracht: "Kracht", cross: "Fiets / zwem" };

/** "25–35" uit "Onderbenen + heupen, 25–35 min" — voor sessies zonder kilometers. */
export const minutesIn = (desc: string) => desc.match(/(\d+(?:[–-]\d+)?)\s*min\b/)?.[1] ?? null;

/** "Vandaag · ma 5 okt", "Morgen · di 6 okt" of "woensdag 7 okt". */
export function whenLabel(date: string, today: string) {
  const d = parse(date);
  const short = `${DAYS[dowOf(d)]} ${d.getDate()} ${MON[d.getMonth()]}`;
  if (date === today) return `Vandaag · ${short}`;
  if (date === iso(addDays(parse(today), 1))) return `Morgen · ${short}`;
  return `${DAYS_LONG[dowOf(d)]} ${d.getDate()} ${MON[d.getMonth()]}`;
}
