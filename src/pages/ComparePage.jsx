import { useState } from 'react';
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';
import { HIVE_IDS, getCompareData, getTotalHarvest, getHiveHealth, getLatestMiteCount } from '../data/dataHelpers';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

const HIVE_COLORS = {
  Hive1: '#F59E0B',
  Hive2: '#16A34A',
  Hive3: '#2563EB',
  Hive4: '#9333EA',
  Hive5: '#DC2626',
};

const METRICS = [
  { key: 'mite',    label: '🔬 Mite Count',   unit: ' mites', threshold: 9 },
  { key: 'weight',  label: '⚖️ Hive Weight',  unit: ' lbs' },
  { key: 'harvest', label: '🍯 Honey Harvest', unit: ' lbs',   type: 'bar' },
];

export default function ComparePage() {
  const { selectedYear, refreshKey } = useApp();
  void refreshKey;

  const [selected, setSelected] = useState(['Hive1', 'Hive2']);
  const [metric,   setMetric]   = useState('mite');

  const toggleHive = (id) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(h => h !== id) : prev   // keep at least 1
        : prev.length < 3 ? [...prev, id] : prev                 // max 3
    );
  };

  const activeMetric = METRICS.find(m => m.key === metric);
  const chartData    = getCompareData(selected, metric, selectedYear);

  // Summary table: latest value + total/avg per selected hive
  const summary = selected.map(id => {
    const health = getHiveHealth(id);
    const latest = getLatestMiteCount(id);
    return {
      id,
      health,
      latestMite:  latest?.miteCount ?? '—',
      harvest:     getTotalHarvest(id, selectedYear),
    };
  });

  return (
    <div className="page">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8 fade-in">

        {/* Header */}
        <div className="mb-7">
          <h2 className="font-fredoka text-2xl text-amber-900">📊 Hive Comparison</h2>
          <p className="text-amber-400 text-sm mt-0.5 font-nunito">
            Select up to 3 hives to overlay on the same chart · {selectedYear === 'all' ? 'All years' : selectedYear}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-6 mb-6 items-start">

          {/* Hive selector */}
          <div>
            <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-2 font-nunito">Select Hives (up to 3)</p>
            <div className="flex gap-2 flex-wrap">
              {HIVE_IDS.map(id => {
                const isOn    = selected.includes(id);
                const color   = HIVE_COLORS[id];
                const health  = getHiveHealth(id);
                return (
                  <button key={id} onClick={() => toggleHive(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-bold text-sm transition-all font-nunito ${isOn ? 'text-white shadow-md' : 'bg-white text-amber-500 border-amber-200 hover:border-amber-400'}`}
                    style={isOn ? { background: color, borderColor: color } : {}}
                  >
                    {id}
                    <span className={`w-1.5 h-1.5 rounded-full ${health === 'good' ? 'bg-green-400' : health === 'watch' ? 'bg-orange-400' : 'bg-red-400'} ${isOn ? 'opacity-90' : ''}`} />
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
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all font-nunito ${metric === m.key ? 'bg-white shadow text-amber-800' : 'text-amber-500 hover:text-amber-700'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-6 mb-5">
          <p className="font-fredoka text-base text-amber-900 mb-4">
            {activeMetric.label} — {selected.join(', ')} {selectedYear !== 'all' ? `(${selectedYear})` : '(All Years)'}
          </p>

          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-amber-300">
              <span className="text-4xl mb-2">📭</span>
              <p className="font-nunito text-sm">No data for the selected period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              {activeMetric.type === 'bar' ? (
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FDE68A" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#B45309', fontFamily: 'Nunito' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#B45309', fontFamily: 'Nunito' }} />
                  <Tooltip
                    contentStyle={{ fontSize: '12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', fontFamily: 'Nunito' }}
                    formatter={(v, name) => [`${v}${activeMetric.unit}`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Nunito' }} />
                  {selected.map(id => (
                    <Bar key={id} dataKey={id} fill={HIVE_COLORS[id]} radius={[4, 4, 0, 0]} />
                  ))}
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FDE68A" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#B45309', fontFamily: 'Nunito' }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#B45309', fontFamily: 'Nunito' }} />
                  <Tooltip
                    contentStyle={{ fontSize: '12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', fontFamily: 'Nunito' }}
                    formatter={(v, name) => [v !== null ? `${v}${activeMetric.unit}` : '—', name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Nunito' }} />
                  {activeMetric.threshold && (
                    <line x1="0%" y1={activeMetric.threshold} x2="100%" y2={activeMetric.threshold}
                      stroke="#DC2626" strokeDasharray="5 3" opacity={0.5} />
                  )}
                  {selected.map(id => (
                    <Line key={id} type="monotone" dataKey={id} stroke={HIVE_COLORS[id]} strokeWidth={2.5}
                      dot={{ r: 3, fill: HIVE_COLORS[id] }} activeDot={{ r: 5 }} connectNulls={false} />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Summary comparison table */}
        <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5">
          <p className="font-fredoka text-base text-amber-900 mb-4">Side-by-Side Summary</p>
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}>
            {summary.map(({ id, health, latestMite, harvest }) => (
              <div key={id} className="rounded-xl p-4 border-2" style={{ borderColor: HIVE_COLORS[id] + '60', background: HIVE_COLORS[id] + '08' }}>
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
