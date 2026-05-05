import React, { useState, useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis,
  Tooltip, ResponsiveContainer, CartesianGrid,
  ReferenceLine, Line, ComposedChart,
} from 'recharts';

// ── Linear regression helpers ──────────────────────────────────────────
function linearRegression(points) {
  const n = points.length;
  if (n < 2) return null;
  const sumX  = points.reduce((s, p) => s + p.x, 0);
  const sumY  = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0);
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;
  const slope     = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  const meanX     = sumX / n;
  const meanY     = sumY / n;
  // R²
  const ssTot = points.reduce((s, p) => s + Math.pow(p.y - meanY, 2), 0);
  const ssRes = points.reduce((s, p) => s + Math.pow(p.y - (slope * p.x + intercept), 2), 0);
  const r2    = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  return { slope, intercept, meanX, r2 };
}

// Standard error of regression → used for confidence band
function stdError(points, slope, intercept) {
  const n = points.length;
  if (n < 3) return 0;
  const residuals = points.map(p => Math.pow(p.y - (slope * p.x + intercept), 2));
  return Math.sqrt(residuals.reduce((s, r) => s + r, 0) / (n - 2));
}

// Build evenly-spaced trend + band points across x range
function buildTrendLine(points, slope, intercept, se, nSteps = 40) {
  if (!points.length) return [];
  const xs = points.map(p => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  if (minX === maxX) return [];
  const step = (maxX - minX) / nSteps;
  return Array.from({ length: nSteps + 1 }, (_, i) => {
    const x = minX + i * step;
    const y = slope * x + intercept;
    return { x, y, upper: y + 1.96 * se, lower: y - 1.96 * se };
  });
}

function fmtVal(meta, v) {
  if (v == null) return '—';
  return meta.isCurrency ? `$${Number(v).toLocaleString()}` : `${v}${meta.unit ? ' ' + meta.unit : ''}`;
}

function fmtTick(meta, v) {
  return meta.isCurrency ? `$${Math.round(v).toLocaleString()}` : v;
}

// ── Toggle button ──────────────────────────────────────────────────────
function Toggle({ active, onClick, color, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '5px 12px', borderRadius: '20px', border: '1.5px solid',
      borderColor: active ? color : 'var(--border)',
      background: active ? color + '18' : 'white',
      color: active ? color : 'var(--text-mid)',
      fontWeight: '700', fontSize: '12px', cursor: 'pointer',
      fontFamily: 'Nunito', transition: 'all 0.15s',
    }}>{children}</button>
  );
}

