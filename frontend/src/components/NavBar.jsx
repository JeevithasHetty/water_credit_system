import { Link, useNavigate } from 'react-router-dom';
import { useAuth }   from '../context/AuthContext';
import { useCart }   from '../context/CartContext';
import { useSocket } from '../context/SocketContext';

const roleLinks = {
  buyer:       [{ to:'/marketplace', label:'Marketplace' }, { to:'/buyer/orders', label:'My Orders' }],
  seller:      [{ to:'/marketplace', label:'Marketplace' }, { to:'/seller/listings', label:'Listings' }, { to:'/seller/orders', label:'Orders' }],
  transporter: [{ to:'/transporter', label:'Dashboard' }],
  admin:       [{ to:'/admin', label:'Dashboard' }, { to:'/admin/verifications', label:'Verifications' }, { to:'/admin/orders', label:'Orders' }],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount }    = useCart();
  const { connected }    = useSocket();
  const navigate         = useNavigate();

  return (
    <nav style={{
      position:'sticky', top:0, zIndex:200,
      background:'rgba(12,28,46,0.88)', backdropFilter:'blur(20px)',
      borderBottom:'1px solid var(--border)', padding:'0 22px',
    }}>
      <div style={{ maxWidth:1180, margin:'0 auto', display:'flex', alignItems:'center', height:62, gap:28 }}>
        <Link to="/" style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:9 }}>
          <span style={{ fontSize:22 }}>💧</span>
          <span style={{ fontFamily:'var(--fh)', fontWeight:800, fontSize:19,
            background:'linear-gradient(130deg,var(--accent),#90e0ef)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            AquaFlow
          </span>
          <span style={{ fontSize:10, color:'var(--dim)', fontWeight:500 }}>v2</span>
        </Link>

        {user && (
          <div style={{ display:'flex', gap:3, flex:1 }}>
            {(roleLinks[user.role] || []).map(l => (
              <Link key={l.to} to={l.to} style={{ color:'var(--dim)', textDecoration:'none', padding:'5px 12px',
                borderRadius:7, fontSize:13, fontWeight:500, transition:'all .14s' }}
                onMouseEnter={e => { e.target.style.color='var(--white)'; e.target.style.background='var(--ghost)'; }}
                onMouseLeave={e => { e.target.style.color='var(--dim)'; e.target.style.background='transparent'; }}
              >{l.label}</Link>
            ))}
          </div>
        )}

        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:10 }}>
          {user && (
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, color:'var(--dim)' }}>
              <span style={{
                width:7, height:7, borderRadius:'50%',
                background: connected ? 'var(--green)' : 'var(--red)',
                display:'inline-block',
                animation: connected ? 'pulse 1.4s ease-in-out infinite' : 'none',
              }}/>
              {connected ? 'Live' : 'Offline'}
            </div>
          )}

          {user?.role === 'buyer' && (
            <Link to="/cart" style={{ position:'relative', textDecoration:'none', padding:'5px 11px',
              borderRadius:7, background:'var(--glass)', border:'1px solid var(--border)',
              display:'flex', alignItems:'center', gap:5, color:'var(--white)', fontSize:13 }}>
              🛒
              {itemCount > 0 && (
                <span style={{ position:'absolute', top:-5, right:-5,
                  background:'var(--accent)', color:'var(--ink)', borderRadius:'50%',
                  width:16, height:16, display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:10, fontWeight:700 }}>{itemCount}</span>
              )}
              Cart
            </Link>
          )}

          {user ? (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ fontSize:12, color:'var(--dim)', textAlign:'right' }}>
                <div style={{ color:'var(--white)', fontWeight:600, fontSize:13 }}>{user.name}</div>
                <div style={{ textTransform:'capitalize', color:'var(--accent)', fontSize:11 }}>{user.role}</div>
              </div>
              <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-ghost btn-sm">
                Logout
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', gap:7 }}>
              <Link to="/login"  className="btn btn-ghost btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-cyan  btn-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
