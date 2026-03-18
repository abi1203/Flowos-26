const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    //  Check ENV
    if (!process.env.MONGODB_URI) {
      console.log(" MONGODB_URI is missing");
      process.exit(1);
    }

    console.log(" Connecting to MongoDB...");

    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;