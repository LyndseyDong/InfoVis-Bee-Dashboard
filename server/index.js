const express = require('express');
const cors = require('cors');
const { createDb } = require('./db');

const app = express();
const db = createDb();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── GET all data (includes IDs for editing) ───────────────────────────────────
app.get('/api/data', (_req, res) => {
  try {
    const data = {
      miteCount: db.prepare(
        'SELECT id, hive_id as hiveId, date, mite_count as miteCount, bee_sample as beeSample FROM mite_count ORDER BY date'
      ).all(),
      hiveWeight: db.prepare(
        'SELECT id, hive_id as hiveId, date, weight FROM hive_weight ORDER BY date'
      ).all(),
      honeyHarvest: db.prepare(
        'SELECT id, hive_id as hiveId, date, pounds FROM honey_harvest ORDER BY date'
      ).all(),
      hiveEvents: db.prepare(
        'SELECT id, hive_id as hiveId, date, event, notes FROM hive_events ORDER BY date'
      ).all(),
      treatments: db.prepare(
        'SELECT id, hive_id as hiveId, date, treatment FROM treatments ORDER BY date'
      ).all(),
      profit: db.prepare(
        'SELECT id, date, item_sold as itemSold, total_revenue as totalRevenue FROM profit ORDER BY date'
      ).all(),
      expenses: db.prepare(
        'SELECT id, date, category, total_cost as totalCost FROM expenses ORDER BY date'
      ).all(),
    };
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Bulk upload endpoints ─────────────────────────────────────────────────────
function uploadRoute(stmt, transform) {
  return (req, res) => {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0)
      return res.status(400).json({ error: 'No rows provided' });
    try {
      const insert = db.prepare(stmt);
      db.transaction(() => rows.forEach(r => insert.run(...transform(r))))();
      res.json({ success: true, inserted: rows.length });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  };
}

app.post('/api/upload/miteCount', uploadRoute(
  'INSERT INTO mite_count (hive_id, date, mite_count, bee_sample) VALUES (?, ?, ?, ?)',
  r => [r.hiveId, r.date, parseInt(r.miteCount), r.beeSample]
));
app.post('/api/upload/hiveWeight', uploadRoute(
  'INSERT INTO hive_weight (hive_id, date, weight) VALUES (?, ?, ?)',
  r => [r.hiveId, r.date, parseFloat(r.weight)]
));
app.post('/api/upload/honeyHarvest', uploadRoute(
  'INSERT INTO honey_harvest (hive_id, date, pounds) VALUES (?, ?, ?)',
  r => [r.hiveId, r.date, parseFloat(r.pounds)]
));
app.post('/api/upload/hiveEvents', uploadRoute(
  'INSERT INTO hive_events (hive_id, date, event, notes) VALUES (?, ?, ?, ?)',
  r => [r.hiveId, r.date, r.event, r.notes || null]
));
app.post('/api/upload/treatments', uploadRoute(
  'INSERT INTO treatments (hive_id, date, treatment) VALUES (?, ?, ?)',
  r => [r.hiveId, r.date, r.treatment || null]
));
app.post('/api/upload/profit', uploadRoute(
  'INSERT INTO profit (date, item_sold, total_revenue) VALUES (?, ?, ?)',
  r => [r.date, r.itemSold, parseFloat(r.totalRevenue)]
));
app.post('/api/upload/expenses', uploadRoute(
  'INSERT INTO expenses (date, category, total_cost) VALUES (?, ?, ?)',
  r => [r.date, r.category, parseFloat(r.totalCost)]
));

// ── Single-record quick-add (POST) ────────────────────────────────────────────
app.post('/api/miteCount', (req, res) => {
  const { hiveId, date, miteCount, beeSample } = req.body;
  try {
    const info = db.prepare(
      'INSERT INTO mite_count (hive_id, date, mite_count, bee_sample) VALUES (?, ?, ?, ?)'
    ).run(hiveId, date, parseInt(miteCount), beeSample);
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/hiveWeight', (req, res) => {
  const { hiveId, date, weight } = req.body;
  try {
    const info = db.prepare(
      'INSERT INTO hive_weight (hive_id, date, weight) VALUES (?, ?, ?)'
    ).run(hiveId, date, parseFloat(weight));
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.post('/api/honeyHarvest', (req, res) => {
  const { hiveId, date, pounds } = req.body;
  try {
    const info = db.prepare(
      'INSERT INTO honey_harvest (hive_id, date, pounds) VALUES (?, ?, ?)'
    ).run(hiveId, date, parseFloat(pounds));
    res.json({ success: true, id: info.lastInsertRowid });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── Edit (PUT) ────────────────────────────────────────────────────────────────
app.put('/api/miteCount/:id', (req, res) => {
  const { miteCount, beeSample, date } = req.body;
  try {
    db.prepare(
      'UPDATE mite_count SET mite_count=?, bee_sample=?, date=? WHERE id=?'
    ).run(parseInt(miteCount), beeSample, date, parseInt(req.params.id));
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/hiveWeight/:id', (req, res) => {
  const { weight, date } = req.body;
  try {
    db.prepare('UPDATE hive_weight SET weight=?, date=? WHERE id=?')
      .run(parseFloat(weight), date, parseInt(req.params.id));
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.put('/api/honeyHarvest/:id', (req, res) => {
  const { pounds, date } = req.body;
  try {
    db.prepare('UPDATE honey_harvest SET pounds=?, date=? WHERE id=?')
      .run(parseFloat(pounds), date, parseInt(req.params.id));
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── Delete (DELETE) ───────────────────────────────────────────────────────────
app.delete('/api/miteCount/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM mite_count WHERE id=?').run(parseInt(req.params.id));
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/hiveWeight/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM hive_weight WHERE id=?').run(parseInt(req.params.id));
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

app.delete('/api/honeyHarvest/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM honey_harvest WHERE id=?').run(parseInt(req.params.id));
    res.json({ success: true });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`BuzzTracker API → http://localhost:${PORT}`));
