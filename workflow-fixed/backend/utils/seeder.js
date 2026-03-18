require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const Workflow = require('../models/Workflow');
const Step = require('../models/Step');
const Rule = require('../models/Rule');
const Execution = require('../models/Execution');

const seed = async () => {
  await connectDB();

  await Rule.deleteMany({});
  await Step.deleteMany({});
  await Execution.deleteMany({});
  await Workflow.deleteMany({});
  console.log('🗑️  Cleared existing data\n');

  // ─────────────────────────────────────────────────────────────────
  // WORKFLOW 1: Expense Approval (matches the Halleyx challenge spec)
  // ─────────────────────────────────────────────────────────────────
  const w1 = await Workflow.create({
    name: 'Expense Approval',
    description: 'Multi-level expense approval with manager, finance, and CEO sign-off',
    version: 3,
    is_active: true,
    status: 'active',
    inputSchema: {
      amount:     { type: 'number', required: true },
      country:    { type: 'string', required: true },
      department: { type: 'string', required: false },
      priority:   { type: 'string', required: true, allowed_values: ['High', 'Medium', 'Low'] },
    },
    tags: ['expense', 'approval', 'finance'],
  });

  const s1_1 = await Step.create({ workflowId: w1._id, name: 'Manager Approval',    type: 'approval',     order: 1, isStart: true,  metadata: { assignee_email: 'manager@example.com' } });
  const s1_2 = await Step.create({ workflowId: w1._id, name: 'Finance Notification', type: 'notification', order: 2, metadata: { notification_channel: 'email', template: 'finance_alert' } });
  const s1_3 = await Step.create({ workflowId: w1._id, name: 'CEO Approval',         type: 'approval',     order: 3, metadata: { assignee_email: 'ceo@example.com' } });
  const s1_4 = await Step.create({ workflowId: w1._id, name: 'Task Rejection',       type: 'task',         order: 4, metadata: { instructions: 'Notify requester of rejection' } });
  const s1_5 = await Step.create({ workflowId: w1._id, name: 'Task Completion',      type: 'task',         order: 5, isEnd: true,    metadata: { instructions: 'Mark expense as approved and process payment' } });

  // Update workflow with start step
  await Workflow.findByIdAndUpdate(w1._id, { start_step_id: s1_1._id });

  // Manager Approval rules (from the spec exactly)
  await Rule.create({ stepId: s1_1._id, name: 'High Value US Order',   priority: 1, condition: "amount > 100 && country == 'US' && priority == 'High'", nextStepId: s1_2._id, action: 'move_to_step' });
  await Rule.create({ stepId: s1_1._id, name: 'Low Amount or HR',       priority: 2, condition: "amount <= 100 || department == 'HR'",                    nextStepId: s1_3._id, action: 'move_to_step' });
  await Rule.create({ stepId: s1_1._id, name: 'Low Priority Non-US',    priority: 3, condition: "priority == 'Low' && country != 'US'",                   nextStepId: s1_4._id, action: 'move_to_step' });
  await Rule.create({ stepId: s1_1._id, name: 'DEFAULT',               priority: 4, condition: 'DEFAULT', isDefault: true,                                nextStepId: s1_4._id, action: 'move_to_step' });

  // Finance Notification → CEO Approval
  await Rule.create({ stepId: s1_2._id, name: 'Proceed to CEO',  priority: 1, condition: 'DEFAULT', isDefault: true, nextStepId: s1_3._id, action: 'move_to_step' });

  // CEO Approval → Complete
  await Rule.create({ stepId: s1_3._id, name: 'Approved',        priority: 1, condition: 'DEFAULT', isDefault: true, nextStepId: s1_5._id, action: 'move_to_step' });

  // Task Rejection → end
  await Rule.create({ stepId: s1_4._id, name: 'Reject & Close',  priority: 1, condition: 'DEFAULT', isDefault: true, nextStepId: s1_5._id, action: 'move_to_step' });

  console.log('✅ Workflow 1: Expense Approval — 5 steps, 7 rules');

  // ─────────────────────────────────────────────────────────────────
  // WORKFLOW 2: Employee Onboarding
  // ─────────────────────────────────────────────────────────────────
  const w2 = await Workflow.create({
    name: 'Employee Onboarding',
    description: 'Automated onboarding workflow for new hires',
    version: 1,
    is_active: true,
    status: 'active',
    inputSchema: {
      department: { type: 'string', required: true },
      role:       { type: 'string', required: true },
      location:   { type: 'string', required: false, allowed_values: ['remote', 'onsite', 'hybrid'] },
      seniority:  { type: 'string', required: false, allowed_values: ['junior', 'mid', 'senior', 'lead'] },
    },
    tags: ['hr', 'onboarding', 'employees'],
  });

  const s2_1 = await Step.create({ workflowId: w2._id, name: 'IT Setup',              type: 'task',         order: 1, isStart: true, metadata: { assignee_email: 'it@company.com', instructions: 'Provision laptop, accounts, and access' } });
  const s2_2 = await Step.create({ workflowId: w2._id, name: 'HR Welcome Email',      type: 'notification', order: 2, metadata: { notification_channel: 'email', template: 'welcome_email' } });
  const s2_3 = await Step.create({ workflowId: w2._id, name: 'Manager Intro Meeting', type: 'approval',     order: 3, metadata: { assignee_email: 'manager@company.com', instructions: 'Schedule 1:1 introduction' } });
  const s2_4 = await Step.create({ workflowId: w2._id, name: 'Security Clearance',    type: 'approval',     order: 4, metadata: { assignee_email: 'security@company.com' } });
  const s2_5 = await Step.create({ workflowId: w2._id, name: 'Onboarding Complete',   type: 'task',         order: 5, isEnd: true, metadata: { instructions: 'Mark employee as fully onboarded' } });

  await Workflow.findByIdAndUpdate(w2._id, { start_step_id: s2_1._id });

  await Rule.create({ stepId: s2_1._id, name: 'Proceed to Welcome', priority: 1, condition: 'DEFAULT', isDefault: true, nextStepId: s2_2._id, action: 'move_to_step' });
  await Rule.create({ stepId: s2_2._id, name: 'Proceed to Manager', priority: 1, condition: 'DEFAULT', isDefault: true, nextStepId: s2_3._id, action: 'move_to_step' });

  // Senior/Lead → security clearance required
  await Rule.create({ stepId: s2_3._id, name: 'Senior Role — Security Check', priority: 1, condition: "seniority == 'senior' || seniority == 'lead'", nextStepId: s2_4._id, action: 'move_to_step' });
  await Rule.create({ stepId: s2_3._id, name: 'Default — Skip Security',      priority: 2, condition: 'DEFAULT', isDefault: true, nextStepId: s2_5._id, action: 'move_to_step' });
  await Rule.create({ stepId: s2_4._id, name: 'Clearance Granted',            priority: 1, condition: 'DEFAULT', isDefault: true, nextStepId: s2_5._id, action: 'move_to_step' });

  console.log('✅ Workflow 2: Employee Onboarding — 5 steps, 5 rules');
  console.log('\n📦 Sample data seeded successfully!');
  console.log('\nTest Execution (Expense Approval):');
  console.log('  { "amount": 250, "country": "US", "department": "Finance", "priority": "High" }');
  console.log('  → Should route: Manager Approval → Finance Notification → CEO Approval → Task Completion');

  process.exit(0);
};

seed().catch(err => { console.error('Seeding error:', err); process.exit(1); });
