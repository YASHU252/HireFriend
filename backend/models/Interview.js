import mongoose from 'mongoose';

const historyEntrySchema = new mongoose.Schema({
  question:   { type: String, required: true },
  answer:     { type: String, default: '' },
  score:      { type: Number, default: 0 },
  maxScore:   { type: Number, default: 5 },
  scoreReason:{ type: String, default: '' },
  keywords:   { type: [String], default: [] },
});

const interviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  questionsAsked: { type: Number, default: 0 },
  score:          { type: Number, default: 0 },
  followUpCount:  { type: Number, default: 0 },
  history:        { type: [historyEntrySchema], default: [] },

  metadata: {
    level:        { type: String, default: 'easy' },
    difficulty:   { type: String, default: 'Easy' },
    domain:       { type: String, default: 'full stack web development' },
    domainLabel:  { type: String, default: 'Full Stack Web Development' },
    maxQuestions: { type: Number, default: 15 },
    resumeUsed:   { type: Boolean, default: false },
  },

  date: { type: Date, default: Date.now },
});

const Interview = mongoose.model('Interview', interviewSchema);
export default Interview;
