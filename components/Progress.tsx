import { nf0, nf1 } from "@/lib/dates";
import { goalPaceStr, goalTimeStr } from "@/lib/goal";
import { CumulativeChart, PaceChart, WeeklyChart } from "./Charts";
import { Fig, Section } from "./ui";

export type Range = "12" | "26" | "all";

interface Props {
  range: Range;
  onRange: (r: Range) => void;
  total: number;
  planToDate: number;
  planTotal: number;
  /** % meer/minder km dan vorige week, of null zonder vergelijking */
  loadChange: number | null;
  pace4: string | null;
  hasEf: boolean;
  data: {
    labels: string[];
    cumPlan: number[];
    cumAct: (number | null)[];
    wPlan: number[];
    wAct: (number | null)[];
    wPace: (number | null)[];
    wEf: (number | null)[];
  };
}

const RANGES: Range[] = ["12", "26", "all"];

/** Voortgang richting de marathon: kerncijfers en drie grafieken met één periodekeuze. */
export default function Progress({ range, onRange, total, planToDate, planTotal, loadChange, pace4, hasEf, data: d }: Props) {
  return (
    <Section
      id="voortgang"
      num="03"
      title="Voortgang"
      lead="Je plan tegenover wat je echt liep, week na week richting de start."
      aside={
        <div className="toggle" role="group" aria-label="Periode grafieken">
          {RANGES.map((r) => (
            <button key={r} type="button" aria-pressed={range === r} onClick={() => onRange(r)}>{r === "all" ? "Alles" : `${r} wk`}</button>
          ))}
        </div>
      }
    >
      <div className="figs-wrap figs-top">
        <dl className="cells figs">
          <div><dt className="label">Gelopen</dt><dd><Fig value={nf1.format(total)} unit="km" /></dd></div>
          <div><dt className="label">Gepland t/m vandaag</dt><dd><Fig value={nf1.format(planToDate)} unit="km" /></dd></div>
          <div>
            <dt className="label">Km t.o.v. vorige week</dt>
            <dd>
              <Fig
                value={loadChange === null ? "–" : `${loadChange > 0 ? "+" : ""}${nf0.format(loadChange)}`}
                unit={loadChange === null ? undefined : "%"}
              />
            </dd>
          </div>
          <div><dt className="label">Gem. tempo · 4 weken</dt><dd><Fig value={pace4 ?? "–"} unit={pace4 ? "/km" : undefined} /></dd></div>
        </dl>
      </div>

      <div className="chart-block">
        <div className="chart-head">
          <h3 className="label">Cumulatief</h3>
          <div className="legend">
            <span style={{ ["--c" as string]: "var(--accent)" }}>Gelopen</span>
            <span className="dash" style={{ ["--c" as string]: "var(--ink-3)" }}>Plan</span>
          </div>
        </div>
        <p className="chart-note">Totaal aantal kilometers sinds de start. Het schema telt {nf0.format(planTotal)} km tot aan de finish.</p>
        <div className="chart-box lg">
          <CumulativeChart labels={d.labels} plan={d.cumPlan} actual={d.cumAct} />
        </div>
      </div>

      <div className="chart-pair">
        <div className="chart-block">
          <div className="chart-head">
            <h3 className="label">Weekvolume</h3>
            <div className="legend">
              <span style={{ ["--c" as string]: "var(--plan)" }}>Plan</span>
              <span style={{ ["--c" as string]: "var(--accent)" }}>Gelopen</span>
            </div>
          </div>
          <p className="chart-note">Kilometers per week: gepland tegenover gelopen.</p>
          <div className="chart-box">
            <WeeklyChart labels={d.labels} plan={d.wPlan} actual={d.wAct} />
          </div>
        </div>
        <div className="chart-block">
          <div className="chart-head">
            <h3 className="label">Tempo</h3>
            <div className="legend">
              <span style={{ ["--c" as string]: "var(--ink)" }}>Tempo</span>
              <span className="dash" style={{ ["--c" as string]: "var(--loss)" }}>Doel {goalPaceStr()}</span>
              {hasEf && <span style={{ ["--c" as string]: "var(--accent)" }}>Efficiëntie</span>}
            </div>
          </div>
          <p className="chart-note">
            Gemiddeld tempo per week, met je doeltempo voor {goalTimeStr()} als stippellijn. Log je hartslag bij rustige lopen (zwaarte ≤ 5), dan zie je ook je efficiëntie — stijgt die, dan word
            je sneller bij dezelfde inspanning.
          </p>
          <div className="chart-box">
            <PaceChart labels={d.labels} pace={d.wPace} ef={d.wEf} />
          </div>
        </div>
      </div>
    </Section>
  );
}
