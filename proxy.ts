import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, authToken } from "@/lib/auth";

/**
 * Afscherming met SITE_PASSWORD. Zonder geldige inlogcookie gaan pagina's naar /login
 * en krijgt de API een 401. Werkt ook in een app op het beginscherm en in de browser
 * van WhatsApp of Teams, waar een Basic Auth-venster vaak niet verschijnt.
 */
export async function proxy(req: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  if (pathname === "/login" || pathname === "/api/login") return NextResponse.next();

  if (req.cookies.get(AUTH_COOKIE)?.value === (await authToken(password))) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = new URL("/login", req.url);
  if (pathname !== "/") url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

// Manifest, app-iconen en geoptimaliseerde foto's blijven open: browsers halen die zonder
// inlog op ("Zet op beginscherm", inlogpagina). Ze bevatten geen persoonlijke data.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon).*)"],
};
