const express = require("express")
const router = express.Router();
const prisma = require("../prismaClient");

router.get("/students", async(req, res) => {
  const { acayr } = req.query;
    try{
        const data = await prisma.student.findMany({   
          where: acayr ? { acayr } : {},     
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

router.get("/learningcenters/:id/students", async (req, res) => {
  const { id } = req.params;
  const { acayr } = req.query;
  try {
    const data = await prisma.student.findMany({
      where: { lcID: Number(id),
        ...(acayr && { acayr }),
      },
       include: {
         lcname: true,        
       },
       orderBy : {id: "asc"},     
    });

    const students = data.map(s => ({
      ...s,
      lcname: s.lcname ? s.lcname.lcname : null // flatten safely
    }));

    res.json(students);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/registration/id/:id", async (req, res) => {
  const  id  = Number(req.params.id);
  try {
    const student = await prisma.student.findUnique({
      where: { id: id },
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

router.get("/registration/by-stuid/:stuID", async (req, res) => {
  const { stuID } = req.params;
  try {
    const student = await prisma.student.findFirst({
      where: { stuID: stuID },
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
    const { acayr, lcID } = req.query;

    if (!acayr) {
      return res.status(400).json({
        error: "Academic year is required"
      });
    }

    if (!lcID) {
      return res.status(400).json({
        error: "Learning center ID is required"
      });
    }

    // Group by Grade and Gender
    const result = await prisma.student.groupBy({
      by: ["grade", "gender"],
      where: {
        acayr: acayr,
        lcID: Number(lcID),
        grade: {
          not: "Preschool"
        }
      },
      _count: {
        id: true
      }
    });

    // Reshape data for chart
    const grouped = {};

    result.forEach((r) => {
      if (!grouped[r.grade]) {
        grouped[r.grade] = {
          grade: r.grade,
          male: 0,
          female: 0,
          count: 0
        };
      }

      if (r.gender === "Male") {
        grouped[r.grade].male = r._count.id;
      }

      if (r.gender === "Female") {
        grouped[r.grade].female = r._count.id;
      }

      grouped[r.grade].count += r._count.id;
    });

    // Convert object to array and sort by grade
    const dataWithGrade = Object.values(grouped).sort((a, b) => {
      if (a.grade === "KG") return -1;
      if (b.grade === "KG") return 1;

      const numA = Number(a.grade.replace("G-", ""));
      const numB = Number(b.grade.replace("G-", ""));

      return numA - numB;
    });

    res.json(dataWithGrade);

  } catch (e) {
    res.status(500).json({
      error: e.message
    });
  }
});

// router.get("/stuCountbyGrade", async (req, res) => {  
//   try {
//     const {acayr, lcID} = req.query;
//     if (!acayr) {
//         return res.status(400).json({ error: "Academic year is required" });
//     }

//     // Base filter 
//     const where = { acayr: acayr, }; 

//     // Only add lcID filter when lcID has a value 
//     if (lcID !== undefined && lcID !== null && lcID !== "") { 
//       const learningcenterID = Number(lcID); 
//         if (Number.isNaN(learningcenterID)) { 
//           return res.status(400).json({ error: "Invalid lcID", }); 
//         } where.lcID = learningcenterID; 
//         console.log("Filtering by lcID:", learningcenterID); 
//     } 
//     else { 
//         console.log("No lcID provided - retrieving all learning centers"); 
//     } 

//     console.log("where : ", where);

//     const result = await prisma.student.groupBy({
//       by: ["grade"],
//       where: {
//         //acayr: acayr, // 👈 filter by year
//         ...where,   
//       },      
//       _count: { id: true },
//     });

//     // Get male and female counts 
//     const male = result.find(r => r.gender === "Male")?._count.id || 0; 
//     const female = result.find(r => r.gender === "Female")?._count.id || 0; 
//     const total = male + female; 
//     console.log("male : ", male);
//     console.log("female :", female);
//     console.log("total : ", total);
//     res.json({ male, female, total, });  

//     // // Map and sort logically: KG first, then G-1..G-10 numerically
//     // const sorted = result
//     //   .map(r => ({
//     //     grade: r.grade,
//     //     count: r._count.id,
//     //   }))
//     //   .sort((a, b) => {
//     //     if (a.grade === "KG") return -1; // KG first
//     //     if (b.grade === "KG") return 1;

//     //     const numA = Number(a.grade.replace("G-", ""));
//     //     const numB = Number(b.grade.replace("G-", ""));

//     //     return numA - numB;
//     //   });

//     // res.json(sorted);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

router.get("/kcStuCountbyLC", async (req, res) => {
  try {
    const { acayr } = req.query;

    // Group by Learning Center and Gender
    const result = await prisma.student.groupBy({
      by: ["lcID","gender"],
      where: {
        kidsClubStu: "Yes",
        acayr: acayr,
        grade: { not: "Preschool" }
      },
      _count: {
        id: true
      }
    });

    // Get unique Learning Center IDs
    const lcIDs = [...new Set(result.map((r) => r.lcID))];

    // Fetch Learning Center names
    const learningCenters = await prisma.learningCenter.findMany({
      where: {
        id: {
          in: lcIDs
        }
      },
      select: {
        id: true,
        lcname: true
      }
    });

    // Create LC lookup
    const lcMap = {};

    learningCenters.forEach((lc) => {
      lcMap[lc.id] = lc.lcname;
    });

    // Reshape data for stacked bar chart
    const grouped = {};

    result.forEach((r) => {
      if (!grouped[r.lcID]) {
        grouped[r.lcID] = {
          lcname: lcMap[r.lcID] || "Unknown",
          male: 0,
          female: 0,
          count: 0
        };
      }

      if (r.gender === "Male") {
        grouped[r.lcID].male = r._count.id;
      }

      if (r.gender === "Female") {
        grouped[r.lcID].female = r._count.id;
      }

      grouped[r.lcID].count += r._count.id;
    });

    const dataWithLCName = Object.values(grouped);

    res.json(dataWithLCName);
  } 
    catch (e) { 
      res.status(500).json({ error: e.message, }); 
    } 
  });

// router.get("/kcStuCountbyLC", async (req, res) => {
//   try {
//     const {acayr} = req.query;
//     // Group by Learning Center ID (lcID)
//     const result = await prisma.student.groupBy({
//       by: ["lcID"],
//       where: { kidsClubStu: "Yes",
//               acayr: acayr,
//               grade: { not: "Preschool" }
//       }, // Only students in Kids Club
//       _count: { id: true },
//     });

//     // Fetch LC names for each lcID
//     const dataWithLCName = await Promise.all(
//       result.map(async (r) => {
//         const lc = await prisma.learningCenter.findUnique({
//           where: { id: r.lcID },
//         });
//         return {
//           lcname: lc ? lc.lcname : "Unknown",
//           count: r._count.id,
//         };
//       })
//     );

//     res.json(dataWithLCName);
//   } catch (e) {
//     res.status(500).json({ error: e.message });
//   }
// });

router.get("/allStuCountbyLC", async (req, res) => {
  try {
    const {acayr} = req.query;
    // Group by Learning Center ID (lcID)
    const result = await prisma.student.groupBy({
      by: ["lcID", "gender"],
      where: { acayr: acayr, 
        grade: { not: "Preschool" }
      },
      _count: { id: true },
    });

    // Fetch LC names for each lcID
    // Get unique Learning Center IDs
    const lcIDs = [...new Set(result.map((r) => r.lcID))];

    // Fetch Learning Center names
    const learningCenters = await prisma.learningCenter.findMany({
      where: {
        id: {
          in: lcIDs
        }
      },
      select: {
        id: true,
        lcname: true
      }
    });

    // Create LC lookup
    const lcMap = {};

    learningCenters.forEach((lc) => {
      lcMap[lc.id] = lc.lcname;
    });

    // Reshape data for stacked bar chart
    const grouped = {};

    result.forEach((r) => {
      if (!grouped[r.lcID]) {
        grouped[r.lcID] = {
          lcname: lcMap[r.lcID] || "Unknown",
          male: 0,
          female: 0,
          count: 0
        };
      }

      if (r.gender === "Male") {
        grouped[r.lcID].male = r._count.id;
      }

      if (r.gender === "Female") {
        grouped[r.lcID].female = r._count.id;
      }

      grouped[r.lcID].count += r._count.id;
    });

    const dataWithLCName = Object.values(grouped);

    res.json(dataWithLCName);

  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: e.message
    });
  }
});

/*router.get("/stuCountbyGender", async (req, res) => {
  try{
    const {acayr, lcID} = req.query;    
    console.log("acayr : ", acayr);
    
    if (lcID !== undefined && lcID !== null && lcID !== "") {
      const learningcenterID = Number (lcID);
      console.log("lcID : ", learningcenterID);
    }
    if (!acayr) {
        return res.status(400).json({ error: "Academic year is required" });
    }    

    const male = await prisma.student.count({
      where: { gender: "Male",
              acayr: acayr,
              lcID: learningcenterID,
              grade: { not: "Preschool" }
       }
    });

    const female = await prisma.student.count({
      where: { gender: "Female",
                acayr: acayr,
                lcID: learningcenterID,
                grade: { not: "Preschool" }
       }
    });

    const preMale = await prisma.student.count({
      where: { gender: "Male",
              acayr: acayr,
              lcID: learningcenterID,
              grade: "Preschool" 
       }
    });

    const preFemale = await prisma.student.count({
      where: { gender: "Female",
                acayr: acayr,
                lcID: learningcenterID,
                grade: "Preschool" 
       }
    });

    console.log("male count(w/h pwd) :", male);
    console.log("female count(w/h pwd) :", female);
    console.log("pwd male count :", preMale);
    console.log("pwd female count :", preFemale);

    res.json({ male, female, preMale, preFemale });

  } catch (e) {
      res.status(500).json({ error: e.message });
  }
});*/

router.get("/stuCountbyGender", async (req, res) => { 
  try { const { acayr, lcID } = req.query; 
  if (!acayr) { 
    return res.status(400).json({ error: "Academic year is required", }); 
  } 

  // Base filter 
  const where = { acayr: acayr, }; 
  
  // Only add lcID filter when lcID has a value 
  if (lcID !== undefined && lcID !== null && lcID !== "") { 
    const learningcenterID = Number(lcID); 
      if (Number.isNaN(learningcenterID)) { 
        return res.status(400).json({ error: "Invalid lcID", }); 
      } where.lcID = learningcenterID;     
    }
    
    const male = await prisma.student.count({ 
      where: { ...where, 
        gender: "Male", 
        pwd: "No",
        grade: { not: "Preschool", }, 
      }, 
    }); 
    
    const female = await prisma.student.count({ 
      where: { ...where, 
        gender: "Female", 
        pwd: "No",
        grade: { not: "Preschool", }, 
      }, 
    }); 

    const male_pwd = await prisma.student.count({ 
      where: { ...where, 
        gender: "Male", 
        pwd: "Yes",
        grade: { not: "Preschool", }, 
      }, 
    }); 
    
    const female_pwd = await prisma.student.count({ 
      where: { ...where, 
        gender: "Female", 
        pwd: "Yes",
        grade: { not: "Preschool", }, 
      }, 
    }); 
    
    const preMale = await prisma.student.count({ 
      where: { ...where, 
        gender: "Male", 
        pwd: "No",
        grade: "Preschool", 
      }, 
    }); 
    
    const preFemale = await prisma.student.count({ 
      where: { ...where, 
        gender: "Female", 
        pwd: "No",
        grade: "Preschool", 
      }, 
    }); 

    const preMale_pwd = await prisma.student.count({ 
      where: { ...where, 
        gender: "Male", 
        pwd: "Yes",
        grade: "Preschool", 
      }, 
    }); 
    
    const preFemale_pwd = await prisma.student.count({ 
      where: { ...where, 
        gender: "Female", 
        pwd: "Yes",
        grade: "Preschool", 
      }, 
    }); 
    
    res.json({ male, female, male_pwd, female_pwd, preMale, preFemale, preMale_pwd, preFemale_pwd}); } 
    catch (e) { 
      console.error(e); res.status(500).json({ error: e.message, }); 
    } 
  });

router.get("/stuCountbyEnrollStatus", async (req,res) => {
  const {acayr, lcID} = req.query;
  if (!acayr) {
      return res.status(400).json({ error: "Academic year is required" });
  }

  // Base filter 
  const where = { acayr: acayr, }; 

  // Only add lcID filter when lcID has a value 
    if (lcID !== undefined && lcID !== null && lcID !== "") { 
      const learningcenterID = Number(lcID); 
        if (Number.isNaN(learningcenterID)) { 
          return res.status(400).json({ error: "Invalid lcID", }); 
        } where.lcID = learningcenterID; 
    } 
    else { 
        console.log("No lcID provided - retrieving all learning centers"); 
    } 

  try{
    const old_count = await prisma.student.count({
      where: {...where, 
              stuStatus: "Old",
              grade: { not: "Preschool" }
      }
    });

    const new_count = await prisma.student.count({
      where: { ...where, 
              stuStatus : "New",
              grade: { not: "Preschool" }
      }
    });

    res.json({ old_count, new_count });
  } catch (e) {
      res.status(500).json({ error: e.message });
  }
})

router.get("/pwdStuCountbyGender", async (req,res) => {
  const {acayr} = req.query;
  if (!acayr) {
      return res.status(400).json({ error: "Academic year is required" });
  }
  try{
    const pwd_boy_count = await prisma.student.count({
      where: {
        pwd: "Yes",
        gender : "Male",
        acayr: acayr,
        grade: { not: "Preschool" }
      }
    });

    const pwd_girl_count = await prisma.student.count({
      where: { 
        pwd: "Yes",
        gender : "Female",
        acayr: acayr,
        grade: { not: "Preschool" }
    }
    });

    res.json({ pwd_boy_count, pwd_girl_count });
  } catch (e) {
      res.status(500).json({ error: e.message });
  }
})

router.get("/totalCountforDashboard", async (req, res) => {
  try{  
    const { acayr, lcID } = req.query;
    if (!acayr) {
        return res.status(400).json({ error: "Academic year is required" });
    }

    // Base filter 
    const where = { acayr: acayr, }; 

    // Only add lcID filter when lcID has a value 
    if (lcID !== undefined && lcID !== null && lcID !== "") { 
      const learningcenterID = Number(lcID); 
        if (Number.isNaN(learningcenterID)) { 
          return res.status(400).json({ error: "Invalid lcID", }); 
        } where.lcID = learningcenterID; 
    } 
    else { 
        console.log("No lcID provided - retrieving all learning centers"); 
    } 
    const totalStuCount = await prisma.student.count({
      where: {  ...where,         
        grade: { not: "Preschool" } 
      }
    });

    const totalPreStuCount = await prisma.student.count({
      where: { ...where,         
        grade:"Preschool" 
      }
    });

    const totalLCCount = await prisma.learningCenter.count({
      where: { status: "Active" }
    });

    res.json({ totalStuCount, totalPreStuCount, totalLCCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/postStudent", async(req, res) => {
  try{
    const { lcname, acayr, name, stuID, grade, gender, pwd, pwd_type, guardianName, guardianNRC, guardianType, familyMember, 
        over18Male, over18Female, under18Male, under18Female, stuStatus, acaReview, kidsClubStu, dropoutStu } = req.body;
    if(!lcname || !name || !stuID || !grade){        
        return res.status(400).json({msg: "Learning Center, Student Name, Student ID  and Grade are required"});
    }   
 
    const learningCenter = await prisma.learningCenter.findUnique({
            where: { lcname: lcname }, // assuming "name" is unique in LearningCenter model
    });

    if (!learningCenter) {
            return res.status(404).json({ msg: "Learning center not found" });
    }

    const existingstudent = await prisma.student.findFirst({
            where: { 
              acayr: acayr,
              stuID: stuID
            }
    });

    if(existingstudent){
      return res.status(409).json({ msg: "Student ID Already Exists" });
    }

    const student = await prisma.student.create({
        data: { acayr, name, stuID, grade, gender, pwd, pwd_type, guardianName, guardianNRC, guardianType, familyMember, 
        over18Male, over18Female, under18Male, under18Female, stuStatus, acaReview, kidsClubStu, dropoutStu, lcname: { connect: { id: learningCenter.id } }, },
    });

    res.json(student);
  }
  catch(e){
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
        pwd_type: data.pwd_type,
        guardianName: data.guardianName,
        guardianNRC: data.guardianNRC,
        guardianType: data.guardianType,
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

    const student = await prisma.student.findFirst({
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

    const examData = {acayr: submittedData.acayr, session: submittedData.session, student: {connect:{id: student.id}}, average_mark: 0, average_grade: "N/A"};

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
    const grade = student.grade;

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
        acayr: s.acayr, 
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
            acayr: s.acayr, 
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
    res.status(500).json({ error: e.message });
  }
});

router.post("/postAvgMarksandGrade/:id", async(req, res) => {    
    const {submittedData} = req.params;    
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
    const {acayr} = req.query;
    if (!acayr) {
        return res.status(400).json({ error: "Academic year is required" });
    }
    const countA = await prisma.examResults.count({
      where: { session: "First Time",
              average_grade: "A",
              acayr: acayr,
              student: {
                grade: { in: ["KG", "G-1", "G-2", "G-3"] }
              }
            }
    });

    const countE = await prisma.examResults.count({
      where: { session: "First Time",
              average_grade: "E",
              acayr: acayr,
              student: {
                grade: { in: ["KG", "G-1", "G-2", "G-3"] }
              }
            }
    });

    const countS = await prisma.examResults.count({
      where: { session: "First Time",
              average_grade: "S",
              acayr: acayr,
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
    const {acayr} = req.query;
    if (!acayr) {
        return res.status(400).json({ error: "Academic year is required" });
    }
    const countA = await prisma.examResults.count({
      where: { session: "Second Time",
              average_grade: "A",
              acayr: acayr,
              student: {
                grade: { in: ["KG", "G-1", "G-2", "G-3"] }
              }
            }
    });

    const countE = await prisma.examResults.count({
      where: { session: "Second Time",
              average_grade: "E",
              acayr: acayr,
              student: {
                grade: { in: ["KG", "G-1", "G-2", "G-3"] }
              }
            }
    });

    const countS = await prisma.examResults.count({
      where: { session: "Second Time",
              average_grade: "S",
              acayr: acayr,
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

router.get("/gradingCountforLPforThirdSession", async (req, res) => {
  try{
    const {acayr} = req.query;
    if (!acayr) {
        return res.status(400).json({ error: "Academic year is required" });
    }
    const countA = await prisma.examResults.count({
      where: { session: "Third Time",
              average_grade: "A",
              acayr: acayr,
              student: {
                grade: { in: ["KG", "G-1", "G-2", "G-3"] }
              }
            }
    });

    const countE = await prisma.examResults.count({
      where: { session: "Third Time",
              average_grade: "E",
              acayr: acayr,
              student: {
                grade: { in: ["KG", "G-1", "G-2", "G-3"] }
              }
            }
    });

    const countS = await prisma.examResults.count({
      where: { session: "Third Time",
              average_grade: "S",
              acayr: acayr,
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
    const {acayr} = req.query;
    if (!acayr) {
        return res.status(400).json({ error: "Academic year is required" });
    }
    const countA = await prisma.examResults.count({
      where: { session: "First Time",
              average_grade: "A",
              acayr: acayr,
              student: {
                grade: { in: ["G-4", "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12"] }
              }
            }
    });

    const countB = await prisma.examResults.count({
      where: { session: "First Time",
              average_grade: "B",
              acayr: acayr,
              student: {
                grade: { in: ["G-4", "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12"] }
              }
            }
    });

    const countC = await prisma.examResults.count({
      where: { session: "First Time",
              average_grade: "C",
              acayr: acayr,
              student: {
                grade: { in: ["G-4", "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12"] }
              }
            }
    });  
    
    const countD = await prisma.examResults.count({
      where: { session: "First Time",
              average_grade: "D",
              acayr: acayr,
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
    const {acayr} = req.query;
    if (!acayr) {
        return res.status(400).json({ error: "Academic year is required" });
    }
    const countA = await prisma.examResults.count({
      where: { session: "Second Time",
              average_grade: "A",
              acayr: acayr,
              student: {
                grade: { in: ["G-4", "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12"] }
              }
            }
    });

    const countB = await prisma.examResults.count({
      where: { session: "Second Time",
              average_grade: "B",
              acayr: acayr,
              student: {
                grade: { in: ["G-4", "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12"] }
              }
            }
    });

    const countC = await prisma.examResults.count({
      where: { session: "Second Time",
              average_grade: "C",
              acayr: acayr,
              student: {
                grade: { in: ["G-4", "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12"] }
              }
            }
    });    

    const countD = await prisma.examResults.count({
      where: { session: "Second Time",
              average_grade: "D",
              acayr: acayr,
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

router.get("/gradingCountforUPforThirdSession", async (req, res) => {
  try{
    const {acayr} = req.query;
    if (!acayr) {
        return res.status(400).json({ error: "Academic year is required" });
    }
    const countA = await prisma.examResults.count({
      where: { session: "Third Time",
              average_grade: "A",
              acayr: acayr,
              student: {
                grade: { in: ["G-4", "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12"] }
              }
            }
    });

    const countB = await prisma.examResults.count({
      where: { session: "Third Time",
              average_grade: "B",
              acayr: acayr,
              student: {
                grade: { in: ["G-4", "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12"] }
              }
            }
    });

    const countC = await prisma.examResults.count({
      where: { session: "Third Time",
              average_grade: "C",
              acayr: acayr,
              student: {
                grade: { in: ["G-4", "G-5", "G-6", "G-7", "G-8", "G-9", "G-10", "G-11", "G-12"] }
              }
            }
    });    

    const countD = await prisma.examResults.count({
      where: { session: "Third Time",
              average_grade: "D",
              acayr: acayr,
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