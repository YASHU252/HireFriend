# 🌌 HireFriend — AI Interview Platform

An end-to-end AI mock interview platform. Upload your resume, pick a domain and difficulty, answer questions via voice or keyboard, and get per-question Gemini-powered scores and rationales instantly.

---

## Tech Stack

| Layer       | Tech |
|-------------|------|
| Frontend    | React 19, Vite 7, React Router 7 |
| Backend     | Node.js, Express 5, MongoDB/Mongoose |
| AI          | Google Gemini 1.5 Flash |
| Auth        | JWT (bcrypt + jsonwebtoken) |
| Resume Parse| pdf-parse + mammoth |
| File Upload | multer (in-memory) |

---

## Prerequisites

- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key → https://aistudio.google.com/app/apikey

---

## Setup

### 1 — Backend

```bash
cd HireFriend/backend
npm install
cp .env.example .env
# Fill in MONGO_URI, GEMINI_API_KEY, JWT_SECRET in .env
npm run dev
# Server starts on http://localhost:5000
```

### 2 — Frontend

```bash
cd HireFriend
npm install
npm run dev
# App starts on http://localhost:5173
```

---

## Environment Variables (backend/.env)

| Variable       | Description |
|----------------|-------------|
| `MONGO_URI`    | MongoDB connection string |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `GEMINI_MODEL` | `gemini-1.5-flash` (default) |
| `JWT_SECRET`   | Long random string for signing tokens |
| `PORT`         | Express port (default 5000) |
| `CLIENT_URL`   | Frontend origin for CORS (default http://localhost:5173) |

---

## Features (all implemented)

- ✅ Register / Login with JWT auth
- ✅ Auth guards on all protected routes
- ✅ Resume upload (PDF / DOC / DOCX) → text extraction → Gemini personalisation
- ✅ 6 domains × 3 difficulty levels (Easy / Medium / Hard)
- ✅ Continuous voice recognition (Chrome/Edge) with interim text display
- ✅ 60-second countdown timer per question with auto-submit
- ✅ Follow-up question logic (max 2 follow-ups per topic, then pivot)
- ✅ Anti-cheat: tab-switch detection (2 strikes = auto-terminate), copy/paste/context-menu blocked
- ✅ Live camera feed with mirrored preview
- ✅ Per-question AI score (0–5), reason, and keyword highlights
- ✅ Full results page with history
- ✅ Dashboard with stats (sessions, avg score, best score, top domain) and paginated history
- ✅ Shared Navbar with logout
- ✅ Dark/light theme support

---

## Project Structure

```
HireFriend/
├── backend/
│   ├── controllers/
│   │   ├── authController.js       # register, login, getMe
│   │   └── interviewController.js  # upload-resume, start, answer, result
│   ├── lib/db.js                   # MongoDB connection
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT verification
│   │   └── upload.js               # multer (memory storage)
│   ├── models/
│   │   ├── Interview.js            # schema with metadata.difficulty, resumeUsed
│   │   └── User.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── interview.routes.js
│   │   └── user.routes.js          # /stats, /interviews (paginated)
│   ├── utils/resumeParser.js       # pdf-parse + mammoth
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── src/
    ├── components/
    │   ├── Navbar.jsx              # shared nav (hidden on auth + interview pages)
    │   └── ProtectedRoute.jsx      # redirects to /login if no token
    ├── pages/
    │   ├── Home.jsx               # landing page
    │   ├── Login.jsx
    │   ├── Register.jsx
    │   ├── HomeProfile.jsx        # dashboard (stats + history)
    │   ├── Interview.jsx          # Step 1: resume upload
    │   ├── Guidelines.jsx         # Step 2: rules + checklist
    │   ├── Setup.jsx              # Step 3: domain + difficulty + device check
    │   ├── InterviewStart.jsx     # live interview room
    │   └── Result.jsx             # post-interview scores
    ├── services/api.jsx            # all fetch calls
    ├── config/api.js               # base URL helper
    └── assets/styles/              # CSS per page + shared
```
