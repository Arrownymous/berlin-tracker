import type { Metadata, Viewport } from "next";
import { Archivo, Instrument_Serif } from "next/font/google";
import "./globals.css";

// Archivo met breedte-as: expanded voor het woordmerk, condensed voor grote cijfers.
const sans = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-sans", display: "swap" });
// Serif-cursief alleen als editorial accent in intro's.
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });

export const metadata: Metadata = {
  title: "Berlin 2027 · Marathontraining",
  description: "Persoonlijk trainingsdashboard richting de Berlin Marathon 2027",
  appleWebApp: { capable: true, title: "Berlin 2027", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#F4F2EC",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${sans.variable} ${serif.variable}`}>
      {/* Extensies zoals ColorZilla zetten attributen op <body> vóór hydratatie; die verschillen negeren we hier. */}
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
