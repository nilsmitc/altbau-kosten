# Altbau Kostenverfolgung

Web-App zur Kostenverfolgung von Altbau-Renovierungsprojekten. Lokale SvelteKit-Anwendung mit dateibasierter JSON-Speicherung – kein Server, keine Datenbank nötig.

## Features

- **Dashboard** – KPI-Karten (Budget, Ausgaben, Verbleibend), Charts, Budget-Warnungen
- **Buchungen** – Kostenbuchungen erfassen, bearbeiten, löschen; Volltext-Suche + kombinierbare Filter
- **Belege** – Dokumente (PDF/JPG/PNG) pro Buchung hochladen und verwalten
- **Monatsverlauf** – Ausgaben-Trend mit Kategorie-Aufschlüsselung (Material / Arbeitslohn / Sonstiges)
- **Budget** – Gewerk-Budgets mit Ampel-Status und Inline-Bearbeitung
- **Gewerke & Räume** – Stammdaten verwalten (CRUD), Räume nach Geschoss gruppiert

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/) (TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Chart.js](https://www.chartjs.org/) – Doughnut- und Balkendiagramme
- JSON-Dateien als Datenspeicher (kein externes DB)

## Voraussetzungen

- [Node.js](https://nodejs.org/) v22+ (empfohlen: via [nvm](https://github.com/nvm-sh/nvm))

## Installation

```bash
git clone https://github.com/nilsmitc/altbau-kosten.git
cd altbau-kosten
npm install
```

Datendateien anlegen:

```bash
mkdir -p data/belege
echo '{"gewerke":[],"raeume":[],"budgets":[]}' > data/projekt.json
echo '[]' > data/buchungen.json
echo '{"generiert":null,"gesamt":{"ist":0,"budget":0},"gewerke":[],"raeume":[],"letzteBuchungen":[]}' > data/summary.json
```

## Starten

```bash
npm run dev -- --open
# oder:
./start.sh
```

App läuft unter `http://localhost:5173`.

## Datenstruktur

Alle Daten liegen in `data/` (nicht im Repository):

| Datei | Inhalt |
|-------|--------|
| `projekt.json` | Gewerke, Räume, Budgets |
| `buchungen.json` | Alle Kostenbuchungen |
| `summary.json` | Auto-generierte Zusammenfassung |
| `belege/` | Hochgeladene Dokumente (ein Ordner pro Buchung) |

Geldbeträge werden als **Integer in Cent** gespeichert (`300000` = 3.000,00 €).

## Projektstruktur

```
src/
├── lib/
│   ├── domain.ts       # Typen, Validierung, Aggregation
│   ├── dataStore.ts    # JSON Datei-I/O
│   ├── format.ts       # Währungs- und Datumsformatierung
│   └── components/
│       ├── BuchungForm.svelte
│       └── Charts.svelte
└── routes/
    ├── +page.svelte          # Dashboard
    ├── buchungen/            # Buchungen (Liste, Neu, Bearbeiten)
    ├── verlauf/              # Monatsverlauf
    ├── belege/               # Dokumentenverwaltung
    ├── budget/               # Budget-Übersicht
    ├── gewerke/              # Gewerke-Verwaltung
    └── raeume/               # Räume-Verwaltung
```

## NPM Scripts

```bash
npm run dev        # Dev-Server starten
npm run build      # Produktions-Build
npm run preview    # Produktions-Build vorschauen
npm run check      # TypeScript + Svelte prüfen
```

## Lizenz

Privates Projekt – kein offizieller Lizenzrahmen.
