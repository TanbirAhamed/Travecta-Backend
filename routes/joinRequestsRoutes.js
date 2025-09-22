const express = require("express");
const { ObjectId } = require("mongodb");
const verifyToken = require("../middlewares/authMiddleware");

module.exports = (joinRequestCollection) => {
    const router = express.Router();

    // Get join requests (optional filter: by userEmail or tripId)
    router.get("/", async (req, res) => {
        const { email, tripId } = req.query;
        let query = {};

        if (email) query.userEmail = email;
        if (tripId) query.tripId = tripId;

        try {
            const result = await joinRequestCollection.find(query).toArray();
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({ message: "Failed to load join requests" });
        }
    });

    // Get single join request
    router.get("/:id", async (req, res) => {
        const id = req.params.id;
        try {
            const query = { _id: new ObjectId(id) };
            const result = await joinRequestCollection.findOne(query);
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({ message: "Join request not found!" });
        }
    });

    // Create a new join request
    router.post("/", verifyToken, async (req, res) => {
        const requestData = req.body;

        // Add default values
        requestData.status = "pending";
        requestData.requestedAt = new Date();

        try {
            const result = await joinRequestCollection.insertOne(requestData);
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({ message: "Failed to create join request!" });
        }
    });

    // Update join request status (approve/reject)
    router.patch("/:id", verifyToken, async (req, res) => {
        const id = req.params.id;
        const { status } = req.body;

        try {
            const query = { _id: new ObjectId(id) };
            const update = { $set: { status: status } };
            const result = await joinRequestCollection.updateOne(query, update);
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({ message: "Failed to update join request!" });
        }
    });

    // Delete/cancel a join request
    router.delete("/:id", verifyToken, async (req, res) => {
        const id = req.params.id;
        try {
            const query = { _id: new ObjectId(id) };
            const result = await joinRequestCollection.deleteOne(query);
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({ message: "Failed to delete join request!" });
        }
    });

    return router;
};
