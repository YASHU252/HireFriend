import { getApiUrl } from '../config/api.js';

// ── Auth header helper ──────────────────────────────────────────────────────
function authHeaders(extra = {}) {
  const token = localStorage.getItem('token');
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

// ── Auth ────────────────────────────────────────────────────────────────────
export const registerUser = async (name, email, password) => {
  const res = await fetch(getApiUrl('/api/auth/register'), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ name, email, password }),
  });
  return res.json();
};

export const loginUser = async (email, password) => {
  const res = await fetch(getApiUrl('/api/auth/login'), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, password }),
  });
  return res.json();
};

export const getMe = async () => {
  try {
    const res = await fetch(getApiUrl('/api/auth/me'), {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

// ── User / Dashboard ─────────────────────────────────────────────────────────
export const getUserStats = async () => {
  try {
    const res = await fetch(getApiUrl('/api/user/stats'), {
      headers: authHeaders(),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

export const getPastInterviews = async (page = 1, limit = 10) => {
  try {
    const res = await fetch(
      getApiUrl(`/api/user/interviews?page=${page}&limit=${limit}`),
      { headers: authHeaders() },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

// ── Resume ───────────────────────────────────────────────────────────────────
export const uploadResume = async (file) => {
  try {
    const formData = new FormData();
    formData.append('resume', file);
    const res = await fetch(getApiUrl('/api/interview/upload-resume'), {
      method:  'POST',
      headers: authHeaders(), // no Content-Type — browser sets multipart boundary
      body:    formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data; // { resumeText, wordCount }
  } catch (err) {
    console.error('uploadResume:', err.message);
    return null;
  }
};

// ── Interview session ────────────────────────────────────────────────────────
export const startInterview = async ({ domain, difficulty, resumeText }) => {
  const res = await fetch(getApiUrl('/api/interview/start-stream'), {
    method:  'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body:    JSON.stringify({ domain, difficulty, resumeText }),
  });
  return res.json();
};

export const sendAnswer = async ({ interviewId, answer }) => {
  const res = await fetch(getApiUrl('/api/interview/sendAnswer-stream'), {
    method:  'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body:    JSON.stringify({ interviewId, answer }),
  });
  return res.json();
};

export const getInterviewResult = async (interviewId) => {
  const res = await fetch(getApiUrl(`/api/interview/${interviewId}`), {
    headers: authHeaders(),
  });
  return res.json();
};
