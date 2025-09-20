const express = require("express");
const verifyToken = require("../middlewares/authMiddleware");

module.exports = (userCollection) => {
    const router = express.Router();

    router.get("/",  async (req, res) => {
        try {
            const result = await userCollection.find().toArray();
            res.status(200).send(result);
        } catch {
            res.status(500).send({ message: "Failed to load users!" });
        }
    });

    router.post("/", async (req, res) => {
        const user = req.body;
        try {
            const query = { email: user?.email };
            const exitingUser = await userCollection.findOne(query)
            if (exitingUser) {
                return res.send({ message: "User already exists", insertedId: null });
            }
            const result = await userCollection.insertOne(user);
            res.status(200).send(result);
        } catch {
            res.status(500).send({ message: "Failed to store user!" });
        }
    });

    return router;
};
