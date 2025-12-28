// utils/asyncHandler.js

// asyncHandler ek higher-order function hai
// Ye controller function leta hai aur Express-compatible function return karta hai
const asyncHandler = (requestHandler) => {

    // ❗ YAHI return missing tha tumhare code me
    return (req, res, next) => {

        // Promise.resolve ensures:
        // - sync errors catch ho
        // - async errors catch ho
        Promise
            .resolve(requestHandler(req, res, next))
            .catch((err) => next(err)); // error ko Express error middleware tak bhej do
    };
};

export { asyncHandler };









/*
asyncHandler is a wrapper function
It takes a controller function (fn) as input
and returns a new function that Express can safely run
const asyncHandler = (fn) => async (req, res, next) => {
    try {
        We CALL the controller function here
        fn is something like: loginUser, getProfile, registerUser
        await is REQUIRED so async errors go into catch block
        await fn(req, res, next);

    } catch (err) {
        If any error happens inside the controller,
        it will be caught here

        ❌ We should NOT send response directly from here
        Sending response here breaks centralized error handling

        Instead, we pass the error to Express error middleware
        next(err);
    }
};

export { asyncHandler };
*/