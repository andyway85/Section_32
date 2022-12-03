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
// const md5 = require("md5");
// Install the package bcryptjs
const bcrypt = require("bcryptjs");
// Install the package express-session, passport, passport-local-mongoose
// and passport-local
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

// const salt = bcrypt.genSaltSync(10);


const app = express();

// Get the information of the environment file
console.log(process.env.API_KEY);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));


// Express-session has to be used right before the connection to mongoose
// and after the ejs, body parser and express public

app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

// Tell the app to use passport to initialized
app.use(passport.initialize());
// Tell the app to use passport to deal with the sessions
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/section32DB");
// mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  secret: String
});

// Check the documentation for mongoose-encryption
// Create the next line as environment variable in the .env file
// const secret = "Thisisourlittlesecret.";
// The next line will only encrypt the password because of the encryptedFields
// userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"] });
// The previous line is not needed anymore since the encryption is changed
// to a hashed methodology instead of encryption with a key

// Use the package of passport-local-mongoose as a plugin to the Schema
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res){
  res.render("home");
});


app.get("/login", function(req, res){
  res.render("login");
});


app.get("/register", function(req, res){
  res.render("register");
});

app.get("/secrets", function (req, res){
  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if (err) {
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", {usersWithSecrets: foundUsers});
      }
    }
  });
});

app.get("/submit", function(req, res){
  if (req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;

  // console.log(req.user);

  User.findById(req.user.id, function(err, foundUser) {
    if (!err) {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    } else {
      console.log(err);
    }
  });
});

app.get("/logout", function (req, res){
  req.logout(function (err){
    if (err) {
      console.log(err);
    }
    res.redirect("/");
  });
});

app.post("/register", function(req, res){

  // const hash = bcrypt.hashSync(req.body.password, salt);
  //
  // const newUser = new User({
  //   email: req.body.username,
  //   // This next line will send the password hashed instead of plain text
  //   // password: md5(req.body.password)
  //   password: hash
  // });
  //
  // newUser.save(function(err){
  //   if(!err){
  //     res.render("secrets");
  //   } else {
  //     console.log(err);
  //   }
  // });

  // With Session and passport
  User.register({username: req.body.username}, req.body.password, function(err, user) {
    if (!err) {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    } else {
      console.log(err);
      res.redirect("/register");
    }
  })

});


app.post("/login", function(req, res){
  // const username = req.body.username;
  // // const password = md5(req.body.password);
  // User.findOne({email: username}, function(err, foundUser){
  //   if (!err){
  //     if (foundUser) {
  //       // if (foundUser.password === password) {
  //       //   res.render("secrets");
  //       // }
  //       if (bcrypt.compareSync(req.body.password, foundUser.password)) {
  //         res.render("secrets");
  //       }
  //     }
  //   } else {
  //     console.log(err);
  //   }
  // });

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  // This following login comes from passport
  req.login(user, function(err){
    if (!err) {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    } else {
      console.log(err);
      res.redirect("/login");
    }
  });

});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
