import { useState } from 'react';
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';
import { HIVE_IDS, getCompareDataByQuarter, getCompareDataByYear, getTotalHarvest, getHiveHealth, getLatestMiteCount } from '../data/dataHelpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const HIVE_COLORS = {
  Hive1: '#d7191c',
  Hive2: '#fdae61',
  Hive3: '#ffffbf',
  Hive4: '#abdda4',
  Hive5: '#2b83ba',
};

const METRICS = [
  { key: 'mite',    label: '🔬 Mite Count',   unit: ' mites' },
  { key: 'weight',  label: '⚖️ Hive Weight',  unit: ' lbs'   },
  { key: 'harvest', label: '🍯 Honey Harvest', unit: ' lbs'   },
];

const BAR_SIZE = 14; // fixed pixel width — never stretches

export default function ComparePage() {
  const { selectedYear, refreshKey } = useApp();
  void refreshKey;

  // Default: all 5 hives selected
  const [selected, setSelected] = useState([...HIVE_IDS]);
  const [metric,   setMetric]   = useState('mite');

  const toggleHive = (id) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        // Only allow deselect if ≥ 3 are currently selected (keeping minimum 2)
        return prev.length > 2 ? prev.filter(h => h !== id) : prev;
      }
      return [...prev, id];
    });
  };

  const activeMetric = METRICS.find(m => m.key === metric);
  const chartData    = selectedYear === 'all'
    ? getCompareDataByYear(selected, metric, selectedYear)
    : getCompareDataByQuarter(selected, metric, selectedYear);

  const summary = selected.map(id => ({
    id,
    health:     getHiveHealth(id, selectedYear),
    latestMite: getLatestMiteCount(id, selectedYear)?.miteCount ?? '—',
    harvest:    getTotalHarvest(id, selectedYear),
  }));

  return (
    <div className="page">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8 fade-in">

        {/* Header */}
        <div className="mb-7">
          <h2 className="font-fredoka text-2xl text-amber-900">📊 Hive Comparison</h2>
          <p className="text-amber-400 text-sm mt-0.5 font-nunito">
            Deselect hives to narrow the comparison — minimum 2 must stay selected ·{' '}
            {selectedYear === 'all' ? 'All years' : selectedYear}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-6 mb-6 items-start">

          {/* Hive selector */}
          <div>
            <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-2 font-nunito">
              Hives ({selected.length} selected — min 2)
            </p>
            <div className="flex gap-2 flex-wrap">
              {HIVE_IDS.map(id => {
                const isOn   = selected.includes(id);
                const color  = HIVE_COLORS[id];
                const health = getHiveHealth(id);
                // Dim the button if it's the only way we'd drop below 2
                const wouldDropBelowMin = isOn && selected.length <= 2;
                return (
                  <button
                    key={id}
                    onClick={() => toggleHive(id)}
                    disabled={wouldDropBelowMin}
                    title={wouldDropBelowMin ? 'At least 2 hives must be selected' : ''}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all font-nunito
                      ${isOn ? 'shadow-md' : 'bg-white text-amber-500 border-amber-200 hover:border-amber-400'}
                      ${wouldDropBelowMin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    style={isOn ? { background: color, borderColor: color, color: '#1a1a1a' } : {}}
                  >
                    {id}
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      health === 'good'  ? 'bg-green-400' :
                      health === 'watch' ? 'bg-orange-400' : 'bg-red-400'
                    } ${isOn ? 'opacity-90' : ''}`} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metric selector */}
          <div>
            <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-2 font-nunito">Metric</p>
            <div className="flex gap-1.5 bg-amber-50 rounded-xl p-1">
              {METRICS.map(m => (
                <button key={m.key} onClick={() => setMetric(m.key)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all font-nunito ${
                    metric === m.key ? 'bg-white shadow text-amber-800' : 'text-amber-500 hover:text-amber-700'
                  }`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart — always a grouped bar chart */}
        <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-6 mb-5">
          <p className="font-fredoka text-base text-amber-900 mb-4">
            {activeMetric.label} — {selected.join(', ')} {selectedYear !== 'all' ? `(${selectedYear})` : '(All Years)'}
          </p>

          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-amber-300">
              <span className="text-4xl mb-2">📭</span>
              <p className="font-nunito text-sm">No data for the selected period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                barGap={3}
                barCategoryGap="30%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#FDE68A" />
                <XAxis
                  dataKey="date"
                  tickFormatter={selectedYear !== 'all' ? (val) => val.split(' ')[1] : undefined}
                  tick={{ fontSize: 10, fill: '#B45309', fontFamily: 'Nunito' }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10, fill: '#B45309', fontFamily: 'Nunito' }} />
                <Tooltip
                  contentStyle={{ fontSize: '12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', fontFamily: 'Nunito' }}
                  formatter={(v, name) => [v !== null ? `${v}${activeMetric.unit}` : '—', name]}
                />
                <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Nunito' }} />
                {selected.map(id => (
                  <Bar
                    key={id}
                    dataKey={id}
                    fill={HIVE_COLORS[id]}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={BAR_SIZE}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Summary cards */}
        <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5">
          <p className="font-fredoka text-base text-amber-900 mb-4">Side-by-Side Summary</p>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}>
            {summary.map(({ id, health, latestMite, harvest }) => (
              <div key={id} className="rounded-xl p-4 border-2"
                style={{ borderColor: HIVE_COLORS[id] + '60', background: HIVE_COLORS[id] + '08' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: HIVE_COLORS[id] }} />
                  <span className="font-fredoka text-lg text-amber-900">{id}</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Health', value: health, valueClass: health === 'good' ? 'text-green-600' : health === 'watch' ? 'text-orange-500' : 'text-red-600' },
                    { label: 'Latest Mite', value: latestMite },
                    { label: `Harvest ${selectedYear === 'all' ? '(total)' : `(${selectedYear})`}`, value: `${harvest} lbs` },
                  ].map(({ label, value, valueClass }) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide font-nunito">{label}</p>
                      <p className={`font-fredoka text-xl leading-tight ${valueClass || 'text-amber-900'}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
