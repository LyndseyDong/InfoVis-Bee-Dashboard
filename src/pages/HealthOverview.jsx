import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { HiveHex } from '../components/Hexagon';
import { useApp } from '../context/AppContext';
import { HIVE_IDS, getHiveHealth, getLatestMiteCount, getTotalHarvest, getAllHarvestByYear } from '../data/dataHelpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const today = () => new Date().toISOString().slice(0, 10);

const RECORD_TYPES = [
  { key: 'miteCount',    label: '🔬 Mite Count',   fields: [{ name: 'miteCount', label: 'Mite Count', type: 'number', min: 0 }, { name: 'beeSample', label: 'Bee Sample', type: 'select', options: ['HalfCup', 'Cup'] }] },
  { key: 'hiveWeight',   label: '⚖️ Hive Weight',  fields: [{ name: 'weight', label: 'Weight (lbs)', type: 'number', min: 0, step: '0.1' }] },
  { key: 'honeyHarvest', label: '🍯 Honey Harvest', fields: [{ name: 'pounds', label: 'Pounds', type: 'number', min: 0, step: '0.1' }] },
];

function QuickAddModal({ onClose, onSaved }) {
  const [hiveId,   setHiveId]   = useState(HIVE_IDS[0]);
  const [typeKey,  setTypeKey]  = useState('miteCount');
  const [date,     setDate]     = useState(today());
  const [values,   setValues]   = useState({ miteCount: '', beeSample: 'HalfCup', weight: '', pounds: '' });
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const recType = RECORD_TYPES.find(t => t.key === typeKey);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    const body = { hiveId, date, ...Object.fromEntries(recType.fields.map(f => [f.name, values[f.name]])) };
    try {
      const res = await fetch(`/api/${typeKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-amber-200 fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100">
          <h3 className="font-fredoka text-lg text-amber-900">Add New Record</h3>
          <button onClick={onClose} className="text-amber-400 hover:text-amber-700 text-xl font-bold leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type tabs */}
          <div className="flex gap-1 bg-amber-50 rounded-xl p-1">
            {RECORD_TYPES.map(t => (
              <button key={t.key} type="button" onClick={() => setTypeKey(t.key)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all font-nunito ${typeKey === t.key ? 'bg-white shadow text-amber-800' : 'text-amber-500 hover:text-amber-700'}`}
              >{t.label}</button>
            ))}
          </div>

          {/* Hive + Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1 font-nunito">Hive</label>
              <select value={hiveId} onChange={e => setHiveId(e.target.value)}
                className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm font-nunito text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-amber-50/40">
                {HIVE_IDS.map(id => <option key={id}>{id}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1 font-nunito">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm font-nunito text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-amber-50/40" />
            </div>
          </div>

          {/* Dynamic fields */}
          <div className="grid grid-cols-2 gap-3">
            {recType.fields.map(f => (
              <div key={f.name}>
                <label className="block text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1 font-nunito">{f.label}</label>
                {f.type === 'select' ? (
                  <select value={values[f.name]} onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}
                    className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm font-nunito text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-amber-50/40">
                    {f.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type={f.type} min={f.min} step={f.step || '1'} value={values[f.name]} required
                    onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}
                    className="w-full border border-amber-200 rounded-xl px-3 py-2 text-sm font-nunito text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-300 bg-amber-50/40" />
                )}
              </div>
            ))}
          </div>

          {error && <p className="text-red-500 text-xs font-nunito">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-amber-200 text-amber-600 font-bold text-sm rounded-xl py-2.5 hover:bg-amber-50 transition-colors font-nunito">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-honey-600 hover:bg-honey-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl py-2.5 transition-colors font-nunito">
              {saving ? 'Saving…' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, valueClass = 'text-amber-900' }) {
  return (
    <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5 flex-1 min-w-[130px]">
      <p className="text-[11px] font-bold text-amber-500 uppercase tracking-widest mb-1 font-nunito">{label}</p>
      <p className={`font-fredoka text-3xl leading-none ${valueClass}`}>{value}</p>
      {sub && <p className="text-[11px] text-amber-400 mt-1 font-nunito">{sub}</p>}
    </div>
  );
}

const HONEYCOMB = [
  { top: 0,   left: 84  },
  { top: 90,  left: 0   },
  { top: 90,  left: 168 },
  { top: 180, left: 84  },
  { top: 270, left: 0   },
];

