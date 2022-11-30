//jshint esversion:6
// Install the package dotenv
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// Install the package mongoose-encryption
const encrypt = require("mongoose-encryption");
// Install the package md5
const md5 = require("md5");

const app = express();

// Get the information of the environment file
console.log(process.env.API_KEY);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/section32DB");

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// Check the documentation for mongoose-encryption
// Create the next line as environment variable in the .env file
// const secret = "Thisisourlittlesecret.";
// The next line will only encrypt the password because of the encryptedFields
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
// The previous line is not needed anymore since the encryption is changed
// to a hashed methodology instead of encryption with a key

const User = mongoose.model("User", userSchema);

app.get("/", function(req, res){
  res.render("home");
});


app.get("/login", function(req, res){
  res.render("login");
});


app.get("/register", function(req, res){
  res.render("register");
});


app.post("/register", function(req, res){
  const newUser = new User({
    email: req.body.username,
    // This next line will send the password hashed instead of plain text
    password: md5(req.body.password)
  });

  newUser.save(function(err){
    if(!err){
      res.render("secrets");
    } else {
      console.log(err);
    }
  });
});


app.post("/login", function(req, res){
  const username = req.body.username;
  const password = md5(req.body.password);
  User.findOne({email: username}, function(err, foundUser){
    if (!err){
      if (foundUser) {
        if (foundUser.password === password) {
          res.render("secrets");
        }
      }
    } else {
      console.log(err);
    }
  });
});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
