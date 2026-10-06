import { useState } from "react";
import { DAYS, MON, dowOf, parse } from "@/lib/dates";
import { goalPaceStr, goalTimeStr } from "@/lib/goal";
import { progressOf, remainingLabel, type MilestoneState } from "@/lib/milestones";
import { Section } from "./ui";

const when = (d: string) => {
  const x = parse(d);
  return `${DAYS[dowOf(x)]} ${x.getDate()} ${MON[x.getMonth()]}`;
};

/** Behaalde mijlpalen met datum, plus per groep de eerstvolgende met voortgang. */
export default function Milestones({ num, items }: { num: string; items: MilestoneState[] }) {
  const [all, setAll] = useState(false);
  const done = items.filter((m) => m.date);
  // Per groep alleen de eerstvolgende open mijlpaal, tenzij alles getoond wordt.
  const nextIds = new Set<string>();
  const seen = new Set<string>();
  for (const m of items) if (!m.date && !seen.has(m.group)) (seen.add(m.group), nextIds.add(m.id));
  const shown = all ? items : items.filter((m) => m.date || nextIds.has(m.id));

  return (
    <Section
      id="mijlpalen"
      num={num}
      title={<>Mijlpalen<sup>{done.length}/{items.length}</sup></>}
      lead={<>Wat je al bereikt hebt, en wat er nog komt. Je doel: {goalTimeStr()} in Berlijn, {goalPaceStr()} per km.</>}
      aside={
        <button className="btn btn-sm" type="button" onClick={() => setAll((v) => !v)} aria-expanded={all}>
          {all ? "Alleen volgende" : `Toon alle ${items.length}`}
        </button>
      }
    >
      <div className="cells ms">
        {shown.map((m) => (
          <div key={m.id} className={`ms-item${m.date ? " got" : nextIds.has(m.id) ? " next" : " later"}`}>
            <span className="label">{m.group}</span>
            <h3 className="ms-title">{m.title}</h3>
            <p className="ms-desc">{m.desc}</p>
            {m.date ? (
              <span className="ms-got">Behaald · {when(m.date)}</span>
            ) : (
              <div className="ms-prog">
                <span>{remainingLabel(m)}</span>
                <div className="line-meter"><i style={{ width: `${progressOf(m) * 100}%` }} /></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