export default function HealthOverview() {
  const navigate = useNavigate();
  const { selectedYear, refreshData, refreshKey } = useApp();
  const [showAdd, setShowAdd] = useState(false);

  // refreshKey in dep list forces re-read of helpers after data refresh
  const hives = HIVE_IDS.map(id => ({
    id,
    health:     getHiveHealth(id),
    latestMite: getLatestMiteCount(id)?.miteCount ?? '—',
    harvest:    getTotalHarvest(id, selectedYear),
  }));

  const harvestData  = getAllHarvestByYear();
  const goodCount    = hives.filter(h => h.health === 'good').length;
  const watchCount   = hives.filter(h => h.health === 'watch').length;
  const riskCount    = hives.filter(h => h.health === 'risk').length;
  const totalHarvest = hives.reduce((s, h) => s + h.harvest, 0);

  // keep refreshKey in scope so React re-renders when it changes
  void refreshKey;

  return (
    <div className="page">
      <Navbar />
      {showAdd && <QuickAddModal onClose={() => setShowAdd(false)} onSaved={refreshData} />}

      <div className="max-w-6xl mx-auto px-6 py-8 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="font-fredoka text-2xl text-amber-900">🍯 Hive Health Overview</h2>
            <p className="text-amber-500 text-sm mt-0.5 font-nunito">
              Click any hive for detailed metrics · {selectedYear === 'all' ? '2021–2025' : selectedYear}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-honey-600 hover:bg-honey-700 text-white font-bold text-sm rounded-full px-5 py-2 transition-colors font-nunito shadow"
          >
            <span className="text-base">＋</span> Add Record
          </button>
        </div>

        {/* Stat cards */}
        <div className="flex gap-3 flex-wrap mb-8">
          <StatCard label="Total Hives"   value={HIVE_IDS.length} />
          <StatCard label="Healthy"       value={goodCount}  sub="Low mite count"   valueClass="text-green-600" />
          <StatCard label="Watch"         value={watchCount} sub="Elevated mites"   valueClass="text-orange-500" />
          <StatCard label="At Risk"       value={riskCount}  sub="High mite count"  valueClass="text-red-600" />
          <StatCard label="Total Harvest" value={`${totalHarvest} lbs`} sub={selectedYear === 'all' ? 'All years' : selectedYear} />
        </div>

        {/* Main layout */}
        <div className="flex gap-8 flex-wrap items-start">

          {/* Honeycomb + legend */}
          <div className="flex flex-col gap-5">
            <div className="relative" style={{ width: 284, height: 372 }}>
              {hives.map((hive, i) => (
                <div key={hive.id} className="absolute" style={{ top: HONEYCOMB[i].top, left: HONEYCOMB[i].left }}>
                  <HiveHex hive={hive} size={110} onClick={() => navigate(`/hive/${hive.id}`)} />
                </div>
              ))}
            </div>

            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-4 w-52">
              <p className="font-fredoka text-sm text-amber-900 mb-3">Hive Health</p>
              {[
                { color: 'bg-green-500',  label: 'Good — mites low' },
                { color: 'bg-orange-500', label: 'Watch — elevated' },
                { color: 'bg-red-500',    label: 'Risk — mites high' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-2 mb-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
                  <span className="text-[11px] text-amber-700 font-semibold font-nunito">{label}</span>
                </div>
              ))}
              <p className="text-[10px] text-amber-400 mt-2 font-nunito">Number shown = latest mite count</p>
            </div>
          </div>

          {/* Charts + table */}
          <div className="flex-1 min-w-[300px] flex flex-col gap-5">

            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5">
              <p className="font-fredoka text-base text-amber-900 mb-4">🍯 Total Honey Harvested by Year (lbs)</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={harvestData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FDE68A" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#B45309', fontFamily: 'Nunito' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#B45309', fontFamily: 'Nunito' }} />
                  <Tooltip
                    contentStyle={{ fontSize: '12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', fontFamily: 'Nunito' }}
                    formatter={v => [`${v} lbs`, 'Harvested']}
                  />
                  <Bar dataKey="pounds" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Hive summary table */}
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5">
              <p className="font-fredoka text-base text-amber-900 mb-4">Hive Summary</p>
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b-2 border-amber-100">
                    {['Hive', 'Status', 'Latest Mite', 'Harvest (lbs)', ''].map(h => (
                      <th key={h} className="text-left py-2 px-2 text-[11px] font-bold text-amber-400 uppercase tracking-wide font-nunito">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hives.map(hive => (
                    <tr key={hive.id} onClick={() => navigate(`/hive/${hive.id}`)}
                      className="border-b border-amber-50 cursor-pointer hover:bg-amber-50 transition-colors group">
                      <td className="py-2.5 px-2 font-fredoka text-amber-900">{hive.id}</td>
                      <td className="py-2.5 px-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold font-nunito ${
                          hive.health === 'good'  ? 'bg-green-100 text-green-700' :
                          hive.health === 'watch' ? 'bg-orange-100 text-orange-600' :
                                                    'bg-red-100 text-red-600'
                        }`}>● {hive.health}</span>
                      </td>
                      <td className="py-2.5 px-2 font-bold text-amber-900 font-nunito">{hive.latestMite}</td>
                      <td className="py-2.5 px-2 text-amber-700 font-nunito">{hive.harvest} lbs</td>
                      <td className="py-2.5 px-2 text-honey-600 text-xs font-bold font-nunito group-hover:translate-x-0.5 transition-transform">View →</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
