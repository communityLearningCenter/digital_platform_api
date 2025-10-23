// routes/upload.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const prisma = require("../prismaClient");

const router = express.Router();

// Base URL for client links (optional)
const baseUrl = process.env.VITE_API_URL || `http://localhost:8000`;

// Helper function to sanitize usernames
const desiredName = (original) => original.replace(/\s+/g, "_");

// Upload folder (absolute path)
const UPLOAD_MOUNT =
  process.env.UPLOAD_MOUNT || path.join(process.cwd(), "data", "profile_images");

// Ensure the folder exists
if (!fs.existsSync(UPLOAD_MOUNT)) {
  fs.mkdirSync(UPLOAD_MOUNT, { recursive: true });
  console.log("✅ Created upload folder at:", UPLOAD_MOUNT);
} else {
  console.log("📂 Using existing upload folder:", UPLOAD_MOUNT);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_MOUNT),
  filename: (req, file, cb) => {
    const username = desiredName(req.query.username || req.body.username || "user");
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${username}_profile${ext}`);
  },
});

const upload = multer({ storage });

// -----------------------------
// ROUTES
// -----------------------------
router.post("/upload-profile", upload.single("image"), async (req, res) => {
  try {
    const username = desiredName(req.body.username);
    const ext = path.extname(req.file.originalname);
    const filename = `${username}_profile${ext}`;

    // URL to return to client
    const fileUrl = `${baseUrl}/profile-images/${filename}`;

    // Update user record in database
    const updatedUser = await prisma.user.update({
      where: { name: req.body.username },
      data: { avatarUrl: fileUrl },
    });

    console.log("📤 File uploaded to:", req.file.path);

    res.json({ message: "File uploaded!", user: updatedUser });
  } catch (err) {
    console.error("❌ Upload failed:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = { uploadRouter: router };