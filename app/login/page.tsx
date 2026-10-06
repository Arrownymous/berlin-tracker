import type { Metadata } from "next";
import Image from "next/image";
import { PHOTOS } from "@/lib/photos";
import { safeNext } from "@/lib/auth";
import { Wordmark } from "@/components/TowerMark";

export const metadata: Metadata = { title: "Inloggen · Berlin 2027" };

/** Inlogpagina met een gewoon wachtwoordveld; werkt op elk toestel, ook als app op het beginscherm. */
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ [k: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  const wrong = sp.fout === "1";

  return (
    <main className="login">
      <Image src={PHOTOS.towerNight.src} alt="" fill sizes="100vw" placeholder="blur" loading="eager" fetchPriority="high" className="hero-img" style={{ objectPosition: "50% 30%" }} />
      <div className="hero-shade" aria-hidden />
      <div className="login-in">
        <span className="label">Marathontraining · 51 weken</span>
        <Wordmark className="login-mark" />
        <p className="login-year">2027</p>

        <form className="login-form" method="post" action="/api/login">
          <input type="hidden" name="next" value={next} />
          {/* Verborgen gebruikersnaam zodat wachtwoordmanagers (iCloud-sleutelhanger) het wachtwoord opslaan. */}
          <input type="text" name="username" autoComplete="username" defaultValue="berlin" hidden readOnly />
          <label htmlFor="pw" className="label">Wachtwoord</label>
          <input
            id="pw"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            autoFocus
            aria-invalid={wrong}
            aria-describedby={wrong ? "pw-err" : undefined}
          />
          {wrong && <p id="pw-err" className="login-err" role="alert">Dat wachtwoord klopt niet. Probeer het opnieuw.</p>}
          <button type="submit" className="btn btn-light">Inloggen</button>
          <p className="login-note">Je blijft op dit toestel een jaar ingelogd.</p>
        </form>
      </div>
    </main>
  );
}
