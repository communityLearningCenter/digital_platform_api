const express = require("express")
const router = express.Router();
const prisma = require("../prismaClient");

router.get("/students", async(req, res) => {
    try{
        const data = await prisma.student.findMany({        
        include: {
            examresults: true, 
            lcname: { // relation field
                select: { lcname: true }, // only bring the name
            },
        },
        take: 20,
    });

    const students = data.map(s => ({
        ...s, lcname: s.lcname.lcname // flatten
    }));

    res.json(students);
    }
    catch(e){
        res.status(500).json({error:e});
    }
});

router.get("/registration/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const student = await prisma.student.findUnique({
      where: { id: Number(id) },
      include: {
        lcname: true,       // relation field name in your Prisma model
        examresults: true,
      },
    });

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Flatten the relation safely
    const result = {
      ...student,
      lcname: student.lcname ? student.lcname.lcname : null,
    };

    res.json(result); // ✅ send the correct object
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/learningcenters/:id/students", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await prisma.student.findMany({
      where: { lcID: Number(id) },
       include: {
         lcname: true,        
       },
    });

    //console.log("Students :", data)

    const students = data.map(s => ({
      ...s,
      lcname: s.lcname ? s.lcname.lcname : null // flatten safely
    }));

    res.json(students);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


router.post("/postStudent", async(req, res) => {
    const { lcname, acayr, name, stuID, grade, gender, pwd, guardianName, guardianNRC, familyMember, 
        over18Male, over18Female, under18Male, under18Female, stuStatus, acaReview, kidsClubStu, dropoutStu } = req.body;
    if(!lcname || !name || !stuID){        
        return res.status(400).json({msg: "name, role and password required"});
    }
 
    const learningCenter = await prisma.learningCenter.findUnique({
            where: { lcname: lcname }, // assuming "name" is unique in LearningCenter model
    });

    if (!learningCenter) {
            return res.status(404).json({ msg: "Learning center not found" });
    }

    const student = await prisma.student.create({
        data: { acayr, name, stuID, grade, gender, pwd, guardianName, guardianNRC, familyMember, 
        over18Male, over18Female, under18Male, under18Female, stuStatus, acaReview, kidsClubStu, dropoutStu, lcname: { connect: { id: learningCenter.id } }, },
    });

    res.json(student);
});

router.put("/students/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const updatedStudent = await prisma.student.update({
      where: { id: Number(id) },
      data: {
        lcID: data.lcID,  // or map lcname -> lcID if needed
        acayr: data.acayr,
        name: data.name,
        stuID: data.stuID,
        grade: data.grade,
        gender: data.gender,
        pwd: data.pwd,
        guardianName: data.guardianName,
        guardianNRC: data.guardianNRC,
        familyMember: data.familyMember,
        over18Male: data.over18Male,
        over18Female: data.over18Female,
        under18Male: data.under18Male,
        under18Female: data.under18Female,
        stuStatus: data.stuStatus,
        acaReview: data.acaReview,
        kidsClubStu: data.kidsClubStu,
        dropoutStu: data.dropoutStu,
        modifiedOn: new Date(),
      },
    });

    res.json(updatedStudent);
  } catch (e) {
    console.error("Error updating student:", e);
    res.status(500).json({ error: e.message });
  }
});

router.delete("/students/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.student.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Student deleted successfully" });
  } catch (e) {
    console.error("Error deleting student:", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/postExamResults", async(req, res) => {    
    const submittedData = req.body;    
     /*if(!submittedData.lcname || !submittedData.student.stuID){
         return res.status(400).json({msg: "Learning Center and Students Name are required"});
     }*/
    console.log("submitted : ", submittedData);
    const learningCenter = await prisma.learningCenter.findUnique({
            where: { lcname: submittedData.lcname }, // assuming "name" is unique in LearningCenter model
    });
   
    if (!learningCenter) {        
        return res.status(404).json({ msg: "Learning center not found" });
    }    

    const student = await prisma.student.findUnique({
        where: { stuID: submittedData.student.stuID }
    });
    if (!student) {
        return res.status(404).json({ msg: "Student not found" });
    }

    const subjectMap = {
        "Myanmar": "myanmar",
        "English": "english",
        "Mathematics": "maths",
        "Science": "science",
        "Society": "social",
        "Geography": "geography",
        "History": "history",
        "Child Rights": "childrights",
        "SRHR and Gender": "srhr",
        "PSS": "pss",
        "Kid's Club": "kidsclub",
        "Attendance": "attendance"
    };

    // Subjects you want to count toward total
    const subjectsForTotal = [
        "Myanmar",
        "English",
        "Mathematics",
        "Science",
        "Society",
        "Geography",
        "History",
    ];

  let totalMarks = 0;
  let countedSubjects = 0;

    const examData = {session: submittedData.session, student: {connect:{id: student.id}}, average_mark: 0, average_grade: "N/A"};

    submittedData.results.forEach(result => {
            const subjectKey = subjectMap[result.subject];
            if (subjectKey) {
                examData[`${subjectKey}_mark`] = parseInt(result.mark,10) || 0;
                examData[`${subjectKey}_grade`] = result.grading;       
                
                if(subjectsForTotal.includes(result.subject)){
                    totalMarks += parseInt(result.mark, 10) || 0;                     
                    countedSubjects++;
                }
            }
        });    
    // Add total and average
    examData.total_marks = totalMarks;
    examData.average_mark = countedSubjects
        ? Number((totalMarks / countedSubjects).toFixed(2))
        : 0;

    const examresults = await prisma.examResults.create({
        data: examData
        
    });
    
    res.json(examresults);
});


router.get("/examresults", async(req, res) => {
    try{
        const data = await prisma.examResults.findMany({        
        include: {
            student: {
                include:{
                    lcname:{
                        select: {lcname: true}
                    }
                }                
            }    
        },
        take: 20,
    });

    const examresults = data.map(s => ({...s, 
        lcname: s.student.lcname.lcname, 
        acayr: s.student.acayr, 
        name: s.student.name, 
        stuID: s.student.stuID, 
        grade: s.student.grade
    }));

    res.json(examresults);
    }
    catch(e){
        res.status(500).json({error:e});
    }
});

router.get("/learningcenters/:id/examresults", async(req, res) => {
    const { id } = req.params;
    try{       
        const data = await prisma.examResults.findMany({  
             where: {
                student: { lcID: Number(id) }, // ✅ filter at top level
            },
            include: {
                student: {
                include: {
                    lcname: {
                    select: { lcname: true },
                    },
                },
                },
            },
            take: 20,
        });

        const examresults = data.map(s => ({...s, 
            lcname: s.student.lcname.lcname, 
            acayr: s.student.acayr, 
            name: s.student.name, 
            stuID: s.student.stuID, 
            grade: s.student.grade
        }));

        res.json(examresults);
    }
    catch(e){
        res.status(500).json({error:e});
    }
});

module.exports = {studentRouter: router};