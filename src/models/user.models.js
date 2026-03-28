// ============================================
// USER MODEL - Database Schema Definition
// ============================================
// This file defines the structure and behavior of user documents in MongoDB

import mongoose from "mongoose";
import { Schema } from "mongoose";
import bcrypt from "bcrypt"; // For hashing passwords securely
import jwt from "jsonwebtoken"; // For creating authentication tokens

// Define the shape of user data that will be stored in the database
const userSchema = new Schema(
    {
        // Unique username for login (stored in lowercase to avoid case-sensitivity issues)
        username: {
            required: true,
            unique: true, // No two users can have the same username
            type: String,
            lowercase: true, // 'UserName' becomes 'username' automatically
            trim: true, // Removes whitespace from both ends
            index: true // Creates database index for faster searches
        },
        
        // Unique email address for account recovery and notifications
        email: {
            type: String,
            unique: true, // No two users can have the same email
            lowercase: true,
            trim: true,
            required: true,
            validate: {
                validator: function(v) {
                    // Check email format using regex
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
                },
                message: 'Please provide a valid email address'
            }
        },
        
        // User's actual full name for display purposes
        FullName: {
            type: String,
            required: true,
            trim: true,
            index: true // Indexed for faster name-based searches
        },
        
        // Profile picture URL from Cloudinary (image hosting service)
        avatar: {
            type: String, // cloudinary url
            required: false, // Optional - user can add later
        },
        
        // Background/cover image for user profile
        coverImage: {
            type: String, // cloudinary url
            // Optional field - not required
        },
        
        // Array of video IDs that the user has watched
        // This tracks user's viewing history
        watchHistory: [
            {
                type: Schema.Types.ObjectId, // Reference to Video document ID
                ref: "Video" // Links to the Video model
            }
        ],
        
        // User's password (stored hashed, never plain text)
        password: {
            type: String,
            required: [true, 'Password is required'], // Custom error message if missing
            minlength: [6, 'Password must be at least 6 characters long']
        },
        
        // Long-lived token used to refresh the access token when it expires
        refreshToken: {
            type: String
            // Not required - only set after successful login
        }

    },
    {
        // Automatically add createdAt and updatedAt timestamps
        timestamps: true
    }
    
)

// ============================================
// MIDDLEWARE: Pre-save Hook
// ============================================
// This runs BEFORE saving a user document to the database
// Used to hash the password so it's never stored in plain text
userSchema.pre("save", async function(next) {
    try {
        // Check if password was actually modified in this save operation
        // If user updates only their email/username, skip password hashing
        if(!this.isModified("password")) return next();

        // Hash the password with bcrypt (salt rounds = 10)
        // This converts password from plain text to an irreversible hash
        // Example: "myPassword123" → "$2b$10$aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT1uV2wX3yZ4aB5c6d7e8f9"
        this.password = await bcrypt.hash(this.password, 10);
        
        next(); // Continue with saving
    } catch(error) {
        // If password hashing fails, pass the error to the next middleware
        next(error);
    }
})

// ============================================
// CUSTOM METHODS (functions attached to user documents)
// ============================================

// Method 1: Verify if provided password matches the stored hashed password
// WHY: During login, we can't compare plain text with hashed password directly
// WHAT: Compares the login password with the stored hash using bcrypt
userSchema.methods.isPasswordCorrect = async function(password) {
    // bcrypt.compare returns true if password matches the hash
    return await bcrypt.compare(password, this.password);
}

// Method 2: Create a short-lived access token for authentication
// WHY: Client needs a token to prove they're logged in (expires quickly for security)
// WHAT: Encodes user info + secret key to create a tamper-proof token
userSchema.methods.generateAccessToken = function() {
    // jwt.sign creates a token containing user data + expiration
    return jwt.sign(
        {
            // Data encoded in the token (payload)
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.FullName
        },
        process.env.ACCESS_TOKEN_SECRET, // Secret key from .env (no one else knows it)
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY // Usually "15m" (15 minutes)
        }
    )
}

// Method 3: Create a long-lived refresh token
// WHY: When access token expires, we use refresh token to get a new access token
//      without asking user to login again
// WHAT: Creates a simpler token (only contains user ID for security)
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            // Only include ID (minimal info for security reasons)
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY // Usually "7d" (7 days)
        }
    )
}

// ============================================
// EXPORT MODEL
// ============================================
// Create and export the User model based on this schema
// mongoose.model("User", userSchema) makes this schema available in the app
export default mongoose.model("User", userSchema);