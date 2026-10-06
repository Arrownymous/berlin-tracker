import { START, addDays, iso } from "./dates";
import type { Session, Week } from "./types";

export const PHASES = [
  { name: "Herstel & fundament", short: "Fundament", from: 1, to: 10 },
  { name: "Basisopbouw", short: "Basis", from: 11, to: 22 },
  { name: "Aerobe uitbouw", short: "Uitbouw", from: 23, to: 34 },
  { name: "Marathonspecifiek", short: "Specifiek", from: 35, to: 48 },
  { name: "Taper & race", short: "Taper", from: 49, to: 51 },
];

const REC = new Set([4, 8, 12, 16, 20, 24, 28, 32, 35, 39, 43, 47]);
export const phaseOf = (n: number) => PHASES.findIndex((p) => n >= p.from && n <= p.to);

// Fase 0: [geschatte km incl. wandelen, omschrijving] — 3× per week
const P0: [number, string][] = [
  [2.5, "6× (1 min lopen / 1,5 min wandelen)"],
  [3, "6× (2 min lopen / 1 min wandelen)"],
  [3.2, "5× (3 min lopen / 1 min wandelen)"],
  [2.5, "5× (2 min lopen / 1 min wandelen)"],
  [3.8, "4× (5 min lopen / 1 min wandelen)"],
  [3.8, "3× (7 min lopen / 1 min wandelen)"],
  [4, "2× (10 min lopen / 1 min wandelen) + 3 min"],
  [3.3, "3× (6 min lopen / 1 min wandelen)"],
  [4.2, "2× (12 min lopen / 1 min wandelen)"],
  [4.3, "25–30 min aaneen lopen"],
];

// Fase 1: km per loopje (di, do, za, [zo])
const P1 = [
  [4, 4, 5], [3, 4, 4], [4, 5, 6], [5, 5, 7], [5, 5, 8], [4, 4, 6],
  [5, 5, 8, 3], [5, 5, 9, 4], [5, 6, 10, 4], [4, 5, 8, 4], [5, 6, 12, 4], [5, 6, 14, 5],
];

// Fase 2: [kwaliteit dinsdag, [di, do, za, zo]]
const P2: [string, number[]][] = [
  ["6× 1 min vlot / 2 min rustig", [6, 6, 15, 4]],
  ["Rustig + strides", [5, 6, 11, 4]],
  ["5× 2 min vlot / 2 min rustig", [7, 6, 16, 4]],
  ["2× 8 min tempo / 3 min rustig", [7, 7, 16, 5]],
  ["3× 8 min tempo / 3 min rustig", [7, 7, 17, 5]],
  ["Rustig + strides", [6, 6, 12, 5]],
  ["20 min tempo aaneen", [8, 7, 18, 5]],
  ["4× 1 km tempo / 2 min rustig", [8, 8, 19, 5]],
  ["25 min tempo aaneen", [8, 8, 20, 5]],
  ["Rustig + strides", [7, 6, 14, 5]],
  ["3× 2 km halve-marathontempo", [8, 8, 16, 6]],
  ["2 km halve-marathontempo", [6, 5, 0, 21.1]],
];

// Fase 3 & 4: [kwaliteit dinsdag, {dag: km}]  (1=di, 2=wo, 3=do, 5=za, 6=zo)
type DayMap = Record<number, number>;
const P3: [string, DayMap][] = [
  ["Rustig", { 1: 5, 3: 6, 5: 14, 6: 4 }],
  ["3× 2 km marathontempo", { 1: 8, 3: 6, 5: 20, 6: 4 }],
  ["5 km marathontempo", { 1: 10, 3: 6, 5: 22, 6: 4 }],
  ["4× 1,5 km tempo", { 1: 10, 3: 7, 5: 24, 6: 4 }],
  ["Rustig + strides", { 1: 7, 3: 8, 5: 16, 6: 5 }],
  ["6 km marathontempo", { 1: 11, 3: 6, 5: 26, 6: 4 }],
  ["5× 1 km tempo", { 1: 11, 2: 5, 3: 6, 5: 24, 6: 4 }],
  ["8 km marathontempo", { 1: 12, 2: 4, 3: 5, 5: 28, 6: 4 }],
  ["Rustig + strides", { 1: 8, 2: 5, 3: 6, 5: 18, 6: 5 }],
  ["2× 4 km marathontempo", { 1: 12, 2: 4, 3: 6, 5: 30, 6: 3 }],
  ["3× 2 km tempo", { 1: 12, 2: 6, 3: 8, 5: 26, 6: 6 }],
  ["8 km marathontempo", { 1: 12, 2: 4, 3: 6, 5: 32, 6: 4 }],
  ["Rustig + strides", { 1: 8, 2: 5, 3: 6, 5: 20, 6: 5 }],
  ["10 km marathontempo", { 1: 12, 2: 6, 3: 6, 5: 30, 6: 4 }],
];
const P4: [string, DayMap][] = [
  ["4× 1 km tempo", { 1: 10, 2: 5, 3: 8, 5: 22 }],
  ["3× 2 km marathontempo", { 1: 8, 3: 6, 5: 14, 6: 5 }],
  ["3× 1 km marathontempo", { 1: 6, 3: 5, 5: 3, 6: 42.2 }],
];
const LONGX: Record<number, string> = {
  41: "laatste 8 km marathontempo",
  45: "waarvan 12 km marathontempo",
  49: "waarvan 6 km marathontempo",
};

