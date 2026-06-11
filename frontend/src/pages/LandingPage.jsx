import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();
  return (
    <div className="page">
      <section style={{ minHeight:'calc(100vh - 62px)', display:'flex', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'60px 24px' }}>
        <div style={{ maxWidth:680 }} className="fade-in">
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 14px', borderRadius:100, background:'rgba(0,180,216,.1)', border:'1px solid rgba(0,180,216,.2)', fontSize:12, color:'var(--accent)', marginBottom:26 }}>
            💧 Real-time Water Trading — Now with WebSocket Live Updates
          </div>
          <h1 style={{ fontFamily:'var(--fh)', fontSize:'clamp(38px,5.5vw,68px)', fontWeight:800, lineHeight:1.1, marginBottom:22 }}>
            Trade Water.<br/>
            <span style={{ background:'linear-gradient(130deg,var(--accent),#90e0ef)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Track Live.
            </span>
          </h1>
          <p style={{ fontSize:17, color:'var(--dim)', lineHeight:1.7, marginBottom:36, maxWidth:500, margin:'0 auto 36px' }}>
            Buyers, sellers and transporters connected on one platform. Orders assigned in milliseconds. Status updates pushed live — zero page refresh.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            {user
              ? <Link to="/marketplace" className="btn btn-cyan btn-lg">Go to Marketplace →</Link>
              : <>
                  <Link to="/signup" className="btn btn-cyan btn-lg">Get Started</Link>
                  <Link to="/login"  className="btn btn-ghost btn-lg">Sign In</Link>
                </>
            }
          </div>
          <div style={{ marginTop:48, display:'flex', justifyContent:'center', gap:8, flexWrap:'wrap' }}>
            {[
              ['WebSocket',   'Real-time updates'],
              ['Auto-assign', 'Nearest transporter'],
              ['Live status', 'No page refresh'],
              ['Admin verify','Verified transporters'],
            ].map(([t, s]) => (
              <div key={t} style={{ padding:'8px 16px', borderRadius:8, background:'var(--glass)', border:'1px solid var(--border)', fontSize:12 }}>
                <div style={{ fontWeight:600, color:'var(--white)' }}>{t}</div>
                <div style={{ color:'var(--dim)' }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
