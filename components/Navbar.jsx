import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { logout, selectedYear, setSelectedYear } = useApp();
  const navigate = useNavigate();
  const loc = useLocation();

  const isHealth = loc.pathname === '/' || loc.pathname.startsWith('/hive');
  const isFinance = loc.pathname === '/finance';

  const navLinkStyle = (active) => ({
    fontFamily: "'Fredoka One', cursive",
    fontSize: '15px',
    padding: '6px 18px',
    borderRadius: '20px',
    border: 'none',
    background: active ? 'rgba(255,255,255,0.35)' : 'transparent',
    color: active ? '#2C1A00' : 'rgba(44,26,0,0.65)',
    cursor: 'pointer',
    transition: 'all 0.15s',
    letterSpacing: '0.3px',
  });

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #F5A623 0%, #F7C87A 100%)',
      padding: '0 24px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 12px rgba(61,43,0,0.15)',
      borderBottom: '2px solid #E8890C',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <span style={{ fontSize: '26px' }}>🐝</span>
        <span style={{ fontFamily: "'Fredoka One', cursive", fontSize: '20px', color: '#2C1A00' }}>BuzzTracker</span>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.06)', borderRadius: '24px', padding: '3px' }}>
        <button style={navLinkStyle(isHealth)} onClick={() => navigate('/')}>🍯 Health</button>
        <button style={navLinkStyle(isFinance)} onClick={() => navigate('/finance')}>💰 Finance</button>
      </div>

      {/* Right side: year filter + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <select
          value={selectedYear}
          onChange={e => setSelectedYear(e.target.value)}
          style={{
            padding: '4px 10px',
            border: '1.5px solid rgba(44,26,0,0.2)',
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.7)',
            fontFamily: "'Nunito', sans-serif",
            fontWeight: '700',
            fontSize: '12px',
            color: '#2C1A00',
            cursor: 'pointer',
          }}
        >
          <option value="all">All Years</option>
          {['2021','2022','2023','2024','2025'].map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button className="btn-primary" onClick={logout} style={{ fontSize: '12px', padding: '5px 16px' }}>
          Log out
        </button>
      </div>
    </nav>
  );
}
