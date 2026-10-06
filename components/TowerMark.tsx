import { useId } from "react";

/**
 * Gestileerde Fernsehturm: antenne met baken, bol met raamband, kraag en taps toelopende schacht.
 * De schacht (y 110–200) is precies de kapitaalhoogte, zodat de toren als "I" in het woordmerk staat
 * en de bol erboven uitsteekt, zoals de punt op een i.
 */
export default function TowerMark({ className, beacon = true }: { className?: string; beacon?: boolean }) {
  const clip = useId();
  return (
    <svg className={className} viewBox="0 0 40 200" aria-hidden focusable="false">
      <defs>
        <clipPath id={clip}>
          <circle cx="20" cy="92" r="16" />
        </clipPath>
      </defs>
      <g fill="currentColor">
        <rect x="19.3" y="6" width="1.4" height="40" />
        <rect x="18.5" y="44" width="3" height="34" />
        <circle cx="20" cy="92" r="16" />
        <rect x="15.5" y="106" width="9" height="5" />
        <polygon points="16.4,110 23.6,110 27.5,200 12.5,200" />
      </g>
      <g clipPath={`url(#${clip})`} className="tower-band">
        <rect x="0" y="86.5" width="40" height="5.5" />
        <rect x="0" y="94.5" width="40" height="1.2" />
      </g>
      {beacon && <circle className="tower-beacon" cx="20" cy="4" r="2.6" />}
    </svg>
  );
}

/** "BERLIN" met de Fernsehturm als I. */
export function Wordmark({ id, className = "" }: { id?: string; className?: string }) {
  return (
    <h1 id={id} className={`wordmark ${className}`} aria-label="Berlin 2027">
      <span aria-hidden>BERL</span>
      <TowerMark className="tower-i" />
      <span aria-hidden>N</span>
    </h1>
  );
}
