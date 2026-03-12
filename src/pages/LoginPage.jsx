import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function LoginPage() {
  const { login } = useApp();
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!u || !p) { setErr('Please enter username and password'); return; }
    setLoading(true);
    setTimeout(() => {
      const ok = login(u, p);
      if (!ok) { setErr('Invalid credentials'); setLoading(false); }
    }, 400);
  };

  const size = 340;
  const cx = size/2, cy = size/2, r = size/2 - 6;
  const pts = Array.from({length:6},(_,i) => {
    const a = (Math.PI/3)*i - Math.PI/6;
    return `${cx+r*Math.cos(a)},${cy+r*Math.sin(a)}`;
  }).join(' ');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #FFFDF5 0%, #FFF3CD 40%, #F7C87A 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', position: 'relative',
    }}>
      <style>{`
        @keyframes float1{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-14px) rotate(8deg)}}
        @keyframes float2{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-8px) rotate(-6deg)}}
        @keyframes pulse{0%,100%{opacity:0.04}50%{opacity:0.08}}
      `}</style>

      {/* Bg hexagons */}
      {[...Array(8)].map((_,i) => {
        const s = 60 + (i%3)*40;
        const bx = (i*137)%100, by = (i*83)%90;
        const bpts = Array.from({length:6},(_,j)=>{const a=(Math.PI/3)*j-Math.PI/6;return `${s/2+s/2*Math.cos(a)},${s/2+s/2*Math.sin(a)}`;}).join(' ');
        return (
          <svg key={i} width={s} height={s} style={{position:'absolute',top:`${by}%`,left:`${bx}%`,animation:'pulse 3s ease-in-out infinite',animationDelay:`${i*0.4}s`}}>
            <polygon points={bpts} fill="none" stroke="#D4721A" strokeWidth="1.5" />
          </svg>
        );
      })}

      {/* Floating bees */}
      <span style={{position:'absolute',top:'15%',left:'8%',fontSize:'32px',animation:'float1 3.5s ease-in-out infinite'}}>🐝</span>
      <span style={{position:'absolute',top:'70%',right:'10%',fontSize:'24px',animation:'float2 4s ease-in-out infinite'}}>🐝</span>
      <span style={{position:'absolute',top:'50%',left:'4%',fontSize:'18px',animation:'float1 5s ease-in-out infinite',animationDelay:'1s'}}>🐝</span>

      <div style={{zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'16px'}}>
        {/* Brand */}
        <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'4px'}}>
          <span style={{fontSize:'44px'}}>🐝</span>
          <span style={{fontFamily:"'Fredoka One',cursive",fontSize:'38px',color:'#2C1A00',letterSpacing:'1px'}}>BuzzTracker</span>
        </div>
        <p style={{color:'#7A5C2E',fontSize:'14px',fontWeight:'600',marginBottom:'8px'}}>Beekeeping Management Dashboard</p>

        {/* Hex login card */}
        <div style={{position:'relative', width:size, height:size}}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{position:'absolute'}}>
            <defs>
              <linearGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFDF5"/>
                <stop offset="100%" stopColor="#FFF0C0"/>
              </linearGradient>
            </defs>
            <polygon points={pts} fill="url(#loginGrad)" stroke="#E8890C" strokeWidth="4"
              style={{filter:'drop-shadow(0 8px 24px rgba(232,137,12,0.2))'}}/>
          </svg>
          <div style={{
            position:'absolute', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:'14px',
            width:'200px',
          }}>
            <p style={{fontFamily:"'Fredoka One',cursive",fontSize:'20px',color:'#2C1A00',letterSpacing:'2px'}}>LOG IN</p>
            <input type="text" placeholder="Username" value={u} onChange={e=>{setU(e.target.value);setErr('');}}
              onKeyDown={e=>e.key==='Enter'&&handleLogin()} style={inp}/>
            <input type="password" placeholder="Password" value={p} onChange={e=>{setP(e.target.value);setErr('');}}
              onKeyDown={e=>e.key==='Enter'&&handleLogin()} style={inp}/>
            {err && <p style={{color:'#D93A2B',fontSize:'11px',textAlign:'center'}}>{err}</p>}
            <button onClick={handleLogin} className="btn-primary"
              style={{padding:'9px 36px',fontSize:'15px',letterSpacing:'1px',opacity:loading?0.7:1}}>
              {loading ? '...' : 'enter'}
            </button>
            <p style={{fontSize:'10px',color:'#B89060',textAlign:'center'}}>Any username + password</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const inp = {
  width:'100%', padding:'8px 12px',
  border:'1.5px solid #F0D89A', borderRadius:'8px',
  fontFamily:"'Nunito',sans-serif", fontSize:'13px',
  background:'rgba(255,255,255,0.85)', color:'#2C1A00',
  outline:'none',
};
