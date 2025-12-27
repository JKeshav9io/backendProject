// Import mongoose → ODM (Object Data Modeling) library for MongoDB
// It helps us interact with MongoDB using JavaScript instead of raw queries
import mongoose from "mongoose";

// Import database name from constants
// Separating constants avoids hardcoding values everywhere
import { DB_NAME } from "../src/constants.js";

// Async function because database connection is a network operation
// Network calls take time → must use async/await
const connectDB = async () => {
  try {
    // mongoose.connect() establishes connection with MongoDB
    // process.env.MONGODB_URL comes from .env file (secure, not hardcoded)
    // DB_NAME is appended to select which database to use
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );

    // connectionInstance gives metadata about the connection
    // connection.host tells us which MongoDB server we are connected to
    console.log(
      `MongoDB connected: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    // If DB connection fails, we log the error
    console.error("MongoDB connection error:", error);

    // process.exit(1) immediately stops the Node.js process
    // Reason: backend without DB is useless → fail fast
    process.exit(1);
  }
};

// Export function so it can be used in index.js
export default connectDB;
