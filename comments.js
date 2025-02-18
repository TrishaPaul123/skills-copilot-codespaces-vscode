//Create web server
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Create a secret key
const secretKey = "mysecretkey";

//Read the comments from the file
const comments = JSON.parse(fs.readFileSync(path.join(__dirname, "comments.json")));

//Create a middleware function to check the token
const checkToken = (req, res, next) => {
  //Get the token from the header
  const token = req.headers["x-access-token"];
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Invalid token" });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    return res.status(401).json({ message: "Token not found" });
  }
};

//Create a middleware function to check the user role
const checkUserRole = (req, res, next) => {
  if (req.decoded.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Forbidden" });
  }
};

//Get all the comments
app.get("/comments", checkToken, (req, res) => {
  res.json(comments);
});

//Create a new comment
app.post("/comments", checkToken, (req, res) => {
  const { name, email, comment } = req.body;
  if (name && email && comment) {
    const newComment = {
      name,
      email,
      comment,
    };
    comments.push(newComment);
    fs.writeFileSync(path.join(__dirname, "comments.json"), JSON.stringify(comments, null, 2));
    res.json({ message: "Comment added" });
  } else {
    res.status(400).json({ message: "Invalid data" });
  }
});

//Update a comment
app.put("/comments/:id", checkToken, checkUserRole, (req, res) => {
  const id = req.params.id;
  const { name, email, comment } = req.body;
  if (name && email && comment)