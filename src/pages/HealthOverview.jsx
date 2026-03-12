import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { HiveHex, AddHex } from '../components/Hexagon';
import { useApp } from '../context/AppContext';
import { HIVE_IDS, getHiveHealth, getLatestMiteCount, getTotalHarvest, getAllHarvestByYear } from '../data/dataHelpers';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ minWidth: 130 }}>
      <p style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontFamily: "'Fredoka One',cursive", fontSize: '26px', color: color || 'var(--text)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: 'var(--text-mid)', marginTop: '3px' }}>{sub}</p>}
    </div>
  );
}

export default function HealthOverview() {
  const navigate = useNavigate();
  const { selectedYear } = useApp();

  const hives = HIVE_IDS.map(id => {
    const health = getHiveHealth(id);
    const latest = getLatestMiteCount(id);
    const harvest = getTotalHarvest(id, selectedYear);
    return { id, health, latestMite: latest?.miteCount ?? '—', harvest };
  });

  const harvestData = getAllHarvestByYear();

  const goodCount = hives.filter(h => h.health === 'good').length;
  const watchCount = hives.filter(h => h.health === 'watch').length;
  const riskCount = hives.filter(h => h.health === 'risk').length;
  const totalHarvest = hives.reduce((s, h) => s + h.harvest, 0);

  // Hive grid positions (honeycomb layout)
  const positions = [
    { top: 0, left: 80 },
    { top: 88, left: 0 },
    { top: 88, left: 160 },
    { top: 176, left: 80 },
    { top: 264, left: 0 },
  ];

  return (
    <div className="page">
      <Navbar />
      <div style={{ padding: '28px 36px', maxWidth: '1100px', margin: '0 auto' }} className="fade-in">

        {/* Page header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', color: 'var(--text)' }}>🍯 Hive Health Overview</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '13px', marginTop: '3px' }}>
            Click any hive for detailed metrics · {selectedYear === 'all' ? '2021–2025' : selectedYear}
          </p>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '32px' }}>
          <StatCard label="Total Hives" value={HIVE_IDS.length} />
          <StatCard label="Healthy" value={goodCount} color="var(--good)" sub="Low mite count" />
          <StatCard label="Watch" value={watchCount} color="var(--watch)" sub="Elevated mites" />
          <StatCard label="At Risk" value={riskCount} color="var(--risk)" sub="High mite count" />
          <StatCard label="Total Harvest" value={`${totalHarvest} lbs`} sub={selectedYear === 'all' ? 'All years' : selectedYear} />
        </div>

        {/* Main layout: hive grid + chart */}
        <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* Hive honeycomb */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ position: 'relative', width: 270, height: 360 }}>
              {hives.map((hive, i) => (
                <div key={hive.id} style={{ position: 'absolute', top: positions[i].top, left: positions[i].left }}>
                  <HiveHex hive={hive} size={108} onClick={() => navigate(`/hive/${hive.id}`)} />
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="card" style={{ padding: '12px 16px', width: '200px' }}>
              <p style={{ fontFamily: "'Fredoka One',cursive", fontSize: '13px', marginBottom: '8px', color: 'var(--text)' }}>Hive Health</p>
              {[{color:'var(--good)',label:'Good — mites low'},{color:'var(--watch)',label:'Watch — mites elevated'},{color:'var(--risk)',label:'Risk — mites high'}].map(({color,label}) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-mid)', fontWeight: '600' }}>{label}</span>
                </div>
              ))}
              <p style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '8px' }}>
                Number shown = latest mite count
              </p>
            </div>
          </div>

          {/* Right: Harvest chart + hive table */}
          <div style={{ flex: 1, minWidth: 300, display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Honey harvest chart */}
            <div className="card" style={{ padding: '20px' }}>
              <p style={{ fontFamily: "'Fredoka One',cursive", fontSize: '15px', marginBottom: '14px', color: 'var(--text)' }}>
                🍯 Total Honey Harvested by Year (lbs)
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={harvestData} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--text-mid)', fontFamily: 'Nunito' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-mid)', fontFamily: 'Nunito' }} />
                  <Tooltip
                    contentStyle={{ fontSize: '12px', background: '#FFFDF5', border: '1px solid var(--border)', borderRadius: '8px', fontFamily: 'Nunito' }}
                    formatter={v => [`${v} lbs`, 'Harvested']}
                  />
                  <Bar dataKey="pounds" fill="var(--gold)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Hive summary table */}
            <div className="card" style={{ padding: '20px' }}>
              <p style={{ fontFamily: "'Fredoka One',cursive", fontSize: '15px', marginBottom: '14px', color: 'var(--text)' }}>
                Hive Summary
              </p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--border)' }}>
                    {['Hive', 'Status', 'Latest Mite Count', 'Harvest (lbs)', ''].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-light)', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {hives.map(hive => (
                    <tr key={hive.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => navigate(`/hive/${hive.id}`)}
                      onMouseOver={e => e.currentTarget.style.background = 'var(--honey-light)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '8px 8px', fontFamily: "'Fredoka One',cursive", fontSize: '14px' }}>{hive.id}</td>
                      <td style={{ padding: '8px 8px' }}>
                        <span className={`tag tag-${hive.health}`}>
                          <span style={{ fontSize: 8 }}>●</span> {hive.health}
                        </span>
                      </td>
                      <td style={{ padding: '8px 8px', fontWeight: '700' }}>{hive.latestMite}</td>
                      <td style={{ padding: '8px 8px' }}>{hive.harvest} lbs</td>
                      <td style={{ padding: '8px 8px', color: 'var(--amber-dark)', fontSize: '12px', fontWeight: '700' }}>View →</td>
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
