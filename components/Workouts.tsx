"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { PLAN } from "@/lib/plan";
import { DAYS, MON, START, addDays, dowOf, iso, nf1, paceStr, parse, todayD, weekIdxOf } from "@/lib/dates";
import { whenLabel } from "@/lib/labels";
import { PHOTOS } from "@/lib/photos";
import { matchSessions, sessionKey, weekActualCache } from "@/lib/stats";
import { computeMilestones } from "@/lib/milestones";
import type { Session } from "@/lib/types";
import { useApp } from "./AppShell";
import LogForm, { type LogPreset } from "./LogForm";
import LogTable from "./LogTable";
import Schedule from "./Schedule";
import { Section } from "./ui";

/** Trainingenpagina: training invoeren, logboek en het volledige schema. */
export default function Workouts() {
  const { entries, mounted, maxHr, saveEntry, removeEntry, openLog, notify } = useApp();
  const [preset, setPreset] = useState<LogPreset>({});
  const [formKey, setFormKey] = useState(0);
  const [flashId, setFlashId] = useState<string | null>(null);
  const formTop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!flashId) return;
    const t = setTimeout(() => setFlashId(null), 2600);
    return () => clearTimeout(t);
  }, [flashId]);

  const t = mounted ? todayD() : START;
  const tIso = iso(t);
  const ti = weekIdxOf(t);
  const curIdx = Math.max(0, Math.min(50, ti));
  const weekActual = useMemo(() => weekActualCache(entries), [entries]);

  const log = useMemo(() => [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.created - a.created), [entries]);
  const runs = entries.filter((e) => e.type === "loop" && e.km > 0);
  const total = runs.reduce((a, e) => a + e.km, 0);
  const totalMin = runs.filter((e) => e.min > 0).reduce((a, e) => a + e.min, 0);
  const totalKmTimed = runs.filter((e) => e.min > 0).reduce((a, e) => a + e.km, 0);
  const last = log[0];

  // Open trainingen uit het schema van de afgelopen week t/m vandaag: één tik vult het formulier.
  const matched = useMemo(() => matchSessions(entries, PLAN), [entries]);
  const msByEntry = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const x of computeMilestones(entries)) if (x.entryId) m.set(x.entryId, [...(m.get(x.entryId) ?? []), x.title]);
    return m;
  }, [entries]);
  const isDone = (s: Session) => matched.has(sessionKey(s));
  const weekAgo = iso(addDays(t, -6));
  const open = PLAN.flatMap((w) => w.sessions)
    .filter((s) => s.date >= weekAgo && s.date <= tIso && !isDone(s))
    .reverse()
    .slice(0, 4);

  const pick = (p: LogPreset) => {
    setPreset(p);
    setFormKey((k) => k + 1);
    formTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const exportCsv = () => {
    const rows: (string | number)[][] = [["datum", "soort", "afstand_km", "duur_min", "tempo_min_per_km", "zwaarte_1_10", "gem_hartslag", "notitie"]];
    [...entries].sort((a, b) => a.date.localeCompare(b.date)).forEach((e) =>
      rows.push([e.date, e.type, e.km || "", e.min || "", e.type === "loop" ? paceStr(e.km, e.min) : "", e.rpe, e.avgHr || "", (e.note || "").replace(/"/g, '""')])
    );
    const csv = rows.map((r) => r.map((c) => (/[",;\n]/.test(String(c)) ? `"${c}"` : c)).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "berlin2027-trainingen.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main>
      <section id="hero" className="hero-photo hero-sub" aria-labelledby="w-title">
        <Image src={PHOTOS.towerNight.src} alt={PHOTOS.towerNight.alt} fill sizes="100vw" placeholder="blur" loading="eager" fetchPriority="high" className="hero-img" style={{ objectPosition: "50% 30%" }} />
        <div className="hero-shade" aria-hidden />
        <div className="hero-in wrap">
          <div className="hero-top">
            <span className="label">Logboek · Berlin 2027</span>
          </div>
          <div className="hero-main">
            <h1 id="w-title" className="page-title">Trainingen</h1>
            <p className="hero-year-txt">Log je loopjes, kracht en cross-training. Alles telt mee in je voortgang richting de start.</p>
          </div>
          <div className="hero-figs">
            <div><b>{mounted ? entries.length : "–"}</b><span>Trainingen</span></div>
            <div><b>{mounted ? nf1.format(total) : "–"}<small>km</small></b><span>Gelopen</span></div>
            <div>
              <b>{mounted ? nf1.format(weekActual(curIdx).km) : "–"}<small>/ {nf1.format(PLAN[curIdx].km)}</small></b>
              <span>Km deze week</span>
            </div>
            <div><b>{mounted && totalKmTimed ? paceStr(totalKmTimed, totalMin) : "–"}<small>/km</small></b><span>Gem. tempo</span></div>
          </div>
        </div>
      </section>

      <div className="wrap">
        <div ref={formTop} className="anchor" />
        <Section
          id="nieuw"
          num="01"
          title="Nieuwe training"
          lead={last && mounted ? <>Laatst gelogd: {whenLabel(last.date, tIso).toLowerCase()}.</> : "Vul in wat je gedaan hebt. Afstand en duur zijn genoeg; de rest is optioneel."}
          aside={
            mounted && open.length > 0 ? (
              <div className="picks">
                <span className="label">Uit je schema, nog open</span>
                <ul>
                  {open.map((s) => {
                    const d = parse(s.date);
                    const active = preset.date === s.date && preset.type === s.kind;
                    return (
                      <li key={s.date + s.kind}>
                        <button type="button" aria-pressed={active} onClick={() => pick({ date: s.date, type: s.kind, km: s.km || undefined, title: s.title })}>
                          <span className="pick-day">{s.date === tIso ? "Vandaag" : `${DAYS[dowOf(d)]} ${d.getDate()} ${MON[d.getMonth()]}`}</span>
                          <span className="pick-title">{s.title}</span>
                          {s.km ? <span className="pick-km">{nf1.format(s.km)} km</span> : null}
                        </button>
                      </li>
                    );
                  })}
                  <li>
                    <button type="button" aria-pressed={!preset.date} onClick={() => pick({})}>
                      <span className="pick-day">Vrij</span>
                      <span className="pick-title">Losse training</span>
                    </button>
                  </li>
                </ul>
              </div>
            ) : undefined
          }
        >
          {mounted ? (
            <LogForm
              key={formKey}
              preset={preset}
              maxHr={maxHr}
              variant="inline"
              idPrefix="w"
              onError={notify}
              onCancel={() => pick({})}
              onSave={(e) => {
                const saved = saveEntry(e);
                setFlashId(saved.id);
                setPreset({});
                setFormKey((k) => k + 1);
              }}
            />
          ) : (
            <div style={{ minHeight: 480 }} />
          )}
        </Section>

        {mounted && (
          <>
            <LogTable num="02" log={log} maxHr={maxHr} flashId={flashId} milestones={msByEntry} onEdit={(entry) => openLog({ entry })} onRemove={removeEntry} onExport={exportCsv} />
            <Schedule num="03" weekKm={(i) => weekActual(i).km} curIdx={curIdx} beforeStart={t < START} />
          </>
        )}
      </div>
    </main>
  );
}

