import { NextRequest, NextResponse } from "next/server";
import { redis, ENTRIES_KEY } from "@/lib/redis";
import type { Entry } from "@/lib/types";

export const dynamic = "force-dynamic";

const TYPES = new Set(["loop", "kracht", "cross"]);

function clean(input: unknown): Entry[] | null {
  if (!Array.isArray(input) || input.length > 5000) return null;
  const out: Entry[] = [];
  for (const e of input) {
    if (!e || typeof e !== "object") return null;
    const x = e as Record<string, unknown>;
    if (typeof x.id !== "string" || typeof x.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x.date)) return null;
    if (typeof x.type !== "string" || !TYPES.has(x.type)) return null;
    out.push({
      id: x.id.slice(0, 40),
      date: x.date,
      type: x.type as Entry["type"],
      km: Math.max(0, Number(x.km) || 0),
      min: Math.max(0, Number(x.min) || 0),
      ...(x.pain != null ? { pain: Math.min(10, Math.max(0, Number(x.pain) || 0)) } : {}),
      rpe: Math.min(10, Math.max(1, Number(x.rpe) || 1)),
      ...(Number(x.avgHr) > 0 ? { avgHr: Math.min(250, Math.round(Number(x.avgHr))) } : {}),
      note: typeof x.note === "string" ? x.note.slice(0, 500) : "",
      created: Number(x.created) || Date.now(),
    });
  }
  return out;
}

export async function GET() {
  if (!redis) return NextResponse.json({ error: "no_storage" }, { status: 501 });
  const entries = (await redis.get<Entry[]>(ENTRIES_KEY)) ?? [];
  return NextResponse.json({ entries });
}

export async function PUT(req: NextRequest) {
  if (!redis) return NextResponse.json({ error: "no_storage" }, { status: 501 });
  const body = await req.json().catch(() => null);
  const entries = clean(body?.entries);
  if (!entries) return NextResponse.json({ error: "invalid" }, { status: 400 });
  await redis.set(ENTRIES_KEY, entries);
  return NextResponse.json({ ok: true, count: entries.length });
}

/**
 * Losse wijzigingen toepassen: { upserts: Entry[], deletes: string[] }.
 * Elk toestel stuurt alleen wat het zelf veranderde, zodat het nooit de trainingen
 * van een ander toestel overschrijft. Geeft de nieuwe volledige lijst terug.
 */
export async function PATCH(req: NextRequest) {
  if (!redis) return NextResponse.json({ error: "no_storage" }, { status: 501 });
  const body = await req.json().catch(() => null);
  const upserts = clean(body?.upserts ?? []);
  const deletes: unknown = body?.deletes ?? [];
  if (!upserts || !Array.isArray(deletes) || deletes.length > 5000 || deletes.some((d) => typeof d !== "string")) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const del = new Set(deletes as string[]);
  const byId = new Map(upserts.map((e) => [e.id, e]));
  const current = (await redis.get<Entry[]>(ENTRIES_KEY)) ?? [];
  const next = current.filter((e) => !del.has(e.id)).map((e) => byId.get(e.id) ?? e);
  const known = new Set(current.map((e) => e.id));
  for (const e of upserts) if (!known.has(e.id) && !del.has(e.id)) next.push(e);
  if (next.length > 5000) return NextResponse.json({ error: "too_many" }, { status: 400 });
  await redis.set(ENTRIES_KEY, next);
  return NextResponse.json({ entries: next });
}
