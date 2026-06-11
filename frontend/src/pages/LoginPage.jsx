import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';
import { authAPI }  from '../api';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);
  const { login }       = useAuth();
  const navigate        = useNavigate();

  const set   = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const quick = em => setForm({ email: em, password: 'password123' });

  const submit = async e => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const { data } = await authAPI.login(form);
      login(data.user, data.token);
      const dest = { buyer:'/marketplace', seller:'/marketplace', transporter:'/transporter', admin:'/admin' };
      navigate(dest[data.user.role] || '/');
    } catch (e) {
      setErr(e.response?.data?.message || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight:'calc(100vh - 62px)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:420 }} className="fade-in">
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:38, marginBottom:10 }}>💧</div>
          <h1 style={{ fontFamily:'var(--fh)', fontSize:26, fontWeight:700, marginBottom:7 }}>Welcome Back</h1>
          <p style={{ color:'var(--dim)', fontSize:13 }}>Sign in to AquaFlow v2</p>
        </div>
        <div className="card">
          {err && <div className="alert alert-error">{err}</div>}
          <form onSubmit={submit}>
            <div className="form-group">
              <label>Email</label>
              <input name="email" type="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={set} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input name="password" type="password" className="form-control" placeholder="••••••••" value={form.password} onChange={set} required />
            </div>
            <button type="submit" className="btn btn-cyan" style={{ width:'100%', justifyContent:'center', marginTop:6 }} disabled={busy}>
              {busy ? 'Signing in…' : 'Sign In →'}
            </button>
          </form>
          <div style={{ marginTop:22, borderTop:'1px solid var(--border)', paddingTop:18 }}>
            <p style={{ fontSize:11, color:'var(--dim)', marginBottom:9, textAlign:'center' }}>
              Quick fill (password: <code style={{ color:'var(--accent)' }}>password123</code>)
            </p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {[
                ['👑 Admin',      'admin@water.com'],
                ['🛒 Buyer',      'ravi@buyer.com'],
                ['🏪 Seller',     'seller1@water.com'],
                ['🚛 Transporter','suresh@transporter.com'],
              ].map(([l, e]) => (
                <button key={e} onClick={() => quick(e)} className="btn btn-ghost btn-sm" type="button" style={{ flex:'1 1 calc(50% - 3px)' }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p style={{ textAlign:'center', marginTop:18, fontSize:13, color:'var(--dim)' }}>
          New? <Link to="/signup">Create account</Link>
        </p>
      </div>
    </div>
  );
}
