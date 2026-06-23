import { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import { Link }     from 'react-router-dom';

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try { const { data } = await adminAPI.getStats(); setStats(data.stats); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadStats();
    const h = () => loadStats();
    window.addEventListener('ws:admin_new_order',    h);
    window.addEventListener('ws:admin_order_updated', h);
    return () => {
      window.removeEventListener('ws:admin_new_order',    h);
      window.removeEventListener('ws:admin_order_updated', h);
    };
  }, []);

  if (loading) return <div className="spinner" style={{ marginTop:80 }} />;

  const s = stats || {};
  const cards = [
    { label:'Buyers',         val:s.buyers,      color:'var(--accent)',  icon:'🛒' },
    { label:'Sellers',        val:s.sellers,     color:'#48cae4',        icon:'🏪' },
    { label:'Transporters',   val:s.transporters,color:'var(--yellow)',  icon:'🚛' },
    { label:'Verified',       val:s.verified,    color:'var(--green)',   icon:'✅' },
    { label:'Total Orders',   val:s.orders,      color:'var(--orange)',  icon:'📦' },
    { label:'Pending Verif.', val:s.pending,     color:'var(--red)',     icon:'⏳' },
  ];

  return (
    <div className="page" style={{ padding:'28px 0 80px' }}>
      <div className="container">
        <h2 style={{ fontFamily:'var(--fh)', fontSize:26, fontWeight:700, marginBottom:6 }}>Admin Dashboard</h2>
        <p style={{ color:'var(--dim)', fontSize:13, marginBottom:28 }}>Stats refresh live via WebSocket when orders or verifications change.</p>

        <div className="grid-3" style={{ marginBottom:32 }}>
          {cards.map(c => (
            <div key={c.label} className="stat-card">
              <div style={{ fontSize:24, marginBottom:8 }}>{c.icon}</div>
              <div className="stat-val" style={{ color:c.color }}>{c.val ?? '—'}</div>
              <div className="stat-label">{c.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ fontFamily:'var(--fh)', fontSize:17, marginBottom:18 }}>Quick Actions</h3>
          <div style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            <Link to="/admin/verifications" className="btn btn-primary btn-lg">
              🔍 Review Verifications
              {s.pending > 0 && (
                <span style={{ background:'var(--red)', color:'#fff', borderRadius:'50%', width:20, height:20,
                  display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, marginLeft:4 }}>
                  {s.pending}
                </span>
              )}
            </Link>
            <Link to="/admin/orders" className="btn btn-ghost btn-lg">📦 All Orders</Link>
            <Link to="/admin/sellers" className="btn btn-ghost btn-lg">🏅 Manage Seller Badges</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
