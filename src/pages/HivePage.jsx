import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { HiveHex } from '../components/Hexagon';
import { useApp } from '../context/AppContext';
import {
  HIVE_IDS, getHiveHealth, getLatestMiteCount,
  getMiteData, getWeightData, getHarvestData,
  getMiteDataByYear, getWeightDataByYear, getHarvestDataByYear,
  getTotalHarvest, getHiveEvents, getTreatments,
} from '../data/dataHelpers';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';

const EVENT_COLORS = { HiveDeath: '#DC2626', Replaced: '#16A34A', Split: '#2563EB' };
const EVENT_ICONS  = { HiveDeath: '💀', Replaced: '🆕', Split: '✂️' };
const today = () => new Date().toISOString().slice(0, 10);

// ── Quick-add inline form ─────────────────────────────────────────────────────
function QuickAddForm({ hiveId, metric, onSaved, onCancel }) {
  const endpoint = metric === 'mite' ? 'miteCount' : metric === 'weight' ? 'hiveWeight' : 'honeyHarvest';
  const [date,   setDate]   = useState(today());
  const [val,    setVal]    = useState('');
  const [sample, setSample] = useState('HalfCup');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    const body = metric === 'mite'
      ? { hiveId, date, miteCount: val, beeSample: sample }
      : metric === 'weight'
        ? { hiveId, date, weight: val }
        : { hiveId, date, pounds: val };
    try {
      const res  = await fetch(`/api/${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await onSaved();
    } catch (err) { setError(err.message); setSaving(false); }
  };

  const label = metric === 'mite' ? 'Mite Count' : metric === 'weight' ? 'Weight (lbs)' : 'Pounds harvested';

  return (
    <form onSubmit={handleSubmit} className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-3 flex flex-wrap gap-3 items-end fade-in">
      <div>
        <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1 font-nunito">Date</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required
          className="border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs font-nunito text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white" />
      </div>
      <div>
        <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1 font-nunito">{label}</label>
        <input type="number" min="0" step={metric === 'mite' ? '1' : '0.1'} value={val}
          onChange={e => setVal(e.target.value)} required placeholder="0"
          className="w-24 border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs font-nunito text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white" />
      </div>
      {metric === 'mite' && (
        <div>
          <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1 font-nunito">Sample</label>
          <select value={sample} onChange={e => setSample(e.target.value)}
            className="border border-amber-200 rounded-lg px-2.5 py-1.5 text-xs font-nunito text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white">
            <option>HalfCup</option>
            <option>Cup</option>
          </select>
        </div>
      )}
      {error && <p className="text-red-500 text-xs font-nunito w-full">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving}
          className="bg-honey-600 hover:bg-honey-700 disabled:opacity-60 text-white font-bold text-xs rounded-lg px-3 py-1.5 transition-colors font-nunito">
          {saving ? '…' : 'Save'}
        </button>
        <button type="button" onClick={onCancel}
          className="border border-amber-200 text-amber-600 font-bold text-xs rounded-lg px-3 py-1.5 hover:bg-white transition-colors font-nunito">
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Inline edit cell for mite readings ───────────────────────────────────────
function EditableReading({ reading, onSaved }) {
  const [editing,  setEditing]  = useState(false);
  const [val,      setVal]      = useState(String(reading.value));
  const [sample,   setSample]   = useState(reading.beeSample || 'Cup');
  const [saving,   setSaving]   = useState(false);

  const save = async () => {
    if (!reading.id) return;
    setSaving(true);
    await fetch(`/api/miteCount/${reading.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ miteCount: val, beeSample: sample, date: reading.rawDate }),
    });
    await onSaved();
    setEditing(false);
    setSaving(false);
  };

  const del = async () => {
    if (!reading.id || !confirm('Delete this reading?')) return;
    await fetch(`/api/miteCount/${reading.id}`, { method: 'DELETE' });
    await onSaved();
  };

  const color = reading.value >= 9 ? '#DC2626' : reading.value >= 5 ? '#F97316' : '#16A34A';
  const pct   = Math.min(100, (reading.value / 15) * 100);

  if (editing) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 fade-in">
        <div className="flex gap-2 mb-2 items-center">
          <input type="number" min="0" value={val} onChange={e => setVal(e.target.value)}
            className="w-16 border border-amber-300 rounded-lg px-2 py-1 text-xs font-nunito text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300" />
          <select value={sample} onChange={e => setSample(e.target.value)}
            className="border border-amber-300 rounded-lg px-2 py-1 text-xs font-nunito text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300">
            <option>HalfCup</option>
            <option>Cup</option>
          </select>
        </div>
        <div className="flex gap-1.5">
          <button onClick={save} disabled={saving}
            className="bg-honey-600 text-white font-bold text-[10px] rounded-lg px-2.5 py-1 font-nunito disabled:opacity-60">
            {saving ? '…' : 'Save'}
          </button>
          <button onClick={() => setEditing(false)}
            className="border border-amber-200 text-amber-600 font-bold text-[10px] rounded-lg px-2.5 py-1 font-nunito">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      <div className="flex justify-between mb-1 items-center">
        <span className="text-[11px] text-amber-400 font-nunito">{reading.date}</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold font-nunito" style={{ color }}>{reading.value}</span>
          {reading.id && (
            <div className="hidden group-hover:flex gap-1">
              <button onClick={() => setEditing(true)} title="Edit"
                className="text-[10px] text-amber-400 hover:text-amber-600 leading-none px-1">✏️</button>
              <button onClick={del} title="Delete"
                className="text-[10px] text-amber-400 hover:text-red-500 leading-none px-1">🗑</button>
            </div>
          )}
        </div>
      </div>
      <div className="h-1 bg-amber-100 rounded-full">
        <div className="h-1 rounded-full transition-all duration-300" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function HivePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedYear, refreshData, refreshKey } = useApp();
  const [activeMetric, setActiveMetric] = useState('mite');
  const [showAddForm,  setShowAddForm]  = useState(false);

  // refreshKey forces re-read of helpers when data changes
  void refreshKey;

  const health       = getHiveHealth(id);
  const latest       = getLatestMiteCount(id);
  const totalHarvest = getTotalHarvest(id, selectedYear);
  const events       = getHiveEvents(id);
  const treatments   = getTreatments(id, selectedYear);
  const hive         = { id, health, latestMite: latest?.miteCount ?? '—' };

  const miteData    = selectedYear === 'all' ? getMiteDataByYear(id)    : getMiteData(id, selectedYear);
  const weightData  = selectedYear === 'all' ? getWeightDataByYear(id)  : getWeightData(id, selectedYear);
  const harvestData = selectedYear === 'all' ? getHarvestDataByYear(id) : getHarvestData(id, selectedYear);

  const treatmentsByType = {};
  treatments.forEach(t => {
    const key = t.treatment || 'None';
    treatmentsByType[key] = (treatmentsByType[key] || 0) + 1;
  });
  const treatmentList = Object.entries(treatmentsByType).sort((a, b) => b[1] - a[1]);

  const metrics = [
    { key: 'mite',    label: '🔬 Mite Count',   data: miteData,    color: '#DC2626', unit: ' mites', threshold: 9, domain: [0, 12], ticks: [0, 2, 4, 6, 8, 10, 12] },
    { key: 'weight',  label: '⚖️ Hive Weight',  data: weightData,  color: '#F59E0B', unit: ' lbs' },
    { key: 'harvest', label: '🍯 Honey Harvest', data: harvestData, color: '#16A34A', unit: ' lbs' },
  ];
  const active = metrics.find(m => m.key === activeMetric);

  const healthClass = health === 'good' ? 'bg-green-100 text-green-700' : health === 'watch' ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600';
  const healthColor = health === 'good' ? '#16A34A' : health === 'watch' ? '#F97316' : '#DC2626';

  return (
    <div className="page">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-7 fade-in">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <button onClick={() => navigate('/')}
            className="w-9 h-9 flex items-center justify-center rounded-full border border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-400 transition-all text-xl font-bold">‹</button>
          <HiveHex hive={hive} size={64} />
          <div>
            <h2 className="font-fredoka text-2xl text-amber-900">{id}</h2>
            <p className="text-xs text-amber-400 font-nunito">{latest ? `Last checked: ${latest.date}` : 'No data'}</p>
          </div>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold font-nunito ${healthClass}`}>
            ● {health.charAt(0).toUpperCase() + health.slice(1)}
          </span>
          <div className="ml-auto flex gap-1.5 flex-wrap">
            {HIVE_IDS.map(hid => (
              <button key={hid} onClick={() => navigate(`/hive/${hid}`)}
                className={`px-3 py-1 rounded-full border text-xs font-bold transition-all font-fredoka ${hid === id ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-amber-200 bg-white text-amber-500 hover:border-amber-300'}`}>
                {hid}
              </button>
            ))}
          </div>
        </div>

        {/* Stat row */}
        <div className="flex gap-3 flex-wrap mb-6">
          {[
            { label: 'Latest Mite Count', value: latest?.miteCount ?? '—', sub: latest?.date || '', color: healthColor },
            { label: 'Sample Size',       value: latest?.beeSample || '—', sub: 'bee sample' },
            { label: `Harvest ${selectedYear === 'all' ? 'Total' : `(${selectedYear})`}`, value: `${totalHarvest} lbs`, sub: 'honey harvested' },
            { label: 'Treatments Applied', value: treatments.filter(t => t.treatment && t.treatment !== 'None').length, sub: selectedYear === 'all' ? 'all time' : selectedYear },
          ].map(s => (
            <div key={s.label} className="bg-white border border-amber-200 rounded-2xl shadow-sm p-4 min-w-[140px] flex-1">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1 font-nunito">{s.label}</p>
              <p className="font-fredoka text-2xl leading-none" style={{ color: s.color || '#78350F' }}>{s.value}</p>
              <p className="text-[10px] text-amber-400 mt-1 font-nunito">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-5 flex-wrap">

          {/* Left: charts */}
          <div className="flex-1 min-w-[480px] flex flex-col gap-4">

            {/* Metric selector + add button */}
            <div className="flex items-center gap-2 flex-wrap">
              {metrics.map(m => (
                <button key={m.key} onClick={() => { setActiveMetric(m.key); setShowAddForm(false); }}
                  className={`px-4 py-1.5 rounded-full border text-xs font-bold transition-all font-nunito ${activeMetric === m.key ? 'text-white border-transparent' : 'bg-white border-amber-200 text-amber-500 hover:border-amber-300'}`}
                  style={activeMetric === m.key ? { background: m.color, borderColor: m.color } : {}}
                >{m.label}</button>
              ))}
              <button
                onClick={() => setShowAddForm(f => !f)}
                title={`Add ${active.label} reading`}
                className="ml-auto border border-dashed border-amber-300 text-amber-500 hover:border-amber-500 hover:text-amber-700 rounded-full px-3 py-1.5 text-xs font-bold transition-all font-nunito"
              >{showAddForm ? '✕ Cancel' : '＋ Add Reading'}</button>
            </div>

            {/* Inline quick-add form */}
            {showAddForm && (
              <QuickAddForm
                hiveId={id}
                metric={activeMetric}
                onSaved={async () => { await refreshData(); setShowAddForm(false); }}
                onCancel={() => setShowAddForm(false)}
              />
            )}

            {/* Chart */}
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5">
              <p className="font-fredoka text-base text-amber-900 mb-4">
                {active.label} — {id} {selectedYear !== 'all' ? `(${selectedYear})` : '(All Years)'}
              </p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={active.data} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FDE68A" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#B45309' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#B45309' }} domain={active.domain || [0, 'auto']} ticks={active.ticks} />
                  <Tooltip contentStyle={{ fontSize: '12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', fontFamily: 'Nunito' }}
                    formatter={v => [`${v}${active.unit}`, active.label]} />
                  {active.threshold && (
                    <ReferenceLine y={active.threshold} stroke="#DC2626" strokeDasharray="5 3"
                      label={{ value: `Danger threshold (${active.threshold})`, position: 'insideTopRight', fontSize: 10, fill: '#DC2626' }} />
                  )}
                  <Bar dataKey="value" fill={active.color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Treatments */}
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5">
              <p className="font-fredoka text-base text-amber-900 mb-3">💊 Treatments Applied</p>
              {treatmentList.length === 0
                ? <p className="text-amber-400 text-sm font-nunito">No treatment data for this period.</p>
                : (
                  <div className="flex flex-wrap gap-3">
                    {treatmentList.map(([type, count]) => (
                      <div key={type} className={`rounded-xl px-4 py-3 text-center border ${type === 'None' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                        <p className={`font-bold text-xl font-fredoka ${type === 'None' ? 'text-amber-500' : 'text-blue-700'}`}>{count}</p>
                        <p className={`text-xs font-semibold font-nunito ${type === 'None' ? 'text-amber-400' : 'text-blue-500'}`}>{type}</p>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>

          {/* Right panel */}
          <div className="w-64 flex flex-col gap-4 shrink-0">

            {/* Event log */}
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5">
              <p className="font-fredoka text-base text-amber-900 mb-4">📋 Hive Event Log</p>
              {events.length === 0
                ? <p className="text-amber-400 text-sm font-nunito">No recorded events for this hive.</p>
                : (
                  <div className="flex flex-col gap-4">
                    {events.map((ev, i) => (
                      <div key={i} className="pl-3 border-l-[3px]" style={{ borderColor: EVENT_COLORS[ev.event] || '#D97706' }}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-sm">{EVENT_ICONS[ev.event] || '📌'}</span>
                          <span className="font-bold text-xs font-nunito" style={{ color: EVENT_COLORS[ev.event] }}>{ev.event}</span>
                        </div>
                        <p className="text-[11px] text-amber-400 font-semibold font-nunito">{ev.date}</p>
                        <p className="text-xs text-amber-800 mt-0.5 font-nunito">{ev.notes}</p>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            {/* Recent mite readings — with click-to-edit */}
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5">
              <p className="font-fredoka text-base text-amber-900 mb-3">🔬 Recent Mite Readings</p>
              <p className="text-[10px] text-amber-400 mb-3 font-nunito">Hover a reading to edit or delete</p>
              <div className="flex flex-col gap-3">
                {miteData.slice(-8).reverse().map((r, i) => (
                  <EditableReading key={r.id ?? i} reading={r} onSaved={refreshData} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
