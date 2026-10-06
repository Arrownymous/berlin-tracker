export type EntryType = "loop" | "kracht" | "cross";

export interface Entry {
  id: string;
  date: string; // YYYY-MM-DD
  type: EntryType;
  km: number;
  min: number;
  pain?: number; // 0–10, wordt niet meer gelogd; alleen nog in oudere entries
  rpe: number; // 1–10 zwaarte
  avgHr?: number; // gem. hartslag bpm
  note: string;
  created: number;
}

export interface Session {
  d: number; // 0 = maandag
  kind: "loop" | "kracht";
  km: number;
  title: string;
  desc: string;
  date: string;
}

export interface Week {
  n: number;
  start: Date;
  ph: number;
  rec: boolean;
  sessions: Session[];
  km: number;
  longest: number;
  key: string;
}
