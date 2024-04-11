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
const {listingSchema} = require("./schema.js");

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

//Index Route
app.get("/listings", wrapAsync(async (req, res) => {
  const allListings = await Listing.find({});
  res.render("listings/index.ejs", { allListings });
}));

//New Route
app.get("/listings/new", (req, res) => {
  res.render("listings/new.ejs");
});

//Show Route
app.get("/listings/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/show.ejs", { listing });
}));

//Create Route
app.post("/listings", wrapAsync(async (req,res,next) => {

    listingSchema.validate(req.body);
     const newListing = new Listing({
        title: req.body.title,
        description: req.body.description,
        image: req.body.image,
        price:req.body.price,
        country: req.body.country,
        location: req.body.location 
      });
    const nlist = await newListing.save();
    console.log(nlist);
    res.redirect("/listings");
  }
)
);

//Edit Route
app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  res.render("listings/edit.ejs", { listing });
}));

//Update Route
app.put("/listings/:id",wrapAsync(async (req, res) => {
  let { id } = req.params;
  await Listing.findByIdAndUpdate(id, { ...req.body.listing });
  res.redirect(`/listings/${id}`);
}));

//Delete Route
app.delete("/listings/:id", wrapAsync(async (req, res) => {
  let { id } = req.params;
  let deletedListing = await Listing.findByIdAndDelete(id);
  console.log(deletedListing);
  res.redirect("/listings");
}));



app.all("*", (req,res,next)=>{
  next(new expressError(404, "Page not Fonud!"));
})



// Reviews: Submitting the form
//Post Route
app.post("/listings/:id/reviews", async(req,res,next)=>{

  try{

    let { id } = req.params;
    console.log(id);
    let listing = await Listing.findById(id);
    let newReview = new Review(req.body);
    listing.reviews.push(newReview);
    await newReview.save();
    await listing.save();
    console.log(listing);
    res.send("new reqview saved");
  }
  catch(err){
    next(err);
  }
});


app.use((err,req,res,next)=>{
  console.log("Something is wrong"); 
  let {statusCode=501, message="PAge not found"} = err;
  res.status(statusCode).render("error.ejs", {message});
  // res.status(statusCode).send(message);
})

app.listen(8080, () => {
  console.log("server is listening to port 8080");
});