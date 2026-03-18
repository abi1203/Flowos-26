const Execution = require('../models/Execution');
const Workflow = require('../models/Workflow');
const Step = require('../models/Step');
const Rule = require('../models/Rule');
const { successResponse, errorResponse } = require('../utils/response');
const { evaluateRules } = require('../utils/ruleEngine');

const MAX_STEPS = 100;

const formatDuration = (startedAt, endedAt) => {
  const ms = new Date(endedAt) - new Date(startedAt);
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
};

const addLog = (execution, level, message, extra = {}) => {
  execution.logs.push({ timestamp: new Date(), level, message, ...extra });
};

const processExecution = async (execution) => {
  let stepCount = 0;

  while (execution.status === 'in_progress' && stepCount < MAX_STEPS) {
    stepCount++;

    const currentStep = await Step.findById(execution.currentStepId);
    if (!currentStep) {
      execution.status = 'failed';
      execution.error = `Step not found: ${execution.currentStepId}`;
      addLog(execution, 'error', `Step not found: ${execution.currentStepId}`);
      break;
    }

    const stepStartedAt = new Date();
    addLog(execution, 'info', `Processing step: ${currentStep.name}`, {
      stepId: currentStep._id, stepName: currentStep.name,
    });

    // End step → complete
    if (currentStep.isEnd) {
      const stepEndedAt = new Date();
      execution.stepLogs.push({
        stepId: currentStep._id, stepName: currentStep.name, stepType: currentStep.type,
        status: 'completed', evaluatedRules: [], selectedNextStep: null,
        startedAt: stepStartedAt, endedAt: stepEndedAt,
        duration: formatDuration(stepStartedAt, stepEndedAt),
      });
      execution.status = 'completed';
      execution.completedAt = stepEndedAt;
      addLog(execution, 'success', `Workflow completed at end step: ${currentStep.name}`, {
        stepId: currentStep._id, stepName: currentStep.name,
      });
      break;
    }

    // Fetch rules
    const rules = await Rule.find({ stepId: currentStep._id })
      .sort({ isDefault: 1, priority: 1 })
      .populate('nextStepId', 'name type order');

    if (rules.length === 0) {
      const stepEndedAt = new Date();
      execution.stepLogs.push({
        stepId: currentStep._id, stepName: currentStep.name, stepType: currentStep.type,
        status: 'completed', evaluatedRules: [], selectedNextStep: null,
        startedAt: stepStartedAt, endedAt: stepEndedAt,
        duration: formatDuration(stepStartedAt, stepEndedAt),
      });
      execution.status = 'completed';
      execution.completedAt = stepEndedAt;
      addLog(execution, 'success', 'No rules — workflow completed.');
      break;
    }

    // Evaluate all rules (for logging) + find first match
    const context = { ...execution.input, ...execution.context };
    const { matchedRule, evaluatedRules } = evaluateRules(rules, context);

    // Log all evaluated rules
    for (const er of evaluatedRules) {
      addLog(execution, er.result ? 'success' : 'info',
        `Rule "${er.ruleName}" [${er.condition}] → ${er.result ? 'MATCHED' : 'no match'}`,
        { stepId: currentStep._id, stepName: currentStep.name, ruleId: er.ruleId, ruleName: er.ruleName }
      );
    }

    if (!matchedRule) {
      const stepEndedAt = new Date();
      execution.stepLogs.push({
        stepId: currentStep._id, stepName: currentStep.name, stepType: currentStep.type,
        status: 'failed', evaluatedRules,
        errorMessage: 'No matching rule found',
        startedAt: stepStartedAt, endedAt: stepEndedAt,
        duration: formatDuration(stepStartedAt, stepEndedAt),
      });
      execution.status = 'failed';
      execution.error = `No matching rule at step: ${currentStep.name}`;
      addLog(execution, 'error', `No matching rule at step: ${currentStep.name}`, {
        stepId: currentStep._id, stepName: currentStep.name,
      });
      break;
    }

    addLog(execution, 'info',
      `Selected rule: "${matchedRule.name}" → action: ${matchedRule.action}`, {
      stepId: currentStep._id, stepName: currentStep.name,
      ruleId: matchedRule._id, ruleName: matchedRule.name,
    });

    // Determine next step name for log
    const nextStepName = matchedRule.nextStepId?.name || null;
    const stepEndedAt = new Date();

    execution.stepLogs.push({
      stepId: currentStep._id, stepName: currentStep.name, stepType: currentStep.type,
      status: 'completed', evaluatedRules,
      selectedNextStep: nextStepName,
      startedAt: stepStartedAt, endedAt: stepEndedAt,
      duration: formatDuration(stepStartedAt, stepEndedAt),
    });

    // Handle action
    if (matchedRule.action === 'complete') {
      execution.status = 'completed';
      execution.completedAt = stepEndedAt;
      addLog(execution, 'success', `Workflow completed by rule: ${matchedRule.name}`);
      break;
    } else if (matchedRule.action === 'fail') {
      execution.status = 'failed';
      execution.error = `Workflow failed by rule: ${matchedRule.name}`;
      addLog(execution, 'error', execution.error);
      break;
    } else {
      // move_to_step
      if (!matchedRule.nextStepId) {
        // null nextStepId ends the workflow
        execution.status = 'completed';
        execution.completedAt = stepEndedAt;
        addLog(execution, 'success', 'No next step defined — workflow completed.');
        break;
      }

      const nextStep = await Step.findById(matchedRule.nextStepId._id || matchedRule.nextStepId);
      if (!nextStep) {
        execution.status = 'failed';
        execution.error = `Next step not found: ${matchedRule.nextStepId}`;
        addLog(execution, 'error', execution.error);
        break;
      }

      addLog(execution, 'info', `Moving to: ${nextStep.name}`, {
        stepId: nextStep._id, stepName: nextStep.name,
      });
      execution.currentStepId = nextStep._id;
      execution.currentStepName = nextStep.name;

      if (nextStep.isEnd) {
        const endAt = new Date();
        execution.stepLogs.push({
          stepId: nextStep._id, stepName: nextStep.name, stepType: nextStep.type,
          status: 'completed', evaluatedRules: [], selectedNextStep: null,
          startedAt: endAt, endedAt: endAt, duration: '00:00:00',
        });
        execution.status = 'completed';
        execution.completedAt = endAt;
        addLog(execution, 'success', `Workflow completed at end step: ${nextStep.name}`, {
          stepId: nextStep._id, stepName: nextStep.name,
        });
        break;
      }
    }
  }

  if (stepCount >= MAX_STEPS) {
    execution.status = 'failed';
    execution.error = 'Max step limit (100) reached — possible infinite loop.';
    addLog(execution, 'error', execution.error);
  }

  return execution;
};

