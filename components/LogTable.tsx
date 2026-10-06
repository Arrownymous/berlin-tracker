import { useState } from "react";
import { DAYS, MON, dowOf, fmtD, nf0, nf1, paceStr, parse } from "@/lib/dates";
import { hrZone } from "@/lib/hr";
import { TYPE_LABEL } from "@/lib/labels";
import { fmtDuration } from "@/lib/stats";
import type { Entry, EntryType } from "@/lib/types";
import { Section } from "./ui";

const MONTHS_LONG = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const FILTERS: { v: EntryType | "all"; label: string }[] = [
  { v: "all", label: "Alles" },
  { v: "loop", label: "Loop" },
  { v: "kracht", label: "Kracht" },
  { v: "cross", label: "Fiets / zwem" },
];

interface Props {
  num: string;
  log: Entry[];
  maxHr: number | null;
  /** Net opgeslagen training, kort gemarkeerd. */
  flashId?: string | null;
  /** Mijlpalen per training-id */
  milestones?: Map<string, string[]>;
  onEdit: (e: Entry) => void;
  onRemove: (id: string) => void;
  onExport: () => void;
}

/** Het volledige logboek per maand: tabel op desktop, blokken op mobiel. */
export default function LogTable({ num, log, maxHr, flashId, milestones, onEdit, onRemove, onExport }: Props) {
  const [filter, setFilter] = useState<EntryType | "all">("all");
  const rows = filter === "all" ? log : log.filter((e) => e.type === filter);

  // Groepeer per maand, nieuwste eerst (log is al aflopend gesorteerd).
  const groups: { key: string; label: string; items: Entry[] }[] = [];
  for (const e of rows) {
    const key = e.date.slice(0, 7);
    let g = groups[groups.length - 1];
    if (!g || g.key !== key) {
      const d = parse(e.date);
      groups.push((g = { key, label: `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`, items: [] }));
    }
    g.items.push(e);
  }

  return (
    <Section
      id="logboek"
      num={num}
      title={<>Logboek<sup>{log.length}</sup></>}
      lead="Al je trainingen per maand, nieuwste eerst. Tik op wijzig om iets te corrigeren."
      aside={
        <div className="log-aside">
          <div className="toggle" role="group" aria-label="Filter op soort">
            {FILTERS.map((f) => (
              <button key={f.v} type="button" aria-pressed={filter === f.v} onClick={() => setFilter(f.v)}>{f.label}</button>
            ))}
          </div>
          <button className="btn btn-sm" type="button" onClick={onExport} disabled={!log.length}>Exporteer CSV</button>
        </div>
      }
    >
      {rows.length === 0 ? (
        <p className="empty">{log.length ? "Geen trainingen van deze soort." : "Nog niets gelogd. Vul hierboven je eerste training in."}</p>
      ) : (
        <div className="table-scroll">
          <table className="tbl log">
            <thead>
              <tr>
                <th>Datum</th><th>Soort</th><th className="num">Afstand</th><th className="num">Duur</th><th className="num">Tempo</th>
                <th className="num">Zwaarte</th><th className="num">HS</th><th>Notitie</th><th />
              </tr>
            </thead>
            {groups.map((g) => {
              const km = g.items.filter((e) => e.type === "loop").reduce((a, e) => a + e.km, 0);
              return (
                <tbody key={g.key}>
                  <tr className="grp">
                    <th colSpan={9} scope="colgroup">
                      <span className="grp-name">{g.label}</span>
                      <span className="grp-meta">{g.items.length} {g.items.length === 1 ? "training" : "trainingen"}{km ? ` · ${nf1.format(km)} km` : ""}</span>
                    </th>
                  </tr>
                  {g.items.map((e) => {
                    const d = parse(e.date);
                    const run = e.type === "loop";
                    const pace = run ? paceStr(e.km, e.min) : "–";
                    const z = e.avgHr && maxHr ? hrZone(e.avgHr, maxHr) : null;
                    return (
                      <tr key={e.id} className={e.id === flashId ? "flash" : undefined}>
                        <td className="l-date strong">{DAYS[dowOf(d)]} {fmtD(d)}</td>
                        <td className="l-type"><span className={`type t-${e.type}`}>{TYPE_LABEL[e.type] ?? e.type}</span></td>
                        <td className={`num strong l-km${run && e.km ? "" : " nil"}`}>{run && e.km ? `${nf1.format(e.km)} km` : "–"}</td>
                        <td className={`num${e.min ? "" : " nil"}`} data-label="Duur">{e.min ? (run ? fmtDuration(e.min) : `${nf0.format(e.min)} min`) : "–"}</td>
                        <td className={`num${pace === "–" ? " nil" : ""}`} data-label="Tempo">{pace}</td>
                        <td className="num" data-label="Zwaarte">{e.rpe}</td>
                        <td className={`num${e.avgHr ? "" : " nil"}`} data-label="HS">
                          {e.avgHr ? z ? <span className={`hz z${z.zone}`}>{e.avgHr}</span> : e.avgHr : "–"}
                        </td>
                        <td className="note">
                          {milestones?.get(e.id)?.map((t) => <span key={t} className="flag ms-flag" title="Mijlpaal behaald">{t}</span>)}
                          {e.note}
                        </td>
                        <td className="num l-act">
                          <span className="acts">
                          <button className="del" type="button" aria-label={`Wijzig training van ${d.getDate()} ${MON[d.getMonth()]}`} onClick={() => onEdit(e)}>Wijzig</button>
                          <button className="del danger" type="button" aria-label={`Verwijder training van ${d.getDate()} ${MON[d.getMonth()]}`} onClick={() => onRemove(e.id)}>Verwijder</button>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              );
            })}
          </table>
        </div>
      )}
    </Section>
  );
}
