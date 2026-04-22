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
const sanitizeFileName = (name) => name.replace(/\s+/g, "_").replace(/[^\w.-]/g, "");

// Upload folder (absolute path)
//const UPLOAD_MOUNT = process.env.UPLOAD_MOUNT || path.join(process.cwd(), "data", "profile_images");

const UPLOAD_ROOT = process.env.UPLOAD_MOUNT || path.join(process.cwd(), "data", "profile-images");
const PROFILE_DIR = path.join(UPLOAD_ROOT, "user-images");
const MATERIAL_DIR = path.join(UPLOAD_ROOT, "teaching-materials");

// Ensure the folder exists
[PROFILE_DIR, MATERIAL_DIR].forEach((dir) => {  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log("✅ Created upload folder at:", dir);
  } else {
    console.log("📂 Using existing upload folder:", dir);
  }
});


// Multer storage configuration
const storage_profile = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PROFILE_DIR),
  filename: (req, file, cb) => {
    const username = desiredName(req.query.username || req.body.username || "user");
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${username}_profile${ext}`);
  },
});

const upload_profile = multer({ storage: storage_profile });

const storage_materials = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MATERIAL_DIR),
  filename: (req, file, cb) => {
    //console.log("original file name : ", desiredName(path.parse(file.originalname).name));
    const originalName = file.originalname;
    const username = sanitizeFileName(path.parse(originalName).name);
    const ext = path.extname(file.originalname);
    cb(null, `${username}_${Date.now()}${ext}`);
  },
});

const upload_materials = multer({ storage: storage_materials });

// -----------------------------
// ROUTES
// -----------------------------
router.post("/upload-profile", upload_profile.single("image"), async (req, res) => {
  try {
    const username = desiredName(req.body.username);
    //const ext = path.extname(req.file.originalname);
    const filename = req.file.filename;//`${username}_profile${ext}`;

    // URL to return to client
    const fileUrl = `${baseUrl}/profile-images/user-images/${filename}`;

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

router.post("/upload-file", upload_materials.single("file"), async (req, res) => {
  try {
    const username = desiredName(req.body.username);
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // ✅ unique filename (avoid overwrite)
    const filename = req.file.filename;

    // OPTIONAL: rename file if needed
    //const fs = require("fs");
    //const newPath = `uploads/documents/${filename}`;
    //fs.renameSync(req.file.path, newPath);

    // ✅ URL to send back
    const fileUrl = `${baseUrl}/profile-images/teaching-materials/${filename}`;

    console.log("📤 File uploaded:", filename);

    // 👉 OPTIONAL: save to DB (recommended)
    await prisma.file.create({
       data: {
         name: req.file.originalname,
         url: fileUrl,
         userName: username,
       },
     });

    res.json({
      url: fileUrl,
      name: req.file.originalname,
    });

  } catch (err) {
    console.error("❌ Upload failed:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

router.get("/files", async (req, res) => {
  try {
    const files = await prisma.file.findMany({
      orderBy: {
        uploadedDate: "desc",
      },
    });

    res.json(files);
  } catch (err) {
    console.error("❌ Fetch files failed:", err);
    res.status(500).json({ error: "Failed to fetch files" });
  }
});

module.exports = { uploadRouter: router };