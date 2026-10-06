import type { ReactNode } from "react";

/** Editorial sectie: nummer, kop en intro links; inhoud rechts (op mobiel eronder). */
export function Section({ id, num, title, lead, aside, children }: {
  id: string;
  num: string;
  title: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="sec" aria-labelledby={`${id}-t`}>
      <header className="sec-head">
        <span className="sec-num">{num}</span>
        <h2 id={`${id}-t`} className="sec-title">{title}</h2>
        {lead && <p className="sec-lead">{lead}</p>}
        {aside && <div className="sec-aside">{aside}</div>}
      </header>
      <div className="sec-body">{children}</div>
    </section>
  );
}

/** Groot typografisch getal met optionele eenheid. */
export function Fig({ value, unit, className }: { value: ReactNode; unit?: string; className?: string }) {
  return (
    <span className={className ? `fig ${className}` : "fig"}>
      {value}
      {unit && <small>{unit}</small>}
    </span>
  );
}
