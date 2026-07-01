import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadResume } from '../services/api';
import '../assets/styles/Interview.css';

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function fileSizeLabel(bytes) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function Interview() {
  const [resume,    setResume]    = useState(null);
  const [dragging,  setDragging]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [error,     setError]     = useState('');
  const fileRef = useRef(null);
  const navigate = useNavigate();

  // ── File selection ─────────────────────────────────────────────
  const selectFile = (file) => {
    setError('');
    setUploadMsg('');
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only PDF, DOC, or DOCX files are accepted.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File must be under 10 MB.');
      return;
    }
    setResume(file);
  };

  const handleFileInput = (e) => selectFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    selectFile(e.dataTransfer.files[0]);
  };

  // ── Continue ───────────────────────────────────────────────────
  const handleContinue = async () => {
    if (!resume) {
      setError('Please upload your resume before continuing.');
      return;
    }

    setUploading(true);
    setError('');
    setUploadMsg('Parsing your resume…');

    const result = await uploadResume(resume);

    if (result?.resumeText) {
      sessionStorage.setItem('hirefriend-resume-text', result.resumeText);
      setUploadMsg(`Resume parsed — ${result.wordCount} words extracted. ✅`);
      setTimeout(() => navigate('/guidelines'), 700);
    } else {
      // Parsing failed — still allow them to continue without personalisation
      sessionStorage.removeItem('hirefriend-resume-text');
      setUploadMsg('Could not parse resume — continuing without personalisation.');
      setTimeout(() => navigate('/guidelines'), 1200);
    }

    setUploading(false);
  };

  const removeFile = () => {
    setResume(null);
    setUploadMsg('');
    setError('');
    sessionStorage.removeItem('hirefriend-resume-text');
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="interview-page page-shell">
      <div className="page-glow one" />
      <div className="page-glow two" />

      <div className="interview-container">
        {/* ── Heading ─────────────────────────────────────────── */}
        <div className="interview-header">
          <span className="tag-pill">Step 1 of 3</span>
          <h1>Upload your resume</h1>
          <p className="interview-subtext">
            HireFriend reads your experience, skills, and projects to generate questions that
            match your actual background — not just generic ones.
          </p>
        </div>

        {/* ── Drop zone ───────────────────────────────────────── */}
        <div
          className={`upload-zone glass-surface${dragging ? ' dragging' : ''}${resume ? ' has-file' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !resume && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />

          {!resume ? (
            <>
              <span className="upload-icon">📄</span>
              <p className="upload-primary">
                {dragging ? 'Drop it here!' : 'Drag & drop your resume or click to browse'}
              </p>
              <p className="upload-secondary">PDF, DOC, or DOCX · max 10 MB</p>
            </>
          ) : (
            <div className="file-info">
              <span className="file-icon">✅</span>
              <div className="file-meta">
                <p className="file-name">{resume.name}</p>
                <p className="file-size">{fileSizeLabel(resume.size)}</p>
              </div>
              <button
                className="file-remove"
                onClick={(e) => { e.stopPropagation(); removeFile(); }}
                title="Remove file"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        {/* ── Status messages ──────────────────────────────────── */}
        {error     && <p className="upload-error">{error}</p>}
        {uploadMsg && <p className="upload-status">{uploadMsg}</p>}

        {/* ── Actions ─────────────────────────────────────────── */}
        <div className="interview-actions">
          <button
            className="cta-button primary"
            onClick={handleContinue}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : 'Continue →'}
          </button>
        </div>

        {/* ── Feature highlights ───────────────────────────────── */}
        <div className="upload-features">
          {[
            { icon: '🔒', text: 'Your resume is never stored permanently' },
            { icon: '🎯', text: 'Questions adapt to your projects and tech stack' },
            { icon: '⚡', text: 'Text is extracted in seconds' },
          ].map((f) => (
            <div key={f.text} className="upload-feature">
              <span>{f.icon}</span>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Interview;
