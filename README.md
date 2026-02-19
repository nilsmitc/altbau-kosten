# Altbau Kostenverfolgung

Web-App zur Kostenverfolgung von Renovierungsprojekten. Lokale SvelteKit-Anwendung mit dateibasierter JSON-Speicherung – kein Server, keine Datenbank nötig.

## Features

- **Dashboard** – KPI-Karten (Budget, Ausgaben, Verbleibend, Burn Rate, Offene Rechnungen), 4 klickbare Charts, Budget-Warnungen, Gewerke-Übersicht
- **Ausgaben** – Kostenbuchungen erfassen, bearbeiten, löschen; Volltext-Suche + kombinierbare Filter inkl. Herkunft (direkt / aus Rechnung); **Rückbuchungen**; optionales **Tätigkeit**-Feld
- **Rechnungen** – Auftragnehmer-Rechnungen mit mehreren Abschlagszahlungen (Abschlag / Schlussrechnung / Nachtrag); Beleg-Upload je Abschlag; Bezahlen erstellt automatisch eine Buchung
- **Nachträge** – Genehmigte Mehraufwände (Change Orders) auf Rechnungen erfassen; Gesamtauftrag = Auftragssumme + Σ Nachträge; Fortschrittsbalken berücksichtigt Nachträge
- **Flexible Ortzuordnung** – Buchungen auf einzelne Räume oder ganze Stockwerke buchen
- **Belege** – Dokumente (PDF/JPG/PNG) pro Buchung oder Abschlag hochladen und verwalten
- **Monatsverlauf** – Ausgaben-Trend + kumulierter Verlauf; Kategorie-Aufschlüsselung (Material / Arbeitslohn / Sonstiges)
- **Prognose** – Burn-Rate-Projektion, Budget-Erschöpfungsdatum, **Gebundene Mittel** (offene Rechnungen), Gewerk-Hochrechnungstabelle
- **Budget** – Gewerk-Budgets mit Ampel-Status und Inline-Bearbeitung; **Sammelgewerke** mit Tätigkeit-Aufschlüsselung
- **Sammelgewerk** – Gewerke (z.B. Generalunternehmer) als "Sammelgewerk" markieren: kein Budget-Alarm, stattdessen Tätigkeit-Aufschlüsselung
- **Bauplaner** – Zeitplan pro Gewerk (Gantt-Chart), Abhängigkeiten, Status-Tracking
- **Gewerke & Räume** – Stammdaten verwalten (CRUD), Räume nach Geschoss gruppiert
- **Export / Import** – Vollständiges ZIP-Backup aller Daten inkl. Belege und Rechnungen; Restore per Import
- **Icons & visuelles Design** – Heroicons (Inline-SVG) auf allen Seiten; sticky Navigation; konsistente Card- und Tabellen-Styles

## Tech Stack

