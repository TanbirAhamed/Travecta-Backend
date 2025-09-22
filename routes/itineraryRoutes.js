const express = require("express");
const verifyToken = require("../middlewares/authMiddleware");

module.exports = (itineraryCollection) => {
    const router = express.Router();

    router.get("/", async (req, res) => {
        const { tripId } = req.query;

        if (!tripId) {
            return res.status(400).send({ message: "tripId is required" });
        }

        try {
            const tripItinerary = await itineraryCollection.findOne({ tripId });

            if (!tripItinerary) {
                return res.status(200).send({ itinerary: [] });
            }

            res.status(200).send({
                tripId: tripItinerary.tripId,
                tripName: tripItinerary.tripName,
                createdBy: tripItinerary.createdBy,
                itinerary: tripItinerary.itinerary,
            });
        } catch (error) {
            res.status(500).send({ message: "Failed to fetch itinerary" });
        }
    });

    router.post("/", verifyToken, async (req, res) => {
        const { tripId, tripName, createdBy, day } = req.body;

        if (!tripId || !tripName || !createdBy || !day) {
            return res.status(400).send({ message: "tripId, tripName, createdBy, and day are required" });
        }

        try {
            const existing = await itineraryCollection.findOne({ tripId });

            if (existing) {
                // Add new day to existing itinerary array
                const result = await itineraryCollection.updateOne(
                    { tripId },
                    { $push: { itinerary: day } }
                );
                return res.status(200).send({ message: "Itinerary day added successfully!", result });
            } else {
                // Create new itinerary document
                const newDoc = {
                    tripId,
                    tripName,
                    createdBy,
                    itinerary: [day],
                };
                const result = await itineraryCollection.insertOne(newDoc);
                return res.status(200).send({ message: "Itinerary created!", result });
            }
        } catch (error) {
            res.status(500).send({ message: "Failed to add itinerary!" });
        }
    });

    return router;
};
