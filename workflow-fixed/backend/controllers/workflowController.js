const Workflow = require('../models/Workflow');
const Step = require('../models/Step');
const Rule = require('../models/Rule');
const Execution = require('../models/Execution');
const { successResponse, errorResponse } = require('../utils/response');

exports.createWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.create(req.body);
    return successResponse(res, workflow, 'Workflow created successfully', 201);
  } catch (error) {
    if (error.name === 'ValidationError') return errorResponse(res, 'Validation failed', 400, error.errors);
    return errorResponse(res, error.message);
  }
};

exports.getWorkflows = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Workflow.countDocuments(filter);
    const workflows = await Workflow.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));

    // Attach step + execution counts
    const enriched = await Promise.all(workflows.map(async (wf) => {
      const stepCount = await Step.countDocuments({ workflowId: wf._id });
      const executionCount = await Execution.countDocuments({ workflowId: wf._id });
      return { ...wf.toJSON(), stepCount, executionCount };
    }));

    return successResponse(res, {
      workflows: enriched,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

exports.getWorkflowById = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.id).populate({
      path: 'steps',
      populate: { path: 'rules' },
    });
    if (!workflow) return errorResponse(res, 'Workflow not found', 404);
    return successResponse(res, workflow);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

exports.updateWorkflow = async (req, res) => {
  try {
    // Auto-increment version on update
    const existing = await Workflow.findById(req.params.id);
    if (!existing) return errorResponse(res, 'Workflow not found', 404);

    const updateData = { ...req.body };
    if (updateData.version === undefined) {
      const parts = (existing.version || '1.0.0').split('.').map(Number); parts[2] = (parts[2] || 0) + 1; updateData.version = parts.join('.');
    }

    const workflow = await Workflow.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    return successResponse(res, workflow, 'Workflow updated (new version created)');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

exports.deleteWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findByIdAndDelete(req.params.id);
    if (!workflow) return errorResponse(res, 'Workflow not found', 404);
    const steps = await Step.find({ workflowId: req.params.id });
    for (const step of steps) await Rule.deleteMany({ stepId: step._id });
    await Step.deleteMany({ workflowId: req.params.id });
    await Execution.deleteMany({ workflowId: req.params.id });
    return successResponse(res, null, 'Workflow and all related data deleted');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
