import { PHASES } from "@/lib/plan";
import { nf1 } from "@/lib/dates";
import { goalPaceStr, goalTimeStr } from "@/lib/goal";
import { Fig } from "./ui";

interface Props {
  total: number;
  delta: { cls: string; text: string };
  week: number | null;
  longestRecent: number;
  donePct: number | null;
  weekKm: number;
  weekPlan: number;
  schemaPct: number;
  curPh: number;
  /** 0-gebaseerde index van de huidige week */
  ti: number;
  narrow: boolean;
}

/** Stand van zaken direct onder de hero: kerncijfers en de voortgang door de vijf fases. */
export default function Overview({ total, delta, week, longestRecent, donePct, weekKm, weekPlan, schemaPct, curPh, ti, narrow }: Props) {
  return (
    <section id="stand" className="overview wrap" aria-labelledby="stand-t">
      <div className="ov-head">
        <span className="label kicker">Stand van zaken</span>
        <h2 id="stand-t" className="ov-title">
          {week ? <>Week {week} <em>van 51</em></> : <>Bijna <em>begonnen</em></>}
        </h2>
        <p className="ov-goal">
          <span className="label">Streefdoel</span>
          <b>{goalTimeStr()}</b>
          <span className="ov-goal-pace">{goalPaceStr()} /km</span>
        </p>
      </div>

      <div className="stats-wrap">
        <div className="cells stats">
          <div className="stat primary">
            <Fig value={nf1.format(total)} unit="km" />
            <span className="label">Totaal gelopen</span>
            <span className={`stat-note ${delta.cls}`}>{delta.text}</span>
          </div>
          <div className="stat">
            <Fig value={nf1.format(weekKm)} unit={`/ ${nf1.format(weekPlan)}`} />
            <span className="label">Km deze week</span>
          </div>
          <div className="stat">
            <Fig value={longestRecent ? nf1.format(longestRecent) : "–"} unit={longestRecent ? "km" : undefined} />
            <span className="label">Langste run · 4 wk</span>
          </div>
          <div className="stat">
            <Fig value={donePct ?? "–"} unit={donePct !== null ? "%" : undefined} />
            <span className="label">Trainingen gedaan</span>
          </div>
        </div>
      </div>

      <div className="rail" aria-label="Voortgang door het schema">
        <div className="rail-head">
          <span className="label">
            {curPh >= 0 ? <>Fase {curPh + 1} van {PHASES.length} · <b>{PHASES[curPh].name}</b></> : "Schema start ma 5 okt"}
          </span>
          <span className="label"><b>{schemaPct}%</b> van het schema</span>
        </div>
        <div className="rail-bar">
          {PHASES.map((p, i) => {
            const len = p.to - p.from + 1;
            return (
              <div key={p.name} className={`rail-seg${i < curPh ? " done" : ""}`} style={{ flex: len }}>
                {i === curPh && <i className="fill" style={{ width: `${Math.min(100, ((ti + 1 - p.from + 1) / len) * 100)}%` }} />}
              </div>
            );
          })}
        </div>
        <div className="rail-labels">
          {PHASES.map((p, i) => (
            <div key={p.name} style={{ flex: p.to - p.from + 1 }} className={i === curPh ? "now" : ""} title={`${p.name} · week ${p.from}–${p.to}`}>
              {narrow ? p.short : `${p.name} · wk ${p.from}–${p.to}`}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
