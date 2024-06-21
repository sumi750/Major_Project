require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const Review = require("./models/review.js");
const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
const wrapAsync = require("./uitls/wrapAsync.js");
const expressError = require("./uitls/exError.js");
const {listingSchema, reviewSchema} = require("./schema.js");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const session = require("express-session");
const flash = require("connect-flash");
const {isLoggedIn, saveRedirectUrl, isOwner, isAuthor} = require("./middle.js");
const multer = require("multer");
const {storage} = require("./cloudConfig.js");
const upload = multer({ storage });

main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(MONGO_URL);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

app.get("/", (req, res) => {
  res.send("Hi, I am root");
});

const sessionOption = {
  secret: "mysecretstring",
  resave: false,
  saveUninitialized: true,
  cookie : {
    expires : Date.now() + 7*24*60*60*1000,
    maxAge : 7*24*60*60*1000,
    httpOnly : true
  }
}

app.use(session(sessionOption));
app.use(flash());

// Passport
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
  res.locals.Smsg = req.flash("success");
  res.locals.Emsg = req.flash("error");
  res.locals.currUser = req.user;
  next();
})

// Valitdate
const validateListing = (req,res,next) =>{
  let {error} = listingSchema.validate(req.body);

  if(error){
    let errMsg = error.details.map((el)=> el.message).join(",");
    throw new expressError(400, errMsg);
  }
  else{
    next();
  }
}

const validateReview = (req,res,next) =>{
  let {error} = reviewSchema.validate(req.body);

  if(error){
    let errMsg = error.details.map((el)=> el.message).join(",");
    throw new expressError(400, errMsg);
  }
  else{
    next();
  }
}

// app.get("/listings", async(req,res)=>{
//   try{
//     const list = await Listing.find({});
//     res.json(list);
//   }
//   catch(err){
//     res.send(500).send(err);
//   }
// })
//Index Route


app.get("/listings", wrapAsync(async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
}));

//New Route
app.get("/listings/new", isLoggedIn,(req, res) => {
  res.render("listings/new.ejs");
});

//Show Route
app.get("/listings/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id)
  .populate({
    path: "reviews",
     populate:{
      path: "author"}
    })
  .populate("owner");
  res.render("listings/show.ejs", { listing });
}));

//Create Route
app.post("/listings", upload.single("image"), wrapAsync(async (req,res,next) =>{

  // const result = listingSchema.validate(req.body);
  let url = req.file.path;
  let filename = req.file.filename;
  const newListing = new Listing({
      title: req.body.title,
      description: req.body.description,
      image: req.body.image,
      price:req.body.price,
      country: req.body.country,
      location: req.body.location 
  });
    newListing.owner = req.user._id;
    newListing.image = {url, filename};
    const nlist = await newListing.save();
    req.flash("success", "New Listing is Added!");
    res.redirect("/listings");
  }));

//Edit Route
app.get("/listings/:id/edit", isLoggedIn,
  isOwner,
  wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
}));

//Update Route
app.put("/listings/:id",
  isLoggedIn,
  isOwner,
  validateListing,
  wrapAsync(async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  req.flash("success", "listing Updated");
  res.redirect(`/listings/${id}`);
}));

//Delete Route
app.delete("/listings/:id",isLoggedIn, 
  isOwner,
  wrapAsync(async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  req.flash("success", "Listing is deleted");
  res.redirect("/listings");
}));


// Reviews: Submitting the form
//Post Route
app.post("/listings/:id",
  isLoggedIn,
   wrapAsync(async(req,res,next)=>{

  try{
    let { id } = req.params;
    let listing = await Listing.findById(id);
    let newReview = new Review({
      rating : req.body.rating,
      comment : req.body.comment,
    });
    newReview.author = req.user._id;
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    console.log("Reviews is added ");
    req.flash("success", "New Review is Added!");
    res.redirect(`/listings/${listing.id}`);
  }
  catch(err){
    next(err);
  }
}));


//Delete Review
app.delete("/listings/:id/:reviewId",
  isLoggedIn,
  isAuthor,
  wrapAsync(async(req,res)=>{
    let {id, reviewId} = req.params;
    await Listing.findByIdAndUpdate(id, {$pull: {reviews: reviewId}})
    await Review.findByIdAndDelete(reviewId);
    console.log("Review is deleted");
    req.flash("success", "Review is Deleted!");
    res.redirect(`/listings/${id}`);
}))


// SignUp Pafe
//Get Method
app.get("/signup", (req,res)=>{
    res.render("users/signup.ejs");
})

//Post Method
app.post("/signup", wrapAsync(async(req,res,next)=>{
  try{

    let {username, email, password} = req.body;
    const newUser = new User({email, username, password});
    const regUser =  await User.register(newUser, password);
    console.log(regUser);
    req.login(regUser, (err)=>{
      if(err){
        return next();
      }
    req.flash("success", "User is Regostred Successfuly!");
    res.redirect("/listings");
    })
  }
  catch(err){
    req.flash("error", err.message);
    res.redirect("/signup");
  }
}));

//Login Page
// Get method
app.get("/login", (req,res)=>{
  res.render("users/login.ejs");
})

//Post method
app.post("/login", 
  saveRedirectUrl,
  passport.authenticate("local", {
  failureRedirect : "/login", 
  failureFlash: true}), 
  async (req,res)=>{
    req.flash("success", "U are Logged In!");
    let redirectUrl = res.locals.redirect || "/listings";
    res.redirect(redirectUrl);
});

// Logout
app.get("/logout", (req,res,next)=>{
    req.logout((err)=>{
        if(err){
          return next(err);
        }
        req.flash("success", "you are logout!")
        res.redirect("/listings");
    })
})


app.all("*", (req,res,next)=>{
  next(new expressError(404, "Page not Fonud!"));
})

app.use((err,req,res,next)=>{
  console.log("Something is wrong"); 
  let {statusCode=501, message="Page not found"} = err;
  res.status(statusCode).render("error.ejs", {message});
  // res.status(statusCode).send(message);
})

app.listen(8080, () => {
  console.log("server is listening to port" , 8080);
});