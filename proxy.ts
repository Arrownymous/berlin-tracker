import { NextRequest, NextResponse } from "next/server";

// Simpele Basic Auth: zet SITE_PASSWORD in Vercel om de site af te schermen.
export function proxy(req: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const pass = decoded.slice(decoded.indexOf(":") + 1);
      if (pass === password) return NextResponse.next();
    } catch {
      /* ongeldige header */
    }
  }
  return new NextResponse("Inloggen vereist", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Berlin 2027", charset="UTF-8"' },
  });
}

// Manifest en app-iconen blijven open: browsers halen die zonder wachtwoord op,
// anders werkt "Zet op beginscherm" niet. Ze bevatten geen persoonlijke data.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icon|apple-icon).*)"],
};
