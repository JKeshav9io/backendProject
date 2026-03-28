import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";

// Configure once at startup from environment variables.
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

const requiredEnv = ["CLOUD_NAME", "API_KEY", "API_SECRET"];

const hasCloudinaryConfig = () => requiredEnv.every((key) => Boolean(process.env[key]));

const safeUnlink = async (filePath) => {
    if (!filePath) return;

    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== "ENOENT") {
            // Do not fail upload flow on cleanup issues.
            console.error("Failed to remove temp file:", error.message);
        }
    }
};

// Upload a file from local disk (usually multer temp path) to Cloudinary.
// localFilePath: absolute/relative path on local server
// options.keepLocalFile: keep temp file if true (default false)
export const uploadOnCloudinary = async (localFilePath, options = {}) => {
    const { keepLocalFile = false, ...uploadOptions } = options;

    if (!localFilePath) {
        throw new Error("Local file path is required for Cloudinary upload");
    }

    if (!hasCloudinaryConfig()) {
        throw new Error("Missing Cloudinary configuration in environment variables");
    }

    try {
        const uploadResponse = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            ...uploadOptions,
        });

        if (!keepLocalFile) {
            await safeUnlink(localFilePath);
        }

        return uploadResponse;
    } catch (error) {
        if (!keepLocalFile) {
            await safeUnlink(localFilePath);
        }

        // Preserve the upstream error while adding useful context.
        throw new Error(`Cloudinary upload failed: ${error.message}`);
    }
};

export { cloudinary };