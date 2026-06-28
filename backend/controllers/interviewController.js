import Interview from '../models/Interview.js';
import User from '../models/User.js';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { parseResume } from '../utils/resumeParser.js';

dotenv.config();

// ── Config ──────────────────────────────────────────────────────────────────
const GEMINI_API_KEY      = (process.env.GEMINI_API_KEY || '').trim();
const GEMINI_MODEL        = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const INITIAL_QUESTION    = 'Tell me about yourself and your technical background.';
const MAX_QUESTIONS       = 15;
const PER_Q_MAX_SCORE     = 5;
const GEMINI_DELAY_MS     = 1500;

// ── Domain catalogue ────────────────────────────────────────────────────────
const AVAILABLE_DOMAINS = [
  { value: 'full stack web development',    label: 'Full Stack Web Development' },
  { value: 'data structures',               label: 'Data Structures' },
  { value: 'computer networks',             label: 'Computer Networks' },
  { value: 'operating systems',             label: 'Operating Systems' },
  { value: 'database management systems',   label: 'Database Management Systems' },
  { value: 'object oriented programming',   label: 'Object Oriented Programming' },
];

const DOMAIN_LOOKUP = new Map(AVAILABLE_DOMAINS.map((d) => [d.value, d]));

const DOMAIN_ALIASES = {
  'full stack development':    'full stack web development',
  'fullstack development':     'full stack web development',
  'fullstack web development': 'full stack web development',
  dbms:                        'database management systems',
  'database management system':'database management systems',
  oop:                         'object oriented programming',
  'operating system':          'operating systems',
  os:                          'operating systems',
  cn:                          'computer networks',
  networks:                    'computer networks',
  ds:                          'data structures',
};

// ── Difficulty catalogue ────────────────────────────────────────────────────
const DIFFICULTY_MAP = {
  easy:   { label: 'Easy',   prompt: 'basic, entry-level, suitable for freshers' },
  medium: { label: 'Medium', prompt: 'intermediate, requiring practical hands-on experience' },
  hard:   { label: 'Hard',   prompt: 'advanced, senior-level, covering edge cases and design decisions' },
};

// ── Gemini initialisation ───────────────────────────────────────────────────
let geminiModel          = null;
let lastGeminiCallAt     = 0;

