import { Redis } from "@upstash/redis";

/**
 * Zoekt de Upstash REST-gegevens, ook als Vercel er bij het koppelen een eigen voorvoegsel
 * aan gaf (bijv. STORAGE_KV_REST_API_URL). Alleen-lezen-tokens slaan we over.
 */
function find(suffixes: string[]) {
  for (const s of suffixes) {
    if (process.env[s]) return process.env[s];
  }
  for (const [k, v] of Object.entries(process.env)) {
    if (v && !k.includes("READ_ONLY") && suffixes.some((s) => k.endsWith("_" + s))) return v;
  }
  return undefined;
}

const url = find(["UPSTASH_REDIS_REST_URL", "KV_REST_API_URL"]);
const token = find(["UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN"]);

export const redis = url && token ? new Redis({ url, token }) : null;
export const ENTRIES_KEY = "berlin27:entries";
