const Step = require('../models/Step');
const Rule = require('../models/Rule');
const Workflow = require('../models/Workflow');
const { successResponse, errorResponse } = require('../utils/response');

exports.createStep = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.workflowId);
    if (!workflow) return errorResponse(res, 'Workflow not found', 404);

    const step = await Step.create({ ...req.body, workflowId: req.params.workflowId });
    return successResponse(res, step, 'Step created successfully', 201);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return errorResponse(res, 'Validation failed', 400, error.errors);
    }
    return errorResponse(res, error.message);
  }
};

exports.getSteps = async (req, res) => {
  try {
    const steps = await Step.find({ workflowId: req.params.workflowId })
      .sort({ order: 1 })
      .populate('rules');
    return successResponse(res, steps, 'Steps fetched successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

exports.updateStep = async (req, res) => {
  try {
    const step = await Step.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!step) return errorResponse(res, 'Step not found', 404);
    return successResponse(res, step, 'Step updated successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

exports.deleteStep = async (req, res) => {
  try {
    const step = await Step.findByIdAndDelete(req.params.id);
    if (!step) return errorResponse(res, 'Step not found', 404);
    await Rule.deleteMany({ stepId: req.params.id });
    return successResponse(res, null, 'Step deleted successfully');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
