const express = require('express');
const router = express.Router();
const workflowController  = require('../controllers/workflowController');
const stepController      = require('../controllers/stepController');
const ruleController      = require('../controllers/ruleController');
const executionController = require('../controllers/executionController');

// Workflow routes
router.post('/workflows',     workflowController.createWorkflow);
router.get('/workflows',      workflowController.getWorkflows);       // supports ?search=&status=&page=&limit=
router.get('/workflows/:id',  workflowController.getWorkflowById);
router.put('/workflows/:id',  workflowController.updateWorkflow);      // auto-increments version
router.delete('/workflows/:id', workflowController.deleteWorkflow);

// Step routes
router.post('/workflows/:workflowId/steps', stepController.createStep);
router.get('/workflows/:workflowId/steps',  stepController.getSteps);
router.put('/steps/:id',    stepController.updateStep);
router.delete('/steps/:id', stepController.deleteStep);

// Rule routes
router.post('/steps/:stepId/rules', ruleController.createRule);
router.get('/steps/:stepId/rules',  ruleController.getRules);
router.put('/rules/:id',    ruleController.updateRule);
router.delete('/rules/:id', ruleController.deleteRule);

// Execution routes
router.post('/workflows/:workflowId/execute', executionController.executeWorkflow);
router.get('/executions',     executionController.getExecutions);      // supports ?workflowId=&status=&page=
router.get('/executions/:id', executionController.getExecution);
router.post('/executions/:id/cancel', executionController.cancelExecution);
router.post('/executions/:id/retry',  executionController.retryExecution);

module.exports = router;
