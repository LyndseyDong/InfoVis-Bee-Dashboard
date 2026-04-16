const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'buzz.db');
const SEED_PATH = path.join(__dirname, '../src/data/realData.json');

function createDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS mite_count (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hive_id TEXT NOT NULL,
      date TEXT NOT NULL,
      mite_count INTEGER NOT NULL,
      bee_sample TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS hive_weight (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hive_id TEXT NOT NULL,
      date TEXT NOT NULL,
      weight REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS honey_harvest (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hive_id TEXT NOT NULL,
      date TEXT NOT NULL,
      pounds REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS hive_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hive_id TEXT NOT NULL,
      date TEXT NOT NULL,
      event TEXT NOT NULL,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS treatments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hive_id TEXT NOT NULL,
      date TEXT NOT NULL,
      treatment TEXT
    );
    CREATE TABLE IF NOT EXISTS profit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      item_sold TEXT NOT NULL,
      total_revenue REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      total_cost REAL NOT NULL
    );
  `);

  const count = db.prepare('SELECT COUNT(*) as c FROM mite_count').get();
  if (count.c === 0 && fs.existsSync(SEED_PATH)) {
    const raw = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
    seedData(db, raw);
    console.log('Database seeded from realData.json');
  }

  return db;
}

function seedData(db, raw) {
  const ins = {
    mite: db.prepare('INSERT INTO mite_count (hive_id, date, mite_count, bee_sample) VALUES (?, ?, ?, ?)'),
    weight: db.prepare('INSERT INTO hive_weight (hive_id, date, weight) VALUES (?, ?, ?)'),
    harvest: db.prepare('INSERT INTO honey_harvest (hive_id, date, pounds) VALUES (?, ?, ?)'),
    event: db.prepare('INSERT INTO hive_events (hive_id, date, event, notes) VALUES (?, ?, ?, ?)'),
    treatment: db.prepare('INSERT INTO treatments (hive_id, date, treatment) VALUES (?, ?, ?)'),
    profit: db.prepare('INSERT INTO profit (date, item_sold, total_revenue) VALUES (?, ?, ?)'),
    expense: db.prepare('INSERT INTO expenses (date, category, total_cost) VALUES (?, ?, ?)'),
  };

  db.transaction(() => {
    raw.miteCount.forEach(r => ins.mite.run(r.hiveId, r.date, r.miteCount, r.beeSample));
    raw.hiveWeight.forEach(r => ins.weight.run(r.hiveId, r.date, r.weight));
    raw.honeyHarvest.forEach(r => ins.harvest.run(r.hiveId, r.date, r.pounds));
    raw.hiveEvents.forEach(r => ins.event.run(r.hiveId, r.date, r.event, r.notes || null));
    raw.treatments.forEach(r => ins.treatment.run(r.hiveId, r.date, r.treatment || null));
    raw.profit.forEach(r => ins.profit.run(r.date, r.itemSold, r.totalRevenue));
    raw.expenses.forEach(r => ins.expense.run(r.date, r.category, r.totalCost));
  })();
}

module.exports = { createDb };
