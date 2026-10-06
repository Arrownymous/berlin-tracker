export const DAY = 86400000;
export const pad = (n: number) => String(n).padStart(2, "0");
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parse = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const START = new Date(2026, 9, 5); // ma 5 okt 2026
export const RACE = new Date(2027, 8, 26); // zo 26 sep 2027
export const todayD = () => {
  const t = new Date();
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
};
export const DAYS = ["ma", "di", "wo", "do", "vr", "za", "zo"];
export const DAYS_LONG = ["maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag", "zondag"];
export const MON = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
export const fmtD = (d: Date) => `${d.getDate()} ${MON[d.getMonth()]}`;
/** 0 = maandag */
export const dowOf = (d: Date) => (d.getDay() + 6) % 7;
export const weekIdxOf = (d: Date) => Math.floor((d.getTime() - START.getTime()) / DAY / 7);

export const nf1 = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 1 });
export const nf0 = new Intl.NumberFormat("nl-NL", { maximumFractionDigits: 0 });

export const fmtPace = (p: number) => {
  let m = Math.floor(p);
  let s = Math.round((p - m) * 60);
  if (s === 60) { m++; s = 0; }
  return `${m}:${pad(s)}`;
};
export const paceStr = (km: number, min: number) => (!km || !min ? "–" : fmtPace(min / km));
