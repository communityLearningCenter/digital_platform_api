
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const prisma = require("../prismaClient");
const app = express();

const router = express.Router();
const baseUrl = process.env.VITE_API_URL || `https://digital-platform-client.onrender.com`;

// Multer storage config
/*const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "..", "Profile Images");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const username = desiredName(req.query.username); // get from query
    const ext = path.extname(file.originalname);
    cb(null, `${username}_profile${ext}`);
  }
});*/

const UPLOAD_MOUNT = process.env.UPLOAD_MOUNT || "/data/profile-images";

// ensure dir exists at runtime
if (!fs.existsSync(UPLOAD_MOUNT)) {
  fs.mkdirSync(UPLOAD_MOUNT, { recursive: true });
}

// Serve uploaded files publicly
app.use("/profile-images", express.static(UPLOAD_MOUNT));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // write files directly to the mount path (absolute)
    cb(null, UPLOAD_MOUNT);
  },
  filename: function (req, file, cb) {
    const username = desiredName(req.query.username || req.body.username || "user");
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${username}_profile${ext}`);
  }
});

const upload = multer({ storage });
const desiredName = (original) => {
  return original
    .replace(/\s+/g, '_')                   // spaces -> underscores
}

// API route
router.post("/upload-profile", upload.single("image"), async (req, res) => {    
    try {      
      const username =  desiredName(req.body.username);
      const ext = path.extname(req.file.originalname);
      const filename = `${username}_profile${ext}`;
      //const filePath = path.join("Profile Images", filename); // relative path
      const fileUrl = `${baseUrl}/profile-images/${filename}`;//`${UPLOAD_MOUNT}/${filename}`;//`http://localhost:8000/profile-images/${filename}`;      

      // Update User table
      const updatedUser = await prisma.user.update({
        where: { name: req.body.username },
        data: { avatarUrl: fileUrl }
    });

    res.json({ message: "File uploaded!", user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
});

module.exports = {uploadRouter: router};
