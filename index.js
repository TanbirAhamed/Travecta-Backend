require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');

// middleware
app.use(express.json());
app.use(cors());


const uri = process.env.MONGO_URL;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const database = client.db("travectaDB");
    const userCollection = database.collection('users');
    const tripCollection = database.collection('trips');

    // jwt api's
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, { expiresIn: '3h' });
      res.send({ token });
    });


    // middlewares
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorize access' });
      }

      const token = req.headers.authorization.split(' ')[1]
      jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorize access' });
        }
        req.decoded = decoded;
        next();
      })
    };


    // user related api's
    app.get('/users', verifyToken, async (req, res) => {
      try {
        const result = await userCollection.find().toArray();
        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to load users!' });
      }
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      try {
        const query = { email: user?.email };
        const exitingUser = await userCollection.findOne(query);

        if (exitingUser) {
          return res.send({ massage: 'User already exists', insertedId: null })
        }

        const result = await userCollection.insertOne(user);
        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to store/upload user!' });
      }
    });


    // trips related api's
    app.get('/trips', async (req, res) => {
      try {
        const result = await tripCollection.find().toArray();
        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to load trips' });
      }

    });

    app.get('/trips/:id', async (req, res) => {
      const id = req.params.id;
      try {
        const query = { _id: new ObjectId(id) };
        const result = await tripCollection.findOne(query);
        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({ message: 'Trips not found!' });
      }
    });

    app.post('/trips', verifyToken, async (req, res) => {
      const item = req.body;
      try {
        const result = await tripCollection.insertOne(item);
        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to store/upload trip!' });
      }

    });

    app.delete('/trips/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      try {
        const query = { _id: new ObjectId(id) };
        const result = await tripCollection.deleteOne(query);
        res.status(200).send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to delete trip!' });
      }
    });





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Travecta Running Smoothly!');
});

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
})