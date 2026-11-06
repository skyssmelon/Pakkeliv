# Pakkeliv – netthandelsimulator for Android

En «telefon i telefonen» der du handler på nett med fiktive penger, følger pakker, krangler med kundeservice og drukner sakte i Klarnå-gjeld.

## Apper i spillet

| App | Parodi på | Hva den gjør |
|---|---|---|
| **Amazoom** | Amazon | Alt mulig: elektronikk, bøker, hjem, verktøy, leker, sport, skjønnhet, dyr, bil, baby, dagligvarer. Prime-prøve som blir et abonnement. |
| **Zalandoo** | Zalando | Klær og sko med størrelser og farger, 100 dagers retur, «prøv først, betal om 30 dager». |
| **Elkjøpt** | Elkjøp | Elektronikk, med forhåndsavkrysset Trygghetsavtale. |
| **Tæmu** | Temu | Billig skrot, lang frakt, toll, lykkehjul og varer som ikke ligner på bildet. |
| **PostNei** | PostNord/Posten | Sporing, toll-gebyr, hentefrist, hentested og en frekk kundeservicechat. |
| **Mæil** | Gmail | Ordrebekreftelser, sporingsnumre, nyhetsbrev med ekte tilbud, purringer, inkasso og phishing. |
| **SpareMinus** | SpareBank 1 | Brukskonto, sparekonto, kredittkort, forbrukslån, kredittscore og faste trekk. |
| **Klarnå** | Klarna | Faktura, del opp i 3, finansiering, utsettelse mot gebyr, purring, inkasso. |
| **Funn** | Finn.no | Kjøp brukt (av og til fra svindlere), selg tingene dine til lowballere. |
| **Boden** | – | Tingene du eier. Returner, selg, gi bort eller «bruk». |
| **Huskeliste** | – | Oppdrag: bursdagsgave, julegaver til familien, bli vinterklar, sparemål. |
| **Trofeer** | – | 24 trofeer. |

Spillet starter fredag 6. november 2026 med 8 450 kr på konto. Lønn kommer den 20., husleie og regninger går den 1. Singles Day, Black Week (med oppblåste førpriser uken før) og mellomjulssalg kommer automatisk.

## Prøve i nettleseren

Åpne `www/index.html` direkte, eller kjør `npm run serve` og gå til http://localhost:8080.

## Bygge APK (samme oppsett som Döner-spillet)

**Via GitHub Actions (enklest):**
1. Lag et nytt repo og push hele mappen (unntatt `node_modules/` og `android/`, de er i `.gitignore`).
2. Workflowen `.github/workflows/android.yml` kjører automatisk ved push til `main` (eller manuelt under *Actions*).
3. Last ned `pakkeliv-debug-apk` fra kjøringen og installer på telefonen.

**Lokalt med Android Studio:**
```bash
npm install
npm run android:init   # oppretter android/-mappen, ikoner og splash
npm run android:open   # åpner i Android Studio
```
Etter endringer i `www/`: `npm run android:sync`.

## Struktur

```
www/
  index.html
  css/style.css
  js/util.js          hjelpefunksjoner
  js/products.js      produktkatalogen (~1 850 produkter + farge-/størrelsesvarianter)
  js/game.js          spillmotor: klokke, bank, Klarnå, frakt, e-post, hendelser, trofeer
  js/os.js            telefonens hjemskjerm, navigasjon, varsler
  js/apps/*.js        én fil per app-gruppe
assets/               app-ikon og splash (brukes av @capacitor/assets)
```

### Legge til produkter
I `js/products.js` er produktene korte lister, f.eks. `simpleElec`, `clothes`, `misc` og `temu`. Legg til en linje i riktig liste, så dukker produktet opp i butikken, søket, kategoriene og nyhetsbrevene automatisk.

Lagring skjer i `localStorage` på telefonen. «Start på nytt» ligger i Innstillinger.
