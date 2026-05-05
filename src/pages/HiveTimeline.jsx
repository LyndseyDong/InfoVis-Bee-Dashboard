import React, { useState, useMemo } from 'react';
import Navbar from '../components/Navbar';
import { HIVE_IDS, getMiteData, getHiveEvents, getTreatments } from '../data/dataHelpers';

const START_YEAR   = 2021;
const END_YEAR     = 2025;
const TOTAL_MONTHS = (END_YEAR - START_YEAR + 1) * 12;
const YEARS        = [2021, 2022, 2023, 2024, 2025];

function monthOffset(dateStr) {
  const year  = parseInt(dateStr.slice(0, 4));
  const month = parseInt(dateStr.slice(5, 7)) - 1;
  return (year - START_YEAR) * 12 + month;
}

function deriveSegments(hiveId) {
  const readings = getMiteData(hiveId, 'all');
  if (!readings.length) return [{ start: 0, end: TOTAL_MONTHS, status: 'inactive' }];

  const firstMonth = monthOffset(readings[0].date);
  const segments   = [];

  if (firstMonth > 0) segments.push({ start: 0, end: firstMonth, status: 'inactive' });

  readings.forEach((r, i) => {
    const start  = monthOffset(r.date);
    const end    = i < readings.length - 1 ? monthOffset(readings[i + 1].date) : Math.min(start + 2, TOTAL_MONTHS);
    const status = r.value >= 9 ? 'risk' : r.value >= 5 ? 'watch' : 'good';
    const prevEnd = segments.length ? segments[segments.length - 1].end : firstMonth;
    if (start > prevEnd) segments.push({ start: prevEnd, end: start, status: 'inactive' });
    if (end > start) segments.push({ start, end, status });
  });

  const lastEnd = segments.length ? segments[segments.length - 1].end : 0;
  if (lastEnd < TOTAL_MONTHS) segments.push({ start: lastEnd, end: TOTAL_MONTHS, status: 'inactive' });

  return segments;
}

const SEG_COLORS = { good: 'green', watch: 'orange', risk: 'red', inactive: '#ccc' };
const EVENT_COLORS = { HiveDeath: 'red', Replaced: 'green', Split: 'blue' };

export default function HiveTimeline() {
  const [showHealth,     setShowHealth]     = useState(true);
  const [showEvents,     setShowEvents]     = useState(true);
  const [showTreatments, setShowTreatments] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  const now       = new Date();
  const nowOffset = (now.getFullYear() - START_YEAR) * 12 + now.getMonth();
  const nowPct    = Math.min(100, Math.max(0, (nowOffset / TOTAL_MONTHS) * 100));

  const hiveData = useMemo(() => HIVE_IDS.map(id => ({
    id,
    segments:   deriveSegments(id),
    events:     getHiveEvents(id).map(e => ({ month: monthOffset(e.date), type: e.event, date: e.date, note: e.notes || '' })),
    treatments: getTreatments(id, 'all').filter(t => t.treatment && t.treatment !== 'None')
                  .map(t => ({ month: monthOffset(t.date), type: t.treatment, date: t.date })),
  })), []);

  return (
    <div className="page">
      <Navbar />
      <div style={{ padding: '20px' }}>

        <h2>Hive Life Stage Timeline</h2>
        <p style={{ marginBottom: '12px' }}>Hover over segments and markers for details.</p>

        {/* Toggles */}
        <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
          <label><input type="checkbox" checked={showHealth}     onChange={e => setShowHealth(e.target.checked)}     /> Health</label>
          <label><input type="checkbox" checked={showEvents}     onChange={e => setShowEvents(e.target.checked)}     /> Events</label>
          <label><input type="checkbox" checked={showTreatments} onChange={e => setShowTreatments(e.target.checked)} /> Treatments</label>
        </div>

        {/* Year header */}
        <div style={{ display: 'flex', marginLeft: '80px', marginBottom: '4px' }}>
          {YEARS.map(y => (
            <div key={y} style={{ flex: 1, fontSize: '12px', fontWeight: 'bold', borderLeft: '1px solid #ccc', paddingLeft: '4px' }}>
              {y}
            </div>
          ))}
        </div>

        {/* Hive rows */}
        {hiveData.map(hive => (
          <div key={hive.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>

            <div style={{ width: '80px', fontSize: '13px', fontWeight: 'bold' }}>{hive.id}</div>

            <div style={{ flex: 1, height: '24px', position: 'relative', background: '#eee', borderRadius: '2px' }}>

              {/* Today line */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${nowPct}%`, width: '2px', background: 'black', opacity: 0.4, zIndex: 3 }} />

              {/* Health segments */}
              {showHealth && hive.segments.map((seg, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute', top: 0, height: '100%',
                    left:  `${(seg.start / TOTAL_MONTHS) * 100}%`,
                    width: `${((seg.end - seg.start) / TOTAL_MONTHS) * 100}%`,
                    background: SEG_COLORS[seg.status],
                    opacity: 0.7, cursor: 'default', zIndex: 1,
                  }}
                  onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, text: `${hive.id} — ${seg.status} (months ${seg.start}–${seg.end})` })}
                  onMouseMove={e => setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}

              {/* Event markers */}
              {showEvents && hive.events.map((ev, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute', top: '50%', left: `${(ev.month / TOTAL_MONTHS) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '12px', height: '12px', borderRadius: '50%',
                    background: EVENT_COLORS[ev.type] || '#555',
                    border: '1.5px solid white', zIndex: 4, cursor: 'pointer',
                  }}
                  onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, text: `${ev.type} — ${ev.date}${ev.note ? ': ' + ev.note : ''}` })}
                  onMouseMove={e => setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}

              {/* Treatment markers */}
              {showTreatments && hive.treatments.map((tr, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute', top: '50%', left: `${(tr.month / TOTAL_MONTHS) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '10px', height: '10px',
                    background: 'purple', border: '1.5px solid white',
                    zIndex: 4, cursor: 'pointer',
                  }}
                  onMouseEnter={e => setTooltip({ x: e.clientX, y: e.clientY, text: `Treatment: ${tr.type} — ${tr.date}` })}
                  onMouseMove={e => setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }))}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}

            </div>
          </div>
        ))}

        {/* Legend */}
        <div style={{ marginTop: '12px', fontSize: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <span><span style={{ background: 'green',  display: 'inline-block', width: 12, height: 12 }} /> Good</span>
          <span><span style={{ background: 'orange', display: 'inline-block', width: 12, height: 12 }} /> Watch</span>
          <span><span style={{ background: 'red',    display: 'inline-block', width: 12, height: 12 }} /> At risk</span>
          <span><span style={{ background: '#ccc',   display: 'inline-block', width: 12, height: 12 }} /> Inactive</span>
          <span><span style={{ background: 'red',    display: 'inline-block', width: 12, height: 12, borderRadius: '50%' }} /> Death</span>
          <span><span style={{ background: 'green',  display: 'inline-block', width: 12, height: 12, borderRadius: '50%' }} /> Replaced</span>
          <span><span style={{ background: 'blue',   display: 'inline-block', width: 12, height: 12, borderRadius: '50%' }} /> Split</span>
          <span><span style={{ background: 'purple', display: 'inline-block', width: 12, height: 12 }} /> Treatment</span>
        </div>

      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{
          position: 'fixed', left: tooltip.x + 10, top: tooltip.y - 10,
          background: 'white', border: '1px solid #ccc',
          padding: '6px 10px', fontSize: '12px',
          pointerEvents: 'none', zIndex: 9999,
        }}>
          {tooltip.text}
        </div>
      )}
    </div>
  );
}