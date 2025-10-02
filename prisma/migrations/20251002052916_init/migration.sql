-- CreateTable
CREATE TABLE "LearningCenter" (
    "id" SERIAL NOT NULL,
    "lcname" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "learningCenterId" INTEGER,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avatarUrl" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "id" SERIAL NOT NULL,
    "teacherName" TEXT NOT NULL,
    "teacherNRC" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lcID" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "phnumber" TEXT NOT NULL,
    "joinDate" TIMESTAMP(3) NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" SERIAL NOT NULL,
    "lcID" INTEGER NOT NULL,
    "acayr" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stuID" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "pwd" TEXT NOT NULL,
    "gurdianName" TEXT NOT NULL,
    "gurdianNRC" TEXT NOT NULL,
    "familyMember" INTEGER NOT NULL,
    "over18Male" INTEGER NOT NULL,
    "over18Female" INTEGER NOT NULL,
    "under18Male" INTEGER NOT NULL,
    "under18Female" INTEGER NOT NULL,
    "stuStatus" TEXT NOT NULL,
    "acaReview" TEXT NOT NULL,
    "kidsClubStu" TEXT NOT NULL,
    "dropoutStu" TEXT NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamResults" (
    "id" SERIAL NOT NULL,
    "studentID" INTEGER NOT NULL,
    "session" TEXT NOT NULL,
    "myanmar_mark" INTEGER NOT NULL,
    "myanmar_grade" TEXT NOT NULL,
    "english_mark" INTEGER NOT NULL,
    "english_grade" TEXT NOT NULL,
    "maths_mark" INTEGER NOT NULL,
    "maths_grade" TEXT NOT NULL,
    "science_mark" INTEGER NOT NULL,
    "science_grade" TEXT NOT NULL,
    "social_mark" INTEGER,
    "social_grade" TEXT,
    "geography_mark" INTEGER,
    "geography_grade" TEXT,
    "history_mark" INTEGER,
    "history_grade" TEXT,
    "childrights_mark" INTEGER NOT NULL,
    "childrights_grade" TEXT NOT NULL,
    "srhr_mark" INTEGER NOT NULL,
    "srhr_grade" TEXT NOT NULL,
    "pss_mark" INTEGER NOT NULL,
    "pss_grade" TEXT NOT NULL,
    "kidsclub_mark" INTEGER NOT NULL,
    "kidsclub_grade" TEXT NOT NULL,
    "average_mark" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "average_grade" TEXT NOT NULL,
    "attendance_mark" INTEGER NOT NULL,
    "attendance_grade" TEXT NOT NULL,
    "total_marks" INTEGER NOT NULL DEFAULT 0,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifiedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamResults_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LearningCenter_lcname_key" ON "LearningCenter"("lcname");

-- CreateIndex
CREATE UNIQUE INDEX "User_name_key" ON "User"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Student_stuID_key" ON "Student"("stuID");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_learningCenterId_fkey" FOREIGN KEY ("learningCenterId") REFERENCES "LearningCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Teacher" ADD CONSTRAINT "Teacher_lcID_fkey" FOREIGN KEY ("lcID") REFERENCES "LearningCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_lcID_fkey" FOREIGN KEY ("lcID") REFERENCES "LearningCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamResults" ADD CONSTRAINT "ExamResults_studentID_fkey" FOREIGN KEY ("studentID") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
