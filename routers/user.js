const express = require("express")
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../prismaClient");

router.get("/users", async(req, res) => {
    try{
        const data = await prisma.user.findMany({
        orderBy : {id: "desc"},
        take: 20,
    });

    res.json(data);
    }
    catch(e){
        res.status(500).json({error:e});
    }
});

router.get("/users/:id", async(req, res) => {
    const {id} = req.params;
    try{
        const data = await prisma.user.findFirst({
        where: {id : Number (id)}
    });

    res.json(data);
    }
    catch(e){
        res.status(500).json({error:e});
    }
});

/*router.post("/users", async(req, res) => {
    const {name, role, password} = req.body;
    if(!name || !role || !password){
        return res.status(400).json({msg: "name, role and password required"});
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {name, role, password: hash},
    });

    res.json(user);
})*/

router.post("/users", async (req, res) => {
    const { name, role, password, learningCenterId } = req.body;

    if (!name || !role || !password) {
        return res.status(400).json({ msg: "name, role and password required" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: { name, role, password: hash, learningCenterId },
    });

    res.json(user);
});


router.post("/login", async(req,res) => {
    const {name, password} = req.body;
    if(!name || !password){
        return res.status(400).json({msg:"Name and Password required"});
    }

    const user = await prisma.user.findFirst({
        where: {name},
        include: { learningCenter: true },
    });

    if(user) {
        // if(bcrypt.compare(password, user.password)){
        //     const token = jwt.sign(user, process.env.JWT_SECRET);
        //     return res.json({token, user});
        // }
        const isMatch = await bcrypt.compare(password, user.password); // <-- await here
        if (isMatch) {
            const token = jwt.sign(
                { id: user.id, name: user.name }, // Don't sign the whole user object
                process.env.JWT_SECRET,
                //{ expiresIn: "1h" }
            );
            return res.json({ token, user });
        }
    }

    res.status(401).json({msg: "incorrect username or password"});
});

module.exports = {userRouter: router};