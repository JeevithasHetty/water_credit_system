import { useState, useEffect } from 'react';
import { listingsAPI } from '../api';
import { useCart }     from '../context/CartContext';
import { useAuth }     from '../context/AuthContext';
import { Link }        from 'react-router-dom';

const types = ['all','drinking','agricultural','industrial','rainwater'];
const emoji = { drinking:'🥤', agricultural:'🌾', industrial:'⚙️', rainwater:'🌧️' };
const badgeEmoji = { silver: '🥈', gold: '🥇', diamond: '💎' };

export default function MarketplacePage() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minQty, setMinQty]     = useState('');
  const [location, setLocation] = useState('');
  const [sortBy, setSortBy]     = useState('newest');
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

  // Apply all filters
  let filtered = listings.filter(l => {
    if (filter !== 'all' && l.waterType !== filter) return false;
    if (search && !l.title.toLowerCase().includes(search.toLowerCase()) && !l.location.toLowerCase().includes(search.toLowerCase())) return false;
    if (minPrice && l.pricePerLitre < +minPrice) return false;
    if (maxPrice && l.pricePerLitre > +maxPrice) return false;
    if (minQty && l.quantityLitres < +minQty) return false;
    if (location && !l.location.toLowerCase().includes(location.toLowerCase())) return false;
    return true;
  });

  // Apply sorting
  if (sortBy === 'newest') {
    filtered = [...filtered].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (sortBy === 'price-low') {
    filtered = [...filtered].sort((a, b) => a.pricePerLitre - b.pricePerLitre);
  } else if (sortBy === 'price-high') {
    filtered = [...filtered].sort((a, b) => b.pricePerLitre - a.pricePerLitre);
  } else if (sortBy === 'rating-high') {
    filtered = [...filtered].sort((a, b) => (b.sellerRating || 0) - (a.sellerRating || 0));
  }

  const activeFilters = (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (minQty ? 1 : 0) + (location ? 1 : 0);

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinQty('');
    setLocation('');
    setSortBy('newest');
  };

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

        {/* Advanced filters */}
        <div style={{ background: 'rgba(0,180,216,.05)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              Filters {activeFilters > 0 && <span style={{ background: 'var(--accent)', color: 'var(--ink)', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, marginLeft: 8 }}>{activeFilters}</span>}
            </div>
            {activeFilters > 0 && <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear All</button>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 12 }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11 }}>Min Price (₹/L)</label>
              <input type="number" className="form-control" placeholder="0" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11 }}>Max Price (₹/L)</label>
              <input type="number" className="form-control" placeholder="100" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11 }}>Min Qty (L)</label>
              <input type="number" className="form-control" placeholder="100" value={minQty} onChange={e => setMinQty(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11 }}>Location</label>
              <input type="text" className="form-control" placeholder="City/Area" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: 11 }}>Sort by</label>
              <select className="form-control" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating-high">Rating: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 14, textAlign: 'right' }}>
          Showing {filtered.length} of {listings.length} listings
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
                  {[['📍', l.location]].map(([ic, v]) => (
                    <div key={ic} style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                      <span style={{ color:'var(--dim)' }}>{ic}</span><span>{v}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
                    <span style={{ color:'var(--dim)' }}>💧</span>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span>{l.quantityLitres.toLocaleString()}L available</span>
                      {l.quantityLitres < 500 ? (
                        <span style={{ color: 'var(--red)', fontSize: 10, fontWeight: 600 }}>🔴 Very Low</span>
                      ) : l.quantityLitres < 1000 ? (
                        <span style={{ color: 'var(--yellow)', fontSize: 10, fontWeight: 600 }}>⚠️ Low</span>
                      ) : null}
                    </div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, alignItems:'center' }}>
                    <span style={{ color:'var(--dim)' }}>🏪</span>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span>{l.seller?.name}</span>
                        {l.seller?.badge && (
                          <span style={{
                            fontSize:10,
                            fontWeight:700,
                            padding:'4px 10px',
                            borderRadius:4,
                            textTransform:'uppercase',
                            letterSpacing:'0.5px',
                            background: l.seller.badge === 'diamond' ? 'rgba(185,242,255,.2)' : l.seller.badge === 'gold' ? 'rgba(255,215,0,.2)' : 'rgba(192,192,192,.2)',
                            color: l.seller.badge === 'diamond' ? '#b9f2ff' : l.seller.badge === 'gold' ? '#ffd700' : '#c0c0c0',
                            border: l.seller.badge === 'diamond' ? '1px solid #b9f2ff' : l.seller.badge === 'gold' ? '1px solid #ffd700' : '1px solid #c0c0c0',
                          }}>
                            {badgeEmoji[l.seller.badge]} {l.seller.badge}
                          </span>
                        )}
                      </div>
                      {l.ratingCount > 0 ? (
                        <div style={{ fontSize:10, color:'var(--accent)' }}>
                          ⭐ {l.sellerRating} ({l.ratingCount} {l.ratingCount === 1 ? 'review' : 'reviews'})
                        </div>
                      ) : (
                        <div style={{ fontSize:10, color:'var(--dim)' }}>New Seller</div>
                      )}
                    </div>
                  </div>
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
