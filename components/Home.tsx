"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PLAN, phaseOf } from "@/lib/plan";
import { DAY, RACE, START, addDays, iso, nf1, paceStr, todayD, weekIdxOf } from "@/lib/dates";
import { HR_ZONES, hrZone } from "@/lib/hr";
import { PHOTOS } from "@/lib/photos";
import { matchSessions, sessionKey, weekActualCache } from "@/lib/stats";
import type { Session } from "@/lib/types";
import { useApp } from "./AppShell";
import HomeHero from "./HomeHero";
import Overview from "./Overview";
import PhotoBand from "./PhotoBand";
import ThisWeek from "./ThisWeek";
import Upcoming from "./Upcoming";
import Progress, { type Range } from "./Progress";
import HeartRate from "./HeartRate";
import Recent from "./Recent";
import Milestones from "./Milestones";
import { computeMilestones } from "@/lib/milestones";

const NARROW = 720;

/** Homepage: fotohero, stand van zaken, deze week, voortgang en hartslag. */
export default function Home() {
  const { entries, mounted, maxHr, setMaxHr, openLog } = useApp();
  const [viewWeek, setViewWeek] = useState<number | null>(null);
  const [range, setRange] = useState<Range>("all");
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    // Op een telefoon is 12 weken leesbaarder dan alle 51 balken.
    if (window.innerWidth < NARROW) setRange("12");
    const on = () => setNarrow(window.innerWidth < NARROW);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  const t = mounted ? todayD() : START;
  const tIso = iso(t);
  const ti = weekIdxOf(t);
  const curIdx = Math.max(0, Math.min(50, ti));
  const vw = viewWeek ?? curIdx;
  const weekActual = useMemo(() => weekActualCache(entries), [entries]);

  const matched = useMemo(() => matchSessions(entries, PLAN), [entries]);
  const milestones = useMemo(() => computeMilestones(entries), [entries]);
  const isDone = (s: Session) => matched.has(sessionKey(s));
  const doneOn = (s: Session) => matched.get(sessionKey(s))?.date ?? null;
  const runs = entries.filter((e) => e.type === "loop" && e.km > 0);
  const total = runs.reduce((a, e) => a + e.km, 0);
  const allSessions = PLAN.flatMap((w) => w.sessions);
  const planToDate = allSessions.filter((s) => s.date <= tIso).reduce((a, s) => a + s.km, 0);
  // Noemer: alles wat al gepland stond, plus sessies die je vooruit al hebt afgevinkt.
  const due = allSessions.filter((s) => s.date <= tIso || isDone(s));
  const from28 = iso(addDays(t, -27));
  const longestRecent = runs.filter((e) => e.date >= from28 && e.date <= tIso).reduce((a, e) => Math.max(a, e.km), 0);
  const beforeStart = t < START;
  const schemaPct = Math.round(Math.min(1, Math.max(0, (t.getTime() - START.getTime()) / (RACE.getTime() - START.getTime()))) * 100);

  let delta: { cls: string; text: string };
  if (beforeStart) delta = { cls: "flat", text: `Start over ${Math.round((START.getTime() - t.getTime()) / DAY)} dagen · ma 5 okt` };
  else {
    const diff = total - planToDate;
    if (Math.abs(diff) < 0.5) delta = { cls: "flat", text: "Precies op schema" };
    else if (diff > 0) delta = { cls: "up", text: `▲ ${nf1.format(diff)} km voor op schema` };
    else delta = { cls: "down", text: `▼ ${nf1.format(-diff)} km achter op schema` };
  }

  /* ---------- week op week ---------- */
  const wa = weekActual(ti);
  const wb = weekActual(ti - 1);
  const loadChange = wb.km > 0 ? ((wa.km - wb.km) / wb.km) * 100 : null;
  const r4 = runs.filter((e) => e.date >= from28 && e.min > 0);
  const km4 = r4.reduce((s, e) => s + e.km, 0);
  const min4 = r4.reduce((s, e) => s + e.min, 0);

  /* ---------- hartslagzones ---------- */
  const hrEntries = maxHr ? entries.filter((e) => e.avgHr && hrZone(e.avgHr, maxHr)) : [];
  const hrCounts = HR_ZONES.map((z) => hrEntries.filter((e) => hrZone(e.avgHr!, maxHr!)?.zone === z.zone).length);
  const hasEf = entries.some((e) => e.avgHr && e.rpe <= 5);

  /* ---------- grafiekdata ---------- */
  const charts = useMemo(() => {
    const labels = PLAN.map((w) => `Wk ${w.n}`);
    let cp = 0, ca = 0;
    const cumPlan: number[] = [], cumAct: (number | null)[] = [];
    const wPlan: number[] = [], wAct: (number | null)[] = [], wPace: (number | null)[] = [], wEf: (number | null)[] = [];
    PLAN.forEach((w, i) => {
      cp += w.km;
      const a = weekActual(i);
      ca += a.km;
      cumPlan.push(+cp.toFixed(1));
      cumAct.push(i <= ti ? +ca.toFixed(1) : null);
      wPlan.push(+w.km.toFixed(1));
      wAct.push(i <= ti ? +a.km.toFixed(1) : null);
      wPace.push(i <= ti ? a.pace : null);
      wEf.push(i <= ti ? a.ef : null);
    });
    let lo = 0, hi = 51;
    if (range !== "all") {
      const n = Number(range);
      lo = Math.max(0, curIdx - n + 1);
      hi = Math.min(51, lo + n);
    }
    const cut = <T,>(a: T[]) => a.slice(lo, hi);
    return {
      labels: cut(labels), cumPlan: cut(cumPlan), cumAct: cut(cumAct),
      wPlan: cut(wPlan), wAct: cut(wAct), wPace: cut(wPace), wEf: cut(wEf),
    };
  }, [weekActual, ti, curIdx, range]);

  const curPh = beforeStart ? -1 : phaseOf(Math.min(51, ti + 1));
  const log = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created);
  const upcoming = allSessions.filter((s) => s.date >= tIso && !isDone(s)).slice(0, 3);
  const planTotal = PLAN.reduce((a, w) => a + w.km, 0);

  return (
    <main>
      <HomeHero />
      {mounted ? (
        <>
          <Overview
            total={total}
            delta={delta}
            week={beforeStart ? null : Math.min(51, ti + 1)}
            longestRecent={longestRecent}
            donePct={due.length ? Math.round((due.filter(isDone).length / due.length) * 100) : null}
            weekKm={weekActual(curIdx).km}
            weekPlan={PLAN[curIdx].km}
            schemaPct={schemaPct}
            curPh={curPh}
            ti={ti}
            narrow={narrow}
          />
          <div className="wrap">
            <ThisWeek
              week={PLAN[vw]}
              isCurrent={ti === vw}
              actualKm={weekActual(vw).km}
              kracht={weekActual(vw).kracht}
              planKracht={PLAN[vw].sessions.filter((s) => s.kind === "kracht").length}
              today={tIso}
              narrow={narrow}
              isDone={isDone}
              doneOn={doneOn}
              onLog={openLog}
              onPrev={vw > 0 ? () => setViewWeek(vw - 1) : undefined}
              onNext={vw < 50 ? () => setViewWeek(vw + 1) : undefined}
            />
          </div>

          <PhotoBand photo={PHOTOS.finish} kicker="De finish" title={<>Onder de <em>Brandenburger Tor</em> door.</>} pos="50% 40%" tall>
            Na 42,195 kilometer en {nf1.format(planTotal)} trainingskilometers in je schema.
          </PhotoBand>

          <div className="wrap">
            <Upcoming sessions={upcoming} today={tIso} onLog={openLog} />
            <Progress
              range={range}
              onRange={setRange}
              total={total}
              planToDate={planToDate}
              planTotal={planTotal}
              loadChange={loadChange}
              pace4={km4 ? paceStr(km4, min4) : null}
              hasEf={hasEf}
              data={charts}
            />
          </div>

          <PhotoBand photo={PHOTOS.oberbaum} kicker="Kreuzberg · Friedrichshain" title={<>Elke kilometer <em>telt.</em></>} pos="50% 50%" />

          <div className="wrap">
            <Milestones num="04" items={milestones} />
            <HeartRate maxHr={maxHr} onMaxHr={setMaxHr} counts={hrCounts} />
            <Recent entries={log.slice(0, 3)} maxHr={maxHr} />
            <div className="more">
              <Link className="btn" href="/trainingen">Alle {log.length} trainingen bekijken</Link>
            </div>
          </div>
        </>
      ) : (
        <div className="wrap" aria-busy="true" style={{ minHeight: "60vh" }} />
      )}
    </main>
  );
}
