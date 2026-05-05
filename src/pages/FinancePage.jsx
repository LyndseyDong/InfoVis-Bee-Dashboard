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

const ITEM_COLORS = [
  '#F59E0B', '#16A34A', '#2563EB', '#9333EA',
  '#F97316', '#06B6D4', '#EC4899', '#64748B'
];

function StatCard({ label, value, sub, valueClass }) {
  return (
    <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5 flex-1 min-w-[150px]">
      <p className="text-[11px] font-bold text-amber-400 uppercase tracking-widest mb-1 font-nunito">
        {label}
      </p>
      <p className={`font-fredoka text-3xl leading-none ${valueClass || 'text-amber-900'}`}>
        {value}
      </p>
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
        <p key={i} style={{ color: p.color }}>
          {p.name}: ${p.value?.toLocaleString()}
        </p>
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

  // sort state for ranking list only
  const [sortOrder, setSortOrder] = useState('desc'); // desc = highest first

  const profitData = getNetProfitByYear();
  const expCat     = getExpensesByCategory(selectedYear);
  const revItems   = getRevenueByItem(selectedYear);
  const totalRev   = getTotalRevenue(selectedYear);
  const totalExp   = getTotalExpenses(selectedYear);
  const netProfit  = totalRev - totalExp;
  const margin     = totalRev > 0 ? Math.round((netProfit / totalRev) * 100) : null;

  const sortedRevItems = [...revItems].sort((a, b) =>
    sortOrder === 'desc' ? b.total - a.total : a.total - b.total
  );

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

        {/* KPI */}
        <div className="flex gap-3 flex-wrap mb-7">
          <StatCard label="Total Revenue" value={`$${totalRev.toLocaleString()}`} sub="sales" valueClass="text-green-600" />
          <StatCard label="Total Expenses" value={`$${totalExp.toLocaleString()}`} sub="costs" valueClass="text-red-600" />
          <StatCard label="Net Profit" value={`$${netProfit.toLocaleString()}`} sub="net" valueClass={netProfit >= 0 ? 'text-green-600' : 'text-red-600'} />
          <StatCard label="Profit Margin" value={margin !== null ? `${margin}%` : '—'} sub="ratio" />
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {VIEWS.map(v => (
            <button
              key={v.key}
              onClick={() => setActiveView(v.key)}
              className={`px-4 py-2 rounded-full border text-sm font-bold transition-all font-nunito ${
                activeView === v.key
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'bg-white border-amber-200 text-amber-600 hover:border-amber-300'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeView === 'overview' && (
          <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5">
            <p className="font-fredoka text-base text-amber-900 mb-4">
              Revenue vs Expenses by Year
            </p>

            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={profitData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FDE68A" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `$${v}`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" fill="#16A34A" />
                <Bar dataKey="expenses" fill="#DC2626" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* EXPENSES */}
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

        {/* REVENUE */}
        {activeView === 'revenue' && (
          <div className="flex gap-5 flex-wrap">

            {/* BAR CHART */}
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5 flex-1 min-w-[460px]">
              <p className="font-fredoka text-base text-amber-900 mb-4">
                Revenue by Product
              </p>

              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revItems} layout="vertical" barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `$${v}`} />
                  <YAxis type="category" dataKey="item" width={130} />
                  <Tooltip formatter={v => `$${v}`} />
                  <Bar dataKey="total">
                    {revItems.map((_, i) => (
                      <Cell key={i} fill={ITEM_COLORS[i % ITEM_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* RANKING LIST */}
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-5 w-56">

              {/* HEADER + TOGGLE */}
              <div className="flex items-center justify-between mb-3">
                <p className="font-fredoka text-base text-amber-900">Product Ranking</p>

                {/* UP/DOWN TOGGLE BUTTON*/}
                <button
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex flex-col items-center justify-center w-6 h-6 border border-amber-200 rounded hover:bg-amber-50 transition"
                  title={sortOrder === 'desc' ? 'Highest → Lowest' : 'Lowest → Highest'}
                >
                  {/* up triangle */}
                  <div
                    className={`w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-amber-700 ${
                      sortOrder === 'asc' ? 'opacity-100' : 'opacity-30'
                    }`}
                  />
                  {/* down triangle */}
                  <div
                    className={`w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-amber-700 ${
                      sortOrder === 'desc' ? 'opacity-100' : 'opacity-30'
                    }`}
                  />
                </button>
              </div>

              {/* LIST */}
              {sortedRevItems.map((item, i) => (
                <div key={item.item} className="flex items-center gap-3 mb-3">
                  <span
                    className="font-fredoka text-base min-w-[24px]"
                    style={{ color: ITEM_COLORS[i % ITEM_COLORS.length] }}
                  >
                    #{i + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-amber-900 font-nunito">
                      {item.item}
                    </p>
                    <p className="text-[11px] text-amber-400 font-nunito">
                      ${item.total.toLocaleString()}
                    </p>
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