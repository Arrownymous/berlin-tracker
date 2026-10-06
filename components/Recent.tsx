import { DAYS_LONG, MON, dowOf, nf0, nf1, paceStr, parse } from "@/lib/dates";
import { hrZone } from "@/lib/hr";
import { TYPE_LABEL } from "@/lib/labels";
import type { Entry } from "@/lib/types";
import { Fig, Section } from "./ui";

/** De laatste drie trainingen als korte verslagen. */
export default function Recent({ entries, maxHr }: { entries: Entry[]; maxHr: number | null }) {
  return (
    <Section id="logboek" num="07" title="Recente trainingen" lead="Je laatste sessies, met hoe ze voelden.">
      {entries.length === 0 ? (
        <p className="empty">Nog niets gelogd. Je eerste training verschijnt hier.</p>
      ) : (
        <div className="cells feature" style={{ ["--n" as string]: entries.length }}>
          {entries.map((e) => {
            const d = parse(e.date);
            const run = e.type === "loop";
            const z = e.avgHr && maxHr ? hrZone(e.avgHr, maxHr) : null;
            return (
              <article key={e.id}>
                <span className="label">{DAYS_LONG[dowOf(d)]} {d.getDate()} {MON[d.getMonth()]}</span>
                <h3 className="f-title">{TYPE_LABEL[e.type] ?? e.type}</h3>
                {run && e.km ? <Fig value={nf1.format(e.km)} unit="km" /> : e.min ? <Fig value={nf0.format(e.min)} unit="min" /> : <Fig value="–" />}
                <div className="f-meta">
                  {run && e.km > 0 && e.min > 0 && <span><b>{nf0.format(e.min)}</b> min</span>}
                  {run && e.km > 0 && e.min > 0 && <span><b>{paceStr(e.km, e.min)}</b> /km</span>}
                  {e.avgHr ? <span className={z ? `hz z${z.zone}` : ""}><b>{e.avgHr}</b>&nbsp;bpm</span> : null}
                  <span>Zwaarte <b>{e.rpe}</b>/10</span>
                </div>
                {e.note && <p className="f-note">“{e.note}”</p>}
              </article>
            );
          })}
        </div>
      )}
    </Section>
  );
}
