require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { connectDB } = require("./db");

// Import routes
const userRoutes = require("./routes/userRoutes");
const tripRoutes = require("./routes/tripRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const itineraryRoutes = require("./routes/itineraryRoutes");
const joinRoutes = require("./routes/joinRequestsRoutes");

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());

// JWT route
app.post("/jwt", (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: "3h" });
  res.send({ token });
});

// Connect DB and mount routes
connectDB().then(({ userCollection, tripCollection, expenseCollection, itineraryCollection, joinRequestCollection }) => {
  app.use("/users", userRoutes(userCollection));
  app.use("/trips", tripRoutes(tripCollection));
  app.use("/expenses", expenseRoutes(expenseCollection));
  app.use("/itinerary", itineraryRoutes(itineraryCollection));
  app.use("/joinRequests", joinRoutes(joinRequestCollection));

  app.get("/", (req, res) => res.send("Travecta Running Smoothly!"));

  app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
});
