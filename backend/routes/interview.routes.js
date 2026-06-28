import express from 'express';
import interviewController from '../controllers/interviewController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// ── Resume ───────────────────────────────────────────────────────────────────
router.post('/upload-resume', upload.single('resume'), interviewController.uploadResume);

// ── Session ──────────────────────────────────────────────────────────────────
router.post('/start-stream',       interviewController.startInterviewStream);
router.post('/sendAnswer-stream',  interviewController.sendAnswerStream);

// ── Backward-compat aliases (keep old callers working) ───────────────────────
router.post('/start',       interviewController.startInterviewStream);
router.post('/sendAnswer',  interviewController.sendAnswerStream);
router.post('/answer',      interviewController.sendAnswerStream);

// ── Result — must be last to avoid catching other paths ──────────────────────
router.get('/:interviewId', interviewController.getInterviewResult);

export default router;
