"use client";

import { PHOTOS, PHOTO_LIST } from "@/lib/photos";
import { SYNC, useApp } from "./AppShell";
import PhotoBand from "./PhotoBand";
import TowerMark from "./TowerMark";

/** Slotbeeld van de Brandenburger Tor, daarna status en fotoverantwoording. */
export default function SiteFooter() {
  const { sync } = useApp();
  return (
    <>
      <PhotoBand photo={PHOTOS.brandenburg} kicker="Zondag 26.09.2027" title={<>Tot in <em>Berlijn.</em></>} pos="50% 60%" />
      <footer className="foot">
        <div className="wrap foot-in">
          <div className="foot-mark">
            <TowerMark className="mark-tower" beacon={false} />
            <span className="mark">Berlin 2027</span>
          </div>
          <p className="foot-sync">
            <span className="label sync"><i className={SYNC[sync].cls} />{SYNC[sync].label}</span>
            {SYNC[sync].title}
          </p>
          <details className="credits">
            <summary className="label">Fotoverantwoording</summary>
            <ul>
              {PHOTO_LIST.map((p) => (
                <li key={p.source}>
                  <a href={p.source} target="_blank" rel="noreferrer">{p.title}</a> · {p.author} ·{" "}
                  <a href={p.licenseUrl} target="_blank" rel="noreferrer">{p.license}</a>
                </li>
              ))}
            </ul>
            <p>Foto&apos;s via Wikimedia Commons, verkleind voor het web.</p>
            <p>
              Routekaart bij benadering op basis van het parcours van 2023. Kaartdata ©{" "}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap-bijdragers</a> (ODbL).
            </p>
          </details>
        </div>
      </footer>
    </>
  );
}
