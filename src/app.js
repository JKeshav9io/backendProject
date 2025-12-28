// Import Express framework
// Express helps us create a backend server and APIs easily
import express from "express";

// Import CORS middleware
// CORS = Cross-Origin Resource Sharing
// It controls which frontend domains can talk to this backend
import cors from "cors";

// Import cookie-parser middleware
// It helps Express read cookies sent by the browser
import cookieParser from "cookie-parser";

// Create an Express application instance
// `app` is the central object that controls the server
const app = express();


// -------------------- CORS CONFIGURATION --------------------

// app.use() registers a middleware
// This middleware runs on EVERY incoming request
app.use(
    cors({
        // origin defines which frontend is allowed to access this backend
        // Example: http://localhost:5173 (Vite) or your Flutter web URL
        origin: process.env.CORS_ORIGIN,

        // credentials: true allows cookies, authorization headers, etc.
        // REQUIRED for login systems using cookies or sessions
        credentials: true,
    })
);


// -------------------- BODY PARSERS --------------------

// This middleware parses incoming JSON data
// Example: POST request with JSON body
// limit prevents very large payloads (security + performance)
app.use(express.json({ limit: "16kb" }));


// This middleware parses URL-encoded data
// Used when data is sent from forms (HTML forms, Postman x-www-form-urlencoded)
// extended: true allows nested objects
app.use(express.urlencoded({ extended: true, limit: "16kb" }));


// -------------------- STATIC FILES --------------------

// This makes the "public" folder accessible directly
// Example: public/image.png → http://localhost:PORT/image.png
// Useful for serving images, PDFs, uploads, etc.
app.use(express.static("public"));


// -------------------- COOKIE PARSER --------------------

// This middleware parses cookies from incoming requests
// After this, cookies are available as: req.cookies
// Very important for authentication using cookies (JWT/session)
app.use(cookieParser());


// Export the app so it can be used in index.js / server.js
export { app };
