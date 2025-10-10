// routes/joinRequestsRoutes.js
const express = require("express");
const { ObjectId } = require("mongodb");
const verifyToken = require("../middlewares/authMiddleware");

module.exports = (joinRequestCollection, tripCollection) => {
    const router = express.Router();

    // 🔹 GET all join requests (with optional filters)
    router.get("/", async (req, res) => {
        const { email, tripId, joinedEmail } = req.query;
        const query = {};

        if (email) query.tripCreatedBy = email;
        if (joinedEmail) query.joinedEmail = joinedEmail;
        if (tripId) query.tripId = tripId;

        try {
            const result = await joinRequestCollection.find(query).toArray();
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({ message: "Failed to load join requests" });
        }
    });

    // 🔹 GET single join request
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

    // 🔹 POST create join request
    router.post("/", verifyToken, async (req, res) => {
        const requestData = req.body;
        requestData.status = "pending";
        requestData.requestedAt = new Date();

        try {
            const existing = await joinRequestCollection.findOne({
                tripId: requestData.tripId,
                joinedEmail: requestData.joinedEmail,
            });

            // ✅ allow re-request if previously rejected or cancelled
            if (
                existing &&
                existing.status !== "rejected" &&
                existing.status !== "cancelled"
            ) {
                return res
                    .status(200)
                    .send({ message: "Already requested this trip", acknowledged: false });
            }

            // delete old rejected/cancelled record
            if (
                existing &&
                (existing.status === "rejected" || existing.status === "cancelled")
            ) {
                await joinRequestCollection.deleteOne({ _id: existing._id });
            }

            const result = await joinRequestCollection.insertOne(requestData);
            res.status(200).send(result);
        } catch (error) {
            res.status(500).send({ message: "Failed to create join request!" });
        }
    });

    // 🔹 PATCH update join request status (approve/reject)
    router.patch("/:id", verifyToken, async (req, res) => {
        const id = req.params.id;
        const { status } = req.body;

        try {
            const query = { _id: new ObjectId(id) };
            const joinReq = await joinRequestCollection.findOne(query);
            if (!joinReq) return res.status(404).send({ message: "Join request not found" });

            await joinRequestCollection.updateOne(query, { $set: { status } });

            // If accepted, push collaborator to trip
            if (status === "accepted") {
                const trip = await tripCollection.findOne({
                    _id: new ObjectId(joinReq.tripId),
                });
                if (!trip) return res.status(404).send({ message: "Trip not found" });

                const collaborators = Array.isArray(trip?.collaborators)
                    ? trip.collaborators
                    : [];

                if (collaborators.length >= trip.participants) {
                    return res.status(400).send({ message: "Trip participant limit reached!" });
                }

                const alreadyJoined = collaborators.some(
                    (c) => c.email === joinReq.joinedEmail
                );

                if (!alreadyJoined) {
                    const newMember = {
                        name: joinReq.joinedName,
                        email: joinReq.joinedEmail,
                        image: joinReq.joinedPhoto,
                        joinedAt: new Date(),
                    };

                    await tripCollection.updateOne(
                        { _id: new ObjectId(joinReq.tripId) },
                        { $push: { collaborators: newMember } }
                    );
                }
            }

            res.status(200).send({ message: "Join request updated successfully" });
        } catch (error) {
            res.status(500).send({ message: "Failed to update join request!" });
        }
    });

    // 🔹 DELETE cancel join request
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
