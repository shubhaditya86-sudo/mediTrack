import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { Stethoscope, User, Mail, Lock, Eye, EyeOff, ArrowRight, Loader } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm]         = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirm } = form;

    if (!name || !email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      toast.success('Account created! 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const iconStyle = {
    position: 'absolute', left: 14, top: '50%',
    transform: 'translateY(-50%)', color: 'var(--text-4)',
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo-wrap">
          <div className="auth-logo-icon">
            <Stethoscope size={28} color="white" />
          </div>
          <h1 className="auth-title">Create account</h1>
          <p className="auth-subtitle">Start tracking your medicines today</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={iconStyle} />
              <input
                id="reg-name"
                type="text"
                name="name"
                className="form-input"
                placeholder="enter your name"
                value={form.name}
                onChange={handleChange}
                style={{ paddingLeft: 40 }}
                autoComplete="name"
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={iconStyle} />
              <input
                id="reg-email"
                type="email"
                name="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                style={{ paddingLeft: 40 }}
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={iconStyle} />
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                name="password"
                className="form-input"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={handleChange}
                style={{ paddingLeft: 40, paddingRight: 44 }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 14, top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', color: 'var(--text-4)',
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={iconStyle} />
              <input
                id="reg-confirm"
                type={showPass ? 'text' : 'password'}
                name="confirm"
                className="form-input"
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={handleChange}
                style={{ paddingLeft: 40 }}
                autoComplete="new-password"
              />
            </div>
          </div>

          <button
            id="reg-submit"
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? (
              <><Loader size={16} style={{ animation: 'spin 0.75s linear infinite' }} /> Creating...</>
            ) : (
              <>Create Account <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <div className="auth-link">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