// ── Main component ─────────────────────────────────────────────────────
// Props:
//   points      — array of { x, y, id?, date? }   (already filtered/joined)
//   xMeta       — { label, unit, isCurrency }
//   yMeta       — { label, unit, isCurrency }
//   dotColor    — hex for scatter dots (or array of { status, color, data } for health-colored)
//   healthDots  — bool: if true, `points` is replaced by `byHealth` array
//   byHealth    — [{ status, color, data: [{x,y,id}] }]
//   title       — card title string
//   note        — small grey note below chart
//   granularityNote — optional yellow note about granularity coarsening
export default function ScatterComparison({
  xMeta, yMeta,
  points = [],
  byHealth = null,
  dotColor = '#3DAA5C',
  title = '📊 Metric Comparison',
  note = '',
  granularityNote = '',
  // Axis selectors are rendered by the parent; this component only draws the chart
  // and the trend/band toggles.
  axisSelectors = null,
}) {
  const [showTrend, setShowTrend]  = useState(false);
  const [showBand,  setShowBand]   = useState(false);

  // Flatten byHealth → points for regression
  const allPoints = byHealth
    ? byHealth.flatMap(g => g.data)
    : points;

  const reg = useMemo(() => linearRegression(allPoints), [allPoints]);
  const se  = useMemo(
    () => reg ? stdError(allPoints, reg.slope, reg.intercept) : 0,
    [allPoints, reg]
  );
  const trendLine = useMemo(
    () => reg ? buildTrendLine(allPoints, reg.slope, reg.intercept, se) : [],
    [allPoints, reg, se]
  );

  const hasEnough = allPoints.length >= 2;

  // Custom scatter dot — drawn via recharts `shape` prop
  const makeDot = (color) => (props) => {
    const { cx, cy } = props;
    return <circle cx={cx} cy={cy} r={6} fill={color} fillOpacity={0.85} stroke="white" strokeWidth={1} />;
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    // Trend line points have no id/date
    if (d?.upper != null) return null;
    return (
      <div style={{ background: '#FFFDF5', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', fontFamily: 'Nunito' }}>
        {(d?.id || d?.date) && <p style={{ fontWeight: '800', marginBottom: '3px' }}>{d?.id || d?.date}</p>}
        <p>{xMeta.label}: <b>{fmtVal(xMeta, d?.x)}</b></p>
        <p>{yMeta.label}: <b>{fmtVal(yMeta, d?.y)}</b></p>
      </div>
    );
  };

  const axisProps = {
    x: {
      tick: { fontSize: 11, fill: 'var(--text-mid)', fontFamily: 'Nunito' },
      tickFormatter: v => fmtTick(xMeta, v),
      label: { value: xMeta.label, position: 'insideBottom', offset: -16, fontSize: 11, fill: 'var(--text-mid)', fontFamily: 'Nunito' },
    },
    y: {
      tick: { fontSize: 11, fill: 'var(--text-mid)', fontFamily: 'Nunito' },
      tickFormatter: v => fmtTick(yMeta, v),
      label: { value: yMeta.label, angle: -90, position: 'insideLeft', offset: 10, fontSize: 11, fill: 'var(--text-mid)', fontFamily: 'Nunito' },
    },
  };

  return (
    <div className="card" style={{ padding: '20px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
        <p style={{ fontFamily: "'Fredoka One',cursive", fontSize: '15px', color: 'var(--text)', marginRight: '4px' }}>
          {title}
        </p>
        {axisSelectors}
      </div>

      {/* Trend / band toggles */}
      {hasEnough && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Toggle active={showTrend} onClick={() => setShowTrend(t => !t)} color="#6366F1">
            Trend line
          </Toggle>
          <Toggle active={showBand} onClick={() => { setShowBand(b => !b); if (!showTrend) setShowTrend(true); }} color="#F5A623">
            Confidence Band (95%)
          </Toggle>
          {showTrend && reg && (
            <span style={{ fontSize: '11px', color: 'var(--text-mid)', marginLeft: '4px' }}>
              R² = <b>{reg.r2.toFixed(2)}</b>
              {' · '}slope = <b>{reg.slope > 0 ? '+' : ''}{reg.slope.toFixed(2)}</b>
            </span>
          )}
        </div>
      )}

      {granularityNote && (
        <p style={{ fontSize: '11px', color: 'var(--text-mid)', background: 'var(--honey-light)', borderRadius: '6px', padding: '5px 10px', marginBottom: '12px' }}>
          {granularityNote}
        </p>
      )}

      {!hasEnough ? (
        <p style={{ color: 'var(--text-light)', fontSize: '13px', padding: '16px 0' }}>
          Not enough data points to plot this combination.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart margin={{ top: 10, right: 20, bottom: 30, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" dataKey="x" {...axisProps.x} />
            <YAxis type="number" dataKey="y" {...axisProps.y} />
            <ZAxis range={[55, 55]} />
            <Tooltip content={<CustomTooltip />} />

            {/* Confidence band — drawn as two lines with area fill via two Scatter layers */}
            {showTrend && showBand && trendLine.length > 0 && (
              <>
                <Line
                  data={trendLine} type="monotone" dataKey="upper"
                  stroke="#F5A623" strokeWidth={1} strokeDasharray="4 3"
                  dot={false} activeDot={false} legendType="none"
                />
                <Line
                  data={trendLine} type="monotone" dataKey="lower"
                  stroke="#F5A623" strokeWidth={1} strokeDasharray="4 3"
                  dot={false} activeDot={false} legendType="none"
                />
              </>
            )}

            {/* Trend line */}
            {showTrend && trendLine.length > 0 && (
              <Line
                data={trendLine} type="monotone" dataKey="y"
                stroke="#6366F1" strokeWidth={2} dot={false} activeDot={false}
                legendType="none"
              />
            )}

            {/* Scatter dots — health-colored or single color */}
            {byHealth ? (
              byHealth.map(({ status, color, data }) => (
                <Scatter key={status} name={status} data={data} shape={makeDot(color)} />
              ))
            ) : (
              <Scatter data={points} shape={makeDot(dotColor)} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Legend for health colors */}
      {byHealth && (
        <div style={{ display: 'flex', gap: '14px', marginTop: '10px', flexWrap: 'wrap' }}>
          {byHealth.map(({ status, color }) => (
            <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: '11px', color: 'var(--text-mid)', fontWeight: '600', textTransform: 'capitalize' }}>{status}</span>
            </div>
          ))}
          {showTrend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: 18, height: 2, background: '#6366F1', borderRadius: 1 }} />
              <span style={{ fontSize: '11px', color: 'var(--text-mid)', fontWeight: '600' }}>Trend (all hives)</span>
            </div>
          )}
          {showBand && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: 18, height: 2, background: '#F5A623', borderRadius: 1, borderTop: '1px dashed #F5A623' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-mid)', fontWeight: '600' }}>95% confidence band</span>
            </div>
          )}
        </div>
      )}

      {note && (
        <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '10px' }}>{note}</p>
      )}
    </div>
  );
}