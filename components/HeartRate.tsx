import { HR_ZONES } from "@/lib/hr";
import { Fig, Section } from "./ui";

interface Props {
  maxHr: number | null;
  onMaxHr: (v: string) => void;
  /** aantal trainingen met hartslag per zone, in volgorde van HR_ZONES */
  counts: number[];
}

/** Max hartslag eenmalig instellen; daarna de verdeling van je trainingen over vijf zones. */
export default function HeartRate({ maxHr, onMaxHr, counts }: Props) {
  const n = counts.reduce((a, b) => a + b, 0);
  return (
    <Section
      id="hartslag"
      num="06"
      title="Hartslag"
      lead="Stel één keer je max hartslag in; elke gelogde gemiddelde hartslag wordt dan een zone."
    >
      <div className="hr-set">
        <label className="label" htmlFor="fMaxHr" style={{ flexBasis: "100%", marginBottom: 6 }}>Jouw max hartslag</label>
        <input
          id="fMaxHr"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          placeholder="190"
          value={maxHr ?? ""}
          onChange={(e) => onMaxHr(e.target.value)}
        />
        <span className="hr-unit">bpm</span>
      </div>

      {maxHr && n > 0 && (
        <div className="hr-dist-wrap">
          <span className="label">Verdeling van {n} {n === 1 ? "training" : "trainingen"}</span>
          <div className="hr-dist" aria-hidden>
            {HR_ZONES.map((z, i) => counts[i] > 0 && <i key={z.zone} className={`z${z.zone}`} style={{ flex: counts[i] }} />)}
          </div>
        </div>
      )}

      <div className="zones-wrap" style={!maxHr || n === 0 ? { marginTop: 44 } : undefined}>
        <div className="cells zones">
          {HR_ZONES.map((z, i) => (
            <div key={z.zone} className={`zone z${z.zone}`}>
              <span className="label">{z.short}</span>
              <Fig value={n ? Math.round((counts[i] / n) * 100) : "–"} unit={n ? "%" : undefined} />
              <span className="zone-name">{z.label}</span>
              <span className="zone-range">
                {maxHr
                  ? `${Math.round(z.from * maxHr)}–${z.zone === 5 ? maxHr : Math.round(z.to * maxHr) - 1} bpm`
                  : `${Math.round(z.from * 100)}–${Math.round(Math.min(1, z.to) * 100)}% van max`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!maxHr ? (
        <p className="empty" style={{ marginTop: 24 }}>Vul je (geschatte) max hartslag in, dan zie je hier je zones in slagen per minuut.</p>
      ) : n === 0 ? (
        <p className="empty" style={{ marginTop: 24 }}>Nog geen trainingen met hartslag. Vul &quot;Gem. hartslag&quot; in bij het loggen.</p>
      ) : null}
    </Section>
  );
}
