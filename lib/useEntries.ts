"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Entry } from "./types";

const LS = "berlin27-log";
const LS_QUEUE = "berlin27-queue";
/** Gezet na de eerste geslaagde sync met de database op dit toestel. */
const LS_SYNCED = "berlin27-synced";
export type SyncState = "loading" | "server" | "pending" | "local" | "error";

/** Wijzigingen die de server nog niet heeft: nieuwe/gewijzigde trainingen en verwijderde id's. */
export interface Queue {
  upserts: Record<string, Entry>;
  deletes: string[];
}
const emptyQueue = (): Queue => ({ upserts: {}, deletes: [] });
export const queueSize = (q: Queue) => Object.keys(q.upserts).length + q.deletes.length;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* vol of geblokkeerd */
  }
}

/** Past de wachtrij toe op een lijst van de server. */
export function applyQueue(base: Entry[], q: Queue): Entry[] {
  const del = new Set(q.deletes);
  const out = base.filter((e) => !del.has(e.id) && !q.upserts[e.id]);
  for (const e of Object.values(q.upserts)) if (!del.has(e.id)) out.push(e);
  return out;
}

/** Zet het verschil tussen twee lijsten in de wachtrij. */
function enqueue(q: Queue, prev: Entry[], next: Entry[]): Queue {
  const before = new Map(prev.map((e) => [e.id, e]));
  const after = new Set(next.map((e) => e.id));
  const upserts = { ...q.upserts };
  let deletes = q.deletes;
  for (const e of next) {
    if (before.get(e.id) !== e) {
      upserts[e.id] = e;
      deletes = deletes.filter((id) => id !== e.id);
    }
  }
  for (const id of before.keys()) {
    if (!after.has(id)) {
      delete upserts[id];
      if (!deletes.includes(id)) deletes = [...deletes, id];
    }
  }
  return { upserts, deletes };
}

/** Haalt uit de wachtrij wat de server zojuist bevestigde (en sindsdien niet opnieuw wijzigde). */
function acknowledge(q: Queue, sent: Queue): Queue {
  const upserts = { ...q.upserts };
  for (const [id, e] of Object.entries(sent.upserts)) if (upserts[id] === e) delete upserts[id];
  const sentDel = new Set(sent.deletes);
  return { upserts, deletes: q.deletes.filter((id) => !sentDel.has(id)) };
}

/**
 * Trainingen staan altijd op het toestel (werkt offline) en worden als losse wijzigingen
 * naar /api/entries gestuurd. Lukt dat niet, dan blijven ze in een wachtrij staan en gaan
 * ze mee bij de volgende kans: weer online, app weer open, of een nieuwe wijziging.
 */
export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [sync, setSync] = useState<SyncState>("loading");
  const [pending, setPending] = useState(0);
  const serverOn = useRef(false);
  /** true zodra de server meldt dat er geen database is: dan alleen lokaal opslaan. */
  const noServer = useRef(false);
  /** Nog nooit met de database gesynct op dit toestel. */
  const firstRun = useRef(false);
  const current = useRef<Entry[]>([]);
  const queue = useRef<Queue>(emptyQueue());
  const busy = useRef(false);
  const retry = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback((list: Entry[], q: Queue) => {
    current.current = list;
    queue.current = q;
    setEntries(list);
    setPending(queueSize(q));
    write(LS, list);
    write(LS_QUEUE, q);
  }, []);

  const flush = useCallback(async () => {
    if (!serverOn.current || busy.current) return;
    if (!queueSize(queue.current)) {
      setSync("server");
      return;
    }
    busy.current = true;
    const sent = queue.current;
    try {
      const r = await fetch("/api/entries", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upserts: Object.values(sent.upserts), deletes: sent.deletes }),
      });
      if (r.status === 401) return void (window.location.href = `/login?next=${encodeURIComponent(location.pathname)}`);
      if (!r.ok) throw new Error(String(r.status));
      const { entries: remote } = (await r.json()) as { entries: Entry[] };
      const rest = acknowledge(queue.current, sent);
      commit(applyQueue(remote, rest), rest);
      setSync(queueSize(rest) ? "pending" : "server");
    } catch {
      setSync(navigator.onLine === false ? "pending" : "error");
      if (retry.current) clearTimeout(retry.current);
      retry.current = setTimeout(() => void flush(), 30_000);
    } finally {
      busy.current = false;
    }
    // Tijdens het versturen bijgekomen wijzigingen meteen hierna versturen.
    if (queueSize(queue.current) && queue.current !== sent && serverOn.current) void flush();
  }, [commit]);

  /** Nieuwste stand van de server ophalen, met eigen wachtrij erover heen. */
  const pull = useCallback(async () => {
    try {
      const r = await fetch("/api/entries", { cache: "no-store" });
      if (r.status === 401) {
        // Inlogcookie verlopen of wachtwoord gewijzigd: opnieuw inloggen.
        window.location.href = `/login?next=${encodeURIComponent(location.pathname)}`;
        return;
      }
      if (r.status === 501) {
        noServer.current = true;
        commit(current.current, emptyQueue());
        return setSync("local");
      }
      if (!r.ok) throw new Error(String(r.status));
      const { entries: remote } = (await r.json()) as { entries: Entry[] };
      noServer.current = false;
      let q = queue.current;
      // Eenmalig (nog geen wachtrij op dit toestel): trainingen die alleen hier staan,
      // bijvoorbeeld gelogd voordat de database gekoppeld was, samenvoegen in plaats van overschrijven.
      if (firstRun.current) {
        firstRun.current = false;
        write(LS_SYNCED, true);
        const ids = new Set(remote.map((e) => e.id));
        const onlyHere = current.current.filter((e) => !ids.has(e.id) && !(e.id in q.upserts));
        if (onlyHere.length) q = enqueue(q, [], onlyHere);
      }
      serverOn.current = true;
      commit(applyQueue(remote, q), q);
      setSync(queueSize(q) ? "pending" : "server");
      void flush();
    } catch {
      setSync(serverOn.current || queueSize(queue.current) ? "pending" : "local");
    }
  }, [commit, flush]);

  useEffect(() => {
    const local = read<Entry[]>(LS, []);
    firstRun.current = !read<boolean>(LS_SYNCED, false);
    const q = read<Queue>(LS_QUEUE, emptyQueue());
    commit(local, { upserts: q.upserts ?? {}, deletes: q.deletes ?? [] });
    void pull();

    const onOnline = () => void pull();
    const onVisible = () => document.visibilityState === "visible" && void pull();
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
      if (retry.current) clearTimeout(retry.current);
    };
  }, [commit, pull]);

  const update = useCallback(
    (fn: (prev: Entry[]) => Entry[]) => {
      const prev = current.current;
      const next = fn(prev);
      // Ook zonder verbinding in de wachtrij zetten; alleen niet als er bewust geen database is.
      const q = noServer.current ? queue.current : enqueue(queue.current, prev, next);
      commit(next, q);
      if (serverOn.current) {
        setSync("pending");
        void flush();
      } else if (!noServer.current) {
        setSync("pending");
      }
    },
    [commit, flush]
  );

  return { entries, update, sync, pending };
}
