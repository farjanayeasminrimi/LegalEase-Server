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

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");

const JWKS = createRemoteJWKSet(
  new URL(process.env.BASE_URL + "/api/auth/jwks")
);

const verifyToken = async (req, res, next) => {
  ...
};

const database = client.db("LegalEase");

const LaywerData = database.collection("laywerData");
const comments = database.collection("comments");
const users = database.collection("user");
const hirelawyers = database.collection("hirelawyers");
const pay = database.collection("pay");

app.get("/", (req, res) => {
  res.send("Welcome to home page!");
});

app.get("/user", verifyToken, async (req, res) => {
  const result = await users.find().toArray();
  res.send(result);
});
app.patch("/user/:id", ...)
app.delete("/user/:id", ...)
app.post("/laywerdata", ...)
app.get("/alllaywer", ...)
app.get("/alllaywer/:id", ...)
app.patch("/alllaywer/:id", ...)
app.delete("/alllaywer/:id", ...)
app.post("/comment", ...)
app.get("/comment", ...)
app.patch("/comment/:id", ...)
app.delete("/comment/:id", ...)
app.post("/hirelawyer", ...)
app.get("/hirelawyer", ...)
app.patch("/hirelawyer/:id", ...)
app.get("/pay", ...)
app.post("/payment", ...)