"use client";

import { useEffect, useRef } from "react";
import type { Entry } from "@/lib/types";
import LogForm, { type LogPreset } from "./LogForm";

export type { LogPreset };

interface Props {
  preset: LogPreset;
  maxHr: number | null;
  onCancel: () => void;
  onSave: (e: Omit<Entry, "id" | "created">, replaceId?: string) => void;
  onError: (msg: string) => void;
}

/** Logvenster: modaal op desktop, bottom sheet op mobiel. */
export default function LogDialog({ preset, maxHr, onCancel, onSave, onError }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  return (
    <dialog ref={ref} aria-labelledby="dlgTitle" onCancel={(e) => { e.preventDefault(); onCancel(); }}>
      <div className="dlg">
        <div className="dlg-head">
          <span className="label">Logboek</span>
          <h3 id="dlgTitle">{preset.entry ? "Training wijzigen" : "Training loggen"}</h3>
          <button type="button" className="dlg-x" aria-label="Sluiten" onClick={onCancel}>×</button>
        </div>
        <LogForm preset={preset} maxHr={maxHr} variant="dialog" idPrefix="d" onSave={onSave} onCancel={onCancel} onError={onError} />
      </div>
    </dialog>
  );
}
