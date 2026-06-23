import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart }   from '../context/CartContext';
import { ordersAPI } from '../api';

export default function CartPage() {
  const { cart, updateQty, removeFromCart, clearCart, total, itemCount } = useCart();
  const [address, setAddress] = useState('');
  const [notes,   setNotes]   = useState('');
  const [busy,    setBusy]    = useState(false);
  const [err,     setErr]     = useState('');
  const [ok,      setOk]      = useState('');
  const navigate = useNavigate();

  const checkout = async () => {
    if (!address.trim()) { setErr('Delivery address is required'); return; }
    setErr(''); setBusy(true);
    try {
      const items = cart.map(i => ({ listingId: i.listing._id, quantity: i.quantity }));
      const { data } = await ordersAPI.checkout({ items, deliveryAddress: address, notes });
      setOk(data.message);
      clearCart();
      setTimeout(() => navigate('/buyer/orders'), 1400);
    } catch (e) {
      setErr(e.response?.data?.message || 'Checkout failed');
    } finally {
      setBusy(false);
    }
  };

  if (!cart.length && !ok) return (
    <div className="page" style={{ padding:'60px 24px' }}>
      <div className="container" style={{ maxWidth:560, textAlign:'center' }}>
        <div className="empty-state">
          <div className="icon">🛒</div>
          <h3>Cart is empty</h3>
          <p style={{ marginBottom:22 }}>Browse the marketplace to add listings.</p>
          <Link to="/marketplace" className="btn btn-cyan">Go to Marketplace →</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="page" style={{ padding:'28px 0 80px' }}>
      <div className="container" style={{ maxWidth:760 }}>
        <h2 style={{ fontFamily:'var(--fh)', fontSize:26, fontWeight:700, marginBottom:22 }}>Your Cart</h2>
        {ok  && <div className="alert alert-success" style={{ fontSize:15 }}>✅ {ok} — Redirecting…</div>}
        {err && <div className="alert alert-error">{err}</div>}

        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:24 }}>
          {cart.map(({ listing, quantity }) => (
            <div key={listing._id} className="card" style={{ padding:'14px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--fh)', fontSize:15, fontWeight:600 }}>{listing.title}</div>
                  <div style={{ fontSize:12, color:'var(--dim)', marginTop:2 }}>📍 {listing.location} · ₹{listing.pricePerLitre}/L</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <button className="btn btn-ghost btn-sm" style={{ padding:'3px 10px' }} onClick={() => updateQty(listing._id, quantity - 100)}>−</button>
                  <span style={{ fontFamily:'var(--fh)', fontSize:14, minWidth:55, textAlign:'center' }}>{quantity}L</span>
                  <button className="btn btn-ghost btn-sm" style={{ padding:'3px 10px' }} onClick={() => updateQty(listing._id, quantity + 100)}>+</button>
                </div>
                <div style={{ minWidth:72, textAlign:'right', fontFamily:'var(--fh)', fontSize:16, fontWeight:700, color:'var(--accent)' }}>
                  ₹{(quantity * listing.pricePerLitre).toFixed(2)}
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => removeFromCart(listing._id)}>✕</button>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <h3 style={{ fontFamily:'var(--fh)', fontSize:17, marginBottom:18 }}>Delivery Details</h3>
          <div className="form-group">
            <label>Delivery Address *</label>
            <textarea className="form-control" rows={3} placeholder="Enter your full address…" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Notes (optional) <span style={{ fontSize: 11, color: 'var(--dim)' }}>— {notes.length}/200 characters</span></label>
            <textarea
              className="form-control"
              placeholder="e.g. Call before arriving, Gate code: 1234, Leave at door"
              value={notes}
              onChange={e => setNotes(e.target.value.slice(0, 200))}
              rows={2}
              maxLength={200}
            />
          </div>
          <div style={{ padding:'13px 16px', borderRadius:8, background:'rgba(0,180,216,.05)', border:'1px solid var(--border)', marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--dim)', marginBottom:7 }}>
              <span>Subtotal ({itemCount}L)</span><span>₹{total.toFixed(2)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, color:'var(--dim)', marginBottom:9 }}>
              <span>Delivery</span><span style={{ color:'var(--green)' }}>Auto-assigned</span>
            </div>
            <div style={{ borderTop:'1px solid var(--border)', paddingTop:9, display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontFamily:'var(--fh)', fontWeight:700, fontSize:17 }}>Total</span>
              <span style={{ fontFamily:'var(--fh)', fontWeight:700, fontSize:17, color:'var(--accent)' }}>₹{total.toFixed(2)}</span>
            </div>
          </div>
          <p style={{ fontSize:12, color:'var(--dim)', marginBottom:13 }}>
            🤖 Nearest online verified transporter will be auto-assigned. You'll get a live WebSocket notification instantly.
          </p>
          <button className="btn btn-cyan btn-lg" style={{ width:'100%', justifyContent:'center' }} onClick={checkout} disabled={busy || !!ok}>
            {busy ? 'Placing Order…' : `Place Order — ₹${total.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
