# FlowForge — Workflow Automation System

A full-stack workflow automation platform with a visual rule engine, step editor, and real-time execution tracking.

## Tech Stack

- **Frontend**: React 18 + Tailwind CSS + React Router v6
- **Backend**: Node.js + Express + MVC pattern
- **Database**: MongoDB (Atlas)
- **Rule Engine**: Dynamic JS expression evaluator with priority-based matching

---

## Folder Structure

```
workflow-system/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── controllers/
│   │   ├── workflowController.js
│   │   ├── stepController.js
│   │   ├── ruleController.js
│   │   └── executionController.js
│   ├── middleware/
│   │   └── errorMiddleware.js
│   ├── models/
│   │   ├── Workflow.js
│   │   ├── Step.js
│   │   ├── Rule.js
│   │   └── Execution.js
│   ├── routes/
│   │   └── index.js             # All API routes
│   ├── utils/
│   │   ├── ruleEngine.js        # Condition evaluator
│   │   ├── response.js          # Response helpers
│   │   └── seeder.js            # Sample data seeder
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx        # Sidebar + nav
│   │   │   ├── StepEditor.jsx    # Step CRUD UI
│   │   │   ├── RuleEditor.jsx    # Rule CRUD UI
│   │   │   └── ExecuteModal.jsx  # Execute dialog
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── WorkflowCreate.jsx
│   │   │   ├── WorkflowEdit.jsx
│   │   │   ├── WorkflowDetail.jsx
│   │   │   ├── ExecutionDetail.jsx
│   │   │   └── ExecutionsList.jsx
│   │   ├── services/
│   │   │   └── api.js            # Axios API layer
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
│
└── README.md
```

---

## Setup Instructions

### 1. Clone / Extract

```bash
cd workflow-system
```

### 2. Configure Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `.env` and set your MongoDB Atlas URI:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/workflow_automation?retryWrites=true&w=majority
NODE_ENV=development
```

> **Get a free MongoDB Atlas cluster**: https://www.mongodb.com/atlas — create a project, click "Connect", choose "Drivers", copy the connection string.

### 3. Install Dependencies

```bash
# From project root
cd backend && npm install
cd ../frontend && npm install
```

### 4. Seed Sample Data (optional)

```bash
cd backend
node utils/seeder.js
```

This creates a sample "Order Approval Workflow" with 5 steps and 6 rules to explore immediately.

### 5. Start the Backend

```bash
cd backend
npm start        # production
# or
npm run dev      # with nodemon (auto-reload)
```

API runs at: `http://localhost:5000`

### 6. Start the Frontend

```bash
cd frontend
npm start
```

UI runs at: `http://localhost:3000`

---

## API Reference

### Workflows
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/workflows | Create workflow |
| GET | /api/workflows | List all workflows |
| GET | /api/workflows/:id | Get workflow (with steps + rules) |
| PUT | /api/workflows/:id | Update workflow |
| DELETE | /api/workflows/:id | Delete workflow (cascades) |

### Steps
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/workflows/:workflowId/steps | Create step |
| GET | /api/workflows/:workflowId/steps | List steps |
| PUT | /api/steps/:id | Update step |
| DELETE | /api/steps/:id | Delete step + rules |

### Rules
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/steps/:stepId/rules | Create rule |
| GET | /api/steps/:stepId/rules | List rules for step |
| PUT | /api/rules/:id | Update rule |
| DELETE | /api/rules/:id | Delete rule |

### Executions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/workflows/:workflowId/execute | Start execution |
| GET | /api/executions | List all executions |
| GET | /api/executions/:id | Get execution with logs |

---

## Rule Engine

Rules are evaluated **in priority order** (lowest number = highest priority). The **first matching rule wins**.

### Condition Examples

```js
amount > 1000
amount > 5000 && country == 'US'
status == 'pending' || status == 'review'
priority >= 2 && region != 'EU'
DEFAULT                              // always matches (fallback)
```

### Actions

| Action | Description |
|--------|-------------|
| `move_to_step` | Transition to specified next step |
| `complete` | Mark execution as completed |
| `fail` | Mark execution as failed |

---

## Execute a Workflow (API Example)

```bash
curl -X POST http://localhost:5000/api/workflows/<id>/execute \
  -H "Content-Type: application/json" \
  -d '{
    "input": {
      "amount": 2500,
      "country": "US",
      "customerId": "cust_abc"
    }
  }'
```

---

## Features

- ✅ Full workflow CRUD with versioning
- ✅ Step types: task, approval, notification  
- ✅ Priority-based rule engine with JS expression evaluation
- ✅ DEFAULT fallback rules
- ✅ Execution engine with detailed step-by-step logs
- ✅ Cascading deletes (workflow → steps → rules)
- ✅ Infinite loop protection (100-step limit)
- ✅ React frontend with dark UI
- ✅ Execute modal with live JSON input
- ✅ Execution history with filterable status
- ✅ Full log viewer with timestamps and step context
