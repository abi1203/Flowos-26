const mongoose = require('mongoose');

const ruleSchema = new mongoose.Schema({
  stepId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Step',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Rule name is required'],
    trim: true,
  },
  priority: {
    type: Number,
    required: [true, 'Priority is required'],
    default: 1,
  },
  condition: {
    type: String,
    required: [true, 'Condition is required'],
  },
  nextStepId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Step',
    default: null,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    default: '',
  },
  action: {
    type: String,
    enum: ['move_to_step', 'complete', 'fail'],
    default: 'move_to_step',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Rule', ruleSchema);
