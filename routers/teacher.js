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
        take: 20,
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

module.exports = {teacherRouter: router};