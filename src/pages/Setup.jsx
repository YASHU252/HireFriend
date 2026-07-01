import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/styles/Setup.css';

const DOMAINS = [
  { value: 'full stack web development',    label: 'Full Stack Web Dev',  icon: '🌐' },
  { value: 'data structures',               label: 'Data Structures',     icon: '🌳' },
  { value: 'computer networks',             label: 'Computer Networks',   icon: '🔌' },
  { value: 'operating systems',             label: 'Operating Systems',   icon: '⚙️' },
  { value: 'database management systems',   label: 'DBMS',                icon: '🗄️' },
  { value: 'object oriented programming',   label: 'OOP',                 icon: '📦' },
];

const DIFFICULTIES = [
  {
    value: 'easy',
    label: 'Easy',
    emoji: '🌱',
    desc: 'Entry-level — fundamentals and core concepts.',
  },
  {
    value: 'medium',
    label: 'Medium',
    emoji: '🔥',
    desc: 'Intermediate — practical, scenario-based questions.',
  },
  {
    value: 'hard',
    label: 'Hard',
    emoji: '💀',
    desc: 'Advanced — senior-level, edge cases and design decisions.',
  },
];

function Setup() {
  const [selectedDomain,     setSelectedDomain]     = useState('full stack web development');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [camOk,  setCamOk]  = useState(false);
  const [micOk,  setMicOk]  = useState(false);
  const [camErr, setCamErr] = useState('');
  const [micErr, setMicErr] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const navigate = useNavigate();

  // ── Clean up camera stream on unmount ──────────────────────────
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Camera permission ──────────────────────────────────────────
  const checkCamera = async () => {
    setCamErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCamOk(true);
    } catch {
      setCamErr('Camera access denied. Please allow camera access in your browser settings.');
      setCamOk(false);
    }
  };

  // ── Mic permission ─────────────────────────────────────────────
  const checkMic = async () => {
    setMicErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop()); // we only need the permission
      setMicOk(true);
    } catch {
      setMicErr('Microphone access denied. Enable it in browser settings to use voice input.');
      setMicOk(false);
    }
  };

  const canProceed = camOk && micOk;

  const handleStart = () => {
    if (!canProceed) return;
    // Stop the preview stream — InterviewStart will open its own
    streamRef.current?.getTracks().forEach((t) => t.stop());
    sessionStorage.setItem('hirefriend-domain',     selectedDomain);
    sessionStorage.setItem('hirefriend-difficulty', selectedDifficulty);
    navigate('/interview-start', {
      state: { domain: selectedDomain, difficulty: selectedDifficulty },
    });
  };

  return (
    <div className="setup-page page-shell">
      <div className="page-glow one" />
      <div className="page-glow two" />

      <div className="setup-container">
        <div className="setup-header">
          <span className="setup-pill">Step 3 of 3</span>
          <h1>Configure your session</h1>
          <p className="setup-sub">Choose a domain, pick your difficulty, then verify camera and mic.</p>
        </div>

        {/* ── Domain ────────────────────────────────────────────── */}
        <section className="setup-section">
          <h2 className="setup-section-title">Interview Domain</h2>
          <div className="domain-grid">
            {DOMAINS.map((d) => (
              <button
                key={d.value}
                className={`domain-card${selectedDomain === d.value ? ' selected' : ''}`}
                onClick={() => setSelectedDomain(d.value)}
              >
                <span className="domain-icon">{d.icon}</span>
                <span className="domain-label">{d.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Difficulty ────────────────────────────────────────── */}
        <section className="setup-section">
          <h2 className="setup-section-title">Difficulty Level</h2>
          <div className="difficulty-row">
            {DIFFICULTIES.map((dif) => (
              <button
                key={dif.value}
                className={`difficulty-card${selectedDifficulty === dif.value ? ' selected' : ''}`}
                onClick={() => setSelectedDifficulty(dif.value)}
              >
                <span className="diff-emoji">{dif.emoji}</span>
                <span className="diff-label">{dif.label}</span>
                <span className="diff-desc">{dif.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Device check ──────────────────────────────────────── */}
        <section className="setup-section">
          <h2 className="setup-section-title">Device Check</h2>
          <div className="device-row">

            {/* Camera */}
            <div className={`device-card${camOk ? ' ok' : ''}`}>
              <div className="device-top">
                <span className="device-icon">{camOk ? '✅' : '📷'}</span>
                <div>
                  <p className="device-name">Camera</p>
                  <p className="device-status">{camOk ? 'Access granted' : 'Not tested'}</p>
                </div>
                <button
                  className={`device-btn${camOk ? ' granted' : ''}`}
                  onClick={checkCamera}
                >
                  {camOk ? 'Re-test' : 'Allow Camera'}
                </button>
              </div>
              {camOk && (
                <video
                  ref={videoRef}
                  className="cam-preview"
                  autoPlay
                  muted
                  playsInline
                />
              )}
              {camErr && <p className="device-err">{camErr}</p>}
            </div>

            {/* Microphone */}
            <div className={`device-card${micOk ? ' ok' : ''}`}>
              <div className="device-top">
                <span className="device-icon">{micOk ? '✅' : '🎙️'}</span>
                <div>
                  <p className="device-name">Microphone</p>
                  <p className="device-status">{micOk ? 'Access granted' : 'Not tested'}</p>
                </div>
                <button
                  className={`device-btn${micOk ? ' granted' : ''}`}
                  onClick={checkMic}
                >
                  {micOk ? 'Re-test' : 'Allow Mic'}
                </button>
              </div>
              {micErr && <p className="device-err">{micErr}</p>}
            </div>
          </div>
        </section>

        {/* ── Start ─────────────────────────────────────────────── */}
        <div className="setup-footer">
          {!canProceed && (
            <p className="setup-hint">
              Grant both camera and microphone access to proceed.
            </p>
          )}
          <button
            className={`cta-button primary${!canProceed ? ' disabled' : ''}`}
            onClick={handleStart}
            disabled={!canProceed}
          >
            Launch Interview →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Setup;
