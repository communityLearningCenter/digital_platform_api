const express = require("express")
const router = express.Router();
const prisma = require("../prismaClient");

router.get("/acayrs", async(req, res) => {
    try{
        const data = await prisma.academicYear.findMany({        
        take: 20,
    });

    res.json(data);
    }
    catch(e){
        res.status(500).json({error:e});
    }
});

router.put("/acayrs/:id", async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const updatedAcaYr = await prisma.academicYear.update({
      where: { id: Number(id) },
      data: {
        status: data.status
      },
    });

    res.json(updatedAcaYr);
  } catch (e) {
    console.error("Error updating academic year:", e); 
    res.status(500).json({ error: e.message });
  }
});

module.exports = {academicYearRouter: router};