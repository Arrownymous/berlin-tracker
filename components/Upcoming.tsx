import { nf1 } from "@/lib/dates";
import { minutesIn, whenLabel } from "@/lib/labels";
import type { Session } from "@/lib/types";
import type { LogPreset } from "./LogDialog";
import { Fig, Section } from "./ui";

/** De eerstvolgende trainingen die nog open staan, groot uitgelicht. */
export default function Upcoming({ sessions, today, onLog }: { sessions: Session[]; today: string; onLog: (p: LogPreset) => void }) {
  return (
    <Section id="komend" num="02" title="Komende trainingen" lead="Wat er op het programma staat, vanaf vandaag.">
      {sessions.length === 0 ? (
        <p className="empty">Geen trainingen meer gepland. Tijd om te genieten van Berlijn.</p>
      ) : (
        <div className="cells feature" style={{ ["--n" as string]: sessions.length }}>
          {sessions.map((s, i) => {
            const mins = s.km ? null : minutesIn(s.desc);
            return (
              <article key={s.date + s.kind}>
                <span className={`label when${i === 0 ? " next" : ""}`}>{whenLabel(s.date, today)}</span>
                <h3 className="f-title">{s.title}</h3>
                {s.km ? <Fig value={nf1.format(s.km)} unit="km" /> : mins ? <Fig value={mins} unit="min" /> : null}
                <p className="f-desc">{s.desc}</p>
                <button
                  type="button"
                  className={`btn${i === 0 ? " btn-primary" : ""}`}
                  onClick={() => onLog({ date: s.date, type: s.kind, km: s.km || undefined, title: s.title })}
                >
                  Training loggen
                </button>
              </article>
            );
          })}
        </div>
      )}
    </Section>
  );
}
