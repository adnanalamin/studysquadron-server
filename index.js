const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.giatfyq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const assignmentsCollection = client.db("studysquadron").collection("assignments");
    const submitAssignmentsCollection = client.db("studysquadron").collection("SubmitAssignments");

    // Get All Assignment
    app.get("/all-assignment", async (req, res) => {
      const { difficulty } = req.query;
      let query = {};
      if (difficulty) {
        query = { difficultyLevel: difficulty };
      }
      const cursor = assignmentsCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Find Assignment by ID
    app.get("/findassignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentsCollection.findOne(query);
      res.send(result);
    });

    // Find Assignment by stutus
    app.get("/findstatusassignment/:status", async (req, res) => {
      const status = req.params.status;
      const query = { status: status };
      const result = await submitAssignmentsCollection.find(query).toArray();
      res.send(result);
    });

    

    // Save a assignments
    app.post("/assignment", async (req, res) => {
      const assignmentsData = req.body;
      const result = await assignmentsCollection.insertOne(assignmentsData);
      res.send(result);
    });

    // Submit a assignments
    app.post("/submit-assignment", async (req, res) => {
      const assignmentsData = req.body;
      const result = await submitAssignmentsCollection.insertOne(assignmentsData);
      res.send(result);
    });

    // Update Assignment
    app.put("/updateassignment/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedData = req.body;
      const assignmentitems = {
        $set: {
          title: updatedData.title,
          marks: updatedData.marks,
          description: updatedData.description,
          thumbnailimage: updatedData.thumbnailimage,
          difficultyLevel: updatedData.difficultyLevel,
          dueDate: updatedData.dueDate,
          
        },
      };
      const result = await assignmentsCollection.updateOne(filter, assignmentitems, options);
      res.send(result);
    });

    // Delete Assignment
    app.delete("/delete-assignment/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await assignmentsCollection.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log("Server is Running Now");
});
