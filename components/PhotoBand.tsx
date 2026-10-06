import Image from "next/image";
import type { ReactNode } from "react";
import type { Photo } from "@/lib/photos";

/** Schermbrede foto tussen secties, met een korte kop linksonder. */
export default function PhotoBand({ photo, kicker, title, children, pos = "center", tall }: {
  photo: Photo;
  kicker: string;
  title: ReactNode;
  children?: ReactNode;
  /** object-position, om het onderwerp in beeld te houden bij smalle schermen */
  pos?: string;
  tall?: boolean;
}) {
  return (
    <figure className={`band${tall ? " tall" : ""}`}>
      <div className="band-img">
        <Image src={photo.src} alt={photo.alt} fill sizes="100vw" placeholder="blur" style={{ objectPosition: pos }} />
      </div>
      <div className="band-shade" aria-hidden />
      <figcaption className="band-cap wrap">
        <span className="label">{kicker}</span>
        <p className="band-title">{title}</p>
        {children && <div className="band-text">{children}</div>}
      </figcaption>
    </figure>
  );
}
