import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/api';
import '../assets/styles/Form.css';

function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirm } = formData;

    if (!name || !email || !password || !confirm) {
      setError('All fields are required.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser(name.trim(), email.trim(), password);
      if (data?.token) {
        localStorage.setItem('token',    data.token);
        localStorage.setItem('userName', data.name || name.trim());
        navigate('/dashboard');
      } else {
        setError(data?.message || 'Registration failed. Please try again.');
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

        <h2 className="form-title">Create your account</h2>
        <p className="form-subtitle">Start practising interviews today — it&apos;s free.</p>

        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleSubmit} className="form-body" noValidate>
          <label className="form-label">
            Full name
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="Yasaswini G"
              value={formData.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </label>

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
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </label>

          <label className="form-label">
            Confirm password
            <input
              type="password"
              name="confirm"
              className="form-input"
              placeholder="Repeat password"
              value={formData.confirm}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </label>

          <button type="submit" className="cta-button primary form-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="form-footer">
          Already have an account?{' '}
          <Link to="/login" className="form-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
