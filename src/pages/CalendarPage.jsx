import { useState } from 'react';
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';
import { getAllTreatmentsByDate } from '../data/dataHelpers';

const HIVE_COLORS = {
  Hive1: '#F59E0B',
  Hive2: '#16A34A',
  Hive3: '#2563EB',
  Hive4: '#9333EA',
  Hive5: '#DC2626',
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function calendarDays(year, month) {
  // month is 0-indexed
  const first   = new Date(year, month, 1).getDay();   // weekday of 1st
  const daysIn  = new Date(year, month + 1, 0).getDate();
  const cells   = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function pad(n) { return String(n).padStart(2, '0'); }

export default function CalendarPage() {
  const { refreshKey } = useApp();
  void refreshKey;

  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [tip,   setTip]   = useState(null); // { date, entries, x, y }

  const treatmentMap = getAllTreatmentsByDate();
  const cells = calendarDays(year, month);
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  // Count treatments this month
  const monthPrefix = `${year}-${pad(month + 1)}`;
  const thisMonthDates = Object.keys(treatmentMap).filter(d => d.startsWith(monthPrefix));
  const totalThisMonth = thisMonthDates.reduce((s, d) => s + treatmentMap[d].length, 0);
  const hivesThisMonth = [...new Set(thisMonthDates.flatMap(d => treatmentMap[d].map(e => e.hiveId)))];

  return (
    <div className="page" onClick={() => setTip(null)}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8 fade-in">

        {/* Header */}
        <div className="mb-7">
          <h2 className="font-fredoka text-2xl text-amber-900">📅 Treatment Calendar</h2>
          <p className="text-amber-400 text-sm mt-0.5 font-nunito">
            Monthly view of all treatments applied across the apiary
          </p>
        </div>

        <div className="flex gap-6 flex-wrap items-start">

          {/* Calendar card */}
          <div className="flex-1 min-w-[340px]">
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm overflow-hidden">

              {/* Month navigation */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 bg-amber-50/60">
                <button onClick={prevMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-amber-100 text-amber-600 font-bold text-lg transition-colors">‹</button>
                <div className="text-center">
                  <p className="font-fredoka text-xl text-amber-900">{MONTH_NAMES[month]} {year}</p>
                  {totalThisMonth > 0 && (
                    <p className="text-xs text-amber-500 font-nunito">{totalThisMonth} treatment{totalThisMonth !== 1 ? 's' : ''} this month</p>
                  )}
                </div>
                <button onClick={nextMonth}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-amber-100 text-amber-600 font-bold text-lg transition-colors">›</button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-amber-100">
                {DAY_NAMES.map(d => (
                  <div key={d} className="py-2 text-center text-[11px] font-bold text-amber-400 uppercase tracking-wide font-nunito">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7">
                {cells.map((day, idx) => {
                  const dateStr   = day ? `${year}-${pad(month + 1)}-${pad(day)}` : null;
                  const entries   = dateStr ? (treatmentMap[dateStr] || []) : [];
                  const isToday   = dateStr === todayStr;
                  const hasTreat  = entries.length > 0;

                  return (
                    <div key={idx}
                      className={`relative min-h-[68px] p-1.5 border-b border-r border-amber-50 transition-colors ${day ? 'cursor-default' : 'bg-amber-50/30'} ${hasTreat ? 'hover:bg-amber-50 cursor-pointer' : ''}`}
                      onClick={e => {
                        if (!hasTreat) return;
                        e.stopPropagation();
                        setTip(t => t?.date === dateStr ? null : { date: dateStr, entries });
                      }}
                    >
                      {day && (
                        <>
                          <span className={`text-xs font-bold font-nunito block mb-1 ${isToday ? 'bg-amber-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]' : 'text-amber-700'}`}>
                            {day}
                          </span>
                          {/* Treatment dots */}
                          {entries.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-0.5">
                              {entries.slice(0, 4).map((e, i) => (
                                <div key={i} className="w-2 h-2 rounded-full shadow-sm flex-shrink-0"
                                  style={{ background: HIVE_COLORS[e.hiveId] || '#999' }}
                                  title={`${e.hiveId}: ${e.treatment}`}
                                />
                              ))}
                              {entries.length > 4 && (
                                <span className="text-[8px] text-amber-400 font-nunito">+{entries.length - 4}</span>
                              )}
                            </div>
                          )}
                          {/* Pill labels when ≤ 2 entries */}
                          {entries.length > 0 && entries.length <= 2 && (
                            <div className="mt-1 flex flex-col gap-0.5">
                              {entries.map((e, i) => (
                                <span key={i} className="text-[8px] font-bold font-nunito rounded px-1 leading-tight truncate"
                                  style={{ background: (HIVE_COLORS[e.hiveId] || '#999') + '20', color: HIVE_COLORS[e.hiveId] || '#999' }}>
                                  {e.hiveId}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected day tooltip */}
            {tip && (
              <div className="mt-3 bg-white border border-amber-200 rounded-2xl shadow-lg p-4 fade-in">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-fredoka text-base text-amber-900">📋 {tip.date}</p>
                  <button onClick={() => setTip(null)} className="text-amber-400 hover:text-amber-600 text-lg leading-none">×</button>
                </div>
                <div className="flex flex-col gap-2">
                  {tip.entries.map((e, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl"
                      style={{ background: (HIVE_COLORS[e.hiveId] || '#999') + '12' }}>
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: HIVE_COLORS[e.hiveId] || '#999' }} />
                      <div>
                        <p className="font-bold text-sm text-amber-900 font-nunito">{e.hiveId}</p>
                        <p className="text-xs text-amber-500 font-nunito">{e.treatment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: legend + stats */}
          <div className="w-56 flex flex-col gap-4 shrink-0">

            {/* Hive legend */}
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-4">
              <p className="font-fredoka text-sm text-amber-900 mb-3">Hive Legend</p>
              {Object.entries(HIVE_COLORS).map(([id, color]) => (
                <div key={id} className="flex items-center gap-2.5 mb-2.5">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="font-bold text-sm text-amber-800 font-nunito">{id}</span>
                </div>
              ))}
            </div>

            {/* This month summary */}
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-4">
              <p className="font-fredoka text-sm text-amber-900 mb-3">{MONTH_NAMES[month]} Summary</p>
              {totalThisMonth === 0 ? (
                <p className="text-xs text-amber-400 font-nunito">No treatments recorded this month.</p>
              ) : (
                <>
                  <div className="mb-3">
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide font-nunito mb-0.5">Total Treatments</p>
                    <p className="font-fredoka text-2xl text-honey-600">{totalThisMonth}</p>
                  </div>
                  <div className="mb-3">
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide font-nunito mb-1">Treated Hives</p>
                    <div className="flex flex-wrap gap-1">
                      {hivesThisMonth.map(id => (
                        <span key={id} className="text-[10px] font-bold px-2 py-0.5 rounded-full font-nunito"
                          style={{ background: (HIVE_COLORS[id] || '#999') + '20', color: HIVE_COLORS[id] || '#999' }}>
                          {id}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide font-nunito mb-1">Treatment Dates</p>
                    <div className="flex flex-col gap-1">
                      {thisMonthDates.sort().map(d => (
                        <div key={d} className="flex justify-between text-[11px] font-nunito">
                          <span className="text-amber-700">{d.slice(5)}</span>
                          <span className="text-amber-400">{treatmentMap[d].length} hive{treatmentMap[d].length > 1 ? 's' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Quick year jump */}
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-4">
              <p className="font-fredoka text-sm text-amber-900 mb-2">Jump to Year</p>
              <div className="flex flex-wrap gap-1.5">
                {[2021, 2022, 2023, 2024, 2025].map(y => (
                  <button key={y} onClick={() => setYear(y)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all font-nunito ${y === year ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
                    {y}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