if (GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    console.log('✅ Gemini model initialised:', GEMINI_MODEL);
  } catch (err) {
    console.error('❌ Gemini init failed:', err.message);
  }
} else {
  console.warn('⚠️  GEMINI_API_KEY not set — fallback questions only.');
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function resolveDomain(input) {
  if (!input) return AVAILABLE_DOMAINS[0];
  const key = String(input).trim().toLowerCase();
  return DOMAIN_LOOKUP.get(DOMAIN_ALIASES[key] || key) || AVAILABLE_DOMAINS[0];
}

function resolveDifficulty(input) {
  const key = String(input || 'medium').toLowerCase();
  return DIFFICULTY_MAP[key] || DIFFICULTY_MAP.medium;
}

async function throttle() {
  const wait = GEMINI_DELAY_MS - (Date.now() - lastGeminiCallAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

async function callGemini(prompt, retries = 3) {
  if (!geminiModel) return null;
  for (let i = 0; i < retries; i++) {
    await throttle();
    try {
      const result = await geminiModel.generateContent(prompt);
      lastGeminiCallAt = Date.now();
      const text = await result.response.text();
      if (text) return text.trim();
    } catch (err) {
      lastGeminiCallAt = Date.now();
      if (err.status === 429 || err.code === 429) {
        const wait = (i + 1) * 2500;
        console.warn(`[Gemini] 429 — waiting ${wait / 1000}s (attempt ${i + 1}/${retries})`);
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      console.error('[Gemini] error:', err.message);
      break;
    }
  }
  return null;
}

function extractQuestion(text = '') {
  if (!text) return '';
  const cleaned = text.replace(/\*\*/g, '').replace(/^["']|["']$/g, '').trim();
  const match   = cleaned.match(/[^.?!]*\?+/);
  return match ? match[0].trim() : cleaned.split('\n')[0].trim();
}

async function analyzeAnswer(answer, question) {
  const fallback = { keywords: [], score: 0, reason: '', followup: '' };
  if (!geminiModel) return fallback;

  const prompt = `You are a strict but fair technical interview evaluator.
Analyze this Q&A and return ONLY valid JSON with no markdown or explanation.

Question: "${question}"
Answer: "${answer || '(no answer given)'}"

Return exactly:
{
  "keywords": ["key", "concepts", "mentioned"],
  "score": <integer 0-5>,
  "reason": "<one concise sentence explaining the score>",
  "followup": "<one specific follow-up question on the same topic>"
}`;

  try {
    const text      = await callGemini(prompt);
    if (!text) return fallback;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords : [],
      score:    parsed.score ?? 0,
      reason:   parsed.reason  || '',
      followup: parsed.followup|| '',
    };
  } catch (err) {
    console.error('[analyzeAnswer] parse error:', err.message);
    return fallback;
  }
}

function buildResumeSnippet(resumeText = '') {
  const trimmed = resumeText.trim();
  if (trimmed.length < 30) return '';
  return `\nCandidate resume (use this to personalise your question to their specific background):\n---\n${trimmed.slice(0, 2500)}\n---\n`;
}

// ── Controller ───────────────────────────────────────────────────────────────
const interviewController = {

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/interview/upload-resume
  // ─────────────────────────────────────────────────────────────────────────
  async uploadResume(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
      }
      const resumeText = await parseResume(req.file.buffer, req.file.mimetype);
      if (!resumeText || resumeText.length < 20) {
        return res.status(422).json({
          message: 'Could not extract readable text from this file. Try a different PDF or DOCX.',
        });
      }
      res.json({
        resumeText,
        wordCount: resumeText.split(/\s+/).filter(Boolean).length,
      });
    } catch (err) {
      console.error('uploadResume error:', err);
      res.status(500).json({ message: 'Server error parsing resume.', error: err.message });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/interview/start-stream
  // ─────────────────────────────────────────────────────────────────────────
  async startInterviewStream(req, res) {
    try {
      const userId = req.user?.userId || req.body?.userId;
      if (!userId) return res.status(400).json({ message: 'User ID required.' });

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'User not found.' });

      const domainEntry     = resolveDomain(req.body?.domain);
      const difficultyEntry = resolveDifficulty(req.body?.difficulty);
      const resumeText      = req.body?.resumeText || '';
      const resumeSnippet   = buildResumeSnippet(resumeText);

      const prompt = `You are a concise technical interviewer specialising in ${domainEntry.label}.
${resumeSnippet}
Ask ONE single-sentence ${difficultyEntry.prompt} technical question for this domain.
Output only the question itself — no preamble, no explanation.`;

      const modelText   = await callGemini(prompt);
      const firstQuestion = extractQuestion(modelText) || INITIAL_QUESTION;

      const interview = new Interview({
        user: userId,
        questionsAsked: 0,
        score:          0,
        followUpCount:  0,
        history: [{
          question:    firstQuestion,
          answer:      '',
          score:       0,
          maxScore:    PER_Q_MAX_SCORE,
          scoreReason: '',
        }],
        date: new Date(),
        metadata: {
          level:        difficultyEntry.label.toLowerCase(),
          difficulty:   difficultyEntry.label,
          domain:       domainEntry.value,
          domainLabel:  domainEntry.label,
          maxQuestions: MAX_QUESTIONS,
          resumeUsed:   resumeSnippet.length > 0,
        },
      });

      await interview.save();

      res.status(200).json({
        interviewId:    interview._id,
        question:       firstQuestion,
        questionsAsked: 1,
        finished:       false,
        domain:         domainEntry.value,
        domainLabel:    domainEntry.label,
        difficulty:     difficultyEntry.label,
        resumeUsed:     resumeSnippet.length > 0,
      });
    } catch (err) {
      console.error('startInterviewStream error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // POST /api/interview/sendAnswer-stream
  // ─────────────────────────────────────────────────────────────────────────
  async sendAnswerStream(req, res) {
    try {
      const { interviewId, answer } = req.body;
      if (!interviewId) return res.status(400).json({ message: 'Interview ID required.' });

      const interview = await Interview.findById(interviewId);
      if (!interview) return res.status(404).json({ message: 'Interview not found.' });

      const lastIdx      = interview.history.length - 1;
      const updatedAnswer = String(answer || '').trim();
      const lastQuestion = interview.history[lastIdx].question;

      // ── Score the answer ───────────────────────────────────────────────
      const analysis = await analyzeAnswer(updatedAnswer, lastQuestion);
      const { keywords = [], score = 0, followup = '', reason = '' } = analysis;

      const normalized  = Math.min(Math.max(Number.isFinite(Number(score)) ? Number(score) : 0, 0), PER_Q_MAX_SCORE);
      const scoreReason = reason.trim() ||
        (normalized >= 4 ? 'Solid answer covering the key concepts.'     :
         normalized >= 2 ? 'Partial answer — some important points missed.' :
                           'Answer lacked the expected detail or accuracy.');

      // ── Update history entry ────────────────────────────────────────────
      const prevScore                        = Number(interview.history[lastIdx].score || 0);
      interview.history[lastIdx].answer      = updatedAnswer;
      interview.history[lastIdx].score       = normalized;
      interview.history[lastIdx].maxScore    = PER_Q_MAX_SCORE;
      interview.history[lastIdx].scoreReason = scoreReason;
      interview.history[lastIdx].keywords    = keywords;

      interview.score = Math.max(0,
        Math.min(
          (interview.score || 0) - prevScore + normalized,
          MAX_QUESTIONS * PER_Q_MAX_SCORE,
        ),
      );
      interview.questionsAsked += 1;

      // ── Metadata consistency ────────────────────────────────────────────
      const domainEntry     = resolveDomain(interview.metadata?.domain);
      const difficultyEntry = resolveDifficulty(interview.metadata?.level);
      interview.metadata      = interview.metadata || {};
      interview.metadata.domain      = domainEntry.value;
      interview.metadata.domainLabel = domainEntry.label;
      interview.markModified?.('metadata');

      const isFinished  = interview.questionsAsked >= MAX_QUESTIONS;
      let nextQuestion  = '';

      if (!isFinished) {
        const followUpCount = interview.followUpCount || 0;
        const lead = keywords.length
          ? `Building on ${keywords.slice(0, 2).join(' and ')} — `
          : '';

        if (followUpCount < 2 && followup) {
          // Use Gemini-suggested follow-up (max 2 per topic)
          nextQuestion = `${lead}${followup}`;
          interview.followUpCount += 1;
        } else {
          // Pivot to a fresh topic
          const excluded = keywords.join(', ') || 'the previous topic';
          const newPrompt = `Ask one ${difficultyEntry.prompt} technical question in ${domainEntry.label} that is NOT about ${excluded}. Single sentence only.`;
          const txt = await callGemini(newPrompt);
          nextQuestion = extractQuestion(txt) || INITIAL_QUESTION;
          interview.followUpCount = 0;
        }

        interview.history.push({
          question:    nextQuestion,
          answer:      '',
          score:       0,
          maxScore:    PER_Q_MAX_SCORE,
          scoreReason: '',
        });
      } else {
        interview.followUpCount = 0;
      }

      await interview.save();

      res.status(200).json({
        interviewId,
        keywords,
        score:          normalized,
        reason:         scoreReason,
        maxScore:       PER_Q_MAX_SCORE,
        question:       nextQuestion,
        questionsAsked: interview.questionsAsked,
        finished:       isFinished,
        domain:         domainEntry.value,
        domainLabel:    domainEntry.label,
      });
    } catch (err) {
      console.error('sendAnswerStream error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GET /api/interview/:interviewId
  // ─────────────────────────────────────────────────────────────────────────
  async getInterviewResult(req, res) {
    try {
      const { interviewId } = req.params;
      const userId          = req.user?.userId;

      if (!interviewId) return res.status(400).json({ message: 'Interview ID is required.' });
      if (!userId)      return res.status(401).json({ message: 'Unauthorised.' });

      const interview = await Interview.findById(interviewId).lean();
      if (!interview)  return res.status(404).json({ message: 'Interview not found.' });
      if (String(interview.user) !== String(userId)) {
        return res.status(403).json({ message: 'Access denied.' });
      }

      res.status(200).json({
        interviewId,
        score:             interview.score,
        maxScore:          MAX_QUESTIONS * PER_Q_MAX_SCORE,
        questionsAnswered: interview.questionsAsked,
        history:           interview.history || [],
        metadata:          interview.metadata || {},
        date:              interview.date,
      });
    } catch (err) {
      console.error('getInterviewResult error:', err);
      res.status(500).json({ message: 'Server error', error: err.message });
    }
  },
};

export default interviewController;
