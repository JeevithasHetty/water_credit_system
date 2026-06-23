import { useState, useEffect } from 'react';
import { adminAPI } from '../api';

const badgeClass = s => ({ Pending:'b-pending', Assigned:'b-assigned', Accepted:'b-accepted', InTransit:'b-intransit', Delivered:'b-delivered' }[s] || 'b-pending');

export default function AdminOrders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');

  const loadOrders = async () => {
    try { const { data } = await adminAPI.getAllOrders(); setOrders(data.orders); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadOrders();
    const h = () => loadOrders();
    window.addEventListener('ws:admin_new_order',    h);
    window.addEventListener('ws:admin_order_updated', h);
    return () => {
      window.removeEventListener('ws:admin_new_order',    h);
      window.removeEventListener('ws:admin_order_updated', h);
    };
  }, []);

  const statuses = ['all','Pending','Assigned','Accepted','InTransit','Delivered'];
  const filtered = orders.filter(o =>
    (filter === 'all' || o.deliveryStatus === filter) &&
    (!search || o._id.includes(search) || o.buyer?.name?.toLowerCase().includes(search.toLowerCase()))
  );
  const revenue = orders.reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div className="page" style={{ padding:'28px 0 80px' }}>
      <div className="container">
        <div className="section-header">
          <div>
            <h2 style={{ fontFamily:'var(--fh)', fontSize:26, fontWeight:700 }}>All Orders</h2>
            <p style={{ color:'var(--dim)', fontSize:13, marginTop:3 }}>
              {orders.length} orders · ₹{revenue.toFixed(2)} total · Live updates via WebSocket
            </p>
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom:24 }}>
          {[
            ['Total',    orders.length,                                              'var(--white)'],
            ['Pending',  orders.filter(o => o.deliveryStatus === 'Pending').length,  'var(--yellow)'],
            ['Pending (No Transporter)', orders.filter(o => o.deliveryStatus === 'Pending' && !o.transporter).length, 'var(--red)'],
            ['In Transit',orders.filter(o => o.deliveryStatus === 'InTransit').length,'var(--orange)'],
            ['Delivered',orders.filter(o => o.deliveryStatus === 'Delivered').length, 'var(--green)'],
          ].map(([l, v, c]) => (
            <div key={l} className="stat-card" style={{ textAlign:'center' }}>
              <div className="stat-val" style={{ color:c }}>{v}</div>
              <div className="stat-label" style={{ fontSize: l === 'Pending (No Transporter)' ? 11 : 13 }}>{l}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:11, marginBottom:14, flexWrap:'wrap' }}>
          <input className="form-control" placeholder="🔍 Search order ID or buyer…"
            value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:320 }} />
        </div>

        <div className="chip-row">
          {statuses.map(s => (
            <button key={s} className={`chip${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
              {s === 'InTransit' ? 'In Transit' : s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>

        {loading ? <div className="spinner" /> : filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">📦</div><h3>No orders found</h3></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Order ID</th><th>Buyer</th><th>Items</th><th>Amount</th><th>Transporter</th><th>Status</th><th>Notes</th><th>Address</th><th>Date</th></tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o._id} style={{ background: o.deliveryStatus === 'Pending' && !o.transporter ? 'rgba(255,193,7,.1)' : 'transparent' }}>
                    <td style={{ fontFamily:'monospace', fontSize:11, color:'var(--accent)' }}>#{o._id.slice(-8).toUpperCase()}</td>
                    <td>
                      <div style={{ fontWeight:600 }}>{o.buyer?.name}</div>
                      <div style={{ fontSize:11, color:'var(--dim)' }}>{o.buyer?.email}</div>
                    </td>
                    <td style={{ fontSize:12 }}>
                      {o.items.map((item, i) => <div key={i}>💧 {item.listing?.title} × {item.quantity}L</div>)}
                    </td>
                    <td style={{ color:'var(--accent)', fontWeight:700 }}>₹{o.totalAmount.toFixed(2)}</td>
                    <td>
                      {o.transporter
                        ? <div>
                            <div style={{ fontWeight:600 }}>{o.transporter.name}</div>
                            <span className={`badge b-${o.transporter.availability}`} style={{ fontSize:10 }}>{o.transporter.availability}</span>
                          </div>
                        : <span style={{ color:'var(--yellow)', fontSize:12, fontWeight:600 }}>⏳ Unassigned</span>
                      }
                    </td>
                    <td><span className={`badge ${badgeClass(o.deliveryStatus)}`}>{o.deliveryStatus}</span></td>
                    <td style={{ fontSize:11, color:'var(--dim)', maxWidth:100, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', cursor: o.notes ? 'help' : 'default' }} title={o.notes || ''}>
                      {o.notes ? `📝 ${o.notes.slice(0, 20)}${o.notes.length > 20 ? '...' : ''}` : '—'}
                    </td>
                    <td style={{ fontSize:11, color:'var(--dim)', maxWidth:140 }}>{o.deliveryAddress}</td>
                    <td style={{ fontSize:11, color:'var(--dim)', whiteSpace:'nowrap' }}>
                      {new Date(o.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
