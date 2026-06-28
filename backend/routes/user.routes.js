import express from 'express';
import Interview from '../models/Interview.js';

const router = express.Router();

// ── GET /api/user/stats ─────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const userId    = req.user.userId;
    const interviews = await Interview.find({ user: userId }).lean();

    if (!interviews.length) {
      return res.json({
        totalSessions: 0, avgScore: 0, bestScore: 0,
        topDomain: null, recentActivity: [],
      });
    }

    const totalSessions = interviews.length;

    const pcts = interviews.map((iv) => {
      const max = (iv.metadata?.maxQuestions || 15) * 5;
      return max > 0 ? (iv.score / max) * 100 : 0;
    });
    const avgScore  = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
    const bestScore = Math.round(Math.max(...pcts));

    const domainCount = {};
    interviews.forEach((iv) => {
      const d = iv.metadata?.domainLabel || 'General';
      domainCount[d] = (domainCount[d] || 0) + 1;
    });
    const topDomain = Object.entries(domainCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    const recentActivity = interviews
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map((iv) => ({
        id:         iv._id,
        domain:     iv.metadata?.domainLabel || 'General',
        difficulty: iv.metadata?.difficulty  || 'Easy',
        score:      iv.score,
        maxScore:   (iv.metadata?.maxQuestions || 15) * 5,
        date:       iv.date,
      }));

    res.json({ totalSessions, avgScore, bestScore, topDomain, recentActivity });
  } catch (err) {
    console.error('GET /stats error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/user/interviews?page=1&limit=10 ────────────────────────────────
router.get('/interviews', async (req, res) => {
  try {
    const userId = req.user.userId;
    const page   = Math.max(1, parseInt(req.query.page)  || 1);
    const limit  = Math.min(20, parseInt(req.query.limit) || 10);
    const skip   = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      Interview.countDocuments({ user: userId }),
      Interview.find({ user: userId })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const interviews = docs.map((iv) => ({
      id:                iv._id,
      domain:            iv.metadata?.domainLabel || iv.metadata?.domain || 'General',
      difficulty:        iv.metadata?.difficulty  || 'Easy',
      score:             iv.score,
      maxScore:          (iv.metadata?.maxQuestions || 15) * 5,
      questionsAnswered: iv.questionsAsked,
      resumeUsed:        iv.metadata?.resumeUsed || false,
      date:              iv.date,
    }));

    res.json({ interviews, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('GET /interviews error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
