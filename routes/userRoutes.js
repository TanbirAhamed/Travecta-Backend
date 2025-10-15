const express = require("express");
const verifyToken = require("../middlewares/authMiddleware");

module.exports = (userCollection) => {
    const router = express.Router();

    router.get("/", verifyToken, async (req, res) => {
        try {
            const result = await userCollection.find().toArray();
            res.status(200).send(result);
        } catch {
            res.status(500).send({ message: "Failed to load users!" });
        }
    });

    router.get('/role/:email', verifyToken, async (req, res) => {
        try {
            const email = req.params.email;

            if (email !== req.decoded.email) {
                return res.status(403).send({ message: 'forbidden access' });
            }

            const query = { email };
            const user = await userCollection.findOne(query);

            let admin = false;
            let moderator = false;

            if (user) {
                admin = user?.role === 'admin';
                moderator = user?.role === 'moderator';
            }

            res.status(200).send({ admin, moderator });

        } catch (error) {
            res.status(500).send({ message: 'Internal Server Error' });
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
