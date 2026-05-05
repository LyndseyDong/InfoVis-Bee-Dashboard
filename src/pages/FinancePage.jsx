import { useState } from 'react';
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';
import {
  getNetProfitByYear, getExpensesByCategory, getRevenueByItem,
  getTotalRevenue, getTotalExpenses,
} from '../data/dataHelpers';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

const CAT_COLORS = {
  Equipment:  '#F59E0B',
  Medication: '#DC2626',
  Supplies:   '#16A34A',
  Consumable: '#2563EB',
};
const ITEM_COLORS = ['#F59E0B', '#16A34A', '#2563EB', '#9333EA', '#F97316', '#06B6D4', '#EC4899', '#64748B'];

function StatCard({ label, value, sub, valueClass }) {
  return (
    <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5 flex-1 min-w-[150px]">
      <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-1 font-nunito">{label}</p>
      <p className={`font-fredoka text-3xl leading-none ${valueClass || 'text-amber-900'}`}>{value}</p>
      {sub && <p className="text-[11px] text-amber-400 mt-1 font-nunito">{sub}</p>}
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-nunito shadow-sm">
      <p className="font-bold mb-1 text-amber-900">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: ${p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
};

const VIEWS = [
  { key: 'overview', label: '📊 Revenue vs Expenses' },
  { key: 'expenses', label: '🏷️ Expense Breakdown' },
  { key: 'revenue',  label: '🛒 Revenue by Product' },
];

export default function FinancePage() {
  const { selectedYear } = useApp();
  const [activeView, setActiveView] = useState('overview');

  const profitData = getNetProfitByYear();
  const expCat     = getExpensesByCategory(selectedYear);
  const revItems   = getRevenueByItem(selectedYear);
  const totalRev   = getTotalRevenue(selectedYear);
  const totalExp   = getTotalExpenses(selectedYear);
  const netProfit  = totalRev - totalExp;
  const margin     = totalRev > 0 ? Math.round((netProfit / totalRev) * 100) : null;

  return (
    <div className="page">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8 fade-in">

        {/* Header */}
        <div className="mb-6">
          <h2 className="font-fredoka text-2xl text-amber-900">💰 Finance Overview</h2>
          <p className="text-amber-400 text-sm mt-0.5 font-nunito">
            {selectedYear === 'all' ? 'All years (2021–2025)' : `Year: ${selectedYear}`}
          </p>
        </div>

        {/* KPI cards */}
        <div className="flex gap-3 flex-wrap mb-7">
          <StatCard label="Total Revenue"  value={`$${totalRev.toLocaleString()}`}  sub="from all sales"            valueClass="text-green-600" />
          <StatCard label="Total Expenses" value={`$${totalExp.toLocaleString()}`}  sub="equipment, meds, supplies" valueClass="text-red-600" />
          <StatCard label="Net Profit"     value={`$${netProfit.toLocaleString()}`} sub="revenue minus expenses"    valueClass={netProfit >= 0 ? 'text-green-600' : 'text-red-600'} />
          <StatCard label="Profit Margin"  value={margin !== null ? `${margin}%` : '—'} sub="net / revenue"         valueClass="text-honey-600" />
        </div>

        {/* View tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {VIEWS.map(v => (
            <button key={v.key} onClick={() => setActiveView(v.key)}
              className={`px-4 py-2 rounded-full border text-sm font-bold transition-all font-nunito ${
                activeView === v.key
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'bg-white border-amber-200 text-amber-600 hover:border-amber-300'
              }`}
            >{v.label}</button>
          ))}
        </div>

        {/* Overview */}
        {activeView === 'overview' && (
          <div className="flex gap-5 flex-wrap">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5 flex-1 min-w-[460px]">
              <p className="font-fredoka text-base text-amber-900 mb-4">Revenue vs Expenses by Year</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={profitData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FDE68A" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#B45309', fontFamily: 'Nunito' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#B45309', fontFamily: 'Nunito' }} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: 'Nunito' }} />
                  <Bar dataKey="revenue"  name="Revenue"  fill="#16A34A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#DC2626" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5 flex-1 min-w-[260px]">
              <p className="font-fredoka text-base text-amber-900 mb-4">Net Profit Trend</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={profitData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FDE68A" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#B45309', fontFamily: 'Nunito' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#B45309', fontFamily: 'Nunito' }} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#F59E0B"
                    strokeWidth={3} dot={{ r: 5, fill: '#F59E0B' }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Expenses */}
        {activeView === 'expenses' && (
          <div className="flex gap-5 flex-wrap">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5 flex-1 min-w-[280px]">
              <p className="font-fredoka text-base text-amber-900 mb-4">Category Details</p>
              {[...expCat].sort((a, b) => b.total - a.total).map(cat => {
                const pct   = Math.round((cat.total / totalExp) * 100);
                const color = CAT_COLORS[cat.category] || '#999';
                return (
                  <div key={cat.category} className="mb-5">
                    <div className="flex justify-between mb-1.5">
                      <span className="font-bold text-sm text-amber-900 font-nunito">{cat.category}</span>
                      <span className="font-bold text-sm font-nunito" style={{ color }}>${cat.total.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-amber-100 rounded-full">
                      <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Revenue */}
        {activeView === 'revenue' && (
          <div className="flex gap-5 flex-wrap">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5 flex-1 min-w-[460px]">
              <p className="font-fredoka text-base text-amber-900 mb-4">Revenue by Product</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revItems} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FDE68A" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#B45309' }} tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="item" tick={{ fontSize: 11, fill: '#B45309', fontFamily: 'Nunito' }} width={130} />
                  <Tooltip formatter={v => [`$${v}`, 'Revenue']} contentStyle={{ fontSize: 12, fontFamily: 'Nunito', borderRadius: 12 }} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {revItems.map((_, i) => <Cell key={i} fill={ITEM_COLORS[i % ITEM_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5 w-56 shrink-0">
              <p className="font-fredoka text-base text-amber-900 mb-3">Product Ranking</p>
              {revItems.map((item, i) => (
                <div key={item.item} className="flex items-center gap-3 mb-3">
                  <span className="font-fredoka text-base min-w-[24px]" style={{ color: ITEM_COLORS[i % ITEM_COLORS.length] }}>#{i + 1}</span>
                  <div>
                    <p className="text-xs font-bold text-amber-900 font-nunito">{item.item}</p>
                    <p className="text-[11px] text-amber-400 font-nunito">${item.total.toLocaleString()}</p>
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
