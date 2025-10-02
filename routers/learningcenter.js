const express = require("express")
const router = express.Router();
const prisma = require("../prismaClient");

router.get("/learningcenters", async(req, res) => {
    try{
        const data = await prisma.learningCenter.findMany({        
        take: 20,
    });

    res.json(data);
    }
    catch(e){
        res.status(500).json({error:e});
    }
});

/*router.get("/users/:id/learningcenters", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { learningCenter: true }, // fetch the LC
    });

    const learningCenters = user?.learningCenter ? [user.learningCenter] : [];
    res.json(learningCenters);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});*/

router.get("/users/:id/learningcenters", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { learningCenter: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    let learningCenters;

    if (user.learningCenter) {      
      
        learningCenters = [user.learningCenter];
    } else {
        learningCenters = await prisma.learningCenter.findMany({
      });
    }

    res.json(learningCenters);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


/*router.get("/users/:id/learningcenters", async (req, res) => {
  const { id } = req.params;
  try {
    const data = await prisma.student.findMany({
      where: { lcID: Number(id) },
      include: {
        examresults: true,
        lcname: {
          select: { lcname: true }, // only fetch the LearningCenter name
        },
      },
    });
    console.log("data : ", data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});*/

module.exports = {learningCenterRouter: router};