import { useState, useEffect } from 'react';
import { adminAPI } from '../api';

export default function AdminVerifications() {
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState({});
  const [busy,    setBusy]    = useState({});
  const [msg,     setMsg]     = useState('');
  const [filter,  setFilter]  = useState('all');

  const loadVerifications = async () => {
    try { const { data } = await adminAPI.getVerifications(); setList(data.verifications); }
    finally { setLoading(false); }
  };
  useEffect(() => { loadVerifications(); }, []);

  const decide = async (transporterId, decision, vid) => {
    setBusy(b => ({ ...b, [vid]: true }));
    try {
      await adminAPI.makeDecision(transporterId, { decision, remarks: remarks[vid] || '' });
      setMsg(`Transporter ${decision} successfully.`);
      loadVerifications();
    } catch (e) {
      setMsg(e.response?.data?.message || 'Error');
    } finally {
      setBusy(b => ({ ...b, [vid]: false }));
    }
  };

  const filtered = list.filter(v => filter === 'all' || v.status === filter);

  return (
    <div className="page" style={{ padding:'28px 0 80px' }}>
      <div className="container">
        <div className="section-header">
          <div>
            <h2 style={{ fontFamily:'var(--fh)', fontSize:26, fontWeight:700 }}>Verifications</h2>
            <p style={{ color:'var(--dim)', fontSize:13, marginTop:3 }}>Approved transporters get a real-time WebSocket notification instantly.</p>
          </div>
        </div>

        {msg && <div className="alert alert-success">{msg}</div>}

        <div className="chip-row">
          {['all','Pending','Verified','Rejected'].map(f => (
            <button key={f} className={`chip${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all'
                ? `All (${list.length})`
                : f === 'Pending'
                ? `⏳ Pending (${list.filter(v => v.status === 'Pending').length})`
                : f === 'Verified'
                ? `✅ Verified (${list.filter(v => v.status === 'Verified').length})`
                : `❌ Rejected (${list.filter(v => v.status === 'Rejected').length})`}
            </button>
          ))}
        </div>

        {loading ? <div className="spinner" /> : filtered.length === 0 ? (
          <div className="empty-state"><div className="icon">🔍</div><h3>No records</h3></div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {filtered.map(v => (
              <div key={v._id} className="card fade-in" style={{
                borderColor: v.status === 'Pending'
                  ? 'rgba(255,209,102,.28)'
                  : v.status === 'Verified'
                  ? 'rgba(6,214,160,.22)'
                  : 'rgba(239,71,111,.18)',
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16, flexWrap:'wrap', gap:9 }}>
                  <div>
                    <div style={{ fontFamily:'var(--fh)', fontSize:17, fontWeight:700, marginBottom:3 }}>{v.transporter?.name}</div>
                    <div style={{ fontSize:12, color:'var(--dim)' }}>{v.transporter?.email}</div>
                    <div style={{ fontSize:11, color:'var(--dim)', marginTop:2 }}>
                      Applied: {new Date(v.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                    </div>
                  </div>
                  <span className={`badge ${v.status === 'Pending' ? 'b-pending' : v.status === 'Verified' ? 'b-verified' : 'b-rejected'}`}
                    style={{ fontSize:13, padding:'5px 13px' }}>
                    {v.status === 'Pending' ? '⏳' : v.status === 'Verified' ? '✅' : '❌'} {v.status}
                  </span>
                </div>

                <div className="grid-2" style={{ gap:10, marginBottom:16 }}>
                  {[
                    ['Aadhaar Number', v.aadhaarNumber],
                    ['License Number', v.licenseNumber],
                    ['Vehicle Type',   v.vehicleType || 'Tanker'],
                    ['Capacity',       v.vehicleCapacity ? `${v.vehicleCapacity.toLocaleString()}L` : '—'],
                  ].map(([l, val]) => (
                    <div key={l} style={{ padding:'11px 14px', background:'var(--glass)', borderRadius:7, border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:10, color:'var(--dim)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.04em', marginBottom:3 }}>{l}</div>
                      <div style={{ fontFamily:'monospace', fontSize:14, color:'var(--accent)' }}>{val}</div>
                    </div>
                  ))}
                </div>

                {v.status !== 'Pending' && v.remarks && (
                  <div style={{
                    padding:'10px 14px', borderRadius:7, marginBottom:14, fontSize:13,
                    background: v.status === 'Verified' ? 'rgba(6,214,160,.06)' : 'rgba(239,71,111,.06)',
                    border: `1px solid ${v.status === 'Verified' ? 'rgba(6,214,160,.2)' : 'rgba(239,71,111,.2)'}`,
                  }}>
                    Remarks: {v.remarks}
                  </div>
                )}

                {v.status === 'Pending' && (
                  <div style={{ borderTop:'1px solid var(--border)', paddingTop:14 }}>
                    <div className="form-group" style={{ marginBottom:11 }}>
                      <label>Remarks</label>
                      <input className="form-control" placeholder="Add remarks…"
                        value={remarks[v._id] || ''}
                        onChange={e => setRemarks(r => ({ ...r, [v._id]: e.target.value }))} />
                    </div>
                    <div style={{ display:'flex', gap:11 }}>
                      <button className="btn btn-success" disabled={!!busy[v._id]}
                        onClick={() => decide(v.transporter?._id, 'Verified', v._id)}>
                        {busy[v._id] ? '…' : '✅ Verify Transporter'}
                      </button>
                      <button className="btn btn-danger" disabled={!!busy[v._id]}
                        onClick={() => decide(v.transporter?._id, 'Rejected', v._id)}>
                        {busy[v._id] ? '…' : '❌ Reject'}
                      </button>
                    </div>
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