exports.executeWorkflow = async (req, res) => {
  try {
    const workflow = await Workflow.findById(req.params.workflowId);
    if (!workflow) return errorResponse(res, 'Workflow not found', 404);

    // Find start step: use start_step_id if set, else lowest order
    let startStep = workflow.start_step_id
      ? await Step.findById(workflow.start_step_id)
      : await Step.findOne({ workflowId: req.params.workflowId, isStart: true }).sort({ order: 1 });

    if (!startStep) {
      startStep = await Step.findOne({ workflowId: req.params.workflowId }).sort({ order: 1 });
    }
    if (!startStep) return errorResponse(res, 'No steps found for this workflow', 400);

    const execution = new Execution({
      workflowId:      workflow._id,
      workflowName:    workflow.name,
      workflowVersion: workflow.version,
      status:          'in_progress',
      currentStepId:   startStep._id,
      currentStepName: startStep.name,
      input:           req.body.input || {},
      context:         req.body.context || {},
      triggered_by:    req.body.triggered_by || 'user',
      logs: [],
      stepLogs: [],
    });

    addLog(execution, 'info', `Execution started — Workflow: ${workflow.name} v${workflow.version}`, {
      stepId: startStep._id, stepName: startStep.name,
      data: { input: req.body.input },
    });

    await processExecution(execution);
    await execution.save();

    return successResponse(res, execution, `Execution ${execution.status}`, 201);
  } catch (error) {
    console.error('Execution error:', error);
    return errorResponse(res, error.message);
  }
};

exports.getExecution = async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id)
      .populate('workflowId', 'name version')
      .populate('currentStepId', 'name type order');
    if (!execution) return errorResponse(res, 'Execution not found', 404);
    return successResponse(res, execution);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

exports.getExecutions = async (req, res) => {
  try {
    const { workflowId, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (workflowId) filter.workflowId = workflowId;
    if (status) filter.status = status;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Execution.countDocuments(filter);
    const executions = await Execution.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    return successResponse(res, { executions, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

exports.cancelExecution = async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id);
    if (!execution) return errorResponse(res, 'Execution not found', 404);
    if (!['pending', 'in_progress'].includes(execution.status)) {
      return errorResponse(res, `Cannot cancel execution with status: ${execution.status}`, 400);
    }
    execution.status = 'canceled';
    execution.completedAt = new Date();
    execution.logs.push({ timestamp: new Date(), level: 'warn', message: 'Execution canceled by user.' });
    await execution.save();
    return successResponse(res, execution, 'Execution canceled');
  } catch (error) {
    return errorResponse(res, error.message);
  }
};

exports.retryExecution = async (req, res) => {
  try {
    const execution = await Execution.findById(req.params.id);
    if (!execution) return errorResponse(res, 'Execution not found', 404);
    if (execution.status !== 'failed') {
      return errorResponse(res, 'Only failed executions can be retried', 400);
    }

    // Retry only re-executes from the failed step (not entire workflow)
    execution.status = 'in_progress';
    execution.error = null;
    execution.retries = (execution.retries || 0) + 1;
    execution.completedAt = null;
    execution.logs.push({
      timestamp: new Date(), level: 'info',
      message: `Retry #${execution.retries} — resuming from step: ${execution.currentStepName}`,
    });

    await processExecution(execution);
    await execution.save();

    return successResponse(res, execution, `Retry ${execution.status}`);
  } catch (error) {
    return errorResponse(res, error.message);
  }
};
