"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "./AppShell";
import TowerMark from "./TowerMark";

const LINKS = [
  { href: "/", label: "Overzicht" },
  { href: "/trainingen", label: "Trainingen" },
] as const;

/**
 * Vaste balk bovenin. Zolang de fotohero eronder ligt is hij transparant met witte tekst;
 * daarna wordt hij licht met een haarlijn.
 */
export default function Header() {
  const path = usePathname() ?? "/";
  const { startLog } = useApp();
  const [over, setOver] = useState(true);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) {
      setOver(false);
      return;
    }
    const bar = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--bar")) || 64;
    const io = new IntersectionObserver(([e]) => setOver(e.isIntersecting), { rootMargin: `-${bar}px 0px 0px 0px` });
    io.observe(hero);
    return () => io.disconnect();
  }, [path]);

  return (
    <header className={`bar${over ? " over" : ""}`}>
      <div className="bar-in">
        <Link className="mark" href="/" aria-label="Berlin 2027, naar het overzicht">
          <TowerMark className="mark-tower" beacon={false} />
          <span>Berlin 2027</span>
        </Link>
        <nav className="nav" aria-label="Pagina's">
          {LINKS.map((l) => {
            const cur = l.href === "/" ? path === "/" : path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} aria-current={cur ? "page" : undefined}>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="bar-act">
          <button className="btn btn-primary btn-sm" type="button" onClick={startLog}>Training loggen</button>
        </div>
      </div>
    </header>
  );
}
