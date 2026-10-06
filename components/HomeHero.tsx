"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PHOTOS } from "@/lib/photos";
import { DAYS, MON, dowOf, nf1, pad, parse } from "@/lib/dates";
import { minutesIn, whenLabel } from "@/lib/labels";
import type { Session } from "@/lib/types";
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

export interface TodayInfo {
  date: string;
  items: { s: Session; done: boolean }[];
  /** Eerstvolgende open training na vandaag, voor op een rustdag */
  next: Session | null;
}

/** "Morgen" of "za 10 okt" voor de eerstvolgende training. */
const nextDay = (date: string, today: string) => {
  if (whenLabel(date, today).startsWith("Morgen")) return "Morgen";
  const d = parse(date);
  return `${DAYS[dowOf(d)]} ${d.getDate()} ${MON[d.getMonth()]}`;
};

const sizeOf = (s: Session) => (s.km ? `${nf1.format(s.km)} km` : minutesIn(s.desc) ? `${minutesIn(s.desc)} min` : "");

/** Wat er vandaag op het schema staat, met één tik loggen. */
function Today({ info }: { info: TodayInfo }) {
  const { openLog } = useApp();
  const d = parse(info.date);
  return (
    <div className="nowb" aria-label="Vandaag">
      <span className="label">Vandaag · {DAYS[dowOf(d)]} {d.getDate()} {MON[d.getMonth()]}</span>
      {info.items.length ? (
        info.items.map(({ s, done }) => (
          <div key={s.kind} className={`nowb-row${done ? " done" : ""}`}>
            <div className="nowb-txt">
              <b>{s.title}</b>
              <span>{sizeOf(s)}</span>
            </div>
            {done ? (
              <span className="nowb-done">Gedaan</span>
            ) : (
              <button type="button" className="btn btn-light btn-sm" onClick={() => openLog({ date: s.date, type: s.kind, km: s.km || undefined, title: s.title })}>
                Loggen
              </button>
            )}
          </div>
        ))
      ) : (
        <div className="nowb-row">
          <div className="nowb-txt">
            <b>Rustdag</b>
            <span>{info.next ? `${nextDay(info.next.date, info.date)}: ${info.next.title}` : "Geniet ervan."}</span>
          </div>
          <button type="button" className="btn btn-ghost-light btn-sm" onClick={() => openLog({ date: info.date })}>Loggen</button>
        </div>
      )}
      <Link className="nowb-all" href="/trainingen">Alle trainingen</Link>
    </div>
  );
}

/** Schermvullende fotohero: Karl-Marx-Allee met de Fernsehturm, woordmerk, vandaag en aftelklok. */
export default function HomeHero({ today }: { today: TodayInfo | null }) {
  const { mounted, sync } = useApp();
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
          {today ? <Today info={today} /> : <div className="nowb nowb-ph" aria-hidden />}
        </div>
      </div>

      <a className="hero-scroll" href="#stand" aria-label="Naar je voortgang"><span /></a>
    </section>
  );
}
