import type { StaticImageData } from "next/image";
import karlMarxAllee from "@/assets/berlin/karl-marx-allee.jpg";
import towerNight from "@/assets/berlin/tower-night.jpg";
import towerDusk from "@/assets/berlin/tower-dusk.jpg";
import marathonFinish from "@/assets/berlin/marathon-finish.jpg";
import oberbaum from "@/assets/berlin/oberbaumbruecke.jpg";
import brandenburg from "@/assets/berlin/brandenburger-tor.jpg";

export interface Photo {
  src: StaticImageData;
  alt: string;
  /** Wat er op de foto staat, voor de fotoverantwoording. */
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
}

const BY_SA_3 = { license: "CC BY-SA 3.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/" };
const BY_SA_4 = { license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/" };

/** Vrij te gebruiken foto's van Wikimedia Commons, met naamsvermelding in de footer. */
export const PHOTOS = {
  allee: {
    src: karlMarxAllee,
    alt: "De Karl-Marx-Allee bij nacht, met aan het eind de verlichte Fernsehturm",
    title: "Karl-Marx-Allee en Fernsehturm",
    author: "Diego Delso",
    ...BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Fernsehturm,_Berl%C3%ADn,_Alemania,_2016-04-21,_DD_40-42_HDR.jpg",
  },
  towerNight: {
    src: towerNight,
    alt: "De Fernsehturm bij nacht, gezien vanaf de voet van de toren",
    title: "Fernsehturm bij nacht",
    author: "Diego Delso",
    ...BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Fernsehturm,_Berl%C3%ADn,_Alemania,_2016-04-22,_DD_40-42_HDR.jpg",
  },
  towerDusk: {
    src: towerDusk,
    alt: "De Fernsehturm bij zonsondergang boven de daken van Berlijn",
    title: "Fernsehturm bij zonsondergang",
    author: "Arild Vågen",
    ...BY_SA_3,
    source: "https://commons.wikimedia.org/wiki/File:Berliner_Fernsehturm_November_2013.jpg",
  },
  finish: {
    src: marathonFinish,
    alt: "Lopers van de Berlin Marathon op weg naar de finish bij de Brandenburger Tor",
    title: "Berlin-Marathon, finish bij de Brandenburger Tor",
    author: "H. Milde (Mischelbach)",
    ...BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Berlin-Marathon_-_Ziel_-_Brandenburger_Tor_-_Foto-_H._Milde.jpg",
  },
  oberbaum: {
    src: oberbaum,
    alt: "De Oberbaumbrücke over de Spree in de middagzon",
    title: "Oberbaumbrücke",
    author: "Arild Vågen, bijgesneden door Tomer T",
    ...BY_SA_3,
    source: "https://commons.wikimedia.org/wiki/File:Oberbaumbr%C3%BCcke_November_2013_01_(crop).jpg",
  },
  brandenburg: {
    src: brandenburg,
    alt: "De Brandenburger Tor bij nacht, verlicht op een leeg plein",
    title: "Brandenburger Tor bij nacht",
    author: "Thomas Wolf, www.foto-tw.de",
    ...BY_SA_3,
    source: "https://commons.wikimedia.org/wiki/File:Brandenburger_Tor_nachts_2012-07.jpg",
  },
} satisfies Record<string, Photo>;

export const PHOTO_LIST: Photo[] = Object.values(PHOTOS);
