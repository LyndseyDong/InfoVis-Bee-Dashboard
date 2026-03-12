import React from 'react';

const HEALTH_COLORS = { good: '#3DAA5C', watch: '#E8890C', risk: '#D93A2B' };

function hexPoints(cx, cy, r) {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(' ');
}

export function HiveHex({ hive, onClick, size = 100 }) {
  const color = HEALTH_COLORS[hive.health] || '#D4721A';
  const cx = size / 2, cy = size / 2, r = size / 2 - 5;
  const pts = hexPoints(cx, cy, r);
  const isActive = hive.health !== 'inactive';

  return (
    <div onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', display: 'inline-block', transition: 'transform 0.15s' }}
      onMouseOver={e => { if(onClick) e.currentTarget.style.transform = 'scale(1.06)'; }}
      onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id={`glow-${hive.id}`}>
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>
        <polygon points={pts} fill="white" stroke={color} strokeWidth="3"
          style={{ filter: `drop-shadow(0 2px 6px ${color}55)` }} />
        <text x={cx} y={cy - 4} textAnchor="middle" fill={color}
          fontSize={size * 0.19} fontFamily="'Fredoka One', cursive">{hive.id}</text>
        <text x={cx} y={cy + 13} textAnchor="middle" fill={color}
          fontSize={size * 0.11} fontFamily="'Nunito', sans-serif" fontWeight="700"
          opacity="0.7">{hive.latestMite ?? ''}</text>
      </svg>
    </div>
  );
}

export function AddHex({ onClick, size = 100 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 5;
  const pts = hexPoints(cx, cy, r);
  return (
    <div onClick={onClick} style={{ cursor: 'pointer', display: 'inline-block', transition: 'transform 0.15s' }}
      onMouseOver={e => e.currentTarget.style.transform = 'scale(1.06)'}
      onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon points={pts} fill="#FFFDF5" stroke="#D4721A" strokeWidth="2" strokeDasharray="5 3" />
        <text x={cx} y={cy - 2} textAnchor="middle" fill="#D4721A" fontSize={size * 0.28} fontFamily="sans-serif">+</text>
        <text x={cx} y={cy + 16} textAnchor="middle" fill="#D4721A" fontSize={size * 0.11} fontFamily="'Nunito', sans-serif" fontWeight="700">ADD HIVE</text>
      </svg>
    </div>
  );
}

export function LargeHex({ size = 300, children }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 8;
  const pts = hexPoints(cx, cy, r);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="lgHex" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF8E7" />
            <stop offset="100%" stopColor="#F7D98A" stopOpacity="0.5" />
          </linearGradient>
          <clipPath id="hexClip"><polygon points={pts} /></clipPath>
        </defs>
        <polygon points={pts} fill="url(#lgHex)" stroke="#E8890C" strokeWidth="4" />
      </svg>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: size * 0.74, height: size * 0.74,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>{children}</div>
    </div>
  );
}
