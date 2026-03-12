import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';
import {
  getNetProfitByYear, getExpensesByCategory, getRevenueByItem,
  getTotalRevenue, getTotalExpenses, YEARS
} from '../data/dataHelpers';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';

const CAT_COLORS = {
  Equipment: '#F5A623',
  Medication: '#D93A2B',
  Supplies: '#3DAA5C',
  Consumable: '#2196F3',
};

const ITEM_COLORS = ['#F5A623','#3DAA5C','#2196F3','#9C27B0','#FF5722','#00BCD4','#E91E63','#607D8B'];

function StatCard({ label, value, sub, color }) {
  return (
    <div className="stat-card" style={{ flex: '1 1 160px' }}>
      <p style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</p>
      <p style={{ fontFamily: "'Fredoka One',cursive", fontSize: '26px', color: color || 'var(--text)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: 'var(--text-mid)', marginTop: '3px' }}>{sub}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#FFFDF5', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: 'Nunito' }}>
      <p style={{ fontWeight: 800, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: ${p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
};

export default function FinancePage() {
  const { selectedYear } = useApp();
  const [activeView, setActiveView] = useState('overview');

  const profitData = getNetProfitByYear();
  const expCat = getExpensesByCategory(selectedYear);
  const revItems = getRevenueByItem(selectedYear);
  const totalRev = getTotalRevenue(selectedYear);
  const totalExp = getTotalExpenses(selectedYear);
  const netProfit = totalRev - totalExp;

  return (
    <div className="page">
      <Navbar />
      <div style={{ padding: '28px 36px', maxWidth: '1100px', margin: '0 auto' }} className="fade-in">

        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '22px', color: 'var(--text)' }}>💰 Finance Overview</h2>
          <p style={{ color: 'var(--text-light)', fontSize: '13px', marginTop: '3px' }}>
            {selectedYear === 'all' ? 'All years (2021–2025)' : `Year: ${selectedYear}`}
          </p>
        </div>

        {/* KPI stats */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <StatCard label="Total Revenue" value={`$${totalRev.toLocaleString()}`} color="var(--good)" sub="from all sales" />
          <StatCard label="Total Expenses" value={`$${totalExp.toLocaleString()}`} color="var(--risk)" sub="equipment, meds, supplies" />
          <StatCard label="Net Profit" value={`$${netProfit.toLocaleString()}`} color={netProfit >= 0 ? 'var(--good)' : 'var(--risk)'} sub="revenue minus expenses" />
          <StatCard label="Profit Margin" value={totalRev > 0 ? `${Math.round((netProfit/totalRev)*100)}%` : '—'} color="var(--amber-dark)" sub="net/revenue" />
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[
            { key: 'overview', label: '📊 Revenue vs Expenses' },
            { key: 'expenses', label: '🏷️ Expense Breakdown' },
            { key: 'revenue', label: '🛒 Revenue by Product' },
          ].map(v => (
            <button key={v.key} onClick={() => setActiveView(v.key)}
              style={{
                padding: '7px 18px', borderRadius: '20px', border: '1.5px solid',
                borderColor: activeView===v.key ? 'var(--amber)' : 'var(--border)',
                background: activeView===v.key ? 'var(--honey-light)' : 'white',
                color: activeView===v.key ? 'var(--amber-dark)' : 'var(--text-mid)',
                fontWeight: '700', fontSize: '13px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >{v.label}</button>
          ))}
        </div>

        {activeView === 'overview' && (
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {/* Revenue vs Expenses bar chart */}
            <div className="card" style={{ padding: '20px', flex: '1 1 500px' }}>
              <p style={{ fontFamily: "'Fredoka One',cursive", fontSize: '15px', color: 'var(--text)', marginBottom: '16px' }}>
                Revenue vs Expenses by Year
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={profitData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--text-mid)', fontFamily: 'Nunito' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-mid)', fontFamily: 'Nunito' }} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Nunito' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#3DAA5C" radius={[4,4,0,0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#D93A2B" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Net profit line */}
            <div className="card" style={{ padding: '20px', flex: '1 1 280px' }}>
              <p style={{ fontFamily: "'Fredoka One',cursive", fontSize: '15px', color: 'var(--text)', marginBottom: '16px' }}>
                Net Profit Trend
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'var(--text-mid)', fontFamily: 'Nunito' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-mid)', fontFamily: 'Nunito' }} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="var(--gold)"
                    strokeWidth={3} dot={{ r: 5, fill: 'var(--gold)' }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeView === 'expenses' && (
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {/* Pie chart */}
            <div className="card" style={{ padding: '20px', flex: '0 0 340px' }}>
              <p style={{ fontFamily: "'Fredoka One',cursive", fontSize: '15px', color: 'var(--text)', marginBottom: '16px' }}>
                Expenses by Category
              </p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={expCat} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90}
                    label={({ category, percent }) => `${category} ${(percent*100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {expCat.map((e, i) => (
                      <Cell key={i} fill={CAT_COLORS[e.category] || '#999'} />
                    ))}
                  </Pie>
                  <Tooltip formatter={v => [`$${v}`, 'Total']} contentStyle={{ fontSize: 12, fontFamily: 'Nunito', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category breakdown table */}
            <div className="card" style={{ padding: '20px', flex: '1 1 300px' }}>
              <p style={{ fontFamily: "'Fredoka One',cursive", fontSize: '15px', color: 'var(--text)', marginBottom: '16px' }}>
                Category Details
              </p>
              {expCat.sort((a,b) => b.total - a.total).map(cat => {
                const pct = Math.round((cat.total / totalExp) * 100);
                const color = CAT_COLORS[cat.category] || '#999';
                return (
                  <div key={cat.category} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>{cat.category}</span>
                      <span style={{ fontWeight: '800', fontSize: '13px', color }}>${cat.total.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--border)', borderRadius: 4 }}>
                      <div style={{ height: 8, width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeView === 'revenue' && (
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {/* Bar chart by product */}
            <div className="card" style={{ padding: '20px', flex: '1 1 500px' }}>
              <p style={{ fontFamily: "'Fredoka One',cursive", fontSize: '15px', color: 'var(--text)', marginBottom: '16px' }}>
                Revenue by Product
              </p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revItems} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-mid)' }} tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="item" tick={{ fontSize: 11, fill: 'var(--text-mid)', fontFamily: 'Nunito' }} width={120} />
                  <Tooltip formatter={v => [`$${v}`, 'Revenue']} contentStyle={{ fontSize: 12, fontFamily: 'Nunito', borderRadius: 8 }} />
                  <Bar dataKey="total" radius={[0,4,4,0]}>
                    {revItems.map((_, i) => <Cell key={i} fill={ITEM_COLORS[i % ITEM_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Product list */}
            <div className="card" style={{ padding: '20px', flex: '0 0 240px' }}>
              <p style={{ fontFamily: "'Fredoka One',cursive", fontSize: '15px', color: 'var(--text)', marginBottom: '12px' }}>
                Product Ranking
              </p>
              {revItems.map((item, i) => (
                <div key={item.item} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontFamily: "'Fredoka One',cursive", fontSize: '16px', color: ITEM_COLORS[i%ITEM_COLORS.length], minWidth: 24 }}>#{i+1}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text)' }}>{item.item}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-mid)' }}>${item.total.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
