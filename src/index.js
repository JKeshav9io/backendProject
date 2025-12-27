// dotenv loads environment variables from .env file into process.env
// This keeps secrets (DB URL, PORT, API keys) out of code
import dotenv from "dotenv";

// Express is the web framework that handles routes, middleware, requests, responses
import express from "express";

// Import database connection function
// Separation of concerns: DB logic is NOT written here
import connectDB from "../db/index.js";

// Load environment variables
// path "./.env" means load variables from .env file at project root
dotenv.config({ path: "./.env" });

// Create express application instance
// app represents your backend server
const app = express();

// Call database connection function
// This ensures DB connects as soon as server starts
connectDB();

/*
(async ()=>{

    // Immediately Invoked Function Expression (IIFE)
    // Why?
    // Node.js does not allow top-level await in older patterns
    // This lets us use async/await immediately
    try{

        // Direct database connection using mongoose
        // This approach mixes DB + server logic
        // It works, but is NOT clean architecture
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)

        // app.on("error") listens for runtime server errors
        // Example: port already in use, server crash, etc.
        app.on("error",(error)=>{
            console.log("ERRR: ",error);

            // Throwing error stops execution
            throw error
        })

        // app.listen starts the HTTP server
        // process.env.PORT allows dynamic port configuration
        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
        })

    }catch(error){

        // Catch any error from DB or server startup
        console.error("ERROR: ", error)

        // Throw error so Node knows startup failed
        throw err
    }
})()
*/
