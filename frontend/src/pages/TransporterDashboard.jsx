import { useState, useEffect } from 'react';
import { transporterAPI } from '../api';
import { useAuth }        from '../context/AuthContext';

const badgeClass = s => ({ Assigned:'b-assigned', Accepted:'b-accepted', InTransit:'b-intransit', Delivered:'b-delivered' }[s] || 'b-pending');
const nextAction = {
  Assigned:  { label:'✅ Accept Order',   next:'Accepted',  cls:'btn-success' },
  Accepted:  { label:'🚛 Start Delivery', next:'InTransit', cls:'btn-primary' },
  InTransit: { label:'📦 Mark Delivered', next:'Delivered', cls:'btn-cyan'    },
};

export default function TransporterDashboard() {
  const { user, setUser }     = useAuth();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [avBusy,  setAvBusy]  = useState(false);
  const [msg,     setMsg]     = useState({ text:'', type:'' });

  const fetchOrders = async () => {
    try { const { data } = await transporterAPI.getOrders(); setOrders(data.orders); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchOrders();

    const handleNewAssignment = (e) => {
      const { order } = e.detail;
      setOrders(prev => {
        if (prev.find(o => o._id === order._id)) return prev;
        return [order, ...prev];
      });
      setMsg({ text: `New order assigned from ${order.buyer?.name || 'a buyer'}!`, type:'success' });
    };

    const handleMyOrderUpdated = (e) => {
      const { orderId, deliveryStatus } = e.detail;
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, deliveryStatus } : o));
    };

    const handleVerification = (e) => {
      const { decision } = e.detail;
      if (decision === 'Verified') setUser(u => ({ ...u, verified: true }));
    };

    window.addEventListener('ws:new_assignment',       handleNewAssignment);
    window.addEventListener('ws:my_order_updated',     handleMyOrderUpdated);
    window.addEventListener('ws:verification_result',  handleVerification);
    return () => {
      window.removeEventListener('ws:new_assignment',      handleNewAssignment);
      window.removeEventListener('ws:my_order_updated',    handleMyOrderUpdated);
      window.removeEventListener('ws:verification_result', handleVerification);
    };
  }, []);

  const toggleAvailability = async () => {
    setAvBusy(true);
    const target = user.availability === 'online' ? 'offline' : 'online';
    try {
      const { data } = await transporterAPI.setAvail(target);
      setUser(data.user);
      setMsg({ text: `You are now ${target}`, type:'success' });
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Error', type:'error' });
    } finally {
      setAvBusy(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await transporterAPI.updateStatus(orderId, newStatus);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, deliveryStatus: newStatus } : o));
      setMsg({ text: `Status → ${newStatus}`, type:'success' });
      // If delivered, refresh to update availability
      if (newStatus === 'Delivered') fetchOrders();
    } catch (e) {
      setMsg({ text: e.response?.data?.message || 'Error', type:'error' });
    }
  };

  const active    = orders.filter(o => o.deliveryStatus !== 'Delivered');
  const completed = orders.filter(o => o.deliveryStatus === 'Delivered');

  return (
    <div className="page" style={{ padding:'30px 0 80px' }}>
      <div className="container">
        <h2 style={{ fontFamily:'var(--fh)', fontSize:26, fontWeight:700, marginBottom:6 }}>Transporter Dashboard</h2>
        <p style={{ color:'var(--dim)', fontSize:13, marginBottom:26 }}>Orders assigned in real time via WebSocket — no refresh needed.</p>

        {msg.text && <div className={`alert alert-${msg.type === 'error' ? 'error' : 'success'}`}>{msg.text}</div>}

        {!user.verified && (
          <div className="alert alert-info" style={{ marginBottom:22 }}>
            ⚠️ Pending admin verification. You'll receive a live notification when approved.
          </div>
        )}

        {/* Availability toggle */}
        <div className="card" style={{ marginBottom:26, display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:14 }}>
          <div>
            <div style={{ fontSize:11, color:'var(--dim)', marginBottom:5, textTransform:'uppercase', letterSpacing:'.05em' }}>Current Status</div>
            <span className={`badge b-${user.availability}`} style={{ fontSize:14, padding:'6px 14px' }}>
              ● {user.availability.toUpperCase()}
            </span>
          </div>
          <button
            className={`btn btn-lg ${user.availability === 'online' ? 'btn-danger' : 'btn-success'}`}
            onClick={toggleAvailability}
            disabled={avBusy || !user.verified || user.availability === 'busy'}
          >
            {avBusy ? 'Updating…' : user.availability === 'online' ? '⏸ Go Offline' : '▶ Go Online'}
          </button>
        </div>

        {/* Stats */}
        <div className="grid-3" style={{ marginBottom:28 }}>
          <div className="stat-card"><div className="stat-val" style={{ color:'var(--accent)' }}>{orders.length}</div><div className="stat-label">Total Assigned</div></div>
          <div className="stat-card"><div className="stat-val" style={{ color:'var(--yellow)' }}>{active.length}</div><div className="stat-label">Active</div></div>
          <div className="stat-card"><div className="stat-val" style={{ color:'var(--green)' }}>{completed.length}</div><div className="stat-label">Completed</div></div>
        </div>

        {/* Active orders */}
        <h3 style={{ fontFamily:'var(--fh)', fontSize:18, fontWeight:700, marginBottom:14 }}>
          Active Deliveries
          {active.length > 0 && (
            <span style={{ marginLeft:8, fontSize:12, color:'var(--green)', fontWeight:400 }}>
              <span className="live-dot" style={{ marginRight:4 }} />Live
            </span>
          )}
        </h3>

        {loading ? <div className="spinner" /> : active.length === 0 ? (
          <div className="empty-state" style={{ padding:40 }}>
            <div className="icon">🚛</div>
            <h3>No active deliveries</h3>
            <p>Go online to receive assignments instantly.</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:28 }}>
            {active.map(o => (
              <div key={o._id} className="card fade-in"
                style={{ borderColor: o.deliveryStatus === 'Assigned' ? 'rgba(255,209,102,.3)' : 'var(--border)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14, flexWrap:'wrap', gap:9 }}>
                  <div>
                    <div style={{ fontSize:11, color:'var(--dim)' }}>#{o._id.slice(-8).toUpperCase()}</div>
                    <div style={{ fontFamily:'var(--fh)', fontSize:20, fontWeight:700, color:'var(--accent)' }}>₹{o.totalAmount.toFixed(2)}</div>
                  </div>
                  <span className={`badge ${badgeClass(o.deliveryStatus)}`} style={{ fontSize:12 }}>{o.deliveryStatus}</span>
                </div>
                <div style={{ fontSize:13, display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                  <div>👤 <strong>{o.buyer?.name}</strong> — {o.buyer?.email}</div>
                  <div>📍 {o.deliveryAddress}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {o.items.map((item, i) => (
                      <span key={i} style={{ padding:'3px 9px', borderRadius:5, fontSize:12, background:'rgba(0,180,216,.08)', border:'1px solid rgba(0,180,216,.15)' }}>
                        💧 {item.listing?.title} × {item.quantity}L
                      </span>
                    ))}
                  </div>
                </div>
                {nextAction[o.deliveryStatus] && (
                  <button className={`btn ${nextAction[o.deliveryStatus].cls}`}
                    onClick={() => handleStatusUpdate(o._id, nextAction[o.deliveryStatus].next)}>
                    {nextAction[o.deliveryStatus].label}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <>
            <h3 style={{ fontFamily:'var(--fh)', fontSize:18, fontWeight:700, marginBottom:14 }}>Completed ({completed.length})</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Order</th><th>Buyer</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {completed.map(o => (
                    <tr key={o._id}>
                      <td style={{ fontFamily:'monospace', fontSize:11, color:'var(--accent)' }}>#{o._id.slice(-8).toUpperCase()}</td>
                      <td>{o.buyer?.name}</td>
                      <td style={{ color:'var(--accent)', fontWeight:700 }}>₹{o.totalAmount.toFixed(2)}</td>
                      <td><span className="badge b-delivered">Delivered</span></td>
                      <td style={{ fontSize:11, color:'var(--dim)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
