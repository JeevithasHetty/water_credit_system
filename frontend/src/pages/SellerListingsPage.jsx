import { useState, useEffect } from 'react';
import { listingsAPI, ordersAPI } from '../api';
import { useAuth } from '../context/AuthContext';

const badgeEmoji = { silver: '🥈', gold: '🥇', diamond: '💎' };
const badgeColor = { silver: '#c0c0c0', gold: '#ffd700', diamond: '#b9f2ff' };
const badgeBorder = { silver: '1px solid #c0c0c0', gold: '2px solid #ffd700', diamond: '2px solid #b9f2ff' };
const waterTypeEmoji = { drinking: '🥤', agricultural: '🌾', industrial: '⚙️', rainwater: '🌧️' };

export default function SellerListingsPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [err,  setErr]  = useState('');
  const [ok,   setOk]   = useState('');
  const [form, setForm] = useState({ title:'', description:'', location:'', pricePerLitre:'', quantityLitres:'', waterType:'drinking' });
  const [restockModal, setRestockModal] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [busyRestock, setBusyRestock] = useState(false);
  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const loadListings = async () => {
    try { 
      const { data } = await listingsAPI.getMy(); 
      setListings(data.listings); 
      // Also load analytics
      try {
        const analyticsData = await ordersAPI.getSellerAnalytics();
        setAnalytics(analyticsData.data);
      } catch (e) {
        console.log('Analytics not available');
      }
    }
    finally { setLoading(false); }
  };
  useEffect(() => { loadListings(); }, []);

  const submit = async e => {
    e.preventDefault();
    setErr(''); setOk('');
    try {
      await listingsAPI.create(form);
      setOk('Listing created!');
      setShowForm(false);
      setForm({ title:'', description:'', location:'', pricePerLitre:'', quantityLitres:'', waterType:'drinking' });
      loadListings();
    } catch (e) { setErr(e.response?.data?.message || 'Failed'); }
  };

  const del = async id => {
    if (!window.confirm('Delete this listing?')) return;
    try {
      await listingsAPI.delete(id);
      setListings(l => l.filter(x => x._id !== id));
      setOk('Listing deleted.');
    } catch (e) { setErr(e.response?.data?.message || 'Delete failed'); }
  };

  const handleRestock = async (listingId) => {
    if (!restockQty || restockQty <= 0) {
      setErr('Enter a positive quantity');
      return;
    }
    
    setBusyRestock(true);
    try {
      const { data } = await listingsAPI.restock(listingId, +restockQty);
      setListings(prev => prev.map(l => l._id === listingId ? data.listing : l));
      setOk(`✅ Restocked with ${restockQty}L`);
      setRestockModal(null);
      setRestockQty('');
      setTimeout(() => setOk(''), 3000);
    } catch (e) {
      setErr(e.response?.data?.message || 'Restock failed');
    } finally {
      setBusyRestock(false);
    }
  };

  return (
    <div className="page" style={{ padding:'28px 0 80px' }}>
      <div className="container">
        <div className="section-header">
          <div>
            <h2 style={{ fontFamily:'var(--fh)', fontSize:26, fontWeight:700 }}>My Listings</h2>
            <p style={{ color:'var(--dim)', fontSize:13, marginTop:3 }}>{listings.length} active</p>
          </div>
          <button className="btn btn-cyan" onClick={() => setShowForm(s => !s)}>
            {showForm ? '✕ Cancel' : '+ New Listing'}
          </button>
        </div>

        {user?.badge ? (
          <div style={{
            padding: '20px 24px',
            borderRadius: 12,
            background: user.badge === 'diamond' ? 'rgba(185,242,255,.08)' : user.badge === 'gold' ? 'rgba(255,215,0,.08)' : 'rgba(192,192,192,.08)',
            border: user.badge === 'diamond' ? '2px solid #b9f2ff' : user.badge === 'gold' ? '2px solid #ffd700' : '2px solid #c0c0c0',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <span style={{ fontSize: 40 }}>{badgeEmoji[user.badge]}</span>
            <div>
              <div style={{
                display: 'inline-block',
                fontFamily: 'var(--fh)',
                fontWeight: 700,
                fontSize: 14,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                padding: '8px 14px',
                borderRadius: 6,
                background: user.badge === 'diamond' ? 'rgba(185,242,255,.2)' : user.badge === 'gold' ? 'rgba(255,215,0,.2)' : 'rgba(192,192,192,.2)',
                color: user.badge === 'diamond' ? '#b9f2ff' : user.badge === 'gold' ? '#ffd700' : '#c0c0c0',
                marginBottom: 8,
              }}>
                {user.badge} Seller
              </div>
              <div style={{ fontSize: 12, color: 'var(--dim)' }}>You've earned this badge for excellent service! Keep up the great work.</div>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '16px 18px',
            borderRadius: 8,
            background: 'rgba(255,165,0,.05)',
            border: '1px solid rgba(255,165,0,.3)',
            marginBottom: 24,
          }}>
            <div style={{ fontSize: 13, color: 'var(--dim)', textAlign: 'center' }}>
              ✨ Complete more orders to earn a badge! Reach Silver, Gold, or Diamond status.
            </div>
          </div>
        )}

        {/* Analytics Section */}
        {analytics && analytics.totalOrders > 0 && (
          <div style={{ marginBottom: 28 }}>
            <h3 style={{ fontFamily: 'var(--fh)', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>📊 Your Analytics</h3>
            
            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
              <div className="card" style={{ textAlign: 'center', padding: 16 }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>💰</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)', marginBottom: 3 }}>₹{analytics.totalRevenue?.toFixed(0) || 0}</div>
                <div style={{ fontSize: 11, color: 'var(--dim)' }}>Total Revenue</div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: 16 }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>💧</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', marginBottom: 3 }}>{(analytics.totalLitresSold || 0).toLocaleString()}L</div>
                <div style={{ fontSize: 11, color: 'var(--dim)' }}>Litres Sold</div>
              </div>
              <div className="card" style={{ textAlign: 'center', padding: 16 }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>📦</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', marginBottom: 3 }}>{analytics.totalOrders || 0}</div>
                <div style={{ fontSize: 11, color: 'var(--dim)' }}>Completed Orders</div>
              </div>
              {analytics.topListing && (
                <div className="card" style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>⭐</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis' }}>{analytics.topListing.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--dim)' }}>{analytics.topListing.orders} orders</div>
                </div>
              )}
            </div>

            {/* Revenue by Month Chart */}
            {analytics.revenueByMonth && analytics.revenueByMonth.length > 0 && (
              <div className="card" style={{ marginBottom: 20, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Revenue Trend</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, justifyContent: 'space-around' }}>
                  {analytics.revenueByMonth.map((m, i) => {
                    const maxRevenue = Math.max(...analytics.revenueByMonth.map(x => x.revenue)) || 1;
                    const height = (m.revenue / maxRevenue) * 100;
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                        <div style={{
                          width: '100%',
                          height: `${Math.max(height, 5)}%`,
                          background: 'var(--accent)',
                          borderRadius: '3px 3px 0 0',
                          transition: 'all .2s',
                          cursor: 'pointer'
                        }} title={`₹${m.revenue.toFixed(0)}`} />
                        <div style={{ fontSize: 10, marginTop: 8, color: 'var(--dim)' }}>{m.month}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Water Type Breakdown */}
            {analytics.ordersByWaterType && (
              <div className="card" style={{ marginBottom: 20, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Orders by Water Type</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10 }}>
                  {Object.entries(analytics.ordersByWaterType).map(([type, count]) => (
                    <div key={type} style={{ textAlign: 'center', padding: 10, background: 'rgba(0,180,216,.05)', borderRadius: 6 }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{waterTypeEmoji[type]}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{count}</div>
                      <div style={{ fontSize: 11, color: 'var(--dim)', textTransform: 'capitalize' }}>{type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Week Comparison */}
            {(analytics.thisWeekOrders !== undefined || analytics.lastWeekOrders !== undefined) && (
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>Orders This Week</div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)', marginBottom: 3 }}>{analytics.thisWeekOrders || 0}</div>
                    <div style={{ fontSize: 11, color: 'var(--dim)' }}>This Week</div>
                  </div>
                  <div style={{ fontSize: 20 }}>📈</div>
                  <div style={{ flex: 1, textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--dim)', marginBottom: 3 }}>{analytics.lastWeekOrders || 0}</div>
                    <div style={{ fontSize: 11, color: 'var(--dim)' }}>Last Week</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {err && <div className="alert alert-error">{err}</div>}
        {ok  && <div className="alert alert-success">{ok}</div>}

        {showForm && (
          <div className="card fade-in" style={{ marginBottom:24, borderColor:'rgba(0,180,216,.28)' }}>
            <h3 style={{ fontFamily:'var(--fh)', fontSize:17, marginBottom:18 }}>Create Listing</h3>
            <form onSubmit={submit}>
              <div className="grid-2" style={{ gap:11 }}>
                <div className="form-group">
                  <label>Title *</label>
                  <input name="title" className="form-control" placeholder="Premium Drinking Water" value={form.title} onChange={set} required />
                </div>
                <div className="form-group">
                  <label>Water Type</label>
                  <select name="waterType" className="form-control" value={form.waterType} onChange={set}>
                    <option value="drinking">Drinking</option>
                    <option value="agricultural">Agricultural</option>
                    <option value="industrial">Industrial</option>
                    <option value="rainwater">Rainwater</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea name="description" className="form-control" rows={2} value={form.description} onChange={set} />
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input name="location" className="form-control" placeholder="Whitefield, Bangalore" value={form.location} onChange={set} required />
              </div>
              <div className="grid-2" style={{ gap:11 }}>
                <div className="form-group">
                  <label>Price per Litre (₹) *</label>
                  <input name="pricePerLitre" type="number" step="0.01" min="0.01" className="form-control" placeholder="2.50" value={form.pricePerLitre} onChange={set} required />
                </div>
                <div className="form-group">
                  <label>Quantity (L) *</label>
                  <input name="quantityLitres" type="number" min="1" className="form-control" placeholder="10000" value={form.quantityLitres} onChange={set} required />
                </div>
              </div>
              <button type="submit" className="btn btn-cyan">Create Listing →</button>
            </form>
          </div>
        )}

        {loading ? <div className="spinner" /> : listings.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🏪</div>
            <h3>No listings yet</h3>
            <p>Create your first listing above.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Title</th><th>Type</th><th>Location</th><th>Price/L</th><th>Stock</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {listings.map(l => (
                  <tr key={l._id} style={{ background: l.quantityLitres < 500 ? 'rgba(255,165,0,.08)' : 'transparent' }}>
                    <td><div style={{ fontWeight:600 }}>{l.title}</div></td>
                    <td><span className="badge b-assigned">{l.waterType}</span></td>
                    <td style={{ color:'var(--dim)', fontSize:12 }}>📍 {l.location}</td>
                    <td style={{ color:'var(--accent)', fontWeight:700 }}>₹{l.pricePerLitre}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span>{l.quantityLitres.toLocaleString()}L</span>
                        {l.quantityLitres < 500 ? (
                          <span style={{ fontSize:10, color:'var(--red)', fontWeight:600 }}>🔴 Very Low</span>
                        ) : l.quantityLitres < 1000 ? (
                          <span style={{ fontSize:10, color:'var(--yellow)', fontWeight:600 }}>⚠️ Low</span>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      {l.isActive ? (
                        <span style={{ fontSize:12, color:'var(--green)' }}>✅ Active</span>
                      ) : (
                        <span style={{ fontSize:12, color:'var(--red)', fontWeight:600 }}>❌ Inactive</span>
                      )}
                    </td>
                    <td style={{ display:'flex', gap:8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setRestockModal(l._id); setRestockQty(''); }}>
                        🔄 Restock
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => del(l._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {restockModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}>
            <div className="card" style={{ maxWidth: 400, width: '90%' }}>
              <h3 style={{ fontFamily: 'var(--fh)', fontSize: 18, marginBottom: 16 }}>Restock Listing</h3>
              {err && <div className="alert alert-error" style={{ marginBottom: 12 }}>{err}</div>}
              <div className="form-group">
                <label>Additional Quantity (L) *</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  placeholder="Enter quantity to add"
                  value={restockQty}
                  onChange={(e) => { setRestockQty(e.target.value); setErr(''); }}
                />
              </div>
              <p style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 16 }}>
                The listing will be automatically reactivated after restocking.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  className="btn btn-cyan"
                  style={{ flex: 1 }}
                  onClick={() => handleRestock(restockModal)}
                  disabled={busyRestock || !restockQty}
                >
                  {busyRestock ? 'Updating...' : 'Confirm Restock'}
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ flex: 1 }}
                  onClick={() => setRestockModal(null)}
                  disabled={busyRestock}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
