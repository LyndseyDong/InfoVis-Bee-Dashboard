# 🐝 BuzzTracker v2

Beekeeping management dashboard using your real data.

## Setup

```bash
npm install
npm run dev
```
Open **http://localhost:5173** — login with any username + password.

## Pages

### 🍯 Health (top nav)
- **Overview** — all 5 hives as honeycomb hexagons, color-coded by mite count risk
  - Green = safe, Orange = watch, Red = at risk (based on industry 3% threshold)
  - Honey harvest bar chart by year
  - Hive summary table with click-through
- **Single Hive** (click any hive) — Mite Count / Hive Weight / Honey Harvest charts
  - Treatments applied breakdown
  - Hive Event Log (deaths, replacements, splits)
  - Recent mite readings with bar indicators
  - Quick nav between hives

### 💰 Finance (top nav)
- **Revenue vs Expenses** — grouped bar + net profit trend line
- **Expense Breakdown** — pie chart + bar breakdown by category (Equipment, Medication, Supplies, Consumable)
- **Revenue by Product** — horizontal bar chart ranked by product (honey jars, beeswax, hives sold...)

### Year Filter
Top-right dropdown filters ALL charts and stats to a specific year, or show all years combined.

## Data Sources
- `MiteCount.csv` — 125 mite readings across Hive1–Hive5 (2021–2025)
- `HiveWeight.csv` — 175 weight measurements
- `HoneyHarvest.csv` — 75 harvest records
- `Expenses.csv` — 61 expense entries (Equipment, Medication, Supplies, Consumable)
- `Profit.csv` — 99 sales records (honey jars, beeswax, hives)
- `Treatments.csv` — 188 treatment records
- `HiveEvents.rtf` — 6 key events (deaths, replacements, splits)

  ### Analytics

  ### 