function buildPlan(): Week[] {
  const W: Week[] = [];
  for (let n = 1; n <= 51; n++) {
    const start = addDays(START, (n - 1) * 7);
    const ph = phaseOf(n);
    const S: Omit<Session, "date">[] = [];
    const run = (d: number, km: number, title: string, desc: string) => S.push({ d, kind: "loop", km, title, desc });

    if (ph === 0) {
      const [km, desc] = P0[n - 1];
      [1, 3, 5].forEach((d) => run(d, km, "Run-walk", `${desc} · 5 min in- en uitwandelen`));
    } else if (ph === 1) {
      const r = P1[n - 11];
      const days = r.length === 3 ? [1, 3, 5] : [1, 3, 5, 6];
      r.forEach((km, i) => {
        const d = days[i];
        if (d === 5) run(d, km, "Lange duurloop", "Rustig, praattempo");
        else if (d === 6) run(d, km, "Herstelloop", "Heel rustig");
        else run(d, km, "Rustige duurloop", d === 1 && n >= 17 ? "Praattempo + 4× 15–20 s strides" : "Praattempo");
      });
    } else if (ph === 2) {
      const [q, r] = P2[n - 23];
      run(1, r[0], "Kwaliteit", `${q} (incl. in- en uitlopen)`);
      run(3, r[1], "Rustige duurloop", "Praattempo");
      if (n === 34) run(6, r[3], "Halve marathon", "Gecontroleerd: eerste 10 km rustig");
      else {
        run(5, r[2], "Lange duurloop", "Rustig");
        run(6, r[3], "Herstelloop", "Heel rustig");
      }
    } else {
      const [q, m] = ph === 3 ? P3[n - 35] : P4[n - 49];
      Object.entries(m).forEach(([ds, km]) => {
        const d = Number(ds);
        if (n === 51 && d === 6) return run(6, km, "Berlin Marathon", "Eerste 5 km iets onder MT, tot 30 km strak op MT");
        if (n === 51 && d === 5) return run(5, km, "Losjes", "Shake-out");
        if (n === 51 && d === 3) return run(3, km, "Rustig + strides", "4 strides");
        if (d === 1) run(1, km, "Kwaliteit", `${q} (incl. in- en uitlopen)`);
        else if (d === 2) run(2, km, "Korte herstelloop", "Heel rustig, vóór kracht");
        else if (d === 3) run(3, km, "Rustige duurloop", "Praattempo");
        else if (d === 5)
          run(5, km, "Lange duurloop", LONGX[n] ? `Rustig, ${LONGX[n]}` : "45–60 s/km langzamer dan MT, oefen met eten");
        else run(6, km, "Herstelloop", "Heel rustig");
      });
    }

    let kd = ph === 0 ? [0, 2, 6] : [0, 2];
    if (n === 50) kd = [0];
    if (n === 51) kd = [];
    kd.forEach((d) =>
      S.push({
        d,
        kind: "kracht",
        km: 0,
        title: "Kracht",
        desc: ph === 0 ? "Onderbenen + heupen, 25–35 min" : n >= 49 ? "Licht, geen zware gewichten" : "Onderbenen + heupen + plyo",
      })
    );
    S.sort((a, b) => a.d - b.d || (a.kind === "loop" ? -1 : 1));
    const sessions: Session[] = S.map((s) => ({ ...s, date: iso(addDays(start, s.d)) }));
    const key = sessions.find((s) => ["Kwaliteit", "Halve marathon", "Berlin Marathon"].includes(s.title));
    W.push({
      n,
      start,
      ph,
      rec: REC.has(n),
      sessions,
      km: sessions.reduce((a, s) => a + s.km, 0),
      longest: Math.max(...sessions.map((s) => s.km)),
      key: key
        ? key.desc.replace(" (incl. in- en uitlopen)", "")
        : ph === 0
          ? sessions[0].desc.split(" · ")[0]
          : "Alles rustig",
    });
  }
  return W;
}

export const PLAN = buildPlan();
