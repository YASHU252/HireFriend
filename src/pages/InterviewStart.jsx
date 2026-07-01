import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { startInterview, sendAnswer } from '../services/api';
import '../assets/styles/InterviewStart.css';

const MAX_QUESTIONS  = 15;
const TIME_PER_Q     = 60; // seconds

export default function InterviewStart() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // ── Session config from Setup ────────────────────────────────
  const domain = (
    location.state?.domain ||
    sessionStorage.getItem('hirefriend-domain') ||
    'full stack web development'
  );
  const difficulty = (
    location.state?.difficulty ||
    sessionStorage.getItem('hirefriend-difficulty') ||
    'medium'
  );
  const resumeText = sessionStorage.getItem('hirefriend-resume-text') || '';

  // ── State ────────────────────────────────────────────────────
  const [question,        setQuestion]        = useState('');
  const [answer,          setAnswer]          = useState('');
  const [interviewId,     setInterviewId]     = useState(null);
  const [questionsAsked,  setQuestionsAsked]  = useState(0);
  const [currentScore,    setCurrentScore]    = useState(null);
  const [currentReason,   setCurrentReason]   = useState('');
  const [currentKeywords, setCurrentKeywords] = useState([]);
  const [timer,           setTimer]           = useState(TIME_PER_Q);
  const [loading,         setLoading]         = useState(true);
  const [submitting,      setSubmitting]       = useState(false);
  const [listening,       setListening]        = useState(false);
  const [tabWarning,      setTabWarning]       = useState(0); // 0 | 1 | 2
  const [finished,        setFinished]         = useState(false);
  const [domainLabel,     setDomainLabel]      = useState('');

  // ── Refs ────────────────────────────────────────────────────
  const timerRef        = useRef(null);
  const recognitionRef  = useRef(null);
  const shouldListenRef = useRef(false);
  const accFinalRef     = useRef(''); // accumulated final transcript
  const lastInterimRef  = useRef(''); // last interim chunk
  const videoRef        = useRef(null);
  const cameraStreamRef = useRef(null);
  const answerRef       = useRef('');  // shadow for submit-on-timer
  const handleSubmitRef = useRef(null); // always points to the latest handleSubmit

  // Keep answerRef in sync with state
  useEffect(() => { answerRef.current = answer; }, [answer]);

  // ── Camera ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        cameraStreamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch {
        // Camera unavailable — non-blocking
      }
    })();
    return () => cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  // ── Anti-cheat: tab visibility ───────────────────────────────
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        setTabWarning((prev) => {
          const next = prev + 1;
          if (next >= 2) {
            // Force end interview — use ref so we always get the latest handleSubmit
            handleSubmitRef.current?.(true);
          }
          return next;
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Anti-cheat: keyboard shortcuts / right-click / copy ─────
  useEffect(() => {
    const blockKeys = (e) => {
      const blocked = (
        (e.ctrlKey && ['c', 'v', 'x', 'u', 'a'].includes(e.key.toLowerCase())) ||
        (e.metaKey && ['c', 'v', 'x', 'u', 'a'].includes(e.key.toLowerCase())) ||
        e.key === 'F12'
      );
      if (blocked) e.preventDefault();
    };
    const blockMenu = (e) => e.preventDefault();
    const blockCopy = (e) => e.preventDefault();

    document.addEventListener('keydown',     blockKeys);
    document.addEventListener('contextmenu', blockMenu);
    document.addEventListener('copy',        blockCopy);
    document.addEventListener('paste',       blockCopy);

    return () => {
      document.removeEventListener('keydown',     blockKeys);
      document.removeEventListener('contextmenu', blockMenu);
      document.removeEventListener('copy',        blockCopy);
      document.removeEventListener('paste',       blockCopy);
    };
  }, []);

  // ── Continuous speech recognition ────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.continuous    = true;
    recognition.interimResults = true;
    recognition.lang           = 'en-US';

    recognition.onstart = () => setListening(true);

    recognition.onend = () => {
      setListening(false);
      lastInterimRef.current = '';
      if (shouldListenRef.current) {
        setTimeout(() => {
          if (shouldListenRef.current) {
            try { recognitionRef.current?.start(); } catch {}
          }
        }, 150);
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted')   { setListening(false); shouldListenRef.current = false; return; }
      setListening(false);
      shouldListenRef.current = false;
    };

    recognition.onresult = (event) => {
      let newFinal  = '';
      let newInterim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript.trim();
        if (!text) continue;
        if (event.results[i].isFinal) newFinal  += text + ' ';
        else                          newInterim = text;
      }

      setAnswer((prev) => {
        // Strip last interim from the displayed text
        let base = prev;
        if (lastInterimRef.current) {
          const toStrip = lastInterimRef.current.trim();
          if (base.endsWith(toStrip)) base = base.slice(0, -toStrip.length).trimEnd();
        }

        if (newFinal.trim()) {
          accFinalRef.current  += newFinal;
          base                  = accFinalRef.current.trim();
          lastInterimRef.current = '';
        }

        if (newInterim) {
          lastInterimRef.current = newInterim;
          return base + (base ? ' ' : '') + newInterim;
        }
        return base;
      });
    };

    recognitionRef.current = recognition;
    return () => { shouldListenRef.current = false; try { recognition.stop(); } catch {} };
  }, []);

  const toggleVoice = () => {
    const r = recognitionRef.current;
    if (!r) { alert('Speech recognition not supported. Please use Chrome or Edge.'); return; }

    if (listening) {
      shouldListenRef.current = false;
      // Commit any pending interim
      if (lastInterimRef.current) {
        accFinalRef.current       += lastInterimRef.current + ' ';
        lastInterimRef.current     = '';
        setAnswer(accFinalRef.current.trim());
      }
      try { r.stop(); } catch {}
    } else {
      shouldListenRef.current  = true;
      accFinalRef.current      = answer.trim() + (answer.trim() ? ' ' : '');
      lastInterimRef.current   = '';
      try { r.start(); } catch { shouldListenRef.current = false; }
    }
  };

  // ── Timer ────────────────────────────────────────────────────
  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current);
    setTimer(TIME_PER_Q);
    timerRef.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmitRef.current?.(); // always the latest handleSubmit — no stale closure
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }, []); // safe — reads through ref, not closed-over state

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── handleSubmit ─────────────────────────────────────────────
  const handleSubmit = useCallback(async (forced = false) => {
    if (submitting || finished) return;
    setSubmitting(true);

    // Stop voice
    shouldListenRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}

    clearInterval(timerRef.current);
    setCurrentScore(null);
    setCurrentReason('');
    setCurrentKeywords([]);

    const currentAnswer = answerRef.current.trim();

    try {
      const data = await sendAnswer({ interviewId, answer: currentAnswer });

      if (data.finished || forced) {
        setFinished(true);
        cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
        navigate('/result', { state: { interviewId: data.interviewId || interviewId } });
        return;
      }

      // Show feedback briefly, then move to next question
      setCurrentScore(data.score ?? null);
      setCurrentReason(data.reason || '');
      setCurrentKeywords(data.keywords || []);
      setQuestionsAsked(data.questionsAsked);

      setTimeout(() => {
        setQuestion(data.question);
        setAnswer('');
        accFinalRef.current    = '';
        lastInterimRef.current = '';
        setCurrentScore(null);
        setCurrentReason('');
        setCurrentKeywords([]);
        setSubmitting(false);
        resetTimer();
      }, 2000);
    } catch {
      setSubmitting(false);
      resetTimer();
    }
  }, [submitting, finished, interviewId, navigate, resetTimer]);

  // Keep ref in sync with the latest memoised handleSubmit on every render
  handleSubmitRef.current = handleSubmit;

  // ── Start interview ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const data = await startInterview({ domain, difficulty, resumeText });
        if (data?.interviewId) {
          setInterviewId(data.interviewId);
          setQuestion(data.question);
          setQuestionsAsked(1);
          setDomainLabel(data.domainLabel || domain);
          setLoading(false);
          resetTimer();
        } else {
          alert('Could not start interview. Please try again.');
          navigate('/setup');
        }
      } catch {
        alert('Network error. Please try again.');
        navigate('/setup');
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived UI ────────────────────────────────────────────────
  const progress  = Math.round((questionsAsked / MAX_QUESTIONS) * 100);
  const timerPct  = (timer / TIME_PER_Q) * 100;
  const timerWarn = timer <= 10;

  const diffLabel = (() => {
    const d = difficulty.toLowerCase();
    if (d === 'hard')   return { text: 'Hard',   cls: 'diff-hard' };
    if (d === 'medium') return { text: 'Medium', cls: 'diff-medium' };
    return                     { text: 'Easy',   cls: 'diff-easy' };
  })();

  if (loading) {
    return (
      <div className="is-loading-screen">
        <div className="loader-ring" />
        <p>Starting your interview…</p>
        <span className="load-sub">Gemini is crafting your first question</span>
      </div>
    );
  }

  return (
    <div className="interview-room">

      {/* ── Tab warning banner ──────────────────────────────── */}
      {tabWarning === 1 && (
        <div className="tab-warning">
          ⚠️ Tab switch detected! One more and your interview will be terminated.
        </div>
      )}

      {/* ── Top bar ────────────────────────────────────────── */}
      <div className="room-topbar">
        <div className="topbar-brand">
          <span>🌌</span> HireFriend
          <span className="topbar-domain">{domainLabel}</span>
          <span className={`topbar-diff ${diffLabel.cls}`}>{diffLabel.text}</span>
        </div>
        <div className="topbar-meta">
          <span className="topbar-q">Q {questionsAsked} / {MAX_QUESTIONS}</span>
          {resumeText && <span className="topbar-resume-tag">📄 Resume on</span>}
        </div>
      </div>

      {/* ── Progress bar ───────────────────────────────────── */}
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* ── Main layout ────────────────────────────────────── */}
      <div className="room-body">

        {/* Left — question + answer ────────────────────────── */}
        <div className="room-left">

          {/* Timer ring */}
          <div className={`timer-ring${timerWarn ? ' warn' : ''}`}>
            <svg viewBox="0 0 100 100">
              <circle className="ring-bg" cx="50" cy="50" r="44" />
              <circle
                className="ring-fill"
                cx="50" cy="50" r="44"
                strokeDasharray={`${timerPct * 2.76} 276`}
              />
            </svg>
            <span className={`timer-text${timerWarn ? ' warn' : ''}`}>{timer}s</span>
          </div>

          {/* Question card */}
          <div className="question-card">
            {currentScore !== null ? (
              <div className="feedback-overlay">
                <p className="feedback-score">Score: {currentScore}/5</p>
                <p className="feedback-reason">{currentReason}</p>
                {currentKeywords.length > 0 && (
                  <div className="feedback-keywords">
                    {currentKeywords.map((kw) => (
                      <span key={kw} className="kw-chip">{kw}</span>
                    ))}
                  </div>
                )}
                <p className="feedback-next">Next question loading…</p>
              </div>
            ) : (
              <p className="question-text">{question}</p>
            )}
          </div>

          {/* Answer textarea */}
          <div className="answer-wrap">
            <textarea
              className="answer-box"
              placeholder={listening ? '🎙 Listening… speak your answer' : 'Type or use voice to answer…'}
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                accFinalRef.current = e.target.value;
              }}
              disabled={submitting || currentScore !== null}
            />
            <span className="char-count">{answer.length} chars</span>
          </div>

          {/* Controls */}
          <div className="room-controls">
            <button
              className={`voice-btn${listening ? ' active' : ''}`}
              onClick={toggleVoice}
              disabled={submitting || currentScore !== null}
            >
              {listening ? '⏹ Stop Voice' : '🎙 Start Voice'}
            </button>

            <button
              className="submit-btn"
              onClick={() => handleSubmit(false)}
              disabled={submitting || currentScore !== null || !answer.trim()}
            >
              {submitting ? 'Submitting…' : 'Submit Answer →'}
            </button>
          </div>
        </div>

        {/* Right — camera + tips ───────────────────────────── */}
        <div className="room-right">
          <div className="camera-panel">
            <video
              ref={videoRef}
              className="camera-feed"
              autoPlay
              muted
              playsInline
            />
            <div className="camera-label">
              <span className="rec-dot" />
              Live
            </div>
          </div>

          <div className="tips-panel">
            <p className="tips-title">Tips</p>
            <ul className="tips-list">
              <li>Stay focused on this tab — switches are logged</li>
              <li>Speak clearly; pause before switching topics</li>
              <li>Use examples and numbers where possible</li>
              <li>Submit before the timer hits zero</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
