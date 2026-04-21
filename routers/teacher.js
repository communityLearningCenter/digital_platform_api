const express = require("express")
const router = express.Router();
const prisma = require("../prismaClient");

router.post("/postTeacher", async(req, res) => {
    
    const submittedData = req.body;    
    if(!submittedData.learningcenter.lcname || !submittedData.name){        
        return res.status(400).json({msg: "Teacher Name and Learning Center Name are required"});
    }
 
    const learningCenter = await prisma.learningCenter.findUnique({
            where: { lcname: submittedData.learningcenter.lcname }, // assuming "name" is unique in LearningCenter model
    });

    if (!learningCenter) {
            return res.status(404).json({ msg: "Learning center not found" });
    }

    const teacher = await prisma.teacher.create({
        data: { teacherName: submittedData.name, teacherNRC:submittedData.nrc, position:submittedData.position, status:submittedData.status, 
            address: submittedData.address, phnumber: submittedData.phno, joinDate: submittedData.joinDate, lcname: { connect: { id: learningCenter.id } }, },
    });

    res.json(teacher);
});

router.get("/teachers", async(req, res) => {
    try{
        const data = await prisma.teacher.findMany({        
        include: {
            lcname: true,
        },        
    });

    const teachers = data.map(t => ({
        ...t, lcname: t.lcname.lcname // flatten
    }));

    res.json(teachers);
    }
    catch(e){
        res.status(500).json({error:e});
    }
});

router.get("/teachers/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await prisma.teacher.findUnique({
      where: { id: Number(id) },
      include: {
        lcname: true
      },
    });

    const result = {
        ...data, lcname: data.lcname.lcname // flatten
    };

    res.json(result); // ✅ send the correct object
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.put("/teachers/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const learningCenter = await prisma.learningCenter.findUnique({
            where: { id: data.learningcenter.id }, // assuming "name" is unique in LearningCenter model
    });

    if (!learningCenter) {
            return res.status(404).json({ msg: "Learning center not found" });
    }

    const updatedTeacher = await prisma.teacher.update({
      where: { id: Number(id) },
      data: {
        lcname: { connect: { id: learningCenter.id } },
        teacherName: data.name,
        teacherNRC: data.nrc,
        position: data.position,
        status: data.status,
        address: data.address,
        phnumber: data.phno,
        joinDate: data.joinDate ? new Date(data.joinDate) : null,
        modifiedOn: new Date(),
      },
    });
    res.json(updatedTeacher);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = {teacherRouter: router};