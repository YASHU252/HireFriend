import '../assets/styles/Guidelines.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Guidelines({ darkMode }) {
  const [agreed, setAgreed] = useState(false);
  const navigate = useNavigate();

  const integrityPoints = [
    'No external help—complete the session independently.',
    'Avoid switching tabs or applications during questions.',
    'Do not use AI tools or copy/paste responses from elsewhere.',
  ];

  const recordingPoints = [
    'Video and audio are captured for feedback accuracy.',
    'Speech is transcribed to analyse keywords and depth.',
    'Recordings stay private and are used only for assessment.',
  ];

  const technicalPoints = [
    'Ensure a stable internet connection and quiet setting.',
    'Test your camera and microphone before proceeding.',
    'Close heavy background applications to prevent interruptions.',
  ];

  const handleBack = () => {
    navigate('/interview');
  };

  const handleProceed = () => {
    if (agreed) {
      navigate('/setup');
    } else {
      alert('Please agree to the guidelines before proceeding.');
    }
  };

  return (
    <div className={`page-shell guidelines-page ${darkMode ? 'dark' : ''}`}>
      <div className="page-glow one" />
      <div className="page-glow two" />
      <div className="page-content">
        <div className="guidelines-header">
          <span className="tag-pill">Step 2 · Interview expectations</span>
          <h1>
            Review the guidelines <span>before you begin</span>
          </h1>
          <p>
            We&apos;re committed to giving you an interview simulation that feels authentic and fair.
            Please read the key requirements below and acknowledge them to continue.
          </p>
        </div>

        <div className="guidelines-grid">
          <div className="guideline-card glass-surface">
            <div className="guideline-icon">🎥</div>
            <h3>Recording in progress</h3>
            <ul>
              {recordingPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>

          <div className="guideline-card glass-surface">
            <div className="guideline-icon">🛡️</div>
            <h3>Academic integrity</h3>
            <ul>
              {integrityPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>

          <div className="guideline-card glass-surface">
            <div className="guideline-icon">⚙️</div>
            <h3>Technical readiness</h3>
            <ul>
              {technicalPoints.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </div>
        </div>

        <label className="guidelines-agreement glass-surface">
          <input
            type="checkbox"
            checked={agreed}
            onChange={() => setAgreed((prev) => !prev)}
          />
          <span>
            I acknowledge that the interview will be recorded and agree to follow these guidelines to
            maintain fairness and integrity throughout the session.
          </span>
        </label>

        <div className="guidelines-actions">
          <button className="cta-button ghost" onClick={handleBack}>
            ← Back to resume upload
          </button>
          <button className="cta-button primary" onClick={handleProceed}>
            Proceed to setup
          </button>
        </div>
      </div>
    </div>
  );
}

export default Guidelines;
