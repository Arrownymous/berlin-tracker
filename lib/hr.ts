"use client";

// Standaard 5-zone model op basis van % van max hartslag.
export const HR_ZONES = [
  { zone: 1, from: 0.5, to: 0.6, label: "Herstel", short: "Z1" },
  { zone: 2, from: 0.6, to: 0.7, label: "Duurloop", short: "Z2" },
  { zone: 3, from: 0.7, to: 0.8, label: "Gemiddeld", short: "Z3" },
  { zone: 4, from: 0.8, to: 0.9, label: "Drempel", short: "Z4" },
  { zone: 5, from: 0.9, to: 1.5, label: "Maximaal", short: "Z5" },
] as const;

export function hrZone(avgHr: number, maxHr: number) {
  if (!avgHr || !maxHr) return null;
  const pct = avgHr / maxHr;
  return HR_ZONES.find((z) => pct >= z.from && pct < z.to) ?? HR_ZONES[HR_ZONES.length - 1];
}

const LS = "berlin27-maxhr";

export function readMaxHr(): number | null {
  try {
    const raw = localStorage.getItem(LS);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

export function writeMaxHr(v: number | null) {
  try {
    if (v) localStorage.setItem(LS, String(v));
    else localStorage.removeItem(LS);
  } catch {
    /* geblokkeerd */
  }
}
