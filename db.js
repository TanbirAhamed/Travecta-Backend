const { MongoClient, ServerApiVersion } = require("mongodb");

const uri = process.env.MONGO_URL;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

async function connectDB() {
    // For local you can keep this, for Vercel you can comment it out
    await client.connect();

    const db = client.db("travectaDB");
    console.log('MongoDB connected!');
    return {
        userCollection: db.collection("users"),
        tripCollection: db.collection("trips"),
        expenseCollection: db.collection("expenses"),
        itineraryCollection: db.collection("itineraries")
        
    };
}

module.exports = { connectDB };