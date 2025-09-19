const express = require("express");
const { ObjectId } = require("mongodb");
const verifyToken = require("../middlewares/authMiddleware");

module.exports = (tripCollection) => {
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

    return router;
};
