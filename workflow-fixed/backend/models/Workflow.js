const mongoose = require('mongoose');

const workflowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Workflow name is required'],
    trim: true,
  },

  description: {
    type: String,
    trim: true,
    default: '',
  },

  // ✅ FIXED: use workflowVersion (not version)
  workflowVersion: {
    type: String,
    default: '1.0.0',
  },

  is_active: {
    type: Boolean,
    default: false,
  },

  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft',
  },

  inputSchema: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },

  start_step_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Step',
    default: null,
  },

  tags: [String],

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ✅ Virtual for steps
workflowSchema.virtual('steps', {
  ref: 'Step',
  localField: '_id',
  foreignField: 'workflowId',
  options: { sort: { order: 1 } },
});

module.exports = mongoose.model('Workflow', workflowSchema);