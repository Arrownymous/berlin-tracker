"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Entry } from "./types";

const LS = "berlin27-log";
export type SyncState = "loading" | "server" | "local" | "error";

function readLocal(): Entry[] {
  try {
    const raw = localStorage.getItem(LS);
    return raw ? (JSON.parse(raw) as Entry[]) : [];
  } catch {
    return [];
  }
}
function writeLocal(e: Entry[]) {
  try {
    localStorage.setItem(LS, JSON.stringify(e));
  } catch {
    /* vol of geblokkeerd */
  }
}

/**
 * Entries leven altijd in localStorage (werkt offline) en worden
 * gesynct naar /api/entries als er een database gekoppeld is.
 */
export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [sync, setSync] = useState<SyncState>("loading");
  const serverOn = useRef(false);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const current = useRef<Entry[]>([]);

  const push = useCallback((next: Entry[]) => {
    if (!serverOn.current) return;
    queue.current = queue.current.then(async () => {
      try {
        const r = await fetch("/api/entries", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: next }),
        });
        setSync(r.ok ? "server" : "error");
      } catch {
        setSync("error");
      }
    });
  }, []);

  useEffect(() => {
    const local = readLocal();
    current.current = local;
    setEntries(local);
    (async () => {
      try {
        const r = await fetch("/api/entries", { cache: "no-store" });
        if (r.status === 501) return setSync("local");
        if (!r.ok) return setSync("error");
        const { entries: remote } = (await r.json()) as { entries: Entry[] };
        serverOn.current = true;
        if (remote.length === 0 && local.length > 0) {
          push(local); // eerste keer: lokale data naar de server
        } else {
          current.current = remote;
          setEntries(remote);
          writeLocal(remote);
        }
        setSync("server");
      } catch {
        setSync("local");
      }
    })();
  }, [push]);

  const update = useCallback(
    (fn: (prev: Entry[]) => Entry[]) => {
      const next = fn(current.current);
      current.current = next;
      setEntries(next);
      writeLocal(next);
      push(next);
    },
    [push]
  );

  return { entries, update, sync };
}
