import AppShell from "@/components/AppShell";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

/** Gedeelde schil voor de pagina's achter de inlog: header, logvenster en footer. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <Header />
      {children}
      <SiteFooter />
    </AppShell>
  );
}
