const express = require("express");
const verifyToken = require("../middlewares/authMiddleware");

module.exports = (expenseCollection) => {
    const router = express.Router();

    router.get("/", async (req, res) => {
        const tripId = req.query.tripId;

        if (!tripId) {
            return res.status(400).send({ message: 'tripId is required' });
        }

        try {
            const tripExpenses = await expenseCollection.findOne({ tripId });

            if (!tripExpenses) {
                return res.status(200).send({ tripId, expenses: [] });
            }

            res.status(200).send({ tripId, expenses: tripExpenses.expenses });
        } catch (error) {
            res.status(500).send({ message: 'Failed to fetch expenses' });
        }
    });

    router.post("/", verifyToken, async (req, res) => {
        const { tripId, tripName, createdBy, expense } = req.body;

        try {
            const existing = await expenseCollection.findOne({ tripId });

            if (existing) {

                const result = await expenseCollection.updateOne(
                    { tripId },
                    { $push: { expenses: expense } }
                );
                return res.status(200).send({ message: 'Expense added successfully!', result });
            } else {

                const newDoc = {
                    tripId,
                    tripName,
                    createdBy,
                    expenses: [expense],
                };
                const result = await expenseCollection.insertOne(newDoc);
                return res.status(200).send({ message: 'Expense document created!', result });
            }
        } catch (error) {
            res.status(500).send({ message: 'Failed to add expense!' });
        }
    });

    return router;
};
