import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, AUTH_MAX_AGE, authToken, safeNext } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Formulier van /login: bij het juiste wachtwoord een cookie zetten en doorsturen. */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const next = safeNext(form?.get("next"));
  const password = process.env.SITE_PASSWORD;

  if (!password) return NextResponse.redirect(new URL(next, req.url), 303);

  if (form?.get("password") === password) {
    const res = NextResponse.redirect(new URL(next, req.url), 303);
    res.cookies.set(AUTH_COOKIE, await authToken(password), {
      httpOnly: true,
      secure: req.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_MAX_AGE,
    });
    return res;
  }

  // Even wachten maakt raden met een script een stuk trager.
  await new Promise((r) => setTimeout(r, 800));
  const back = new URL("/login", req.url);
  back.searchParams.set("fout", "1");
  if (next !== "/") back.searchParams.set("next", next);
  return NextResponse.redirect(back, 303);
}
