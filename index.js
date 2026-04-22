const express = require ("express");
const app = express();
const prisma = require ("./prismaClient");
const cors = require ("cors");
const path = require("path");
app.use(cors());

app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

app.use(express.json());
app.use(express.urlencoded({extended:true}));

const {userRouter} = require("./routers/user");
app.use("/", userRouter);

const {learningCenterRouter} = require("./routers/learningcenter");
app.use("/", learningCenterRouter);

const {academicYearRouter} = require("./routers/academicyear");
app.use("/", academicYearRouter);

const {studentRouter} = require("./routers/student");
app.use("/", studentRouter);

const {teacherRouter} = require("./routers/teacher");
app.use("/", teacherRouter);

const {uploadRouter} = require("./routers/upload");
// Mount your router
app.use("/", uploadRouter);

// Serve uploaded files publicly (main app)
const UPLOAD_MOUNT = process.env.UPLOAD_MOUNT || path.join(process.cwd(), "data", "profile-images");
app.use("/profile-images", express.static(UPLOAD_MOUNT));
//app.use("/teaching-materials", express.static(UPLOAD_MOUNT));


//app.use("/profile-images", express.static(path.join(__dirname, "Profile Images")));

app.get("/info", (req, res) => {
    res.json({msg: "Digital Platform"});
});

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`🚀 Digital Platform started at port ${PORT}....`);
});

const gracefulShutdown = async () => {
    await prisma.$disconnect();
    server.close(() => {
        console.log("Digital Platform is closed.")
        process.exit(0);
    });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);