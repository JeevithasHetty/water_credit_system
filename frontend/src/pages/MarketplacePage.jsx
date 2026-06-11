import { useState, useEffect } from 'react';
import { listingsAPI } from '../api';
import { useCart }     from '../context/CartContext';
import { useAuth }     from '../context/AuthContext';
import { Link }        from 'react-router-dom';

const types = ['all','drinking','agricultural','industrial','rainwater'];
const emoji = { drinking:'🥤', agricultural:'🌾', industrial:'⚙️', rainwater:'🌧️' };

export default function MarketplacePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [qty, setQty]           = useState({});
  const [added, setAdded]       = useState({});
  const { addToCart }           = useCart();
  const { user }                = useAuth();

  const loadListings = async () => {
    try {
      const { data } = await listingsAPI.getAll();
      setListings(data.listings);
      const q = {};
      data.listings.forEach(l => { q[l._id] = 100; });
      setQty(q);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
    const handler = (e) => {
      const { listing } = e.detail;
      setListings(prev => {
        if (prev.find(l => l._id === listing._id)) return prev;
        return [listing, ...prev];
      });
      setQty(q => ({ ...q, [listing._id]: 100 }));
    };
    window.addEventListener('ws:new_listing', handler);
    return () => window.removeEventListener('ws:new_listing', handler);
  }, []);

  const handleAdd = (listing) => {
    addToCart(listing, qty[listing._id] || 100);
    setAdded(a => ({ ...a, [listing._id]: true }));
    setTimeout(() => setAdded(a => ({ ...a, [listing._id]: false })), 1400);
  };

  const filtered = listings.filter(l =>
    (filter === 'all' || l.waterType === filter) &&
    (!search || l.title.toLowerCase().includes(search.toLowerCase()) || l.location.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page" style={{ padding:'28px 0 80px' }}>
      <div className="container">
        <div className="section-header">
          <div>
            <h2 style={{ fontFamily:'var(--fh)', fontSize:26, fontWeight:700 }}>Water Marketplace</h2>
            <p style={{ color:'var(--dim)', fontSize:13, marginTop:3 }}>{filtered.length} listings · New listings appear live</p>
          </div>
          {user?.role === 'buyer' && <Link to="/cart" className="btn btn-cyan">🛒 Cart</Link>}
        </div>
        <input className="form-control" placeholder="🔍  Search listings…" value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth:320, marginBottom:14 }} />
        <div className="chip-row">
          {types.map(t => (
            <button key={t} className={`chip${filter === t ? ' active' : ''}`} onClick={() => setFilter(t)}>
              {emoji[t] || '💧'} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {loading ? <div className="spinner" /> : filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">💧</div><h3>No listings</h3></div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:18 }}>
            {filtered.map(l => (
              <div key={l._id} className="card fade-in" style={{ display:'flex', flexDirection:'column', gap:13 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontSize:22, marginBottom:5 }}>{emoji[l.waterType] || '💧'}</div>
                    <h3 style={{ fontFamily:'var(--fh)', fontSize:16, fontWeight:600, lineHeight:1.3 }}>{l.title}</h3>
                  </div>
                  <span className="badge b-assigned" style={{ fontSize:11 }}>{l.waterType}</span>
                </div>
                {l.description && <p style={{ fontSize:12, color:'var(--dim)', lineHeight:1.6 }}>{l.description}</p>}
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {[['📍', l.location], ['💧', `${l.quantityLitres.toLocaleString()}L available`], ['🏪', l.seller?.name]].map(([ic, v]) => (
                    <div key={ic} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                      <span style={{ color:'var(--dim)' }}>{ic}</span><span>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding:'10px 14px', borderRadius:7, background:'rgba(0,180,216,.05)', border:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <div style={{ fontFamily:'var(--fh)', fontSize:20, fontWeight:700, color:'var(--accent)' }}>₹{l.pricePerLitre}</div>
                    <div style={{ fontSize:10, color:'var(--dim)' }}>per litre</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'var(--fh)', fontSize:15, fontWeight:600 }}>₹{((qty[l._id] || 100) * l.pricePerLitre).toFixed(2)}</div>
                    <div style={{ fontSize:10, color:'var(--dim)' }}>for {qty[l._id] || 100}L</div>
                  </div>
                </div>
                {user?.role === 'buyer' && (
                  <div>
                    <div style={{ display:'flex', gap:7, marginBottom:8, alignItems:'center' }}>
                      <span style={{ fontSize:12, color:'var(--dim)', whiteSpace:'nowrap' }}>Qty (L):</span>
                      <input type="number" min={1} max={l.quantityLitres} value={qty[l._id] || 100}
                        onChange={e => setQty(q => ({ ...q, [l._id]: +e.target.value }))}
                        className="form-control" style={{ textAlign:'center' }} />
                    </div>
                    <button onClick={() => handleAdd(l)} className={`btn ${added[l._id] ? 'btn-success' : 'btn-cyan'}`} style={{ width:'100%', justifyContent:'center' }}>
                      {added[l._id] ? '✓ Added!' : '🛒 Add to Cart'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
