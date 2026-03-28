// utils/ApiError.js

// ApiError extends the built-in JavaScript Error class
// This lets us keep native error behavior + add our own fields
class ApiError extends Error {
    constructor(
        statusCode,                     // HTTP error code (400, 401, 404, 500)
        message = "Something went wrong",// Default error message
        errors = [],                    // Extra error details (validation errors)
        stack = ""                      // Optional custom stack trace
    ) {
        // Call parent Error constructor
        // This sets error.message internally
        super(message);

        // Custom fields used by our API
        this.statusCode = statusCode;

        // We keep data null for errors (clear separation)
        this.data = null;

        this.message = message;

        // Errors are always unsuccessful
        this.success = false;

        // Useful when multiple validation errors exist
        this.errors = errors;

        // If a stack trace is provided manually, use it
        if (stack) {
            this.stack = stack;
        } else {
            // Otherwise, automatically generate stack trace
            // This helps debugging (file name, line number, etc.)
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };
