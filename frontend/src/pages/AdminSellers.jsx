import { useState, useEffect } from 'react';
import { adminAPI } from '../api';

const badgeEmoji = { silver: '🥈', gold: '🥇', diamond: '💎' };
const badgeColor = { silver: '#c0c0c0', gold: '#ffd700', diamond: '#b9f2ff' };
const badgeBorder = { silver: '1px solid #c0c0c0', gold: '2px solid #ffd700', diamond: '2px solid #b9f2ff' };

export default function AdminSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState({});

  const loadSellers = async () => {
    try {
      const { data } = await adminAPI.getSellers();
      setSellers(data.sellers);
      setErr('');
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to load sellers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  const handleBadgeChange = async (sellerId, newBadge) => {
    const seller = sellers.find(s => s._id === sellerId);
    const oldBadge = seller.badge;
    const badgeLabel = newBadge ? `${badgeEmoji[newBadge]} ${newBadge.charAt(0).toUpperCase() + newBadge.slice(1)}` : 'None';
    
    if (!window.confirm(`Change ${seller.name}'s badge to "${badgeLabel}"?`)) return;

    setBusy(prev => ({ ...prev, [sellerId]: true }));
    try {
      await adminAPI.assignBadge(sellerId, newBadge);
      setSellers(prev => 
        prev.map(s => s._id === sellerId ? { ...s, badge: newBadge } : s)
      );
      setOk(`✅ Badge updated for ${seller.name}`);
      setTimeout(() => setOk(''), 3000);
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to update badge');
    } finally {
      setBusy(prev => ({ ...prev, [sellerId]: false }));
    }
  };

  if (loading) return <div className="spinner" style={{ marginTop: 100 }} />;

  return (
    <div className="page" style={{ padding: '28px 0 80px' }}>
      <div className="container">
        <h2 style={{ fontFamily: 'var(--fh)', fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Manage Seller Badges</h2>
        <p style={{ color: 'var(--dim)', fontSize: 13, marginBottom: 24 }}>
          Total sellers: {sellers.length} · Assign badges based on performance
        </p>

        {err && <div className="alert alert-error" style={{ marginBottom: 16 }}>{err}</div>}
        {ok && <div className="alert alert-success" style={{ marginBottom: 16 }}>{ok}</div>}

        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13,
            }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--dim)', fontWeight: 600 }}>Seller Name</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--dim)', fontWeight: 600 }}>Email</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--dim)', fontWeight: 600 }}>Listings</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--dim)', fontWeight: 600 }}>Orders</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--dim)', fontWeight: 600 }}>Badge</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--dim)', fontWeight: 600 }}>Assign Badge</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr key={seller._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 500 }}>{seller.name}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--dim)', fontSize: 12 }}>{seller.email}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>{seller.listingCount}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>{seller.orderCount}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      {seller.badge ? (
                        <span style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 6,
                          border: seller.badge === 'diamond' ? '1.5px solid #b9f2ff' : seller.badge === 'gold' ? '1.5px solid #ffd700' : '1.5px solid #c0c0c0',
                          background: seller.badge === 'diamond' ? 'rgba(185,242,255,.15)' : seller.badge === 'gold' ? 'rgba(255,215,0,.15)' : 'rgba(192,192,192,.15)',
                          color: seller.badge === 'diamond' ? '#b9f2ff' : seller.badge === 'gold' ? '#ffd700' : '#c0c0c0',
                          fontWeight: 700,
                          fontSize: 11,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}>
                            {badgeEmoji[seller.badge]} {seller.badge}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--dim)', fontSize: 12 }}>New Seller</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <select
                        className="form-control"
                        value={seller.badge || ''}
                        onChange={(e) => handleBadgeChange(seller._id, e.target.value || null)}
                        disabled={busy[seller._id]}
                        style={{
                          width: '100%',
                          maxWidth: 140,
                          fontSize: 12,
                        }}
                      >
                        <option value="">None</option>
                        <option value="silver">🥈 Silver</option>
                        <option value="gold">🥇 Gold</option>
                        <option value="diamond">💎 Diamond</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
