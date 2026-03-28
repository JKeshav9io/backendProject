import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";

// ============================================================
// CLOUDINARY UTILITY
// ============================================================
// What this file does:
// 1) Configures Cloudinary SDK using environment variables.
// 2) Uploads a local temp file (from Multer disk storage) to Cloudinary.
// 3) Deletes local temp file after upload success/failure (unless told not to).
//
// Why this utility exists:
// - Keeps upload logic centralized and reusable across controllers.
// - Prevents controllers from repeating file cleanup and error handling code.
// - Makes production behavior consistent and easier to debug.

// Configure Cloudinary once during module load.
// Every upload call below will use these credentials.
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

// Required keys for Cloudinary authentication.
const requiredEnv = ["CLOUD_NAME", "API_KEY", "API_SECRET"];

// Checks if all required Cloudinary env vars are present.
// Why: fail early with a clear message instead of mysterious upload failures.
const hasCloudinaryConfig = () => requiredEnv.every((key) => Boolean(process.env[key]));

// Safely removes a local file.
// This is used for cleaning temporary files created by Multer.
// If file is already gone (ENOENT), we ignore it.
const safeUnlink = async (filePath) => {
    if (!filePath) return;

    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== "ENOENT") {
            // Cleanup failure should be visible in logs,
            // but must not crash the main request flow.
            console.error("Failed to remove temp file:", error.message);
        }
    }
};

// Uploads a local file to Cloudinary.
// localFilePath: absolute/relative path on this server (usually req.file.path)
// options: any Cloudinary upload options (folder, public_id, transformation, etc.)
// options.keepLocalFile: set true only when you explicitly want to keep local copy
export const uploadOnCloudinary = async (localFilePath, options = {}) => {
    const { keepLocalFile = false, ...uploadOptions } = options;

    // Guard: upload cannot happen without a local source path.
    if (!localFilePath) {
        throw new Error("Local file path is required for Cloudinary upload");
    }

    // Guard: verify env config before making external API call.
    if (!hasCloudinaryConfig()) {
        throw new Error("Missing Cloudinary configuration in environment variables");
    }

    try {
        // resource_type: "auto" lets Cloudinary auto-detect image/video/raw.
        const uploadResponse = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            ...uploadOptions,
        });

        // On success, remove temp file so disk does not fill over time.
        if (!keepLocalFile) {
            await safeUnlink(localFilePath);
        }

        // Return full Cloudinary response (secure_url, public_id, bytes, etc.).
        return uploadResponse;
    } catch (error) {
        // Even on failure, attempt cleanup of temp file.
        if (!keepLocalFile) {
            await safeUnlink(localFilePath);
        }

        // Rethrow with context so caller/global middleware gets meaningful error.
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
};

// Export raw configured instance for advanced operations
// (destroy, rename, explicit API calls, transformations, etc.).
export { cloudinary };