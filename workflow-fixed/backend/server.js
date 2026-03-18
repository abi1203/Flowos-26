require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/database");
const routes = require("./routes/index");
const { errorHandler, notFound } = require("./middleware/errorMiddleware");

const app = express();

//  IMPORTANT (Render port)
const PORT = process.env.PORT || 10000;

//  DEBUG (must see in logs)
console.log("ENV CHECK:", process.env.MONGODB_URI);

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "Workflow Automation API",
  });
});

// Routes
app.use("/api", routes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});