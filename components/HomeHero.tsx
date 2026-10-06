"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PHOTOS } from "@/lib/photos";
import { pad } from "@/lib/dates";
import { goalPaceStr, goalTimeStr } from "@/lib/goal";
import { SYNC, useApp } from "./AppShell";
import { Wordmark } from "./TowerMark";

/** Startschot Berlin Marathon: zondag 26 september 2027, ochtend (lokale tijd). */
const GUN = new Date(2027, 8, 26, 9, 15);

function useCountdown(on: boolean) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!on) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [on]);
  if (now === null) return null;
  const s = Math.max(0, Math.floor((GUN.getTime() - now) / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Schermvullende fotohero: Karl-Marx-Allee met de Fernsehturm, woordmerk en aftelklok. */
export default function HomeHero() {
  const { mounted, startLog, sync } = useApp();
  const c = useCountdown(mounted);
  const cells: [string, string][] = [
    [c ? String(c.d) : "–", "Dagen"],
    [c ? pad(c.h) : "–", "Uur"],
    [c ? pad(c.m) : "–", "Min"],
    [c ? pad(c.s) : "–", "Sec"],
  ];

  return (
    <section id="hero" className="hero-photo" aria-label="Berlin 2027">
      <Image
        src={PHOTOS.allee.src}
        alt={PHOTOS.allee.alt}
        fill
        sizes="100vw"
        placeholder="blur"
        loading="eager"
        fetchPriority="high"
        className="hero-img"
      />
      <div className="hero-shade" aria-hidden />

      <div className="hero-in wrap">
        <div className="hero-top">
          <span className="label">Marathontraining · 51 weken</span>
          <span className="label sync" title={SYNC[sync].title}><i className={SYNC[sync].cls} />{SYNC[sync].label}</span>
        </div>

        <div className="hero-main">
          <Wordmark id="hero-title" />
          <p className="hero-year">
            <span className="hero-year-num">2027</span>
            <span className="hero-year-txt">Zondag 26 september — 42,195 km door de stad, finish onder de Brandenburger Tor. <b>Doel: {goalTimeStr()}</b> · {goalPaceStr()} /km.</span>
          </p>
        </div>

        <div className="hero-foot">
          <div className="count" role="timer" aria-label={c ? `Nog ${c.d} dagen tot de start` : "Aftellen tot de start"}>
            <span className="label">Tot het startschot</span>
            <div className="count-cells">
              {cells.map(([v, l]) => (
                <div key={l} className="count-cell">
                  <b>{v}</b>
                  <span>{l}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-cta">
            <button type="button" className="btn btn-light" onClick={startLog}>Training loggen</button>
            <Link className="btn btn-ghost-light" href="/trainingen">Alle trainingen</Link>
          </div>
        </div>
      </div>

      <a className="hero-scroll" href="#stand" aria-label="Naar je voortgang"><span /></a>
    </section>
  );
}
