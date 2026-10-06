import { nf1 } from "@/lib/dates";
import { MARATHON_KM } from "@/lib/goal";
import { LANDMARKS, ROUTE, ROUTE_VIEW } from "@/lib/route";
import { Section } from "./ui";

/** Punt op de route bij een gegeven kilometer (lineair tussen de routepunten). */
function at(km: number): [number, number] {
  const k = Math.max(0, Math.min(MARATHON_KM, km));
  for (let i = 1; i < ROUTE.length; i++) {
    const [x0, y0, k0] = ROUTE[i - 1];
    const [x1, y1, k1] = ROUTE[i];
    if (k <= k1) {
      const t = k1 > k0 ? (k - k0) / (k1 - k0) : 0;
      return [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t];
    }
  }
  const last = ROUTE[ROUTE.length - 1];
  return [last[0], last[1]];
}

const line = (pts: [number, number][]) => pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

/** Labelpositie per herkenningspunt: verschuiving en uitlijning, zodat labels de lijn niet raken. */
const LABEL: Record<string, [number, number, "start" | "middle" | "end"]> = {
  "Siegessäule": [0, 34, "middle"],
  Moabit: [0, -18, "middle"],
  "Strausberger Platz": [-16, 24, "end"],
  "Kottbusser Tor": [-16, 24, "end"],
  Hermannplatz: [16, 6, "start"],
  "Rathaus Schöneberg": [0, 34, "middle"],
  "Wilder Eber": [0, 32, "middle"],
  Kurfürstendamm: [0, -18, "middle"],
  "Potsdamer Platz": [0, 34, "middle"],
  Gendarmenmarkt: [16, 6, "start"],
  "Brandenburger Tor": [0, -18, "middle"],
};

/**
 * Je totale kilometers als tocht over het parcours van de Berlin Marathon.
 * Na 42,195 km begin je aan een nieuwe ronde.
 */
export default function RouteMap({ num, total }: { num: string; total: number }) {
  const laps = Math.floor(total / MARATHON_KM);
  const pos = total - laps * MARATHON_KM;
  const done: [number, number][] = [...ROUTE.filter((p) => p[2] < pos).map((p) => [p[0], p[1]] as [number, number]), at(pos)];
  const runner = at(pos);
  const next = LANDMARKS.find((l) => l.km > pos) ?? null;
  const after = next ? LANDMARKS.find((l) => l.km > next.km) ?? null : null;
  const ticks = [5, 10, 15, 20, 25, 30, 35, 40];
  const start = at(0);
  const finish = at(MARATHON_KM);
  const times = total / MARATHON_KM;

  return (
    <Section
      id="route"
      num={num}
      title="De route"
      lead="Al je gelopen kilometers, afgezet tegen het parcours. Na 42,2 km begin je aan een nieuwe ronde."
      aside={
        <dl className="route-stats">
          <div>
            <dt className="label">Ronde {laps + 1}</dt>
            <dd><b>{nf1.format(pos)}</b> <span>/ 42,2 km</span></dd>
          </div>
          <div>
            <dt className="label">Volgende</dt>
            <dd>
              {next ? (
                <>
                  <b className="route-next">{next.name}</b>
                  <span>over {nf1.format(next.km - pos)} km{after ? `, daarna ${after.name}` : ""}</span>
                </>
              ) : (
                <>
                  <b className="route-next">Finish</b>
                  <span>over {nf1.format(MARATHON_KM - pos)} km</span>
                </>
              )}
            </dd>
          </div>
          <div>
            <dt className="label">Totaal</dt>
            <dd><b>{nf1.format(times)}×</b> <span>de marathonroute</span></dd>
          </div>
        </dl>
      }
    >
      <figure className="route">
        <svg viewBox={`0 0 ${ROUTE_VIEW.w} ${ROUTE_VIEW.h}`} role="img" aria-label={`Parcours van de Berlin Marathon. Je bent in ronde ${laps + 1} op ${nf1.format(pos)} km${next ? `, ${nf1.format(next.km - pos)} km voor ${next.name}` : ""}.`}>
          <polyline className={`route-base${laps > 0 ? " lapped" : ""}`} points={line(ROUTE.map((p) => [p[0], p[1]]))} />
          {pos > 0 && <polyline className="route-done" points={line(done)} />}

          {ticks.map((t) => {
            const [x, y] = at(t);
            return (
              <g key={t} className={`route-tick${t <= pos ? " passed" : ""}`}>
                <circle cx={x} cy={y} r="11" />
                <text x={x} y={y + 4}>{t}</text>
              </g>
            );
          })}

          {LANDMARKS.map((l) => {
            const [x, y] = at(l.km);
            const [dx, dy, anchor] = LABEL[l.name] ?? [0, -18, "middle"];
            const cls = l.km <= pos ? " passed" : next?.name === l.name ? " next" : "";
            return (
              <g key={l.name} className={`route-lm${cls}`}>
                <circle cx={x} cy={y} r="6" />
                <text x={x + dx} y={y + dy} textAnchor={anchor}>{l.name}</text>
              </g>
            );
          })}

          <g className="route-flag">
            <circle cx={start[0]} cy={start[1]} r="8" />
            <text x={start[0]} y={start[1] - 18} textAnchor="middle">Start</text>
            <circle cx={finish[0]} cy={finish[1]} r="8" />
            <text x={finish[0]} y={finish[1] + 32} textAnchor="middle">Finish</text>
          </g>

          {total > 0 && (
            <g className="route-runner">
              <circle className="route-pulse" cx={runner[0]} cy={runner[1]} r="14" />
              <circle cx={runner[0]} cy={runner[1]} r="10" />
            </g>
          )}
        </svg>
        <figcaption className="route-cap">
          Parcours bij benadering, op basis van de route van 2023. Kaartdata © OpenStreetMap-bijdragers.
        </figcaption>
      </figure>
    </Section>
  );
}
