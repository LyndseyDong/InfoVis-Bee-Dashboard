# 🐝 BuzzTracker

Beekeeping management dashboard for tracking hive health, treatments, harvests, and finances.

## Setup

```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..

# Start both frontend and backend
npm run dev
```

- Frontend: **http://localhost:5173**
- Backend API: **http://localhost:3001**
- Login with any username + password

## Pages

### 🍯 Health Overview
- All 5 hives displayed as a honeycomb, color-coded by mite count risk
  - Green = good, Orange = watch, Red = at risk
- Health status and mite counts update based on the selected year
- Honey harvest bar chart by year
- Hive summary table with click-through to individual hives
- Quick-add button to log a new mite count, weight, or harvest record

### 🐝 Individual Hive
- Mite Count / Hive Weight / Honey Harvest bar charts
  - All Years → aggregated by year
  - Single year selected → aggregated by quarter (Q1–Q4)
- Mite threshold reference line at 9 (danger level), fixed Y-axis 0–12
- Treatments applied breakdown
- Hive Event Log (deaths, replacements, splits)
- Recent mite readings with inline edit and delete
- Quick navigation between hives

### 📊 Compare
- Side-by-side bar chart for up to 5 hives across mite count, weight, or harvest
- All Years → by year · Single year → by quarter
- Hive selector with minimum 2 required
- Side-by-side summary cards per hive

### 📅 Calendar
- Monthly calendar showing treatments, vaccines, due dates, and mite alerts
- Dot legend: amber circle = Treatment · purple square = Vaccine · blue outlined circle = Due date · red circle = Mite alert
- Click any day for a detailed popup
- Bottom summary: treatments, vaccines, mite alerts, and upcoming due dates for the month

### 💰 Finance
- Revenue vs Expenses grouped bar chart + net profit trend by year
- Expense breakdown by category (Equipment, Medication, Supplies, Consumable)
- Revenue by product with sortable ranking

### 📤 Upload
- Import CSV files for any data type (mite count, weight, harvest, treatments, vaccines, profit, expenses, events)
- Preview rows before importing
- Uploaded data is reflected immediately across all pages

## Year Filter
Top-right dropdown filters all charts and stats to a specific year, or shows all years combined.

## Hive Colors
| Hive | Color |
|------|-------|
| Hive1 | #d7191c (red) |
| Hive2 | #fdae61 (orange) |
| Hive3 | #ffffbf (light yellow) |
| Hive4 | #abdda4 (light green) |
| Hive5 | #2b83ba (blue) |

## CSV Upload Formats

| Type | Columns | Notes |
|------|---------|-------|
| Mite Count | hiveId, date, miteCount, beeSample | beeSample: HalfCup or Cup |
| Hive Weight | hiveId, date, weight | weight in lbs |
| Honey Harvest | hiveId, date, pounds | pounds harvested |
| Hive Events | hiveId, date, event, notes | event: HiveDeath, Replaced, Split |
| Treatments | hiveId, date, treatment | hiveId uses H1–H5 format |
| Vaccines | hiveId, date, vaccine | hiveId uses H1–H5 format |
| Revenue | date, itemSold, totalRevenue | totalRevenue in dollars |
| Expenses | date, category, totalCost | category: Equipment, Medication, Supplies, Consumable |

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, React Router v6
- **Backend**: Node.js, Express, better-sqlite3
- **CSV Parsing**: PapaParse