- [SvelteKit](https://kit.svelte.dev/) + [Svelte 5](https://svelte.dev/) (TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Chart.js](https://www.chartjs.org/) – Doughnut- und Balkendiagramme
- [fflate](https://github.com/101arrowz/fflate) – ZIP-Kompression für Export/Import
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
echo '{"gewerke":[],"raeume":[],"budgets":[],"planung":[]}' > data/projekt.json
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
| `projekt.json` | Gewerke, Räume, Budgets, Bauplaner-Einträge |
| `buchungen.json` | Alle Kostenbuchungen (inkl. auto-erstellter aus Rechnungen) |
| `rechnungen.json` | Rechnungen mit Abschlägen und Nachträgen |
| `summary.json` | Auto-generierte Zusammenfassung |
| `belege/` | Belege pro Buchung (`{buchung-id}/datei`) |
| `rechnungen/` | Belege pro Abschlag (`{rechnung-id}/{abschlag-id}/datei`) |

Geldbeträge werden als **Integer in Cent** gespeichert (`300000` = 3.000,00 €).
Rückbuchungen werden als **negativer Betrag** gespeichert (`-5000` = −50,00 €).

### Felder Buchung

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `datum` | `string` | ISO-Datum `YYYY-MM-DD` |
| `betrag` | `number` | Cents, negativ bei Rückbuchungen |
| `gewerk` | `string` | Gewerk-ID |
| `raum` | `string\|null` | Raum-ID, `@EG`/`@OG`/`@KG` oder `null` |
| `kategorie` | `string` | `"Material"` \| `"Arbeitslohn"` \| `"Sonstiges"` |
| `beschreibung` | `string` | Pflichtfeld, Freitext |
| `rechnungsreferenz` | `string` | Optional, Rechnungsnummer |
| `taetigkeit` | `string?` | Optional, z.B. `"Fliesen Bad"` – für Sammelgewerke |
| `rechnungId` | `string?` | Gesetzt wenn auto-erstellt aus bezahltem Abschlag |
| `belege` | `string[]` | Dateinamen hochgeladener Dokumente |

### Felder Rechnung / Abschlag / Nachtrag

**Rechnung:**

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `id` | `string` | UUID v4 |
| `gewerk` | `string` | Gewerk-ID |
| `auftragnehmer` | `string` | Name des Auftragnehmers |
| `kategorie` | `string` | Buchungs-Kategorie für auto-Buchung |
| `auftragssumme` | `number?` | Cents, ursprüngliches Angebot |
| `nachtraege` | `Nachtrag[]` | Genehmigte Mehraufwände |
| `abschlaege` | `Abschlag[]` | Zahlungsvorgänge |

**Abschlag:**

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `typ` | `string` | `"abschlag"` \| `"schlussrechnung"` \| `"nachtragsrechnung"` |
| `rechnungsbetrag` | `number` | Cents |
| `status` | `string` | `"ausstehend"` \| `"offen"` \| `"bezahlt"` |
| `faelligkeitsdatum` | `string?` | `YYYY-MM-DD`, löst `ueberfaellig` aus wenn überschritten |
| `buchungId` | `string?` | Link zur auto-erstellten Buchung |
| `beleg` | `string?` | Dateiname in `data/rechnungen/{rechnungId}/{abschlagId}/` |

**Nachtrag** (Change Order):

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `beschreibung` | `string` | Freitext |
| `betrag` | `number` | Cents |
| `datum` | `string?` | `YYYY-MM-DD` |

### Gewerke-Felder

| Feld | Typ | Beschreibung |
|------|-----|-------------|
| `id` | `string` | Slugified Name, z.B. `"elektro"` |
| `name` | `string` | Anzeigename |
| `farbe` | `string` | Hex-Farbe für Charts |
| `sortierung` | `number` | Anzeigereihenfolge |
| `pauschal` | `boolean?` | Optional – Sammelgewerk-Flag, unterdrückt Budget-Ampel |

### Sammelgewerke

Gewerke die verschiedenartige Arbeiten abdecken (z.B. Generalunternehmer für Fliesen, Dämmung, Verputz) können als **Sammelgewerk** markiert werden:
- In `/gewerke` → Bearbeiten → Checkbox "Sammelgewerk – kein Budget-Alarm"
- Im Buchungsformular: optionales Feld **Tätigkeit** ausfüllen (z.B. `"Fliesen Bad"`)
- In `/budget`: "Sammelgewerk"-Badge statt Ampel + Tätigkeit-Aufschlüsselung

### Ortzuordnung

Das `raum`-Feld in Buchungen unterstützt drei Werte:

| Wert | Bedeutung |
|------|-----------|
| `null` | Kein Ort (allgemeine Kosten) |
| `"bad-eg"` | Einzelraum (Raum-ID) |
| `"@EG"` | Stockwerk-Buchung (Präfix `@`) |

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
    ├── buchungen/            # Ausgaben (Liste, Neu, Bearbeiten)
    ├── rechnungen/           # Rechnungen mit Abschlägen und Nachträgen
    ├── verlauf/              # Monatsverlauf
    ├── prognose/             # Prognose (Burn Rate, Budget-Erschöpfung, Hochrechnung)
    ├── belege/               # Dokumentenverwaltung
    ├── budget/               # Budget-Übersicht + Sammelgewerk-Aufschlüsselung
    ├── gewerke/              # Gewerke-Verwaltung (inkl. Sammelgewerk-Flag)
    ├── raeume/               # Räume-Verwaltung
    ├── planung/              # Bauplaner (Gantt, Abhängigkeiten)
    ├── einstellungen/        # Export / Import
    └── api/export/           # ZIP-Download-Endpoint
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
