import { useState, useEffect } from 'react';
import { listingsAPI } from '../api';

export default function SellerListingsPage() {
  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [err,  setErr]  = useState('');
  const [ok,   setOk]   = useState('');
  const [form, setForm] = useState({ title:'', description:'', location:'', pricePerLitre:'', quantityLitres:'', waterType:'drinking' });
  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const loadListings = async () => {
    try { const { data } = await listingsAPI.getMy(); setListings(data.listings); }
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
                <tr><th>Title</th><th>Type</th><th>Location</th><th>Price/L</th><th>Stock</th><th>Action</th></tr>
              </thead>
              <tbody>
                {listings.map(l => (
                  <tr key={l._id}>
                    <td><div style={{ fontWeight:600 }}>{l.title}</div></td>
                    <td><span className="badge b-assigned">{l.waterType}</span></td>
                    <td style={{ color:'var(--dim)', fontSize:12 }}>📍 {l.location}</td>
                    <td style={{ color:'var(--accent)', fontWeight:700 }}>₹{l.pricePerLitre}</td>
                    <td>{l.quantityLitres.toLocaleString()}L</td>
                    <td><button className="btn btn-danger btn-sm" onClick={() => del(l._id)}>Delete</button></td>
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
