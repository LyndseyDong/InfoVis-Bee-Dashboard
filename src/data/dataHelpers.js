import staticData from './realData.json';

let rawData = staticData;

export function setApiData(data) {
  rawData = data;
}

export const HIVE_IDS = ['Hive1', 'Hive2', 'Hive3', 'Hive4', 'Hive5'];
export const YEARS = ['2021', '2022', '2023', '2024', '2025'];

function getMiteThreshold(beeSample) {
  return beeSample === 'Cup' ? 9 : 4.5;
}

export function getHiveHealth(hiveId) {
  const readings = rawData.miteCount
    .filter(r => r.hiveId === hiveId)
    .sort((a, b) => b.date.localeCompare(a.date));
  if (!readings.length) return 'good';
  const latest = readings[0];
  const threshold = getMiteThreshold(latest.beeSample);
  if (latest.miteCount >= threshold * 1.5) return 'risk';
  if (latest.miteCount >= threshold) return 'watch';
  return 'good';
}

export function getLatestMiteCount(hiveId) {
  return rawData.miteCount
    .filter(r => r.hiveId === hiveId)
    .sort((a, b) => b.date.localeCompare(a.date))[0] || null;
}

export function getMiteData(hiveId, year = 'all') {
  return rawData.miteCount
    .filter(r => r.hiveId === hiveId && (year === 'all' || r.date.startsWith(year)))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({ id: r.id, date: r.date.slice(0, 7), rawDate: r.date, value: r.miteCount, beeSample: r.beeSample }));
}

export function getWeightData(hiveId, year = 'all') {
  return rawData.hiveWeight
    .filter(r => r.hiveId === hiveId && (year === 'all' || r.date.startsWith(year)))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({ id: r.id, date: r.date.slice(0, 7), rawDate: r.date, value: r.weight }));
}

export function getHarvestData(hiveId, year = 'all') {
  return rawData.honeyHarvest
    .filter(r => r.hiveId === hiveId && (year === 'all' || r.date.startsWith(year)))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({ id: r.id, date: r.date.slice(0, 7), rawDate: r.date, value: r.pounds }));
}

export function getTotalHarvest(hiveId, year = 'all') {
  return rawData.honeyHarvest
    .filter(r => r.hiveId === hiveId && (year === 'all' || r.date.startsWith(year)))
    .reduce((s, r) => s + r.pounds, 0);
}

export function getHiveEvents(hiveId) {
  return rawData.hiveEvents.filter(e => e.hiveId === hiveId);
}

export function getAllHiveEvents() {
  return rawData.hiveEvents;
}

