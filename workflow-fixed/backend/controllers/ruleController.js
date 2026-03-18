const Rule = require('../models/Rule');
const Step = require('../models/Step');
const { successResponse, errorResponse } = require('../utils/response');
const { evaluateCondition } = require('../utils/ruleEngine');

exports.createRule = async (req, res) => {
  try {
    const step = await Step.findById(req.params.stepId);
    if (!step) return errorResponse(res, 'Step not found', 404);

    // Validate condition syntax
    if (req.body.condition && req.body.condition.toUpperCase() !== 'DEFAULT') {
      try {
        evaluateCondition(req.body.condition, {});
      } catch (e) {
        return errorResponse(res, `Invalid condition syntax: ${e.message}`, 400);
      }
    }

    const rule = await Rule.create({ ...req.body, stepId: req.params.stepId });
    return successResponse(res, rule, 'Rule created successfully', 201);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return errorResponse(res, 'Validation failed', 400, error.errors);
    }
    return errorResponse(res, error.message);
  }
};

exports.getRules = async (req, res) => {
  try {
    const rules = await Rule.find({ stepId: req.params.stepId })
      .sort({ priority: 1 })
      .populate('nextStepId', 'name type order');
    return successResponse(res, rules, 'Rules fetched successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

exports.updateRule = async (req, res) => {
  try {
    const rule = await Rule.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!rule) return errorResponse(res, 'Rule not found', 404);
    return successResponse(res, rule, 'Rule updated successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

exports.deleteRule = async (req, res) => {
  try {
    const rule = await Rule.findByIdAndDelete(req.params.id);
    if (!rule) return errorResponse(res, 'Rule not found', 404);
    return successResponse(res, null, 'Rule deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
