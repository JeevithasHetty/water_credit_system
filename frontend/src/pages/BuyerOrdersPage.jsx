import { useState, useEffect } from 'react';
import { ordersAPI, ratingsAPI } from '../api';
import { Link }      from 'react-router-dom';
import socket        from '../socket';

const steps = ['Pending','Assigned','Accepted','InTransit','Delivered'];
const badgeClass = s => ({ Pending:'b-pending', Assigned:'b-assigned', Accepted:'b-accepted', InTransit:'b-intransit', Delivered:'b-delivered' }[s] || 'b-pending');

export default function BuyerOrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const { data } = await ordersAPI.getBuyer();
      setOrders(data.orders);
      data.orders.forEach(o => {
        if (o.deliveryStatus !== 'Delivered') socket.emit('track_order', o._id);
      });
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchOrders();
    const handleStatusUpdate = (e) => {
      const { orderId, deliveryStatus } = e.detail;
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, deliveryStatus } : o));
      if (deliveryStatus === 'Delivered') socket.emit('untrack_order', orderId);
    };
    window.addEventListener('ws:order_status', handleStatusUpdate);
    return () => window.removeEventListener('ws:order_status', handleStatusUpdate);
  }, []);

  if (loading) return <div className="spinner" style={{ marginTop:80 }} />;

  return (
    <div className="page" style={{ padding:'30px 0 80px' }}>
      <div className="container">
        <div className="section-header">
          <div>
            <h2 style={{ fontFamily:'var(--fh)', fontSize:26, fontWeight:700 }}>My Orders</h2>
            <p style={{ color:'var(--dim)', fontSize:13, marginTop:3 }}>{orders.length} orders · Updates arrive live via WebSocket</p>
          </div>
          <Link to="/marketplace" className="btn btn-cyan">+ New Order</Link>
        </div>
        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📦</div>
            <h3>No orders yet</h3>
            <p style={{ marginBottom:22 }}>Place your first order from the marketplace.</p>
            <Link to="/marketplace" className="btn btn-cyan">Browse Listings</Link>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {orders.map(o => <OrderCard key={o._id} order={o} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order }) {
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const handleSubmitRating = async () => {
    if (rating < 1) {
      setErr('Please select a rating');
      return;
    }
    
    setBusy(true);
    try {
      const seller = order.items[0]?.listing?.seller;
      await ratingsAPI.submit({
        orderId: order._id,
        sellerId: seller?._id,
        rating,
        review,
      });
      setSubmitted(true);
      setShowRating(false);
      setRating(0);
      setReview('');
    } catch (e) {
      setErr(e.response?.data?.message || 'Rating failed');
    } finally {
      setBusy(false);
    }
  };

  const idx = steps.indexOf(order.deliveryStatus);
  return (
    <div className="card fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontSize:11, color:'var(--dim)', marginBottom:3 }}>
            Order #{order._id.slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
          </div>
          <div style={{ fontFamily:'var(--fh)', fontSize:22, fontWeight:700, color:'var(--accent)' }}>
            ₹{order.totalAmount.toFixed(2)}
          </div>
        </div>
        <div style={{ display:'flex', gap:7, alignItems:'center' }}>
          {order.deliveryStatus !== 'Delivered' && order.deliveryStatus !== 'Pending' && (
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--green)' }}>
              <span className="live-dot" /> Live
            </span>
          )}
          <span className={`badge ${badgeClass(order.deliveryStatus)}`}>{order.deliveryStatus}</span>
        </div>
      </div>

      {/* Progress tracker */}
      <div style={{ marginBottom:18 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ textAlign:'center', flex:1 }}>
              <div style={{
                width:26, height:26, borderRadius:'50%', margin:'0 auto 3px',
                background: i <= idx ? 'var(--accent)' : 'var(--glass)',
                border: `2px solid ${i <= idx ? 'var(--accent)' : 'var(--border)'}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:11, color: i <= idx ? 'var(--ink)' : 'var(--dim)',
                fontWeight:700, transition:'all .35s',
              }}>{i <= idx ? '✓' : i + 1}</div>
              <div style={{ fontSize:9, color: i <= idx ? 'var(--accent)' : 'var(--dim)', lineHeight:1.2 }}>
                {s === 'InTransit' ? 'In Transit' : s}
              </div>
            </div>
          ))}
        </div>
        <div style={{ height:3, background:'var(--glass)', borderRadius:2, margin:'0 13px' }}>
          <div style={{
            height:'100%', borderRadius:2,
            background:'linear-gradient(90deg, var(--accent), var(--accent2))',
            width: `${Math.max(0, idx / (steps.length - 1)) * 100}%`,
            transition:'width .6s ease',
          }} />
        </div>
      </div>

      {/* Items */}
      <div style={{ borderTop:'1px solid var(--border)', paddingTop:14, marginBottom:14 }}>
        {order.items.map((item, i) => (
          <div key={i} style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:5 }}>
            <span>💧 {item.listing?.title} × {item.quantity}L</span>
            <span style={{ color:'var(--accent)' }}>₹{(item.quantity * item.pricePerLitre).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:18, flexWrap:'wrap', fontSize:12, color:'var(--dim)' }}>
        <div>📍 {order.deliveryAddress}</div>
        {order.transporter
          ? <div>🚛 <span style={{ color:'var(--white)' }}>{order.transporter.name}</span></div>
          : <div style={{ color:'var(--yellow)' }}>⏳ Awaiting transporter</div>
        }
      </div>

      {/* Rating section for delivered orders */}
      {order.deliveryStatus === 'Delivered' && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          {submitted ? (
            <div style={{ padding: '12px 14px', borderRadius: 6, background: 'rgba(34,197,94,.1)', border: '1px solid var(--green)', textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 500 }}>✅ Thanks for rating!</div>
            </div>
          ) : !showRating ? (
            <button className="btn btn-ghost btn-sm" onClick={() => setShowRating(true)} style={{ width: '100%', justifyContent: 'center' }}>
              ⭐ Rate this order
            </button>
          ) : (
            <div>
              {err && <div className="alert alert-error" style={{ marginBottom: 12, fontSize: 12 }}>{err}</div>}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--dim)', display: 'block', marginBottom: 8 }}>Rating *</label>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  {[1,2,3,4,5].map(r => (
                    <button
                      key={r}
                      onClick={() => { setRating(r); setErr(''); }}
                      style={{
                        fontSize: 28,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        opacity: r <= rating ? 1 : 0.3,
                        transition: 'all .2s',
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                      onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--dim)', display: 'block', marginBottom: 6 }}>Review (optional)</label>
                <textarea
                  className="form-control"
                  placeholder="Share your experience..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={2}
                  style={{ fontSize: 12 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-cyan btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={handleSubmitRating}
                  disabled={busy || rating < 1}
                >
                  {busy ? 'Submitting...' : 'Submit Rating'}
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => { setShowRating(false); setRating(0); setReview(''); }}
                  disabled={busy}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order notes */}
      {order.notes && (
        <div style={{ marginTop: 14, padding: '10px 12px', borderRadius: 6, background: 'rgba(255,193,7,.05)', border: '1px solid var(--border)', fontSize: 12 }}>
          <div style={{ color: 'var(--dim)', marginBottom: 4 }}>📝 Your note:</div>
          <div>{order.notes}</div>
        </div>
      )}
    </div>
  );
}
