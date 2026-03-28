import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { ApiError } from "../utils/apiError.js";

// ============================================================
// VIDEO MODEL
// ============================================================
// What: Defines how a video document is stored in MongoDB.
// Why: Keeps data consistent and validates user input before save.

const videoSchema = new Schema(
	{
		// Cloudinary URL for the actual uploaded video file.
		videoFile: {
			type: String,
			required: [true, "Video file URL is required"],
			trim: true,
			validate: {
				validator: function (value) {
					// Minimal URL check to prevent broken/non-string values.
					return /^https?:\/\//i.test(value);
				},
				message: "Video file must be a valid URL",
			},
		},

		// Cloudinary URL for thumbnail image shown in listings/cards.
		thumbnail: {
			type: String,
			required: [true, "Thumbnail URL is required"],
			trim: true,
			validate: {
				validator: function (value) {
					return /^https?:\/\//i.test(value);
				},
				message: "Thumbnail must be a valid URL",
			},
		},

		// Human-readable video title shown to users.
		title: {
			type: String,
			required: [true, "Title is required"],
			trim: true,
			minlength: [3, "Title must be at least 3 characters"],
			maxlength: [120, "Title cannot exceed 120 characters"],
			index: true,
		},

		// Optional but recommended detailed description.
		description: {
			type: String,
			required: [true, "Description is required"],
			trim: true,
			minlength: [10, "Description must be at least 10 characters"],
			maxlength: [5000, "Description cannot exceed 5000 characters"],
		},

		// Duration in seconds.
		duration: {
			type: Number,
			required: [true, "Duration is required"],
			min: [1, "Duration must be at least 1 second"],
		},

		// Total watch count; cannot be negative.
		views: {
			type: Number,
			default: 0,
			min: [0, "Views cannot be negative"],
		},

		// Publish state controls visibility to end users.
		isPublished: {
			type: Boolean,
			default: true,
			index: true,
		},

		// Owner is the user who uploaded this video.
		owner: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: [true, "Video owner is required"],
			index: true,
		},
	},
	{
		timestamps: true,
	}
);

// Useful compound index for feed queries (published videos sorted by latest).
videoSchema.index({ isPublished: 1, createdAt: -1 });

// ============================================================
// PRE-VALIDATE MIDDLEWARE
// ============================================================
// What: Cleans/sanitizes fields before schema validation runs.
// Why: Avoids storing accidental extra spaces and catches bad owner values early.
videoSchema.pre("validate", function (next) {
	try {
		if (typeof this.title === "string") this.title = this.title.trim();
		if (typeof this.description === "string") this.description = this.description.trim();

		if (this.owner && !mongoose.Types.ObjectId.isValid(this.owner)) {
			return next(new ApiError(400, "Invalid owner id for video"));
		}

		return next();
	} catch (error) {
		return next(error);
	}
});

// Adds aggregate pagination support: Video.aggregatePaginate(...)
videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