export function getTreatments(hiveId, year = 'all') {
  const key = hiveId.replace('Hive', 'H');
  return rawData.treatments
    .filter(r => r.hiveId === key && (year === 'all' || r.date.startsWith(year)))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Returns { 'YYYY-MM-DD': [{ hiveId, treatment }] } for all non-null treatments
export function getAllTreatmentsByDate() {
  const result = {};
  rawData.treatments.forEach(t => {
    if (!t.treatment || t.treatment === 'None') return;
    if (!result[t.date]) result[t.date] = [];
    // Normalize H1→Hive1 for display consistency
    const displayId = t.hiveId.startsWith('Hive') ? t.hiveId : `Hive${t.hiveId.slice(1)}`;
    result[t.date].push({ hiveId: displayId, treatment: t.treatment });
  });
  return result;
}

// Multi-hive overlay data for compare page
// Returns [{ date, Hive1: val, Hive2: val, ... }]
export function getCompareData(hiveIds, metric, year = 'all') {
  const getFn = metric === 'weight' ? getWeightData : metric === 'harvest' ? getHarvestData : getMiteData;
  const byHive = {};
  hiveIds.forEach(id => {
    byHive[id] = Object.fromEntries(getFn(id, year).map(d => [d.date, d.value]));
  });
  const allDates = [...new Set(hiveIds.flatMap(id => Object.keys(byHive[id])))].sort();
  return allDates.map(date => ({
    date,
    ...Object.fromEntries(hiveIds.map(id => [id, byHive[id][date] ?? null])),
  }));
}

// Quarter-aggregated compare data — X-axis shows "2021 Q1", "2021 Q2", etc.
// mite/weight: averaged per quarter; harvest: summed per quarter
function monthToQuarterKey(yyyyMM) {
  const [y, m] = yyyyMM.split('-');
  return `${y} Q${Math.ceil(parseInt(m, 10) / 3)}`;
}

export function getCompareDataByQuarter(hiveIds, metric, year = 'all') {
  const getFn = metric === 'weight' ? getWeightData : metric === 'harvest' ? getHarvestData : getMiteData;
  const useSum = metric === 'harvest';

  const byHiveByQ = {};
  hiveIds.forEach(id => {
    const acc = {};
    getFn(id, year).forEach(d => {
      const q = monthToQuarterKey(d.date);
      if (!acc[q]) acc[q] = [];
      acc[q].push(d.value);
    });
    byHiveByQ[id] = Object.fromEntries(
      Object.entries(acc).map(([q, vals]) => {
        const agg = useSum
          ? Math.round(vals.reduce((s, v) => s + v, 0))
          : Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
        return [q, agg];
      })
    );
  });

  const dataQuarters = [...new Set(hiveIds.flatMap(id => Object.keys(byHiveByQ[id])))].sort();
  const allQuarters = year !== 'all'
    ? [`${year} Q1`, `${year} Q2`, `${year} Q3`, `${year} Q4`]
    : dataQuarters;
  return allQuarters.map(q => ({
    date: q,
    ...Object.fromEntries(hiveIds.map(id => [id, byHiveByQ[id][q] ?? null])),
  }));
}

// Year-aggregated compare data — X-axis shows "2021", "2022", etc.
// mite/weight: averaged per year; harvest: summed per year
export function getCompareDataByYear(hiveIds, metric, year = 'all') {
  const getFn = metric === 'weight' ? getWeightData : metric === 'harvest' ? getHarvestData : getMiteData;
  const useSum = metric === 'harvest';

  const byHiveByYear = {};
  hiveIds.forEach(id => {
    const acc = {};
    getFn(id, year).forEach(d => {
      const y = d.date.slice(0, 4);
      if (!acc[y]) acc[y] = [];
      acc[y].push(d.value);
    });
    byHiveByYear[id] = Object.fromEntries(
      Object.entries(acc).map(([y, vals]) => {
        const agg = useSum
          ? Math.round(vals.reduce((s, v) => s + v, 0))
          : Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
        return [y, agg];
      })
    );
  });

  const allYears = [...new Set(hiveIds.flatMap(id => Object.keys(byHiveByYear[id])))].sort();
  return allYears.map(y => ({
    date: y,
    ...Object.fromEntries(hiveIds.map(id => [id, byHiveByYear[id][y] ?? null])),
  }));
}

// Finance helpers
export function getRevenueByYear() {
  const byYear = Object.fromEntries(YEARS.map(y => [y, 0]));
  rawData.profit.forEach(r => {
    const y = r.date.slice(0, 4);
    if (byYear[y] !== undefined) byYear[y] += r.totalRevenue;
  });
  return YEARS.map(y => ({ year: y, revenue: Math.round(byYear[y]) }));
}

export function getExpensesByYear() {
  const byYear = Object.fromEntries(YEARS.map(y => [y, 0]));
  rawData.expenses.forEach(r => {
    const y = r.date.slice(0, 4);
    if (byYear[y] !== undefined) byYear[y] += r.totalCost;
  });
  return YEARS.map(y => ({ year: y, expenses: Math.round(byYear[y]) }));
}

export function getNetProfitByYear() {
  const rev = getRevenueByYear();
  const exp = getExpensesByYear();
  return YEARS.map((y, i) => ({
    year: y,
    revenue: rev[i].revenue,
    expenses: exp[i].expenses,
    netProfit: rev[i].revenue - exp[i].expenses,
  }));
}

export function getExpensesByCategory(year = 'all') {
  const cats = {};
  rawData.expenses
    .filter(r => year === 'all' || r.date.startsWith(year))
    .forEach(r => { cats[r.category] = (cats[r.category] || 0) + r.totalCost; });
  return Object.entries(cats).map(([category, total]) => ({ category, total: Math.round(total) }));
}

export function getRevenueByItem(year = 'all') {
  const items = {};
  rawData.profit
    .filter(r => year === 'all' || r.date.startsWith(year))
    .forEach(r => { items[r.itemSold] = (items[r.itemSold] || 0) + r.totalRevenue; });
  return Object.entries(items)
    .map(([item, total]) => ({ item, total: Math.round(total) }))
    .sort((a, b) => b.total - a.total);
}

export function getTotalRevenue(year = 'all') {
  return Math.round(rawData.profit
    .filter(r => year === 'all' || r.date.startsWith(year))
    .reduce((s, r) => s + r.totalRevenue, 0));
}

export function getTotalExpenses(year = 'all') {
  return Math.round(rawData.expenses
    .filter(r => year === 'all' || r.date.startsWith(year))
    .reduce((s, r) => s + r.totalCost, 0));
}

export function getAllHarvestByYear() {
  const byYear = Object.fromEntries(YEARS.map(y => [y, 0]));
  rawData.honeyHarvest.forEach(r => {
    const y = r.date.slice(0, 4);
    if (byYear[y] !== undefined) byYear[y] += r.pounds;
  });
  return YEARS.map(y => ({ year: y, pounds: Math.round(byYear[y]) }));
}
