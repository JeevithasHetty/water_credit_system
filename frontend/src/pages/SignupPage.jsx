import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';

export default function SignupPage() {
  const [form, setForm] = useState({
    name:'', email:'', password:'', role:'buyer',
    aadhaarNumber:'', licenseNumber:'', vehicleType:'Tanker', vehicleCapacity:'',
  });
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);
  const { login }       = useAuth();
  const navigate        = useNavigate();

  const set = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async e => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const { data } = await authAPI.signup(form);
      login(data.user, data.token);
      const dest = { buyer:'/marketplace', seller:'/marketplace', transporter:'/transporter' };
      navigate(dest[data.user.role] || '/');
    } catch (e) {
      setErr(e.response?.data?.message || 'Signup failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight:'calc(100vh - 62px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 24px' }}>
      <div style={{ width:'100%', maxWidth:460 }} className="fade-in">
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:38, marginBottom:10 }}>💧</div>
          <h1 style={{ fontFamily:'var(--fh)', fontSize:26, fontWeight:700, marginBottom:7 }}>Create Account</h1>
          <p style={{ color:'var(--dim)', fontSize:13 }}>Join AquaFlow — live water trading</p>
        </div>
        <div className="card">
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" className="form-control" placeholder="John Doe" value={form.name} onChange={set} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={set} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input name="password" type="password" className="form-control" placeholder="Min 6 chars" value={form.password} onChange={set} required minLength={6} />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select name="role" className="form-control" value={form.role} onChange={set}>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="transporter">Transporter</option>
              </select>
            </div>
            {form.role === 'transporter' && (
              <>
                <div style={{ padding:'10px 14px', borderRadius:7, marginBottom:14, background:'rgba(0,180,216,.06)', border:'1px solid rgba(0,180,216,.15)', fontSize:12, color:'var(--dim)' }}>
                  ℹ️ Transporter accounts require admin verification. You'll receive a real-time notification once approved.
                </div>
                <div className="grid-2" style={{ gap:10 }}>
                  <div className="form-group">
                    <label>Aadhaar Number</label>
                    <input name="aadhaarNumber" className="form-control" placeholder="XXXX-XXXX-XXXX" value={form.aadhaarNumber} onChange={set} required />
                  </div>
                  <div className="form-group">
                    <label>License Number</label>
                    <input name="licenseNumber" className="form-control" placeholder="KA-01-2024-XXX" value={form.licenseNumber} onChange={set} required />
                  </div>
                  <div className="form-group">
                    <label>Vehicle Type</label>
                    <select name="vehicleType" className="form-control" value={form.vehicleType} onChange={set}>
                      <option>Tanker</option>
                      <option>Mini Tanker</option>
                      <option>Bowser</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Capacity (L)</label>
                    <input name="vehicleCapacity" type="number" className="form-control" placeholder="5000" value={form.vehicleCapacity} onChange={set} />
                  </div>
                </div>
              </>
            )}
            <button type="submit" className="btn btn-cyan" style={{ width:'100%', justifyContent:'center', marginTop:6 }} disabled={busy}>
              {busy ? 'Creating…' : 'Create Account →'}
            </button>
          </form>
        </div>
        <p style={{ textAlign:'center', marginTop:18, fontSize:13, color:'var(--dim)' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
