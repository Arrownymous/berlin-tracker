/** Naam van de inlogcookie. */
export const AUTH_COOKIE = "b27_auth";
/** Cookie blijft ~1 jaar geldig (browsers staan maximaal 400 dagen toe). */
export const AUTH_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * Cookiewaarde afgeleid van het wachtwoord: wie het wachtwoord wijzigt, logt iedereen uit.
 * Web Crypto werkt zowel in de proxy als in route handlers.
 */
export async function authToken(password: string) {
  const data = new TextEncoder().encode(`berlin27:${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Alleen interne paden als bestemming na het inloggen. */
export const safeNext = (v: unknown) => (typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/");
