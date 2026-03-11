import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { HiveHex } from '../components/Hexagon';
import { useApp } from '../context/AppContext';
import {
  HIVE_IDS, getHiveHealth, getLatestMiteCount,
  getMiteData, getWeightData, getHarvestData,
  getTotalHarvest, getHiveEvents, getTreatments
} from '../data/dataHelpers';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine
} from 'recharts';

const EVENT_COLORS = { HiveDeath: '#D93A2B', Replaced: '#3DAA5C', Split: '#2196F3' };
const EVENT_ICONS = { HiveDeath: '💀', Replaced: '🆕', Split: '✂️' };

export default function HivePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedYear } = useApp();
  const [activeMetric, setActiveMetric] = useState('mite');

  const health = getHiveHealth(id);
  const latest = getLatestMiteCount(id);
  const totalHarvest = getTotalHarvest(id, selectedYear);
  const events = getHiveEvents(id);
  const treatments = getTreatments(id, selectedYear);
  const hive = { id, health, latestMite: latest?.miteCount ?? '—' };

  const miteData = getMiteData(id, selectedYear);
  const weightData = getWeightData(id, selectedYear);
  const harvestData = getHarvestData(id, selectedYear);

  const treatmentsByType = {};
  treatments.forEach(t => {
    const key = t.treatment || 'None';
    treatmentsByType[key] = (treatmentsByType[key] || 0) + 1;
  });
  const treatmentList = Object.entries(treatmentsByType).sort((a,b) => b[1]-a[1]);

  const metrics = [
    { key: 'mite', label: '🔬 Mite Count', data: miteData, color: '#D93A2B', unit: ' mites', threshold: 9 },
    { key: 'weight', label: '⚖️ Hive Weight', data: weightData, color: '#F5A623', unit: ' lbs' },
    { key: 'harvest', label: '🍯 Honey Harvest', data: harvestData, color: '#3DAA5C', unit: ' lbs', type: 'bar' },
  ];

  const active = metrics.find(m => m.key === activeMetric);

  return (
    <div className="page">
      <Navbar />
      <div style={{ padding: '24px 36px', maxWidth: '1100px', margin: '0 auto' }} className="fade-in">

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/')} style={{
            background: 'none', border: '1.5px solid var(--border)', borderRadius: '50%',
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', color: 'var(--amber-dark)', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
            onMouseOver={e => { e.currentTarget.style.background='var(--honey-light)'; e.currentTarget.style.borderColor='var(--amber)'; }}
            onMouseOut={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='var(--border)'; }}
          >‹</button>

          <HiveHex hive={hive} size={64} />

          <div>
            <h2 style={{ fontSize: '22px' }}>{id}</h2>
            <p style={{ fontSize: '12px', color: 'var(--text-light)' }}>
              {latest ? `Last checked: ${latest.date}` : 'No data'}
            </p>
          </div>

          <span className={`tag tag-${health}`} style={{ fontSize: '13px', padding: '5px 14px' }}>
            <span>●</span> {health.charAt(0).toUpperCase()+health.slice(1)}
          </span>

          {/* Sibling hive nav */}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
            {HIVE_IDS.map(hid => (
              <button key={hid} onClick={() => navigate(`/hive/${hid}`)}
                style={{
                  padding: '4px 10px', borderRadius: '12px', border: '1.5px solid',
                  borderColor: hid === id ? 'var(--amber)' : 'var(--border)',
                  background: hid === id ? 'var(--honey-light)' : 'white',
                  color: hid === id ? 'var(--amber-dark)' : 'var(--text-mid)',
                  fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                  fontFamily: "'Fredoka One',cursive",
                }}
              >{hid}</button>
            ))}
          </div>
        </div>

        {/* Stat row */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '24px' }}>
          {[
            { label: 'Latest Mite Count', value: latest?.miteCount ?? '—', sub: latest?.date || '', color: health==='risk'?'var(--risk)':health==='watch'?'var(--watch)':'var(--good)' },
            { label: 'Sample Size', value: latest?.beeSample || '—', sub: 'bee sample' },
            { label: `Harvest ${selectedYear==='all'?'Total':'('+selectedYear+')'}`, value: `${totalHarvest} lbs`, sub: 'honey harvested' },
            { label: 'Treatments Applied', value: treatments.filter(t=>t.treatment && t.treatment!=='None').length, sub: `${selectedYear==='all'?'all time':selectedYear}` },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ minWidth: 140 }}>
              <p style={{ fontSize: '10px', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{s.label}</p>
              <p style={{ fontFamily: "'Fredoka One',cursive", fontSize: '24px', color: s.color || 'var(--text)', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: '10px', color: 'var(--text-mid)', marginTop: '2px' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Left: charts */}
          <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Metric selector */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {metrics.map(m => (
                <button key={m.key} onClick={() => setActiveMetric(m.key)}
                  style={{
                    padding: '6px 16px', borderRadius: '20px', border: '1.5px solid',
                    borderColor: activeMetric===m.key ? m.color : 'var(--border)',
                    background: activeMetric===m.key ? m.color+'18' : 'white',
                    color: activeMetric===m.key ? m.color : 'var(--text-mid)',
                    fontWeight: '700', fontSize: '12px', cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >{m.label}</button>
              ))}
            </div>

            {/* Chart */}
            <div className="card" style={{ padding: '20px' }}>
              <p style={{ fontFamily: "'Fredoka One',cursive", fontSize: '15px', color: 'var(--text)', marginBottom: '16px' }}>
                {active.label} — {id} {selectedYear !== 'all' ? `(${selectedYear})` : '(All Years)'}
              </p>
              <ResponsiveContainer width="100%" height={220}>
                {active.type === 'bar' ? (
                  <BarChart data={active.data} barSize={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-mid)' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-mid)' }} />
                    <Tooltip
                      contentStyle={{ fontSize:'12px', background:'#FFFDF5', border:'1px solid var(--border)', borderRadius:'8px' }}
                      formatter={v => [`${v}${active.unit}`, active.label]}
                      labelFormatter={l => `Date: ${l}`}
                    />
                    <Bar dataKey="value" fill={active.color} radius={[4,4,0,0]} />
                  </BarChart>
                ) : (
                  <LineChart data={active.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-mid)' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-mid)' }} />
                    <Tooltip
                      contentStyle={{ fontSize:'12px', background:'#FFFDF5', border:'1px solid var(--border)', borderRadius:'8px' }}
                      formatter={v => [`${v}${active.unit}`, active.label]}
                      labelFormatter={l => `Date: ${l}`}
                    />
                    {active.threshold && (
                      <ReferenceLine y={active.threshold} stroke="#D93A2B" strokeDasharray="5 3"
                        label={{ value: 'Danger threshold', position: 'insideTopRight', fontSize: 10, fill: '#D93A2B' }} />
                    )}
                    <Line type="monotone" dataKey="value" stroke={active.color} strokeWidth={2.5}
                      dot={{ r: 3, fill: active.color }} activeDot={{ r: 5 }} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Treatments breakdown */}
            <div className="card" style={{ padding: '20px' }}>
              <p style={{ fontFamily: "'Fredoka One',cursive", fontSize: '15px', color: 'var(--text)', marginBottom: '12px' }}>
                💊 Treatments Applied
              </p>
              {treatmentList.length === 0 ? (
                <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>No treatment data for this period.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {treatmentList.map(([type, count]) => (
                    <div key={type} style={{
                      background: type==='None' ? 'var(--honey-light)' : '#E8F4FD',
                      border: `1.5px solid ${type==='None' ? 'var(--border)' : '#90CAF9'}`,
                      borderRadius: '10px', padding: '8px 14px', textAlign: 'center',
                    }}>
                      <p style={{ fontWeight: '800', fontSize: '18px', color: type==='None'?'var(--text-mid)':'#1565C0' }}>{count}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-mid)', fontWeight: '600' }}>{type}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Event log */}
          <div style={{ flex: '0 0 260px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '20px' }}>
              <p style={{ fontFamily: "'Fredoka One',cursive", fontSize: '15px', color: 'var(--text)', marginBottom: '14px' }}>
                📋 Hive Event Log
              </p>
              {events.length === 0 ? (
                <p style={{ color: 'var(--text-light)', fontSize: '13px' }}>No recorded events for this hive.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {events.map((ev, i) => (
                    <div key={i} style={{
                      borderLeft: `3px solid ${EVENT_COLORS[ev.event] || 'var(--border)'}`,
                      paddingLeft: '12px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '14px' }}>{EVENT_ICONS[ev.event] || '📌'}</span>
                        <span style={{ fontWeight: '800', fontSize: '13px', color: EVENT_COLORS[ev.event] || 'var(--text)' }}>{ev.event}</span>
                      </div>
                      <p style={{ fontSize: '11px', color: 'var(--text-mid)', fontWeight: '600', marginBottom: '2px' }}>{ev.date}</p>
                      <p style={{ fontSize: '12px', color: 'var(--text)' }}>{ev.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent mite readings */}
            <div className="card" style={{ padding: '20px' }}>
              <p style={{ fontFamily: "'Fredoka One',cursive", fontSize: '15px', color: 'var(--text)', marginBottom: '12px' }}>
                🔬 Recent Mite Readings
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {miteData.slice(-8).reverse().map((r, i) => {
                  const pct = Math.min(100, (r.value / 15) * 100);
                  const color = r.value >= 9 ? 'var(--risk)' : r.value >= 5 ? 'var(--watch)' : 'var(--good)';
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-mid)' }}>{r.date}</span>
                        <span style={{ fontSize: '11px', fontWeight: '800', color }}>{r.value}</span>
                      </div>
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2 }}>
                        <div style={{ height: 4, width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
