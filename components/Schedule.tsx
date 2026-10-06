import { PHASES, PLAN } from "@/lib/plan";
import { addDays, fmtD, nf0, nf1 } from "@/lib/dates";
import { Section } from "./ui";

interface Props {
  num: string;
  weekKm: (i: number) => number;
  curIdx: number;
  beforeStart: boolean;
}

/** Alle 51 weken, ingeklapt per fase. De huidige fase staat open. */
export default function Schedule({ num, weekKm, curIdx, beforeStart }: Props) {
  return (
    <Section id="schema" num={num} title={<>Volledig schema<sup>{PLAN.length}</sup></>} lead="Alle weken per fase. Herstelweken zijn gemarkeerd.">
      {PHASES.map((p, pi) => {
        const ws = PLAN.filter((x) => x.ph === pi);
        const planKm = ws.reduce((a, x) => a + x.km, 0);
        const actKm = ws.reduce((a, x) => a + weekKm(x.n - 1), 0);
        return (
          <details key={p.name} className="ph" open={PLAN[curIdx].ph === pi}>
            <summary>
              <span className="label">Fase {pi + 1}</span>
              <span className="ph-name">
                {p.name}
                <span className="ph-meta">Week {p.from}–{p.to} · {fmtD(ws[0].start)} – {fmtD(addDays(ws[ws.length - 1].start, 6))}</span>
              </span>
              <span className="ph-km">{nf0.format(actKm)} <span>/ {nf0.format(planKm)} km</span></span>
              <span className="ph-tog" aria-hidden />
            </summary>
            <div className="table-scroll">
              <table className="tbl sch">
                <thead>
                  <tr>
                    <th>Week</th><th className="hide-sm">Start</th><th>Belangrijkste training</th>
                    <th className="num hide-sm">Langste</th><th className="num">Plan</th><th className="num">Gelopen</th>
                  </tr>
                </thead>
                <tbody>
                  {ws.map((x) => {
                    const a = weekKm(x.n - 1);
                    const pct = x.km ? Math.min(100, (a / x.km) * 100) : 0;
                    return (
                      <tr key={x.n} className={x.n - 1 === curIdx && !beforeStart ? "cur" : ""}>
                        <td>{x.n}</td>
                        <td className="hide-sm">{fmtD(x.start)}</td>
                        <td className="key">{x.key}{x.rec && <span className="flag">Herstel</span>}</td>
                        <td className="num hide-sm">{nf1.format(x.longest)} km</td>
                        <td className="num">{nf1.format(x.km)} km</td>
                        <td className="num">{nf1.format(a)} km<span className="mini"><i style={{ width: `${pct}%` }} /></span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        );
      })}
    </Section>
  );
}
