import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../services/api';
import '../assets/styles/Form.css';

function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = formData;
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      const data = await loginUser(email.trim(), password);
      if (data?.token) {
        localStorage.setItem('token',    data.token);
        localStorage.setItem('userName', data.name || '');
        navigate('/dashboard');
      } else {
        setError(data?.message || 'Invalid credentials. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-page page-shell">
      <div className="page-glow one" />
      <div className="page-glow two" />

      <div className="form-card glass-surface">
        <div className="form-brand">
          <span className="form-brand-icon">🌌</span>
          <h1>VisionHire</h1>
        </div>

        <h2 className="form-title">Welcome back</h2>
        <p className="form-subtitle">Sign in to continue your interview practice.</p>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit} className="form-body" noValidate>
          <label className="form-label">
            Email
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </label>

          <label className="form-label">
            Password
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="cta-button primary form-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="form-footer">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="form-link">Create one</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
