import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e?.preventDefault();
    if (!u || !p) { setErr('Please enter both fields.'); return; }
    setLoading(true);
    setTimeout(() => {
      if (login(u, p)) navigate('/');
      else { setErr('Invalid credentials.'); setLoading(false); }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-honey-100 to-amber-200 flex items-center justify-center p-4 relative overflow-hidden">

      {/* Decorative floating bees */}
      <span className="absolute top-[15%] left-[8%] text-3xl" style={{ animation: 'float 3.5s ease-in-out infinite' }}>🐝</span>
      <span className="absolute bottom-[20%] right-[10%] text-2xl" style={{ animation: 'float 4s ease-in-out infinite 0.5s' }}>🐝</span>
      <span className="absolute top-[55%] left-[5%] text-lg" style={{ animation: 'float 5s ease-in-out infinite 1s' }}>🐝</span>
      <span className="absolute top-[30%] right-[7%] text-xl" style={{ animation: 'float 3.8s ease-in-out infinite 0.8s' }}>🐝</span>

      {/* Decorative hex outlines */}
      {[...Array(6)].map((_, i) => {
        const s = 70 + (i % 3) * 50;
        const x = (i * 137) % 90, y = (i * 83) % 80;
        const pts = Array.from({ length: 6 }, (_, j) => {
          const a = (Math.PI / 3) * j - Math.PI / 6;
          return `${s / 2 + (s / 2 - 4) * Math.cos(a)},${s / 2 + (s / 2 - 4) * Math.sin(a)}`;
        }).join(' ');
        return (
          <svg key={i} width={s} height={s} className="absolute opacity-10"
            style={{ top: `${y}%`, left: `${x}%` }}>
            <polygon points={pts} fill="none" stroke="#D97706" strokeWidth="1.5" />
          </svg>
        );
      })}

      {/* Login card */}
      <div className="relative z-10 bg-white/90 backdrop-blur rounded-3xl shadow-2xl w-full max-w-sm p-8 border border-amber-200">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🐝</div>
          <h1 className="font-fredoka text-3xl text-honey-700">BuzzTracker</h1>
          <p className="text-amber-700/60 text-sm mt-1 font-nunito">Beekeeping Management Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-amber-700/60 uppercase tracking-widest mb-1.5 font-nunito">
              Username
            </label>
            <input
              type="text"
              value={u}
              onChange={e => { setU(e.target.value); setErr(''); }}
              placeholder="Enter username"
              className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent bg-amber-50/50 font-nunito text-amber-900"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-amber-700/60 uppercase tracking-widest mb-1.5 font-nunito">
              Password
            </label>
            <input
              type="password"
              value={p}
              onChange={e => { setP(e.target.value); setErr(''); }}
              placeholder="Enter password"
              className="w-full border border-amber-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent bg-amber-50/50 font-nunito text-amber-900"
            />
          </div>

          {err && (
            <p className="text-red-500 text-xs font-semibold font-nunito">{err}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-honey-600 hover:bg-honey-700 disabled:opacity-60 text-white font-bold rounded-xl py-3 text-sm transition-colors font-nunito mt-2"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-amber-400 mt-6 font-nunito">
          Any username + password works for demo
        </p>
      </div>
    </div>
  );
}
