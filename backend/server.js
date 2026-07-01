import './loadEnv.js'; // must be the first import — see file for why
import express from 'express';
import cors from 'cors';
import connectDB from './lib/db.js';
import authRoutes from './routes/auth.routes.js';
import interviewRoutes from './routes/interview.routes.js';
import userRoutes from './routes/user.routes.js';
import authMiddleware from './middleware/authMiddleware.js';

const app = express();

// ── Database ──────────────────────────────────────────
connectDB();

// ── Middleware ─────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Public routes ──────────────────────────────────────
app.use('/api/auth', authRoutes);

app.get('/api/interview/ping', (req, res) => {
  res.status(200).json({ message: 'Interview API is live 🚀' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Protected routes ───────────────────────────────────
app.use('/api/user', authMiddleware, userRoutes);
app.use('/api/interview', authMiddleware, interviewRoutes);

// ── Global error handler ───────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
