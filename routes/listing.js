const express = require("express");
const router = express.Router();
const wrapAsync = require("./uitls/wrapAsync.js");
const {listingSchema} = require("./schema.js");
const expressError = require("./uitls/exError.js");

//Index Route
router.get("/", wrapAsync(async (req, res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs", { allListings });
  }));
  
  //New Route
  router.get("/new", (req, res) => {
    res.render("listings/new.ejs");
  });
  
  //Show Route
  router.get("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs", { listing });
  }));
  
  //Create Route
  router.post("/", wrapAsync(async (req,res,next) => {
  
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
  router.get("/:id/edit", wrapAsync(async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs", { listing });
  }));
  
  //Update Route
  router.put("/:id",wrapAsync(async (req, res) => {
    let { id } = req.params;
    await Listing.findByIdAndUpdate(id, { ...req.body.listing });
    res.redirect(`/listings/${id}`);
  }));
  
  //Delete Route
  router.delete("/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
  }));

module.exports = router;
