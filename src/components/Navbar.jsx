import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../assets/styles/Navbar.css';

// Pages that manage their own header / should not show the shared navbar
const HIDDEN_ON = ['/', '/login', '/register', '/interview-start'];

function Navbar() {
  const [userName, setUserName] = useState('');
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    const name = localStorage.getItem('userName');
    if (name) setUserName(name);
  }, [location.pathname]); // re-read on route change (post-login)

  if (HIDDEN_ON.includes(location.pathname)) return null;

  const isLoggedIn = Boolean(localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    sessionStorage.clear();
    navigate('/login');
  };

  return (
    <nav className="app-navbar">
      <button className="navbar-brand" onClick={() => navigate(isLoggedIn ? '/dashboard' : '/')}>
        <span className="navbar-logo-icon">🌌</span>
        VisionHire
      </button>

      <div className="navbar-actions">
        {isLoggedIn ? (
          <>
            {userName && (
              <span className="navbar-user">
                Hi, <strong>{userName.split(' ')[0]}</strong>
              </span>
            )}
            <button
              className="navbar-btn ghost"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </button>
            <button
              className="navbar-btn primary"
              onClick={() => navigate('/interview')}
            >
              New Interview
            </button>
            <button className="navbar-btn logout" onClick={handleLogout}>
              Log out
            </button>
          </>
        ) : (
          <>
            <button className="navbar-btn ghost"   onClick={() => navigate('/login')}>    Login    </button>
            <button className="navbar-btn primary" onClick={() => navigate('/register')}> Sign Up  </button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
