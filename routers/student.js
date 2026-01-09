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
        orderBy : {id: "asc"},     
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

router.get("/stuCountbyAcaYr", async (req, res) => {
  try {
    const result = await prisma.student.groupBy({
      by: ["acayr"],
      _count: {
        id: true,
      },
      orderBy: {
        acayr: "asc",
      }
    });

    res.json(
      result.map(r => ({
        academicYear: r.acayr,
        studentCount: r._count.id,
      }))
    );    

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/stuCountbyGrade", async (req, res) => {
  try {
    const result = await prisma.student.groupBy({
      by: ["grade"],
      _count: { id: true },
    });

    // Map and sort logically: KG first, then G-1..G-10 numerically
    const sorted = result
      .map(r => ({
        grade: r.grade,
        count: r._count.id,
      }))
      .sort((a, b) => {
        if (a.grade === "KG") return -1; // KG first
        if (b.grade === "KG") return 1;

        const numA = Number(a.grade.replace("G-", ""));
        const numB = Number(b.grade.replace("G-", ""));

        return numA - numB;
      });

    res.json(sorted);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/kcStuCountbyLC", async (req, res) => {
  try {
    // Group by Learning Center ID (lcID)
    const result = await prisma.student.groupBy({
      by: ["lcID"],
      where: { kidsClubStu: "Yes" }, // Only students in Kids Club
      _count: { id: true },
    });

    // Fetch LC names for each lcID
    const dataWithLCName = await Promise.all(
      result.map(async (r) => {
        const lc = await prisma.learningCenter.findUnique({
          where: { id: r.lcID },
        });
        return {
          lcname: lc ? lc.lcname : "Unknown",
          count: r._count.id,
        };
      })
    );

    res.json(dataWithLCName);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/stuCountbyGender", async (req, res) => {
  try{
    const male = await prisma.student.count({
      where: { gender: "Male" }
    });

    const female = await prisma.student.count({
      where: { gender: "Female" }
    });

    res.json({ male, female });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/totalCountforDashboard", async (req, res) => {
  try{  
    const totalStuCount = await prisma.student.count();

    const totalTeacherCount = await prisma.teacher.count();

    const totalLCCount = await prisma.learningCenter.count();

    res.json({ totalStuCount, totalTeacherCount, totalLCCount });
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
  try{
    const { lcname, acayr, name, stuID, grade, gender, pwd, guardianName, guardianNRC, familyMember, 
        over18Male, over18Female, under18Male, under18Female, stuStatus, acaReview, kidsClubStu, dropoutStu } = req.body;
    if(!lcname || !name || !stuID){        
        return res.status(400).json({msg: "Learning Center, Student Name and Student ID required"});
    }   
 
    const learningCenter = await prisma.learningCenter.findUnique({
            where: { lcname: lcname }, // assuming "name" is unique in LearningCenter model
    });

    if (!learningCenter) {
            return res.status(404).json({ msg: "Learning center not found" });
    }

    const existingstudent = await prisma.student.findUnique({
            where: { stuID: stuID }
    });

    if(existingstudent){
      return res.status(409).json({ msg: "Student ID Already Exists" });
    }

    const student = await prisma.student.create({
        data: { acayr, name, stuID, grade, gender, pwd, guardianName, guardianNRC, familyMember, 
        over18Male, over18Female, under18Male, under18Female, stuStatus, acaReview, kidsClubStu, dropoutStu, lcname: { connect: { id: learningCenter.id } }, },
    });

    res.json(student);
  }
  catch(e){
    console.error("Error creating student:", e);
    res.status(500).json({ msg: "Internal server error", error: e.message });
  }    
});

router.put("/students/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const learningCenter = await prisma.learningCenter.findUnique({
            where: { lcname: data.lcname }, // assuming "name" is unique in LearningCenter model
    });

    if (!learningCenter) {
            return res.status(404).json({ msg: "Learning center not found" });
    }

    const updatedStudent = await prisma.student.update({
      where: { id: Number(id) },
      data: {
        lcname: { connect: { id: learningCenter.id } },
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
         
    const lowerGrades = new Set(['KG', 'G-1', 'G-2', 'G-3']);
    const upperGrades = new Set(['G-4', 'G-5', 'G-6', 'G-7', 'G-8', 'G-9', 'G-10', 'G-11', 'G-12']);

    const mark = examData.average_mark;
    const grade = examData.student.grade;

    if (lowerGrades.has(grade)) {
      examData.average_grade = mark >= 80 ? 'A' : mark >= 40 ? 'E' : 'S';
    } else if (upperGrades.has(grade)) {
      examData.average_grade = mark >= 80 ? 'A' : mark >= 60 ? 'B' : mark >= 40 ? 'C' : 'D';
    }

    const examresults = await prisma.examResults.create({
        data: examData        
    });   
    
    res.json(examresults);
});


router.get("/examresults", async(req, res) => {
    try{
        const data = await prisma.examResults.findMany({       
        orderBy: [
          { studentID: 'asc' },
          { session: 'asc' }
        ],  
        include: {
            student: {
                include:{
                    lcname:{
                        select: {lcname: true}
                    }
                }                
            }    
        },        
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
          orderBy: [
            { studentID: 'asc' },
            { session: 'asc' }
          ], 
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

router.delete("/examResults/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.examResults.delete({
      where: { id: Number(id) },
    });

    res.json({ message: "Exam Results are deleted successfully" });
  } catch (e) {
    console.error("Error deleting exam results:", e);
    res.status(500).json({ error: e.message });
  }
});

router.post("/postAvgMarksandGrade/:id", async(req, res) => {    
    const {submittedData} = req.params;    
    console.log("submittedData in api : ", submittedData);
    // const learningCenter = await prisma.learningCenter.findUnique({
    //         where: { lcname: submittedData.lcname }, // assuming "name" is unique in LearningCenter model
    // });
   
    // if (!learningCenter) {        
    //     return res.status(404).json({ msg: "Learning center not found" });
    // }    

    // const student = await prisma.student.findUnique({
    //     where: { stuID: submittedData.student.stuID }
    // });

    // if (!student) {
    //     return res.status(404).json({ msg: "Student not found" });
    // }      
    res.status(200).json({ msg: "Received" });
});

router.get("/gradingCountforLPforFirstSession", async (req, res) => {
  try{
    const countA = await prisma.examResults.count({
      where: { session: "First Time",
              average_grade: "A",
              student: {
                grade: { in: ["KG", "G-1", "G-2", "G-3"] }
              }
            }
    });

    const countE = await prisma.examResults.count({
      where: { session: "First Time",
              average_grade: "E",
              student: {
                grade: { in: ["KG", "G-1", "G-2", "G-3"] }
              }
            }
    });

    const countS = await prisma.examResults.count({
      where: { session: "First Time",
              average_grade: "S",
              student: {
                grade: { in: ["KG", "G-1", "G-2", "G-3"] }
              }
            }
    });    
    res.json({ countA, countE, countS });    
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/gradingCountforLPforSecondSession", async (req, res) => {
  try{
    const countA = await prisma.examResults.count({
      where: { session: "Second Time",
              average_grade: "A",
              student: {
                grade: { in: ["KG", "G-1", "G-2", "G-3"] }
              }
            }
    });

    const countE = await prisma.examResults.count({
      where: { session: "Second Time",
              average_grade: "E",
              student: {
                grade: { in: ["KG", "G-1", "G-2", "G-3"] }
              }
            }
    });

    const countS = await prisma.examResults.count({
      where: { session: "Second Time",
              average_grade: "S",
              student: {
                grade: { in: ["KG", "G-1", "G-2", "G-3"] }
              }
            }
    });    
    res.json({ countA, countE, countS });    
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/gradingCountforUPforFirstSession", async (req, res) => {
  try{
    const countA = await prisma.examResults.count({
      where: { session: "First Time",
              average_grade: "A",
              student: {
                grade: { in: ["G-4", "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12"] }
              }
            }
    });

    const countB = await prisma.examResults.count({
      where: { session: "First Time",
              average_grade: "B",
              student: {
                grade: { in: ["G-4", "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12"] }
              }
            }
    });

    const countC = await prisma.examResults.count({
      where: { session: "First Time",
              average_grade: "C",
              student: {
                grade: { in: ["G-4", "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12"] }
              }
            }
    });  
    
    const countD = await prisma.examResults.count({
      where: { session: "First Time",
              average_grade: "D",
              student: {
                grade: { in: ["G-4", "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12"] }
              }
            }
    });  
    res.json({ countA, countB, countC, countD });    
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/gradingCountforUPforSecondSession", async (req, res) => {
  try{
    const countA = await prisma.examResults.count({
      where: { session: "Second Time",
              average_grade: "A",
              student: {
                grade: { in: ["G-4", "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12"] }
              }
            }
    });

    const countB = await prisma.examResults.count({
      where: { session: "Second Time",
              average_grade: "B",
              student: {
                grade: { in: ["G-4", "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12"] }
              }
            }
    });

    const countC = await prisma.examResults.count({
      where: { session: "Second Time",
              average_grade: "C",
              student: {
                grade: { in: ["G-4", "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12"] }
              }
            }
    });    

    const countD = await prisma.examResults.count({
      where: { session: "Second Time",
              average_grade: "D",
              student: {
                grade: { in: ["G-4", "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12"] }
              }
            }
    });  
    res.json({ countA, countB, countC, countD });    
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = {studentRouter: router};