import '../assets/styles/Home.css';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const highlightFeatures = [
  {
    icon: '🤖',
    title: 'Adaptive AI Interviewer',
    description: 'Gemini analyses every answer and adjusts follow-up depth in real time.',
  },
  {
    icon: '📄',
    title: 'Resume-Aware Questions',
    description: 'Upload your CV and VisionHire tailors questions to your actual experience.',
  },
  {
    icon: '🎙️',
    title: 'Voice & Text Input',
    description: 'Speak naturally or type — continuous speech recognition captures every word.',
  },
  {
    icon: '⚡',
    title: 'Actionable Feedback',
    description: 'Per-question keyword highlights, 0-5 scores, and rationales after every session.',
  },
];

const howSteps = [
  { label: 'Upload Resume',        description: 'Let VisionHire understand your background before questions begin.' },
  { label: 'Pick Domain & Level',  description: 'Six domains, three difficulty levels — Easy, Medium, or Hard.' },
  { label: 'Interview in Real Time', description: 'Voice or keyboard, anti-cheat proctoring, 60-second timer per question.' },
  { label: 'Review & Improve',     description: 'See per-question scores, keywords, and AI rationales instantly.' },
];

function Home() {
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem('token'));

  const toggleTheme = () => {
    setDarkMode((p) => !p);
    document.body.classList.toggle('dark-theme');
  };

  const stats = useMemo(
    () => [
      { value: '12k+',  label: 'Questions generated' },
      { value: '4.9/5', label: 'Candidate satisfaction' },
      { value: '85%',   label: 'Report improved readiness' },
    ],
    [],
  );

  return (
    <div className={`home-wrapper ${darkMode ? 'dark' : ''}`}>
      <div className="gradient-glow glow-one" />
      <div className="gradient-glow glow-two" />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="header">
        <div className="logo-wrap">
          <span className="logo-icon">🌌</span>
          <h1 className="logo">VisionHire</h1>
        </div>
        <div className="nav-buttons">
          {isLoggedIn ? (
            <>
              <button onClick={() => navigate('/dashboard')} className="nav-link">Dashboard</button>
              <button onClick={() => navigate('/interview')} className="nav-link filled">Start Interview</button>
            </>
          ) : (
            <>
              <a href="/login"    className="nav-link">Login</a>
              <a href="/register" className="nav-link filled">Create Account</a>
            </>
          )}
          <button onClick={toggleTheme} className="theme-toggle">
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-pill">🚀 Now with resume-personalised questions</span>
          <h2>
            Ace your next <span>technical interview</span> with AI-powered practice.
          </h2>
          <p>
            VisionHire blends adaptive questioning, realistic pacing, and instant analytics to help you
            rehearse like it&apos;s the real thing — every single time.
          </p>
          <div className="hero-actions">
            <a href={isLoggedIn ? '/interview' : '/register'} className="cta-button primary">
              {isLoggedIn ? 'Start Practicing' : 'Get Started Free'}
            </a>
            <a href="/guidelines" className="cta-button ghost">See How It Works</a>
          </div>
          <div className="hero-stats">
            {stats.map((s) => (
              <div key={s.label} className="stat-card">
                <span className="stat-value">{s.value}</span>
                <span className="stat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-card card-one">
            <span>✨</span>
            <h4>Resume-Aware</h4>
            <p>Questions tailored to your actual projects and experience.</p>
          </div>
          <div className="floating-card card-two">
            <span>🧠</span>
            <h4>AI Score Insights</h4>
            <p>Understand each 0-5 score with keywords and rationale.</p>
          </div>
          <div className="floating-orb orb-one" />
          <div className="floating-orb orb-two" />
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section className="features">
        <h2>Why candidates choose VisionHire</h2>
        <div className="feature-grid">
          {highlightFeatures.map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-icon">{f.icon}</span>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section className="how-it-works">
        <h2>The VisionHire flow</h2>
        <div className="how-row">
          {howSteps.map((s) => (
            <div key={s.label} className="how-card">
              <strong>{s.label}</strong>
              <p>{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA banner ─────────────────────────────────────────────── */}
      <section className="cta-banner">
        <div className="cta-copy">
          <h3>Ready to rehearse your next big opportunity?</h3>
          <p>
            Join thousands of engineers who rely on VisionHire to sharpen their skills and walk into
            interviews with confidence.
          </p>
        </div>
        <a href={isLoggedIn ? '/interview' : '/register'} className="cta-button banner">
          {isLoggedIn ? 'New Session' : 'Begin for Free'}
        </a>
      </section>
    </div>
  );
}

export default Home;
