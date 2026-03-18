const mongoose = require('mongoose');

// Per-step evaluated rule log
const evaluatedRuleSchema = new mongoose.Schema({
  ruleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rule', default: null },
  ruleName: String,
  condition: String,
  result: Boolean,
}, { _id: false });

const stepLogSchema = new mongoose.Schema({
  stepId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Step', default: null },
  stepName:  String,
  stepType:  String,
  status:    { type: String, enum: ['completed', 'failed', 'skipped'], default: 'completed' },
  evaluatedRules: [evaluatedRuleSchema],
  selectedNextStep: { type: String, default: null },
  approverId: { type: String, default: null },
  errorMessage: { type: String, default: null },
  startedAt:  { type: Date, default: Date.now },
  endedAt:    { type: Date, default: null },
  duration:   { type: String, default: null }, // e.g. "00:00:03"
}, { _id: false });

const logEntrySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  level: { type: String, enum: ['info', 'warn', 'error', 'success'], default: 'info' },
  message: String,
  stepId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Step', default: null },
  stepName: String,
  ruleId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Rule', default: null },
  ruleName: String,
  data:     { type: mongoose.Schema.Types.Mixed, default: null },
}, { _id: false });

const executionSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true,
  },
  workflowName:    String,
  workflowVersion: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'failed', 'canceled'],
    default: 'pending',
  },
  currentStepId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Step', default: null },
  currentStepName: { type: String, default: null },
  input:    { type: mongoose.Schema.Types.Mixed, default: {} },
  output:   { type: mongoose.Schema.Types.Mixed, default: {} },
  context:  { type: mongoose.Schema.Types.Mixed, default: {} },

  // Rich per-step logs (for Execution Progress UI)
  stepLogs: [stepLogSchema],

  // Flat audit logs (for Execution Log UI)
  logs: [logEntrySchema],

  retries:     { type: Number, default: 0 },
  triggered_by: { type: String, default: 'system' },

  startedAt:   { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
  error:       { type: String, default: null },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Execution', executionSchema);
