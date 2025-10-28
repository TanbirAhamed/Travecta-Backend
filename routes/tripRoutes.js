const express = require("express");
const { ObjectId } = require("mongodb");
const verifyToken = require("../middlewares/authMiddleware");

module.exports = (tripCollection, userCollection) => {
    const router = express.Router();

    router.get("/", async (req, res) => {
        const email = req.query.email;
        let query = {};

        if (email) {
            query = { createdBy: email };
        };

        try {
            const result = await tripCollection.find(query).toArray();
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({ message: 'Failed to load trips' });
        }

    });

    router.get('/:id', async (req, res) => {
        const id = req.params.id;

        try {
            const query = { _id: new ObjectId(id) };
            const result = await tripCollection.findOne(query);
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({ message: 'Trips not found!' });
        }
    });

    router.post("/", verifyToken, async (req, res) => {
        const item = req.body;
        try {
            const result = await tripCollection.insertOne(item);
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({ message: 'Failed to store/upload trip!' });
        }

    });

    router.delete('/:id', verifyToken, async (req, res) => {
        const id = req.params.id;
        try {
            const query = { _id: new ObjectId(id) };
            const result = await tripCollection.deleteOne(query);
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({ message: 'Failed to delete trip!' });
        }
    });

    router.post("/invite", verifyToken, async (req, res) => {
        const { tripId, email } = req.body;

        if (!tripId || !email)
            return res.status(400).send({ message: "Trip ID and email required" });

        try {
            // check if user exists
            const user = await userCollection.findOne({ email });
            if (!user) {
                return res.status(404).send({ message: "User not found" });
            }

            // find trip
            const trip = await tripCollection.findOne({ _id: new ObjectId(tripId) });
            if (!trip) {
                return res.status(404).send({ message: "Trip not found" });
            }

            // check if already collaborator
            const exists = trip.collaborators?.some((c) => c.email === email);
            if (exists) {
                return res.status(400).send({ message: "User already a collaborator" });
            }

            // prepare collaborator object
            const collaborator = {
                name: user.name || user.displayName || "Unnamed",
                email: user.email,
                image: user.image || user.photoURL || null,
                joinedAt: new Date(),
            };

            // update collaborators array
            await tripCollection.updateOne(
                { _id: new ObjectId(tripId) },
                { $push: { collaborators: collaborator } }
            );

            res.status(200).send({ message: "Collaborator added successfully" });
        } catch (err) {
            res.status(500).send({ message: "Server error" });
        }
    });

    return router;
};
