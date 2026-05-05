import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const NAV_LINKS = [
  { to: '/',         label: '🍯 Health',   exact: true },
  { to: '/finance',  label: '💰 Finance',  exact: false },
  { to: '/compare',  label: '📊 Compare',  exact: false },
  { to: '/calendar',  label: '📅 Calendar', exact: false },
  { to: '/upload',    label: '📤 Upload',   exact: false },
];

export default function Navbar() {
  const { logout, selectedYear, setSelectedYear } = useApp();
  const loc = useLocation();

  const isActive = (to, exact) => exact ? loc.pathname === to : loc.pathname.startsWith(to);

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-amber-400 to-honey-300 shadow-md border-b border-amber-500/30">
      <div className="max-w-7xl mx-auto px-5 h-14 flex items-center gap-3">

        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🐝</span>
          <span className="font-fredoka text-xl text-amber-900 tracking-wide">BuzzTracker</span>
        </Link>

        <nav className="flex items-center gap-0.5 bg-black/5 rounded-full px-1.5 py-1 ml-2 overflow-x-auto">
          {NAV_LINKS.map(({ to, label, exact }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all font-nunito ${
                isActive(to, exact)
                  ? 'bg-white/35 text-amber-900'
                  : 'text-amber-900/60 hover:bg-white/20 hover:text-amber-900'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 shrink-0">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(e.target.value)}
            className="bg-white/70 border border-amber-400/40 text-amber-900 font-bold text-xs rounded-full px-3 py-1 focus:outline-none focus:ring-2 focus:ring-amber-300 cursor-pointer font-nunito"
          >
            <option value="all">All Years</option>
            {['2021', '2022', '2023', '2024', '2025'].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            onClick={logout}
            className="bg-white/20 hover:bg-white/40 border border-amber-500/30 text-amber-900 font-bold text-xs rounded-full px-3 py-1.5 transition-all font-nunito"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
