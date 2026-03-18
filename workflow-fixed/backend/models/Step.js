const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
  workflowId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Step name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['task', 'approval', 'notification'],
    required: [true, 'Step type is required'],
  },
  order: {
    type: Number,
    required: [true, 'Step order is required'],
  },
  description: {
    type: String,
    default: '',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isStart: {
    type: Boolean,
    default: false,
  },
  isEnd: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

stepSchema.virtual('rules', {
  ref: 'Rule',
  localField: '_id',
  foreignField: 'stepId',
  options: { sort: { priority: 1 } },
});

module.exports = mongoose.model('Step', stepSchema);
