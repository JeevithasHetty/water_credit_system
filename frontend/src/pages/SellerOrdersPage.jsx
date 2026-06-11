import { useState, useEffect } from 'react';
import { ordersAPI } from '../api';

const badgeClass = s => ({ Pending:'b-pending', Assigned:'b-assigned', Accepted:'b-accepted', InTransit:'b-intransit', Delivered:'b-delivered' }[s] || 'b-pending');

export default function SellerOrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = () => ordersAPI.getSeller().then(({ data }) => setOrders(data.orders)).finally(() => setLoading(false));

  useEffect(() => {
    loadOrders();
    const h = () => loadOrders();
    window.addEventListener('ws:seller_new_order',    h);
    window.addEventListener('ws:admin_order_updated', h);
    return () => {
      window.removeEventListener('ws:seller_new_order',    h);
      window.removeEventListener('ws:admin_order_updated', h);
    };
  }, []);

  if (loading) return <div className="spinner" style={{ marginTop:80 }} />;

  return (
    <div className="page" style={{ padding:'28px 0 80px' }}>
      <div className="container">
        <div className="section-header">
          <div>
            <h2 style={{ fontFamily:'var(--fh)', fontSize:26, fontWeight:700 }}>Incoming Orders</h2>
            <p style={{ color:'var(--dim)', fontSize:13, marginTop:3 }}>{orders.length} orders</p>
          </div>
        </div>
        {orders.length === 0 ? (
          <div className="empty-state"><div className="icon">📋</div><h3>No orders yet</h3></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Order ID</th><th>Buyer</th><th>Items</th><th>Total</th><th>Transporter</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id}>
                    <td style={{ fontFamily:'monospace', fontSize:11, color:'var(--accent)' }}>#{o._id.slice(-8).toUpperCase()}</td>
                    <td>
                      <div style={{ fontWeight:600 }}>{o.buyer?.name}</div>
                      <div style={{ fontSize:11, color:'var(--dim)' }}>{o.buyer?.email}</div>
                    </td>
                    <td style={{ fontSize:12 }}>
                      {o.items.map((item, i) => <div key={i}>💧 {item.listing?.title} × {item.quantity}L</div>)}
                    </td>
                    <td style={{ color:'var(--accent)', fontWeight:700 }}>₹{o.totalAmount.toFixed(2)}</td>
                    <td>{o.transporter?.name || <span style={{ color:'var(--yellow)' }}>Unassigned</span>}</td>
                    <td><span className={`badge ${badgeClass(o.deliveryStatus)}`}>{o.deliveryStatus}</span></td>
                    <td style={{ fontSize:11, color:'var(--dim)' }}>{new Date(o.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}</td>
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
