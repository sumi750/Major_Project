const express = require("express");
const app = express();
const port = 3001;
const session = require("express-session");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const path = require("path");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// app.use(cookieParser("secretcode"));
const sessionOption = {
    secret: "mysecretstring",
    resave: false,
    saveUninitialized: true
}

app.use(flash());
app.use(session(sessionOption));
app.use((req,res,next)=>{
    res.locals.Smsg = req.flash("success");
    res.locals.Emsg = req.flash("Error");
    next();
})


app.get("/register", (req,res)=>{
    let {name = "unkown"} = req.query;
    req.session.name = name;   // Save the name 
    if(name == "unkown"){
        req.flash("Error", "user not resiter");
    }
    else{
        req.flash("success", "user reisgter successfully!");
    }
    res.redirect('/hello');
})

app.get("/hello", (req,res)=>{
    // res.locals.msg = req.flash("success");
    res.render("page.ejs", {name : req.session.name});
})


// app.get("/greet", (req,res)=>{
//     let {name = "unkw"} = req.cookies;
//     res.send(`Hi , ${name}`);
// })

// app.get("/reqcount", (req,res)=>{ 
//     if(req.session.count) // Exists
//         {
//             req.session.count++;
//     }
//     else{
//         req.session.count = 1; 
//     }

//     res.send(`you send request ${req.session.count} times`)

// })

// app.get("/test", (req,res)=>{
//     res.send("Test Succesfull!");
// })


// app.get("/verify", (req,res)=>{
//     console.log(req.signedCookies);
// });

app.listen(port, ()=>{
    console.log("Server is listing on port ", port);
})