import fs from "fs";
import path from "path";
import multer from "multer";
import { ApiError } from "../utils/apiError.js";

// ============================================================
// MULTER MIDDLEWARE (DISK STORAGE)
// ============================================================
// What this file does:
// 1) Accepts multipart/form-data file uploads through Express routes.
// 2) Stores files temporarily on local disk (public/temp).
// 3) Validates file type and file size.
// 4) Converts upload errors into your ApiError format so global error
//    middleware can respond consistently.
//
// Why disk storage?
// - Multer writes incoming files quickly to local temp storage.
// - Then your controller can upload those files to Cloudinary.
// - After successful Cloudinary upload, local temp files can be removed.

// Local temp directory for disk storage uploads.
// Files are later moved to Cloudinary and removed from local disk.
const TEMP_UPLOAD_DIR = path.join(process.cwd(), "public", "temp");

// Ensures the upload directory exists before Multer tries to write files.
// recursive: true creates nested folders safely if missing.
const ensureUploadDir = () => {
    if (!fs.existsSync(TEMP_UPLOAD_DIR)) {
        fs.mkdirSync(TEMP_UPLOAD_DIR, { recursive: true });
    }
};

// Creates a safe filename base from original file name.
// Steps:
// - Remove extension (we add extension back later).
// - Replace unsafe/special characters with '-'.
// - Limit length to 50 chars to avoid very long file names.
// Why: protects filesystem and keeps names clean/predictable.
const sanitizeBaseName = (name) => {
    return name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .slice(0, 50);
};

// Only these MIME types are accepted.
// Why whitelist approach:
// - Safer than allowing everything.
// - Prevents accidental or malicious unsupported uploads.
const allowedMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
]);

// Multer disk storage configuration.
// destination: where files are stored.
// filename: how stored file name is generated.
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            // Create folder if it doesn't exist.
            ensureUploadDir();

            // Success: pass null error + destination path.
            cb(null, TEMP_UPLOAD_DIR);
        } catch (error) {
            // Failure: pass error to Multer so request fails gracefully.
            cb(new ApiError(500, "Failed to prepare upload directory"));
        }
    },
    filename: (req, file, cb) => {
        // Keep original extension so file type remains recognizable.
        const ext = path.extname(file.originalname || "").toLowerCase();

        // Normalize file name into a safe base.
        const safeName = sanitizeBaseName(file.originalname || "file");

        // Add unique suffix so concurrent uploads don't overwrite each other.
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

        // Example output: my-video-1711632000000-834572391.mp4
        cb(null, `${safeName}-${uniqueSuffix}${ext}`);
    },
});

// Runs before file is accepted by storage engine.
// If MIME type is not allowed, reject with 400 error.
const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
        // true means "accept this file"
        return cb(null, true);
    }

    // false means file rejected.
    // We also pass ApiError so caller gets a clear message.
    return cb(new ApiError(400, `Unsupported file type: ${file.mimetype}`), false);
};

// Base Multer instance.
// limits:
// - fileSize: max bytes per file (50 MB)
// - files: max number of files in one request (4)
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50 MB
        files: 4,
    },
});

// Wrap multer middleware to convert MulterError into consistent ApiError responses.
// Why wrapper is useful:
// - Multer throws special MulterError objects.
// - Your app expects ApiError format.
// - This adapter keeps one consistent error response style everywhere.
const handleMulter = (multerMiddleware) => {
    return (req, res, next) => {
        multerMiddleware(req, res, (error) => {
            // No error -> continue to controller.
            if (!error) return next();

            if (error instanceof multer.MulterError) {
                // Specific handling for common Multer error codes.
                if (error.code === "LIMIT_FILE_SIZE") {
                    return next(new ApiError(413, "File too large. Max allowed size is 50MB"));
                }

                if (error.code === "LIMIT_FILE_COUNT") {
                    return next(new ApiError(400, "Too many files uploaded. Max allowed is 4"));
                }

                // Fallback for any other Multer error code.
                return next(new ApiError(400, `Upload error: ${error.message}`));
            }

            // Non-Multer error: pass through unchanged.
            return next(error);
        });
    };
};

// Usage examples in routes:
// router.post("/avatar", uploadSingle("avatar"), controllerFn)
// router.post("/video", uploadFields([{ name: "videoFile", maxCount: 1 }, { name: "thumbnail", maxCount: 1 }]), controllerFn)

// Reusable route-ready middlewares:
// - uploadSingle("avatar") -> req.file
// - uploadArray("images", 3) -> req.files (array)
// - uploadFields([...]) -> req.files (object by field name)
export const uploadSingle = (fieldName) => handleMulter(upload.single(fieldName));
export const uploadArray = (fieldName, maxCount = 4) => handleMulter(upload.array(fieldName, maxCount));
export const uploadFields = (fields) => handleMulter(upload.fields(fields));
