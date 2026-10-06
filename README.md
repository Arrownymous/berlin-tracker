# Berlin 2027 · Trainingsdashboard

Persoonlijk trainingsdashboard richting de Berlin Marathon (zo 26 september 2027).
Next.js 15 (App Router), Chart.js, optioneel Upstash Redis voor sync tussen apparaten.

## Lokaal draaien

```bash
npm install
npm run dev
```

Open http://localhost:3000. Zonder database wordt alles in je browser (localStorage) bewaard.

## Deployen naar Vercel

1. Maak een nieuwe (privé) repo op GitHub en push dit project:
   ```bash
   git init
   git add .
   git commit -m "Berlin 2027 dashboard"
   git branch -M main
   git remote add origin git@github.com:<jouw-naam>/berlin-tracker.git
   git push -u origin main
   ```
2. Ga naar vercel.com → **Add New… → Project** → importeer de repo. Framework wordt automatisch herkend als Next.js. Klik **Deploy**.
3. **Wachtwoord instellen:** Project → **Settings → Environment Variables** → voeg `SITE_PASSWORD` toe. Bij het openen van de site vraagt je browser om inloggen: gebruikersnaam maakt niet uit, wachtwoord is `SITE_PASSWORD`.
4. **Sync tussen telefoon en laptop (optioneel):** Project → **Storage** → **Create Database** → kies **Upstash (Redis)** → koppel aan dit project. Vercel zet de variabelen (`KV_REST_API_URL` / `KV_REST_API_TOKEN` of `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) automatisch. Beide varianten worden ondersteund.
5. **Redeploy** (Deployments → ⋯ → Redeploy) zodat de nieuwe variabelen actief worden.

Onderaan de pagina zie je of je gesynct bent met je database of alleen lokaal opslaat.
Heb je al lokaal gelogd voordat de database er was, dan wordt die data bij de eerste keer automatisch geüpload.

## Op je telefoon

Open je Vercel-URL op je telefoon en zet hem op je beginscherm (iPhone: Safari → Deel → **Zet op beginscherm**; Android: Chrome → ⋮ → **App installeren**). Hij opent dan als losse app zonder adresbalk. Koppel de database (stap 4) zodat telefoon en laptop dezelfde trainingen zien.

## Structuur

| Pad | Wat |
| --- | --- |
| `lib/plan.ts` | Het volledige 51-weken schema. Pas hier trainingen of kilometers aan. |
| `lib/dates.ts` | Startdatum, racedatum en formattering |
| `lib/useEntries.ts` | Opslag: localStorage + sync met `/api/entries` |
| `app/api/entries/route.ts` | API voor lezen en opslaan in Redis |
| `proxy.ts` | Wachtwoordbeveiliging (Basic Auth) |
| `app/page.tsx` · `components/Home.tsx` | Overzicht: fotohero met aftelklok, stand van zaken, deze week, voortgang, hartslag |
| `app/trainingen/page.tsx` · `components/Workouts.tsx` | Trainingen: invoerformulier, logboek per maand (wijzigen/verwijderen) en volledig schema |
| `components/AppShell.tsx` | Gedeelde staat voor beide pagina's: trainingen, max hartslag, logvenster, meldingen |
| `components/LogForm.tsx` | Het invoerformulier, gebruikt in het logvenster en op de trainingenpagina |
| `components/TowerMark.tsx` | De Fernsehturm als SVG, ook als "I" in het BERLIN-woordmerk |
| `lib/photos.ts` · `assets/berlin/` | Foto's van Wikimedia Commons met naamsvermelding (getoond in de footer) |
| `components/` (overig) | Eén bestand per sectie, plus Header, SiteFooter, PhotoBand en Charts |
| `app/globals.css` | Volledige vormgeving: kleuren, typografie en responsive regels |

## Data naar Google Sheets

Klik **Exporteer CSV** en importeer het bestand in Google Sheets via **Bestand → Importeren**.
