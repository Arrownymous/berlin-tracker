"use client";

import { useRef, useState } from "react";
import { iso, nf1, paceStr, todayD } from "@/lib/dates";
import { hrZone } from "@/lib/hr";
import { fmtDuration, parseDuration } from "@/lib/stats";
import type { Entry, EntryType } from "@/lib/types";

export interface LogPreset {
  date?: string;
  type?: EntryType;
  km?: number;
  /** Naam van de geplande training, als context boven het formulier. */
  title?: string;
  /** Bestaande training om te wijzigen. */
  entry?: Entry;
}

interface Props {
  preset: LogPreset;
  maxHr: number | null;
  /** "inline" op de trainingenpagina, "dialog" in het logvenster. */
  variant: "inline" | "dialog";
  idPrefix: string;
  onSave: (e: Omit<Entry, "id" | "created">, replaceId?: string) => void;
  onCancel?: () => void;
  onError: (msg: string) => void;
}

export const TYPES: { v: EntryType; label: string; hint: string }[] = [
  { v: "loop", label: "Loop", hint: "Hardlopen" },
  { v: "kracht", label: "Kracht", hint: "Sterkte & stabiliteit" },
  { v: "cross", label: "Fiets / zwem", hint: "Cross-training" },
];

const rpeLabel = (n: number) => (n >= 9 ? "Maximaal" : n >= 7 ? "Zwaar" : n >= 4 ? "Gemiddeld" : "Licht");

/** Rij tikbare cijfers; sneller dan een schuifje op een telefoon. */
function Scale({ value, onChange, labelledBy }: { value: number; onChange: (n: number) => void; labelledBy: string }) {
  return (
    <div className="scale" role="group" aria-labelledby={labelledBy} style={{ ["--n" as string]: 10 }}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button key={n} type="button" aria-pressed={value === n} className={n <= value ? "on" : ""} onClick={() => onChange(n)}>
          {n}
        </button>
      ))}
    </div>
  );
}

const kmText = (n?: number) => (n ? String(n).replace(".", ",") : "");

export default function LogForm({ preset, maxHr, variant, idPrefix: p, onSave, onCancel, onError }: Props) {
  const ed = preset.entry;
  const kmRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<EntryType>(ed?.type ?? preset.type ?? "loop");
  const [date, setDate] = useState(ed?.date ?? preset.date ?? iso(todayD()));
  const [km, setKm] = useState(kmText(ed?.km || preset.km));
  const [dur, setDur] = useState(ed?.min ? fmtDuration(ed.min) : "");
  const [rpe, setRpe] = useState(ed?.rpe ?? 4);
  const [avgHr, setAvgHr] = useState(ed?.avgHr ? String(ed.avgHr) : "");
  const [note, setNote] = useState(ed?.note ?? "");

  const kmNum = Number(km.replace(",", "."));
  const minNum = parseDuration(dur);
  const avgHrNum = Number(avgHr);
  const zone = avgHrNum && maxHr ? hrZone(avgHrNum, maxHr) : null;
  const durBad = dur.trim() !== "" && minNum === null;

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!date) return;
    if (type === "loop" && !(kmNum > 0)) {
      kmRef.current?.focus();
      onError("Vul de afstand in");
      return;
    }
    if (durBad) {
      onError("Duur niet herkend, gebruik bv. 45 of 45:30");
      return;
    }
    onSave(
      {
        date,
        type,
        km: type === "loop" ? +kmNum.toFixed(2) : 0,
        min: minNum ? +minNum.toFixed(2) : 0,
        rpe,
        avgHr: type !== "kracht" && avgHrNum > 0 ? Math.round(avgHrNum) : undefined,
        note: note.trim().slice(0, 500),
      },
      ed?.id
    );
  };

  const pace = type === "loop" && kmNum > 0 && minNum ? paceStr(kmNum, minNum) : null;
  const durationField = (
    <div className="field">
      <label htmlFor={`${p}Dur`}>Duur</label>
      <input
        id={`${p}Dur`}
        type="text"
        inputMode="numeric"
        placeholder="45:30"
        autoComplete="off"
        aria-invalid={durBad}
        aria-describedby={`${p}DurHint`}
        value={dur}
        onChange={(e) => setDur(e.target.value)}
      />
      <p id={`${p}DurHint`} className={`hint${durBad ? " bad" : ""}`}>
        {durBad ? "Gebruik minuten, mm:ss of u:mm:ss" : "Minuten, mm:ss of u:mm:ss"}
      </p>
    </div>
  );

  return (
    <form className={`logform ${variant}`} onSubmit={submit} noValidate>
      {preset.title && !ed && (
        <p className="lf-context">
          <span className="label">Uit je schema</span>
          {preset.title}
          {preset.km ? ` · ${nf1.format(preset.km)} km` : ""}
        </p>
      )}
      <div className="types" role="group" aria-label="Soort training">
        {TYPES.map((t, i) => (
          <button key={t.v} type="button" aria-pressed={type === t.v} onClick={() => setType(t.v)} data-autofocus={i === 0 ? "" : undefined}>
            <b>{t.label}</b>
            <span>{t.hint}</span>
          </button>
        ))}
      </div>

      <div className="lf-grid">
        <div className="field">
          <label htmlFor={`${p}Date`}>Datum</label>
          <input type="date" id={`${p}Date`} required value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {type === "loop" ? (
          <div className="field">
            <label htmlFor={`${p}Km`}>Afstand</label>
            <div className="unit-input">
              <input ref={kmRef} type="text" inputMode="decimal" id={`${p}Km`} placeholder="0,0" autoComplete="off" value={km} onChange={(e) => setKm(e.target.value)} />
              <span aria-hidden>km</span>
            </div>
          </div>
        ) : (
          durationField
        )}
        {type === "loop" && durationField}
        {type !== "kracht" && (
          <div className="field">
            <label htmlFor={`${p}Hr`}>Gem. hartslag</label>
            <div className="unit-input">
              <input type="number" min={0} step={1} inputMode="numeric" id={`${p}Hr`} placeholder="–" value={avgHr} onChange={(e) => setAvgHr(e.target.value)} />
              <span aria-hidden>bpm</span>
            </div>
            <p className="hint">
              {zone ? (
                <span className={`hz z${zone.zone}`}>{zone.short} · {zone.label}</span>
              ) : avgHrNum && !maxHr ? (
                "Stel je max hartslag in op het overzicht"
              ) : (
                "Optioneel"
              )}
            </p>
          </div>
        )}
      </div>

      {type === "loop" && (
        <div className="lf-live" aria-live="polite">
          <span className="label">Tempo</span>
          <b className={pace ? undefined : "nil"}>{pace ?? "0:00"}</b>
          <span className="unit">/km</span>
        </div>
      )}

      <div className="field">
        <div className="range-val">
          <span id={`${p}Rpe`} className="lbl">Hoe zwaar voelde het</span>
          <output>{rpe}/10 · {rpeLabel(rpe)}</output>
        </div>
        <Scale value={rpe} onChange={setRpe} labelledBy={`${p}Rpe`} />
      </div>
      <div className="field">
        <label htmlFor={`${p}Note`}>Notitie</label>
        <textarea id={`${p}Note`} placeholder="Bijv. lekker gelopen langs de rivier, nieuwe schoenen" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="dlg-actions">
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel}>
            {variant === "dialog" ? "Annuleren" : "Wissen"}
          </button>
        )}
        <button type="submit" className="btn btn-primary">{ed ? "Wijziging opslaan" : "Training opslaan"}</button>
      </div>
    </form>
  );
}
