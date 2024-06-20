const Listing = require("./models/listing.js");
const Review = require("./models/review.js");
module.exports.isLoggedIn = (req,res,next)=>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "Please LogIn First!");
        return res.redirect("/login");
    }
    next();
}

module.exports.saveRedirectUrl = (req,res,next)=>{
    if(req.session.redirectUrl){
        
        res.locals.redirect =  req.session.redirectUrl
    }
    next();
} 

module.exports.isOwner = async (req,res,next)=>{
    let { id } = req.params;
  let listing = await Listing.findById(id);
  if(!listing.owner._id.equals(res.locals.currUser._id)){
      req.flash("error", "you are not a valid user ");
      return res.redirect(`/listings/${id}`);
  }
  next();
}

module.exports.isAuthor = async (req,res,next)=>{
    let { id, reviewId } = req.params;
  let review = await Review.findById(reviewId);
  if(!review.author._id.equals(res.locals.currUser._id)){
      req.flash("error", "you are not a valid author to delete the review ");
      return res.redirect(`/listings/${id}`);
  }
  next();
}
