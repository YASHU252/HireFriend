import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserStats, getPastInterviews } from '../services/api';
import '../assets/styles/HomeProfile.css';

function pct(score, maxScore) {
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}

function scoreBadgeClass(p) {
  if (p >= 80) return 'badge green';
  if (p >= 50) return 'badge yellow';
  return 'badge red';
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

const DOMAIN_ICONS = {
  'Full Stack Web Development':  '🌐',
  'Data Structures':             '🌳',
  'Computer Networks':           '🔌',
  'Operating Systems':           '⚙️',
  'Database Management Systems': '🗄️',
  'Object Oriented Programming': '📦',
};

function domainIcon(label) {
  return DOMAIN_ICONS[label] || '💡';
}

export default function HomeProfile() {
  const [stats,      setStats]      = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [page,       setPage]       = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [ivLoading,  setIvLoading]  = useState(false);
  const navigate = useNavigate();

  const userName = localStorage.getItem('userName') || 'Candidate';
  const firstName = userName.split(' ')[0];

  // ── Load stats once ────────────────────────────────────────────
  useEffect(() => {
    getUserStats().then((data) => {
      if (data) setStats(data);
      setLoading(false);
    });
  }, []);

  // ── Load paginated history ─────────────────────────────────────
  const loadInterviews = useCallback(async (p) => {
    setIvLoading(true);
    const data = await getPastInterviews(p, 8);
    if (data) {
      setInterviews(data.interviews || []);
      setTotalPages(data.pages || 1);
    }
    setIvLoading(false);
  }, []);

  useEffect(() => {
    loadInterviews(page);
  }, [page, loadInterviews]);

  // ── Stat tiles ─────────────────────────────────────────────────
  const statTiles = stats
    ? [
        { icon: '🎯', label: 'Sessions',   value: stats.totalSessions },
        { icon: '📈', label: 'Avg Score',  value: `${stats.avgScore}%` },
        { icon: '🏆', label: 'Best Score', value: `${stats.bestScore}%` },
        { icon: '🔬', label: 'Top Domain', value: stats.topDomain || '—', small: true },
      ]
    : [];

  if (loading) {
    return (
      <div className="dashboard-shell">
        <div className="dash-loader">
          <div className="loader-ring" />
          <p>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-shell">
      <div className="dash-glow one" />
      <div className="dash-glow two" />

      <div className="dashboard-content">

        {/* ── Welcome ─────────────────────────────────────────── */}
        <header className="dash-header">
          <div>
            <span className="dash-pill">Your dashboard</span>
            <h1>
              Welcome back, <span className="dash-name">{firstName}</span> 👋
            </h1>
            <p className="dash-sub">
              Track your progress, review past sessions, and jump back in anytime.
            </p>
          </div>
          <button
            className="dash-cta-btn"
            onClick={() => navigate('/interview')}
          >
            ＋ New Interview
          </button>
        </header>

        {/* ── Stat tiles ──────────────────────────────────────── */}
        {stats && (
          <section className="stats-row">
            {statTiles.map((t) => (
              <div key={t.label} className="stat-tile dash-glass">
                <span className="stat-tile-icon">{t.icon}</span>
                <p className="stat-tile-label">{t.label}</p>
                <p className={`stat-tile-value${t.small ? ' small' : ''}`}>{t.value}</p>
              </div>
            ))}
          </section>
        )}

        {/* ── Quick-start if no sessions ───────────────────────── */}
        {stats?.totalSessions === 0 && (
          <section className="empty-state dash-glass">
            <span className="empty-icon">🚀</span>
            <h2>Run your first interview</h2>
            <p>
              Upload your resume, pick a domain and difficulty, and HireFriend will
              generate a personalised mock session powered by Gemini AI.
            </p>
            <button className="dash-cta-btn" onClick={() => navigate('/interview')}>
              Start now →
            </button>
          </section>
        )}

        {/* ── Recent Activity ──────────────────────────────────── */}
        {stats?.recentActivity?.length > 0 && (
          <section className="recent-section">
            <h2 className="section-title">Recent Activity</h2>
            <div className="recent-row">
              {stats.recentActivity.map((iv) => {
                const p = pct(iv.score, iv.maxScore);
                return (
                  <div key={String(iv.id)} className="recent-card dash-glass">
                    <span className="recent-domain-icon">{domainIcon(iv.domain)}</span>
                    <p className="recent-domain">{iv.domain}</p>
                    <p className="recent-diff">{iv.difficulty || 'Easy'}</p>
                    <p className={scoreBadgeClass(p)}>{p}%</p>
                    <p className="recent-date">{formatDate(iv.date)}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Full Interview History ────────────────────────────── */}
        {interviews.length > 0 && (
          <section className="history-section">
            <h2 className="section-title">All Interviews</h2>

            {ivLoading ? (
              <div className="iv-loading">Loading…</div>
            ) : (
              <div className="history-table dash-glass">
                <div className="ht-head">
                  <span>Domain</span>
                  <span>Difficulty</span>
                  <span>Questions</span>
                  <span>Score</span>
                  <span>Resume</span>
                  <span>Date</span>
                </div>

                {interviews.map((iv) => {
                  const p = pct(iv.score, iv.maxScore);
                  return (
                    <div key={String(iv.id)} className="ht-row">
                      <span className="ht-domain">
                        <span className="ht-icon">{domainIcon(iv.domain)}</span>
                        {iv.domain}
                      </span>
                      <span className="ht-diff">{iv.difficulty || 'Easy'}</span>
                      <span>{iv.questionsAnswered}</span>
                      <span>
                        <span className={scoreBadgeClass(p)}>{p}%</span>
                        <span className="ht-raw"> ({iv.score}/{iv.maxScore})</span>
                      </span>
                      <span>{iv.resumeUsed ? '✅' : '—'}</span>
                      <span className="ht-date">{formatDate(iv.date)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                <span className="page-label">Page {page} of {totalPages}</span>
                <button
                  className="page-btn"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
