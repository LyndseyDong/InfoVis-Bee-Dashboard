import rawData from './realData.json';

export const HIVE_IDS = ['Hive1', 'Hive2', 'Hive3', 'Hive4', 'Hive5'];
export const YEARS = ['2021', '2022', '2023', '2024', '2025'];

// Mite threshold: >3 per 100 bees (half-cup ~150 bees, cup ~300 bees)
// HalfCup threshold ~4.5, Cup threshold ~9
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
  const readings = rawData.miteCount
    .filter(r => r.hiveId === hiveId)
    .sort((a, b) => b.date.localeCompare(a.date));
  return readings[0] || null;
}

export function getMiteData(hiveId, year = 'all') {
  return rawData.miteCount
    .filter(r => r.hiveId === hiveId && (year === 'all' || r.date.startsWith(year)))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({ date: r.date.slice(0, 7), value: r.miteCount, label: r.date }));
}

export function getWeightData(hiveId, year = 'all') {
  return rawData.hiveWeight
    .filter(r => r.hiveId === hiveId && (year === 'all' || r.date.startsWith(year)))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({ date: r.date.slice(0, 7), value: r.weight, label: r.date }));
}

export function getHarvestData(hiveId, year = 'all') {
  return rawData.honeyHarvest
    .filter(r => r.hiveId === hiveId && (year === 'all' || r.date.startsWith(year)))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({ date: r.date.slice(0, 7), value: r.pounds, label: r.date }));
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

// Finance helpers
export function getRevenueByYear() {
  const byYear = {};
  YEARS.forEach(y => { byYear[y] = 0; });
  rawData.profit.forEach(r => {
    const y = r.date.slice(0, 4);
    if (byYear[y] !== undefined) byYear[y] += r.totalRevenue;
  });
  return YEARS.map(y => ({ year: y, revenue: Math.round(byYear[y]) }));
}

export function getExpensesByYear() {
  const byYear = {};
  YEARS.forEach(y => { byYear[y] = 0; });
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
    .forEach(r => {
      cats[r.category] = (cats[r.category] || 0) + r.totalCost;
    });
  return Object.entries(cats).map(([category, total]) => ({ category, total: Math.round(total) }));
}

export function getRevenueByItem(year = 'all') {
  const items = {};
  rawData.profit
    .filter(r => year === 'all' || r.date.startsWith(year))
    .forEach(r => {
      items[r.itemSold] = (items[r.itemSold] || 0) + r.totalRevenue;
    });
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
  const byYear = {};
  YEARS.forEach(y => { byYear[y] = 0; });
  rawData.honeyHarvest.forEach(r => {
    const y = r.date.slice(0, 4);
    if (byYear[y] !== undefined) byYear[y] += r.pounds;
  });
  return YEARS.map(y => ({ year: y, pounds: Math.round(byYear[y]) }));
}
