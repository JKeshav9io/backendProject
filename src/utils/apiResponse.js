// utils/ApiResponse.js

// ApiResponse is a simple class used to STANDARDIZE
// how successful responses are sent to the client.


// Every API response should look similar so frontend (Flutter) doesn’t have to guess structure.
// If responses are inconsistent, frontend code becomes messy and error-prone.

class ApiResponse {
    constructor(
        statusCode,     // HTTP status code (200, 201, 204, etc.)
        data,           // Actual response data (object, array, null)
        message = "Success" // Optional message, default is "Success"
    ) {
        // HTTP status code helps frontend understand what happened
        this.statusCode = statusCode;

        // The real payload of the response
        this.data = data;

        // Human-readable message (useful for UI toasts/snackbars)
        this.message = message;

        // success is derived from statusCode
        // Convention: status codes < 400 mean success
        this.success = statusCode < 400;
    }
}

export { ApiResponse };
