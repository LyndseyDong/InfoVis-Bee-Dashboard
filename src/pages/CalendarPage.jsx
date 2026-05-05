import { useState } from 'react';
import Navbar from '../components/Navbar';
import { useApp } from '../context/AppContext';
import {
  getAllTreatmentsByDate, getAllVaccinesByDate,
  getAllMiteAlertsByDate, getNextTreatmentDueDates,
} from '../data/dataHelpers';

const HIVE_COLORS = {
  Hive1: '#d7191c',
  Hive2: '#fdae61',
  Hive3: '#ffffbf',
  Hive4: '#abdda4',
  Hive5: '#2b83ba',
};

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function calendarDays(year, month) {
  const first  = new Date(year, month, 1).getDay();
  const daysIn = new Date(year, month + 1, 0).getDate();
  const cells  = [];
  for (let i = 0; i < first; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function pad(n) { return String(n).padStart(2, '0'); }


export default function CalendarPage() {
  const { refreshKey } = useApp();
  void refreshKey;

  const now = new Date();
  const [year,     setYear]     = useState(now.getFullYear());
  const [month,    setMonth]    = useState(now.getMonth());
  const [tip,      setTip]      = useState(null);

  const treatmentMap = getAllTreatmentsByDate();
  const vaccineMap   = getAllVaccinesByDate();
  const miteAlertMap = getAllMiteAlertsByDate();
  const dueDateMap   = getNextTreatmentDueDates(14);

  const cells    = calendarDays(year, month);
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const monthPrefix = `${year}-${pad(month + 1)}`;

  const thisMonthTreatDates  = Object.keys(treatmentMap).filter(d => d.startsWith(monthPrefix));
  const totalTreatsThisMonth = thisMonthTreatDates.reduce((s, d) => s + treatmentMap[d].length, 0);
  const treatHivesThisMonth  = [...new Set(thisMonthTreatDates.flatMap(d => treatmentMap[d].map(e => e.hiveId)))];

  const thisMonthVaxDates    = Object.keys(vaccineMap).filter(d => d.startsWith(monthPrefix));
  const totalVaxThisMonth    = thisMonthVaxDates.reduce((s, d) => s + vaccineMap[d].length, 0);
  const vaxHivesThisMonth    = [...new Set(thisMonthVaxDates.flatMap(d => vaccineMap[d].map(e => e.hiveId)))];

  const thisMonthAlertDates  = Object.keys(miteAlertMap).filter(d => d.startsWith(monthPrefix));
  const totalAlertsThisMonth = thisMonthAlertDates.reduce((s, d) => s + miteAlertMap[d].length, 0);

  const thisMonthDueDates    = Object.keys(dueDateMap).filter(d => d.startsWith(monthPrefix));

  const totalThisMonth = totalTreatsThisMonth + totalVaxThisMonth;

  return (
    <div className="page" onClick={() => setTip(null)}>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8 fade-in">

        {/* Header */}
        <div className="mb-7">
          <h2 className="font-fredoka text-2xl text-amber-900">📅 Treatment & Vaccine Calendar</h2>
          <p className="text-amber-400 text-sm mt-0.5 font-nunito">
            Treatments (●) · Vaccines (■) · Mite alerts (◆) · Due dates (○)
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
                  <p className="text-xs text-amber-500 font-nunito">
                    {totalThisMonth > 0 && `${totalThisMonth} event${totalThisMonth !== 1 ? 's' : ''}`}
                    {totalAlertsThisMonth > 0 && ` · ${totalAlertsThisMonth} ⚠ alert${totalAlertsThisMonth !== 1 ? 's' : ''}`}
                    {thisMonthDueDates.length > 0 && ` · ${thisMonthDueDates.length} due`}
                  </p>
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
                  const dateStr  = day ? `${year}-${pad(month + 1)}-${pad(day)}` : null;
                  const treats   = dateStr ? (treatmentMap[dateStr] || []) : [];
                  const vaccines = dateStr ? (vaccineMap[dateStr]   || []) : [];
                  const alerts   = dateStr ? (miteAlertMap[dateStr] || []) : [];
                  const dues     = dateStr ? (dueDateMap[dateStr]   || []) : [];
                  const isToday  = dateStr === todayStr;
                  const isPast   = dateStr && dateStr < todayStr;
                  const hasAny   = treats.length > 0 || vaccines.length > 0 || alerts.length > 0 || dues.length > 0;

                  return (
                    <div key={idx}
                      className={`relative min-h-[72px] p-1.5 border-b border-r border-amber-50 transition-colors
                        ${day ? 'cursor-default' : 'bg-amber-50/30'}
                        ${hasAny ? 'hover:bg-amber-50 cursor-pointer' : ''}
                        ${dues.length > 0 && !isPast ? 'bg-blue-50/30' : ''}
                        ${dues.length > 0 && isPast  ? 'bg-red-50/20'  : ''}
                      `}
                      onClick={e => {
                        if (!hasAny) return;
                        e.stopPropagation();
                        setTip(t => t?.date === dateStr ? null : { date: dateStr, treats, vaccines, alerts, dues });
                      }}
                    >
                      {day && (
                        <>
                          {/* Mite alert badge — top right */}
                          {alerts.length > 0 && (
                            <div className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold leading-none" style={{ fontSize: '7px' }}>!</span>
                            </div>
                          )}

                          <span className={`text-xs font-bold font-nunito block mb-1 ${isToday ? 'bg-amber-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]' : 'text-amber-700'}`}>
                            {day}
                          </span>

                          {/* Treatment dots — circles */}
                          {treats.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-0.5">
                              {treats.slice(0, 4).map((e, i) => (
                                <div key={i} className="w-2 h-2 rounded-full shadow-sm flex-shrink-0"
                                  style={{ background: HIVE_COLORS[e.hiveId] || '#999' }}
                                  title={`💊 ${e.hiveId}: ${e.treatment}`}
                                />
                              ))}
                              {treats.length > 4 && <span className="text-[8px] text-amber-400 font-nunito">+{treats.length - 4}</span>}
                            </div>
                          )}

                          {/* Vaccine dots — squares */}
                          {vaccines.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-0.5">
                              {vaccines.slice(0, 4).map((e, i) => (
                                <div key={i} className="w-2 h-2 rounded-sm shadow-sm flex-shrink-0"
                                  style={{ background: HIVE_COLORS[e.hiveId] || '#999' }}
                                  title={`💉 ${e.hiveId}: ${e.vaccine}`}
                                />
                              ))}
                              {vaccines.length > 4 && <span className="text-[8px] text-amber-400 font-nunito">+{vaccines.length - 4}</span>}
                            </div>
                          )}

                          {/* Treatment due dots — outlined circles */}
                          {dues.length > 0 && (
                            <div className="flex flex-wrap gap-0.5 mt-0.5">
                              {dues.slice(0, 4).map((e, i) => (
                                <div key={i} className="w-2 h-2 rounded-full flex-shrink-0 border-2"
                                  style={{ borderColor: HIVE_COLORS[e.hiveId] || '#999' }}
                                  title={`🔔 ${e.hiveId} treatment due`}
                                />
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

                {tip.alerts.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold text-red-400 uppercase tracking-wide font-nunito mb-1.5">⚠️ Mite Alerts</p>
                    <div className="flex flex-col gap-2 mb-3">
                      {tip.alerts.map((e, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-red-50 border border-red-100">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: HIVE_COLORS[e.hiveId] || '#999' }} />
                          <div>
                            <p className="font-bold text-sm text-red-800 font-nunito">{e.hiveId}</p>
                            <p className="text-xs text-red-400 font-nunito">Mite count: {e.miteCount} — above threshold</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {tip.dues.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wide font-nunito mb-1.5">🔔 Treatment Due</p>
                    <div className="flex flex-col gap-2 mb-3">
                      {tip.dues.map((e, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-blue-50 border border-blue-100">
                          <div className="w-2.5 h-2.5 rounded-full border-2 flex-shrink-0" style={{ borderColor: HIVE_COLORS[e.hiveId] || '#999' }} />
                          <div>
                            <p className="font-bold text-sm text-blue-800 font-nunito">{e.hiveId}</p>
                            <p className="text-xs text-blue-400 font-nunito">Last: {e.lastTreatment} on {e.lastDate}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {tip.treats.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide font-nunito mb-1.5">💊 Treatments</p>
                    <div className="flex flex-col gap-2 mb-3">
                      {tip.treats.map((e, i) => (
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
                  </>
                )}

                {tip.vaccines.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide font-nunito mb-1.5">💉 Vaccines</p>
                    <div className="flex flex-col gap-2">
                      {tip.vaccines.map((e, i) => (
                        <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-xl"
                          style={{ background: (HIVE_COLORS[e.hiveId] || '#999') + '12' }}>
                          <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: HIVE_COLORS[e.hiveId] || '#999' }} />
                          <div>
                            <p className="font-bold text-sm text-amber-900 font-nunito">{e.hiveId}</p>
                            <p className="text-xs text-amber-500 font-nunito">{e.vaccine}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right sidebar — legend, interval, year only */}
          <div className="w-52 flex flex-col gap-4 shrink-0">

            {/* Hive legend + shape key */}
            <div className="bg-white border border-amber-200 rounded-2xl shadow-sm p-4">
              <p className="font-fredoka text-sm text-amber-900 mb-2">Hive Legend</p>
              {Object.entries(HIVE_COLORS).map(([id, color]) => (
                <div key={id} className="flex items-center gap-2.5 mb-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="font-bold text-sm text-amber-800 font-nunito">{id}</span>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-amber-100 flex flex-col gap-1.5">
                {[
                  { shape: 'rounded-full w-2.5 h-2.5 bg-amber-400',              label: 'Treatment' },
                  { shape: 'rounded-sm w-2.5 h-2.5 bg-purple-400',               label: 'Vaccine' },
                  { shape: 'rounded-full w-2.5 h-2.5 border-2 border-blue-400',  label: 'Due date' },
                  { shape: 'rounded-full w-2.5 h-2.5 bg-red-500',                label: 'Mite alert' },
                ].map(({ shape, label }) => (
                  <div key={label} className="flex items-center gap-2">
                    <div className={`flex-shrink-0 ${shape}`} />
                    <span className="text-[11px] text-amber-600 font-nunito">{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Year jump */}
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

        {/* ── Bottom summary row ───────────────────────────────────────────────── */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">

          {/* Treatments this month */}
          <div className="bg-amber-50 border border-amber-300 rounded-2xl shadow-sm p-4">
            <p className="font-fredoka text-sm text-amber-900 mb-2">💊 Treatments</p>
            {totalTreatsThisMonth === 0
              ? <p className="text-xs text-amber-400 font-nunito">None this month</p>
              : (
                <>
                  <p className="font-fredoka text-2xl text-honey-600 mb-2">{totalTreatsThisMonth}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {treatHivesThisMonth.map(id => (
                      <span key={id} className="text-[10px] font-bold px-2 py-0.5 rounded-full font-nunito"
                        style={{ background: (HIVE_COLORS[id] || '#999') + '20', color: HIVE_COLORS[id] || '#999' }}>
                        {id}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1">
                    {thisMonthTreatDates.sort().map(d => (
                      <div key={d} className="flex justify-between text-[11px] font-nunito">
                        <span className="text-amber-700">{d.slice(5)}</span>
                        <span className="text-amber-400">{treatmentMap[d].length} hive{treatmentMap[d].length > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
          </div>

          {/* Vaccines this month */}
          <div className="bg-purple-50 border border-purple-200 rounded-2xl shadow-sm p-4">
            <p className="font-fredoka text-sm text-purple-900 mb-2">💉 Vaccines</p>
            {totalVaxThisMonth === 0
              ? <p className="text-xs text-purple-300 font-nunito">None this month</p>
              : (
                <>
                  <p className="font-fredoka text-2xl text-purple-600 mb-2">{totalVaxThisMonth}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {vaxHivesThisMonth.map(id => (
                      <span key={id} className="text-[10px] font-bold px-2 py-0.5 rounded-full font-nunito"
                        style={{ background: (HIVE_COLORS[id] || '#999') + '20', color: HIVE_COLORS[id] || '#999' }}>
                        {id}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-col gap-1">
                    {thisMonthVaxDates.sort().map(d => (
                      <div key={d} className="flex justify-between text-[11px] font-nunito">
                        <span className="text-purple-700">{d.slice(5)}</span>
                        <span className="text-purple-400">{vaccineMap[d].length} hive{vaccineMap[d].length > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
          </div>

          {/* Mite alerts this month */}
          <div className={`rounded-2xl shadow-sm p-4 border ${totalAlertsThisMonth > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-amber-200'}`}>
            <p className={`font-fredoka text-sm mb-2 ${totalAlertsThisMonth > 0 ? 'text-red-800' : 'text-amber-900'}`}>⚠️ Mite Alerts</p>
            {totalAlertsThisMonth === 0
              ? <p className="text-xs text-amber-400 font-nunito">No alerts this month</p>
              : (
                <>
                  <p className="font-fredoka text-2xl text-red-600 mb-2">{totalAlertsThisMonth}</p>
                  <div className="flex flex-col gap-1">
                    {thisMonthAlertDates.sort().map(d => (
                      <div key={d} className="flex justify-between text-[11px] font-nunito">
                        <span className="text-red-700">{d.slice(5)}</span>
                        <span className="text-red-400">{miteAlertMap[d].length} hive{miteAlertMap[d].length > 1 ? 's' : ''}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
          </div>

          {/* Due dates this month */}
          <div className={`rounded-2xl shadow-sm p-4 border ${thisMonthDueDates.length > 0 ? 'bg-blue-50 border-blue-200' : 'bg-white border-amber-200'}`}>
            <p className={`font-fredoka text-sm mb-2 ${thisMonthDueDates.length > 0 ? 'text-blue-800' : 'text-amber-900'}`}>🔔 Due This Month</p>
            {thisMonthDueDates.length === 0
              ? <p className="text-xs text-amber-400 font-nunito">Nothing due this month</p>
              : (
                <div className="flex flex-col gap-2">
                  {thisMonthDueDates.sort().map(d =>
                    dueDateMap[d].map((e, i) => {
                      const isOverdue = d < todayStr;
                      return (
                        <div key={`${d}-${i}`} className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: HIVE_COLORS[e.hiveId] || '#999' }} />
                            <span className="text-xs font-bold text-blue-800 font-nunito">{e.hiveId}</span>
                          </div>
                          <span className={`text-[10px] font-bold font-nunito ${isOverdue ? 'text-red-500' : 'text-blue-500'}`}>
                            {isOverdue ? 'overdue' : d.slice(5)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
          </div>
        </div>

      </div>
    </div>
  );
}
