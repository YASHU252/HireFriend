import '../assets/styles/Result.css';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchInterviewResult } from '../services/api';

const MAX_POSSIBLE_QUESTIONS = 15;

const DOMAIN_LABELS = {
  'full stack web development': 'Full Stack Web Development',
  'data structures': 'Data Structures',
  'computer networks': 'Computer Networks',
  'operating systems': 'Operating Systems',
  'database management systems': 'Database Management Systems',
  'object oriented programming': 'Object Oriented Programming',
};

function Result({ darkMode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const message = location.state?.message || '';

  const storeInterviewId = (id) => {
    if (!id) return;
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('visionhire-last-interview-id', id);
      }
    } catch (err) {
      console.warn('Unable to persist interview id:', err);
    }
  };

  const readStoredInterviewId = () => {
    try {
      if (typeof window === 'undefined') return null;
      return sessionStorage.getItem('visionhire-last-interview-id');
    } catch (err) {
      console.warn('Unable to read stored interview id:', err);
      return null;
    }
  };

  const interviewId = useMemo(() => {
    const fromState = location.state?.interviewId;
    if (fromState) {
      storeInterviewId(fromState);
      return fromState;
    }
    return readStoredInterviewId();
  }, [location.state]);

  useEffect(() => {
    async function loadResult() {
      if (!interviewId) {
        setError('Interview summary unavailable. Please restart the interview.');
        setLoading(false);
        return;
      }

      setLoading(true);
      const data = await fetchInterviewResult(interviewId);
      if (!data) {
        setError('Unable to load interview summary right now. Try again later.');
      } else {
        setSummary(data);
      }
      setLoading(false);
    }

    loadResult();
  }, [interviewId]);

  const handleReturnHome = () => {
    navigate('/');
  };

  const history = summary?.history || [];
  const score = summary?.score ?? 0;
  const maxScore = summary?.maxScore ?? history.length * 5;
  const questionsAnswered = summary?.questionsAnswered ?? history.length;
  const totalPlannedQuestions = summary?.metadata?.maxQuestions || MAX_POSSIBLE_QUESTIONS;
  const totalAwarded = Number.isFinite(Number(score)) ? Number(score) : 0;
  const scoreDisplay = loading ? '—' : totalAwarded.toFixed(1).replace(/\.0$/, '');
  const fallbackDomain = location.state?.domain;
  const fallbackDomainLabel = location.state?.domainLabel;
  const metadataDomain = summary?.metadata?.domain;
  const metadataDomainLabel = summary?.metadata?.domainLabel;
  const resolvedDomainLabel =
    metadataDomainLabel ||
    (metadataDomain && DOMAIN_LABELS[metadataDomain]) ||
    fallbackDomainLabel ||
    (fallbackDomain && DOMAIN_LABELS[fallbackDomain]) ||
    fallbackDomain ||
    null;

  return (
    <div className={`page-shell result-page ${darkMode ? 'dark' : ''}`}>
      <div className="page-glow one" />
      <div className="page-glow two" />
      <div className="page-content">
        <header className="result-header">
          <span className="tag-pill">Session recap</span>
          <h1>
            Interview <span>results</span>
          </h1>
          <p>
            {message ||
              'Here is the breakdown of your latest VisionHire session with AI score rationales and per-question insights.'}
          </p>
        </header>

        <div className="result-summary glass-surface">
          <div className="score-section">
            <h3>Total score</h3>
            <p className="score">{scoreDisplay}</p>
            <p className="out-of">out of {loading ? '—' : maxScore}</p>
            {!loading && !error && resolvedDomainLabel && (
              <p className="result-domain">Domain: {resolvedDomainLabel}</p>
            )}
            {!loading && !error && (
              <p className="questions-answered">
                Evaluated answers: {questionsAnswered} / {totalPlannedQuestions}
              </p>
            )}
          </div>

          <div className="analysis-section">
            <h3>Answer review</h3>
            {loading && <p>Compiling your responses…</p>}
            {!loading && error && <p className="error-text">{error}</p>}
            {!loading && !error && history.length === 0 && (
              <p>No answers recorded for this interview.</p>
            )}
            {!loading && !error && history.length > 0 && (
              <div className="qa-list">
                {history.map((entry, index) => (
                  <div key={`${entry.question}-${index}`} className="qa-item glass-surface">
                    <p className="qa-question">
                      <span>Q{index + 1}.</span> {entry.question || '—'}
                    </p>
                    <p className="qa-answer">
                      <span>Answer:</span> {entry.answer ? entry.answer : 'No answer provided.'}
                    </p>
                    <p className="qa-score">
                      <span>Score:</span>{' '}
                      {Number.isFinite(Number(entry.score))
                        ? `${Number(entry.score).toFixed(1).replace(/\.0$/, '')}/${entry.maxScore ?? 5}`
                        : 'Pending'}
                      {entry.scoreReason && (
                        <span className="qa-score-reason"> — {entry.scoreReason}</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <footer className="result-footer">
          <button className="cta-button ghost" onClick={handleReturnHome}>
            Return to home
          </button>
          <a href="/interview-start" className="cta-button primary">
            Start another interview
          </a>
        </footer>
      </div>
    </div>
  );
}

export default Result;
