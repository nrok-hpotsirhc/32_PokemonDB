<div align="center">

# ⚡ Pokémon Card Tracker

### Track your Pokémon card collection's market value in real-time

[![Deploy to GitHub Pages](https://github.com/nrok-hpotsirhc/32_PokemonDB/actions/workflows/deploy.yml/badge.svg)](https://github.com/nrok-hpotsirhc/32_PokemonDB/actions/workflows/deploy.yml)
[![Price Sync](https://github.com/nrok-hpotsirhc/32_PokemonDB/actions/workflows/price-sync.yml/badge.svg)](https://github.com/nrok-hpotsirhc/32_PokemonDB/actions/workflows/price-sync.yml)
![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646cff?logo=vite&logoColor=white)

<br/>

[**🌐 Live Demo**](https://nrok-hpotsirhc.github.io/32_PokemonDB/) · [📄 Requirements](docs/requirements.md) · [🐛 Report Bug](https://github.com/nrok-hpotsirhc/32_PokemonDB/issues)

</div>

---

## 📸 Features

<table>
<tr>
<td width="50%">

### 📊 Dashboard
Gesamtwert deiner Sammlung auf einen Blick – mit KPI-Karten, Top Gainers/Losers und Sparkline-Charts.

</td>
<td width="50%">

### 🗂️ Portfolio-Tabelle
Sortierbare und filterbare Tabelle mit Kartenbildern, Preisen und Trendpfeilen (24h / 7d / 30d / 1y).

</td>
</tr>
<tr>
<td>

### ➕ Karten hinzufügen
Fuzzy-Search über 17.000+ Karten, Zustand, Variante, Grading und Kaufpreis erfassen.

</td>
<td>

### 📄 Excel Import/Export
Drag & Drop Import von `.xlsx` / `.csv` – inklusive Vorlage zum Download.

</td>
</tr>
<tr>
<td>

### 📷 OCR Scanner
Karte vor die Kamera halten → automatische Texterkennung → Matching mit der Datenbank.

</td>
<td>

### 🌙 Dark Mode
Automatisch nach System-Präferenz – hell oder dunkel.

</td>
</tr>
</table>

---

## 🏗️ Architektur

```
┌─────────────────────────────────────────────────┐
│                  GitHub Pages                    │
│         Static SPA (React + Vite)               │
├─────────────────────────────────────────────────┤
│  Dashboard │ Portfolio │ Add │ Import │ Scan    │
├─────────────────────────────────────────────────┤
│  TanStack Table │ Fuse.js │ Tesseract.js │ xlsx│
├─────────────────────────────────────────────────┤
│         JSON Files (Git-versioned data)         │
├─────────────────────────────────────────────────┤
│     GitHub Actions: Daily Price Sync (Cron)     │
│         pokemontcg.io API → JSON commit         │
└─────────────────────────────────────────────────┘
```

> **Zero-Cost**: Kein Backend, keine Datenbank, kein Server. Alles läuft kostenlos über GitHub Pages + Actions.

---

## 🛠️ Tech Stack

| Bereich | Technologie |
|---------|-------------|
| **Frontend** | React 19, TypeScript 5.8, Vite 6 |
| **Styling** | Tailwind CSS 4 |
| **Tabelle** | TanStack Table v8 |
| **Suche** | Fuse.js (Fuzzy Search) |
| **OCR** | Tesseract.js (WASM) |
| **Import/Export** | SheetJS (xlsx) |
| **Preisdaten** | [pokemontcg.io](https://pokemontcg.io/) API |
| **Hosting** | GitHub Pages |
| **CI/CD** | GitHub Actions |

---

## 🚀 Schnellstart

### Voraussetzungen

- [Node.js](https://nodejs.org/) ≥ 20
- npm ≥ 10

### Lokal starten

```bash
# Repository klonen
git clone https://github.com/nrok-hpotsirhc/32_PokemonDB.git
cd 32_PokemonDB/app

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Öffne [http://localhost:5173/32_PokemonDB/](http://localhost:5173/32_PokemonDB/) im Browser.

### Produktions-Build

```bash
npm run build
npm run preview
```

---

## 📁 Projektstruktur

```
32_PokemonDB/
├── app/                    # React SPA
│   ├── src/
│   │   ├── components/     # UI-Komponenten
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CardTable.tsx
│   │   │   ├── CardForm.tsx
│   │   │   ├── CardDetail.tsx
│   │   │   ├── ExcelImport.tsx
│   │   │   ├── OcrScanner.tsx
│   │   │   └── PriceSparkline.tsx
│   │   ├── hooks/          # Custom Hooks
│   │   ├── lib/            # Utilities & Business Logic
│   │   └── styles/         # Tailwind CSS
│   └── vite.config.ts
├── data/                   # JSON-Datenbank (Git-versioned)
│   ├── cards.json          # Karten-Stammdaten
│   ├── user-cards.json     # Nutzer-Sammlung
│   ├── prices-latest.json  # Aktuelle Preise
│   └── prices/             # Historische Preis-Snapshots
├── scripts/
│   └── sync-prices.ts      # Preis-Sync (pokemontcg.io)
├── .github/workflows/
│   ├── deploy.yml          # GitHub Pages Deployment
│   └── price-sync.yml      # Täglicher Preis-Cron (06:00 UTC)
└── docs/
    └── requirements.md     # Anforderungsdokumentation
```

---

## 📈 Preissynchronisation

Preise werden **täglich um 06:00 UTC** automatisch über GitHub Actions aktualisiert:

1. `sync-prices.ts` ruft aktuelle Preise von [pokemontcg.io](https://pokemontcg.io/) ab
2. Ergebnisse werden in `data/prices-latest.json` + täglichem Archiv gespeichert
3. GitHub Actions committet die Änderungen → automatisches Re-Deploy

Der Workflow kann auch manuell über **Actions → Price Sync → Run workflow** ausgelöst werden.

---

## 🗺️ Roadmap

- [x] **Phase 1** – MVP: Portfolio-Tabelle mit Preisen & Trends
- [x] **Phase 2** – Kartenverwaltung: CRUD mit Fuzzy Search
- [x] **Phase 3** – Excel Import/Export
- [x] **Phase 4** – OCR Karten-Scanner
- [x] **Phase 5** – Dashboard, Sparklines, Dark Mode
- [ ] **Phase 6** – Multi-User & Sharing
- [ ] **Phase 7** – PWA & Offline-Support

---

## 📜 Lizenz

Dieses Projekt steht unter der [MIT-Lizenz](LICENSE).

> **Hinweis**: Pokémon und alle zugehörigen Marken sind Eigentum von The Pokémon Company. Preise stammen von TCGPlayer via pokemontcg.io. Dieses Projekt ist nicht offiziell affiliiert.

---

<div align="center">

Made with ⚡ by [@nrok-hpotsirhc](https://github.com/nrok-hpotsirhc)

</div>
