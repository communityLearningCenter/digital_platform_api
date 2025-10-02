
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const prisma = require("../prismaClient");

const router = express.Router();

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "..", "Profile Images");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const username = req.query.username; // get from query
    const ext = path.extname(file.originalname);
    cb(null, `${username}_profile${ext}`);
  }
});

const upload = multer({ storage });

// API route
router.post("/upload-profile", upload.single("image"), async (req, res) => {    
    try {
    const username = req.body.username;
    const ext = path.extname(req.file.originalname);
    const filename = `${username}_profile${ext}`;
    //const filePath = path.join("Profile Images", filename); // relative path
    const fileUrl = `http://localhost:8000/profile-images/${filename}`;

    // Update User table
    const updatedUser = await prisma.user.update({
      where: { name: username },
      data: { avatarUrl: fileUrl }
    });

    res.json({ message: "File uploaded!", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = {uploadRouter: router};
