const express = require ("express");
const app = express();
const prisma = require ("./prismaClient");
const cors = require ("cors");
const path = require("path");
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({extended:true}));

const {userRouter} = require("./routers/user");
app.use("/", userRouter);

const {learningCenterRouter} = require("./routers/learningcenter");
app.use("/", learningCenterRouter);

const {studentRouter} = require("./routers/student");
app.use("/", studentRouter);

const {teacherRouter} = require("./routers/teacher");
app.use("/", teacherRouter);

const {uploadRouter} = require("./routers/upload");
app.use("/", uploadRouter);
app.use("/profile-images", express.static(path.join(__dirname, "Profile Images")));

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