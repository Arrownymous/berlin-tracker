"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useEntries, type SyncState } from "@/lib/useEntries";
import { readMaxHr, writeMaxHr } from "@/lib/hr";
import { computeMilestones } from "@/lib/milestones";
import type { Entry } from "@/lib/types";
import LogDialog, { type LogPreset } from "./LogDialog";

export const SYNC: Record<SyncState, { label: string; cls: string; title: string }> = {
  loading: { label: "Laden…", cls: "", title: "Gegevens laden…" },
  server: { label: "Gesynct", cls: "ok", title: "Gesynct met je database." },
  local: { label: "Lokaal", cls: "", title: "Alleen op dit apparaat opgeslagen (geen database gekoppeld)." },
  error: { label: "Sync mislukt", cls: "err", title: "Synchroniseren mislukt; lokaal bewaard." },
};

export type NewEntry = Omit<Entry, "id" | "created">;

interface Ctx {
  entries: Entry[];
  sync: SyncState;
  /** false tot de client draait; datums en cijfers pas daarna tonen. */
  mounted: boolean;
  maxHr: number | null;
  setMaxHr: (v: string) => void;
  openLog: (p?: LogPreset) => void;
  /** Header- en duimknop: logvenster, of op de trainingenpagina naar het formulier. */
  startLog: () => void;
  /** Slaat een nieuwe training op, of vervangt `replaceId`. Geeft de opgeslagen training terug. */
  saveEntry: (e: NewEntry, replaceId?: string) => Entry;
  removeEntry: (id: string) => void;
  notify: (msg: string) => void;
}

const AppCtx = createContext<Ctx | null>(null);

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp buiten AppShell");
  return c;
}

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/** Gedeelde staat voor alle pagina's: trainingen, max hartslag, logvenster en meldingen. */
export default function AppShell({ children }: { children: ReactNode }) {
  const { entries, update, sync } = useEntries();
  const [mounted, setMounted] = useState(false);
  const [maxHr, setMaxHrState] = useState<number | null>(null);
  const [dialog, setDialog] = useState<LogPreset | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const path = usePathname();

  useEffect(() => {
    setMounted(true);
    setMaxHrState(readMaxHr());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.startsWith("Mijlpa") ? 4200 : 2400);
    return () => clearTimeout(t);
  }, [toast]);

  const setMaxHr = useCallback((v: string) => {
    const n = Number(v);
    const next = n > 0 ? n : null;
    setMaxHrState(next);
    writeMaxHr(next);
  }, []);

  const saveEntry = useCallback(
    (e: NewEntry, replaceId?: string) => {
      let saved!: Entry;
      let reached: string[] = [];
      update((prev) => {
        const old = replaceId ? prev.find((x) => x.id === replaceId) : undefined;
        saved = { ...e, id: old?.id ?? newId(), created: old?.created ?? Date.now() };
        const next = old ? prev.map((x) => (x.id === old.id ? saved : x)) : [...prev, saved];
        // Nieuwe mijlpalen door deze training? Dan vieren we die in de melding.
        const had = new Set(computeMilestones(prev).filter((m) => m.date).map((m) => m.id));
        reached = computeMilestones(next).filter((m) => m.date && !had.has(m.id)).map((m) => m.title);
        return next;
      });
      setToast(
        reached.length
          ? `${reached.length > 1 ? "Mijlpalen" : "Mijlpaal"} behaald · ${
              reached.length > 1 ? `${reached.slice(0, -1).join(", ")} en ${reached[reached.length - 1]}` : reached[0]
            }`
          : replaceId ? "Training bijgewerkt" : "Training opgeslagen"
      );
      return saved;
    },
    [update]
  );

  const removeEntry = useCallback(
    (id: string) => {
      if (!confirm("Deze training verwijderen?")) return;
      update((prev) => prev.filter((x) => x.id !== id));
      setToast("Training verwijderd");
    },
    [update]
  );

  const openLog = useCallback((p: LogPreset = {}) => setDialog(p), []);

  // Op de trainingenpagina staat het formulier al open; de knop springt daarheen.
  const onWorkouts = path?.startsWith("/trainingen");
  const startLog = useCallback(() => {
    if (onWorkouts) {
      document.getElementById("nieuw")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => document.querySelector<HTMLElement>("#nieuw [data-autofocus]")?.focus({ preventScroll: true }), 450);
    } else openLog();
  }, [onWorkouts, openLog]);

  return (
    <AppCtx.Provider value={{ entries, sync, mounted, maxHr, setMaxHr, openLog, startLog, saveEntry, removeEntry, notify: setToast }}>
      {children}
      <div className="logbar">
        <button className="btn btn-primary" type="button" onClick={startLog}>Training loggen</button>
      </div>
      {dialog && (
        <LogDialog
          preset={dialog}
          maxHr={maxHr}
          onCancel={() => setDialog(null)}
          onSave={(e, replaceId) => {
            saveEntry(e, replaceId);
            setDialog(null);
          }}
          onError={setToast}
        />
      )}
      <div className={`toast${toast ? " show" : ""}`} role="status" aria-live="polite">{toast}</div>
    </AppCtx.Provider>
  );
}
