const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const port = process.env.PORT || 5000;

const app = express();

const corsOptions = {
  origin: [
    "https://study-squadron.firebaseapp.com/",
    "https://study-squadron.web.app/",
    "https://study-squadron.web.app",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.error(err);
      return res.status(401).send({ message: "Unauthorized access" });
    }

    req.user = decoded;
    next();
  });
};

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
    // await client.connect();

    const assignmentsCollection = client
      .db("studysquadron")
      .collection("assignments");
    const submitAssignmentsCollection = client
      .db("studysquadron")
      .collection("SubmitAssignments");

    // jwt
    app.post("/jwt", async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "365d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // Clear token on logout
    app.get("/logout", (req, res) => {
      res
        .clearCookie("token", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          maxAge: 0,
        })
        .send({ success: true });
    });

    // Get All Assignment && Paginations
    app.get("/all-assignment", async (req, res) => {
      const { difficulty } = req.query;
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      let query = {};
      if (difficulty) {
        query = { difficultyLevel: difficulty };
      }
      const result = await assignmentsCollection
        .find(query)
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

    // Find Assignment by ID
    app.get("/findassignment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assignmentsCollection.findOne(query);
      res.send(result);
    });

    // Find Assignment by ID
    app.get("/giveassignmentmark/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await submitAssignmentsCollection.findOne(query);
      res.send(result);
    });

    // Find Assignment by ID
    app.get("/giveassignmentmarkshow/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await submitAssignmentsCollection.findOne(query);
      res.send(result);
    });

    // Find Assignment by stutus
    app.get("/findstatusassignment/:status", verifyToken, async (req, res) => {
      const status = req.params.status;
      const query = { status: status };
      const result = await submitAssignmentsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/findsMyassignment/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      if (req.user.email !== req.params.email) {
        return res.status(403).send({ message: "forbidden access" });
      }
      let query = { userEmail: email };

      const result = await submitAssignmentsCollection.find(query).toArray();
      res.send(result);
    });

    app.get("/assignmentCount", async (req, res) => {
      const count = await assignmentsCollection.estimatedDocumentCount();
      res.send({ count });
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
      const result = await submitAssignmentsCollection.insertOne(
        assignmentsData
      );
      res.send(result);
    });

    // Update Assignment status
    app.put("/updateassignmentmark/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const updatedData = req.body;
      const assignmentitems = {
        $set: {
          status: updatedData.status,
          number: updatedData.number,
          assignmentFeedback: updatedData.assignmentFeedback,
        },
      };
      const result = await submitAssignmentsCollection.updateOne(
        filter,
        assignmentitems,
        options
      );
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
      const result = await assignmentsCollection.updateOne(
        filter,
        assignmentitems,
        options
      );
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
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );
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
