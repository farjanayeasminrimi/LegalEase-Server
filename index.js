const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");

require("dotenv").config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = process.env.MONGODB_URI;
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const JWKS = createRemoteJWKSet(new URL(process.env.BASE_URL + "/api/auth/jwks"));

const verifyToken = async (req, res, next) => {
  const authheader = req?.headers.authorization;
  if (!authheader) {
    return res.status(401).json({
      message: "Unauthrized",
    });
  }

  const token = authheader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Unauthrized",
    });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload;
    req.email = payload.email;
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }
};

async function run() {
  try {
    const database = client.db("AS_10");
    const LaywerData = database.collection("laywerData");
    const comments = database.collection("comments");
    const users = database.collection("user");
    const hirelawyers = database.collection("hirelawyers");
    const pay = database.collection("pay");

    app.get("/pay", async (req, res) => {
      const result = await pay.find().toArray();
      res.send(result);
    });

    app.post("/payment", async (req, res) => {
      try {
        const {
          hireId,
          lawyerName,
          clientName,
          clientEmail,
          lawyerEmail,
          amount,
          stripeSessionId,
          paymentIntent,
        } = req.body;

        const existingPayment = await pay.findOne({
          stripeSessionId,
        });

        if (existingPayment) {
          return res.send({
            success: true,
            message: "Payment already recorded",
          });
        }

        await hirelawyers.updateOne(
          { _id: new ObjectId(hireId) },
          {
            $set: {
              paymentStatus: "paid",
              pay: "paid",
              paidAt: new Date(),
            },
          },
        );

        const paymentResult = await pay.insertOne({
          hireId,
          lawyerName,
          clientName,
          clientEmail,
          lawyerEmail,
          amount,
          stripeSessionId,
          paymentIntent,
          paymentStatus: "paid",
          paidAt: new Date(),
          createdAt: new Date(),
        });

        res.send({
          success: true,
          paymentResult,
        });
      } catch (error) {
        res.status(500).send({
          success: false,
          message: error.message,
        });
      }
    });

    app.get("/user", verifyToken, async (req, res) => {
      const result = await users.find().toArray();
      res.send(result);
    });

    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await users.deleteOne(query);
      res.send(result);
    });

    app.patch("/user/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        console.log("ID:", id);
        console.log("Body:", updatedData);

        const result = await users.updateOne({ _id: new ObjectId(id) }, { $set: updatedData });

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Update failed" });
      }
    });

    app.post("/comment", async (req, res) => {
      const comment = req.body;
      const result = await comments.insertOne(comment);
      res.send(result);
    });

    app.post("/hirelawyer", async (req, res) => {
      const hirelawyer = req.body;
      console.log(hirelawyer, "hirelaywer");
      const result = await hirelawyers.insertOne(hirelawyer);
      res.send(result);
    });

    app.get("/hirelawyer", async (req, res) => {
      const result = await hirelawyers.find().toArray();
      res.send(result);
    });

    app.patch("/hirelawyer/:id", async (req, res) => {
      try {
        const id = req.params.id;

        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ error: "Invalid ID" });
        }

        const updatedData = req.body;
        console.log(updatedData);

        const result = await hirelawyers.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData },
        );

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Update failed" });
      }
    });

    app.get("/comment", async (req, res) => {
      const result = await comments.find().toArray();
      res.send(result);
    });

    app.delete("/comment/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await comments.deleteOne(query);
      res.send(result);
    });

    app.patch("/comment/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const result = await comments.updateOne({ _id: new ObjectId(id) }, { $set: updatedData });

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Update failed" });
      }
    });

    app.get("/alllaywer", async (req, res) => {
      try {
        const search = req.query.search || "";

        const query = search
          ? {
              $or: [
                {
                  name: {
                    $regex: search,
                    $options: "i",
                  },
                },
                {
                  specialization: {
                    $regex: search,
                    $options: "i",
                  },
                },
              ],
            }
          : {};

        const lawyers = await LaywerData.find(query).toArray();

        res.send({
          success: true,
          totalLawyers: lawyers.length,
          lawyers,
        });
      } catch (error) {
        console.error(error);
        res.status(500).send({
          success: false,
          message: "Failed to fetch lawyers",
        });
      }
    });

    app.patch("/alllaywer/:id", async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const result = await LaywerData.updateOne({ _id: new ObjectId(id) }, { $set: updatedData });

        res.send(result);
      } catch (error) {
        res.status(500).send({ error: "Update failed" });
      }
    });

    app.get("/alllaywer/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await LaywerData.findOne(query);
      res.send(result);
    });

    app.delete("/alllaywer/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await LaywerData.deleteOne(query);
      res.send(result);
    });

    app.post("/laywerdata", async (req, res) => {
      const movie = req.body;
      const result = await LaywerData.insertOne(movie);
      res.send(result);
    });

    app.get("/", (req, res) => {
      res.send("Welcome to home page!");
    });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
  }
}

run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
