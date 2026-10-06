import { PHASES } from "@/lib/plan";
import { DAYS, DAYS_LONG, MON, addDays, fmtD, nf1, parse } from "@/lib/dates";
import { minutesIn } from "@/lib/labels";
import type { Session, Week } from "@/lib/types";
import type { LogPreset } from "./LogDialog";
import { Fig, Section } from "./ui";

interface Props {
  week: Week;
  isCurrent: boolean;
  actualKm: number;
  kracht: number;
  planKracht: number;
  today: string;
  narrow: boolean;
  isDone: (s: Session) => boolean;
  /** Datum van de gekoppelde training, of null */
  doneOn: (s: Session) => string | null;
  onLog: (p: LogPreset) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

/** De week als verticale tijdlijn: dag, training, omvang en status. */
export default function ThisWeek({ week: w, isCurrent, actualKm, kracht, planKracht, today, narrow, isDone, doneOn, onLog, onPrev, onNext }: Props) {
  const pct = w.km ? Math.min(100, (actualKm / w.km) * 100) : 0;
  return (
    <Section
      id="week"
      num="01"
      title={<>{isCurrent ? "Deze week" : `Week ${w.n}`}<sup>{w.sessions.length}</sup></>}
      lead={<>{fmtD(w.start)} – {fmtD(addDays(w.start, 6))} · {PHASES[w.ph].name}</>}
      aside={
        <div className="week-meta">
          <div className="wk-km">
            <span className="label">Kilometers deze week {w.rec && <span className="flag">Herstelweek</span>}</span>
            <div style={{ marginTop: 12 }}><Fig value={nf1.format(actualKm)} unit={`/ ${nf1.format(w.km)} km`} /></div>
            <div className="line-meter"><i style={{ width: `${pct}%` }} /></div>
            {planKracht > 0 && <span className="label wk-sub">Krachtsessies <b>{kracht} / {planKracht}</b></span>}
          </div>
          <div className="week-nav">
            <button className="icon-btn" type="button" aria-label="Vorige week" disabled={!onPrev} onClick={onPrev}>‹</button>
            <span>Week {w.n}</span>
            <button className="icon-btn" type="button" aria-label="Volgende week" disabled={!onNext} onClick={onNext}>›</button>
          </div>
        </div>
      }
    >
      <ol className="tl">
        {w.sessions.map((s, i) => {
          const done = isDone(s);
          const isToday = s.date === today;
          const missed = !done && s.date < today;
          const d = parse(s.date);
          const mins = s.km ? null : minutesIn(s.desc);
          return (
            <li key={i} className={`tl-row${isToday ? " today" : ""}${done ? " done" : ""}${missed ? " missed" : ""}`}>
              <div className="tl-date">
                <span className="label">{isToday && !narrow ? "Vandaag" : narrow ? DAYS[s.d] : DAYS_LONG[s.d]}</span>
                <Fig value={d.getDate()} unit={MON[d.getMonth()]} />
              </div>
              <div className="tl-main">
                {isToday && narrow && <span className="flag tl-flag">Vandaag</span>}
                <h3 className="tl-title">{s.title}</h3>
                <p className="tl-desc">{s.desc}</p>
              </div>
              <div className="tl-fig">
                {s.km ? <Fig value={nf1.format(s.km)} unit="km" /> : mins ? <Fig value={mins} unit="min" /> : null}
              </div>
              <div className="tl-act">
                {done ? (
                  <span className="st done">
                    {(() => {
                      const on = doneOn(s);
                      if (!on || on === s.date) return "Gedaan";
                      const od = parse(on);
                      return `Gedaan · ${DAYS[(od.getDay() + 6) % 7]}`;
                    })()}
                  </span>
                ) : (
                  <>
                    {missed && <span className="st missed">Gemist</span>}
                    <button
                      type="button"
                      className={`btn btn-sm${isToday ? " btn-primary" : ""}`}
                      onClick={() => onLog({ date: s.date, type: s.kind, km: s.km || undefined, title: s.title })}
                    >
                      Loggen
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
