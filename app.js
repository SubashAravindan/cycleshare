var express        = require("express"),
	app            = express(),
	passport       = require("passport"),
	LocalStrategy  = require("passport-local"),
	  bodyParser   = require("body-parser"),
	User           = require("./models/user"),
	path           = require("path"),
	Request        = require("./models/request"),
	multer         = require("multer"),
	dist           = require('geo-distance-js'),
	methodOverride = require("method-override"),
	Cycle          = require("./models/cycle"),
	upload         = multer({ dest: 'cycleimages/' }),
	mongoose       = require("mongoose");




//=======================MIDDLEWARE FUNCTIONS================================


app.set("view engine","ejs");
app.use(methodOverride("_method"));
app.use(express.static(__dirname+"/public"));
app.use(express.static(__dirname+"/cycleimages"));
mongoose.connect("mongodb://localhost/cycleshare");
app.use(bodyParser.urlencoded({extended:true}));


//==============================PASSPORT CONFIG==============================
app.use(require("express-session")({
	secret: "sshoooo this is a very secrety secret",
	resave:false,
	saveUninitialized:false
}))

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req,res,next)=>{
	res.locals.currentUser=req.user;
	next();
})

//===========================================================================


app.get("/",isLoggedIn,isWaitingForRequest,(req,res)=>{
	res.render("home");
})

//========USER PROFILE PAGE=====

app.get("/user",isLoggedIn,isWaitingForRequest,(req,res)=>{
	User.findById(req.user.id).populate("cycle").exec(function(err,result){
		if (err) {
			console.log(err)
		}
		console.log(result)
		res.render("profile",{user:result});	
	})	
})

//========SHOW NEW CYCLE FORM===

app.get("/user/cycle/new",isLoggedIn,isWaitingForRequest,(req,res)=>{
	res.render("newcycle");
})

//=======CREATE NEW CYCLE======

app.post("/user/cycle/new",isLoggedIn,isWaitingForRequest,upload.single('image'),(req,res)=>{
	var fileName;
	//Check if the uploaded file is a image
	if (req.file) {
		if (!(req.file.mimetype==="image/jpeg"||req.file.mimetype==="image/jpg"||req.file.mimetype==="image/png")) {
			alert("file is not image");
			return res.redirect("/items/new");
		}
		fileName=req.file.filename;
	}
	Cycle.create({name:req.body.modelName,image:fileName,price:req.body.price},(err,result)=>{
		if (err) {
			return res.redirect("/user/cycle/new");
		} else {
			User.findByIdAndUpdate(req.user.id,{cycle:result._id},(err,result2)=>{
				if (err) {
					returnres.redirect("/user/cycle/new")
				} else {
					res.redirect("/user");
				}
			})
		}
	})

})


//=============SHOW CYCLE EDIT PAGE=========

app.get("/user/cycle/edit",isLoggedIn,isWaitingForRequest,(req,res)=>{
	User.findById(req.user.id,(err,user)=>{
		if (err) {
			console.log(err)
		} else {
			Cycle.findById(user.cycle,(err,existingCycle)=>{
				if (err) {
					console.log(err)
				} else {
					res.render("editcycle",{existingCycle:existingCycle});
				}
			})
		}
	})
	
})


//============EDIT THE CYCLE====================

app.put("/user/cycle",isLoggedIn,upload.single('image'),isWaitingForRequest,(req,res)=>{
	User.findById(req.user.id,(err,foundUser)=>{
		if (err) {
			console.log(err)
			return res.redirect("/user/cycle/edit")
		} else {
			Cycle.findByIdAndUpdate(foundUser.cycle,{name:req.body.modelName,image:req.file.filename,price:req.body.price},(err,result)=>{
				if (err) {
					console.log(err)
					return res.redirect("/user/cycle/edit")
				} else {

				}
			})
		}
	})
})

//============DELETE CYCLE=================

app.delete("/user/cycle",isLoggedIn,isWaitingForRequest,(req,res)=>{
	User.findByIdAndUpdate(req.user.id,{cycle:undefined},(err,result)=>{
		if (err) {
			console.log(err)
		} else {
			Cycle.findByIdAndDelete(result.cycle,(err,deletedCycle)=>{
				if (err) {
					console.log(err)
				} else {
					console.log(deletedCycle);
					res.redirect("/user")
				}
			})
		}
	})
})

//========VIEW CYCLE IMAGE=============

app.get("/cycleimages/:filename",isLoggedIn,isWaitingForRequest,(req,res)=>{
	res.sendFile(path.join(__dirname, '/cycleimages', req.params.filename));
})


//=========UPDATE LOCATION=============

app.post("/user/location",(req,res)=>{

	User.findByIdAndUpdate(req.body.userId,{lastLocation:req.body.lastLocation},(err,result)=>{
		if (err) {
			console.log(err)
		} else {
			res.end();
		}
	})
})

//=============CREATE REQUEST===========

app.post("/request",isWaitingForRequest,(req,res)=>{
	var data=req.body;
	data.requestedUser=req.user.username;
	data.status=0;
	data.created=Date.now();
	Request.create(data,(err,result)=>{
		if (err) {
			console.log(err)
		} else {
			res.send("1")
		}
	})
	
})


//================WAITING FOR REQUEST=============

app.get("/requested",isLoggedIn,(req,res)=>{
	Request.find({requestedUser:req.user.username,status:0},(err,result)=>{
		if (err) {
			console.log(err);
		} else {
			console.log(result)
			if (result.length) {
				res.render("requested",{request:result[0]});
			} else {
				res.redirect("/")
			}
		}
	})
	
})

//==============DELETE REQUEST===================

app.get("/deleterequest",isLoggedIn,(req,res)=>{
	Request.deleteOne({requestedUser:req.user.username,status:0},(err,result)=>{
		if (err) {
			console.log(err);
			res.redirect("/requested");
		} else {
			res.redirect("/");
		}
	})
})

//============CHECK REQUESTS WITH AJAX==========
app.get("/checkrequests",(req,res)=>{
	userLatLng=req.query.location;
	Request.find({status:0},(err,result)=>{
		if (err) {
			console.log(err)
		} else {
			result.forEach((item,index)=>{
				if (dist.getDistance(userLatLng.lat, userLatLng.lng, item.fromLat, item.fromLng)>500) {
					result.splice(i,1);
				}
			})
			User.findById(req.query.userId,(er,foundUser)=>{
				if (er) {
					console.log(err);
				}

				if (!foundUser.cycle) {
					res.send(null)
				}else{
					res.send(result)
				}
			})
			
		}
	})
})

//=============VIEW REQUESTS PAGE===========
app.get("/requests",isLoggedIn,(req,res,next)=>{
	User.findById(req.user.id,(err,foundUser)=>{
		if (!foundUser.cycle) {
			return res.redirect("/");
		}else{
			return next()
		}
	})
},(req,res)=>{
	res.render("requests");
})

//======AJAX REQ TO CHECK IF REQUEST IS STILL WAITING=====
app.get("/iswaiting",(req,res)=>{
	Request.find({requestedUser:req.query.username,status:0},(err,result)=>{
		if (err) {
			console.log(err);
		}else{
			if (!result.length) {
				res.send(false)
			}else{
				res.send(true)
			}
		}
	})
})

function isWaitingForRequest(req,res,next) {
	Request.find({requestedUser:req.user.username,status:0},(err,result)=>{
		if (err) {
			console.log(err)
		} else {
			if (result.length) {
				res.redirect("/requested")
			} else {
				return next()
			}
		}
	})

}

//========================ACCEPT OR EXPIRE REQUEST========================
app.get("/request/:id/:response",isLoggedIn,(req,res)=>{
	Request.findByIdAndUpdate(req.params.id,{status:Number(req.params.response)},(err,result)=>{
		if (err) {
			console.log(err)
		} else {
			var price;
			if (req.params.response==1) {
				User.findById(req.user.id).populate("cycle").exec((err,foundUser)=>{
					if (err) {
						console.log(err)
					} else {
						price=foundUser.cycle.price;
						change=price*(result.duration.hours+result.duration.minutes/60)
					}
				User.findByIdAndUpdate(req.user.id,{ $inc: {creditBalance:change} },(err,updatedUser)=>{
						if (err) {
							console.log(err)
						} else {
							User.findOneAndUpdate({username:result.requestedUser},{ $inc: {creditBalance:-1*change} },(err,user)=>{
								if (err) {
									console.log(err)
								} else {
									console.log(change)
									return res.redirect("/")
								}
							})
						}
					})
				})
	
			}
			
		}
	})
})
//================================AUTH ROUTES================================

//===SHOW REGISTER FORM=====

app.get("/register",(req,res)=>{
	res.render("register");
})

//====CHECK IF USERNAME EXISTS(WITH AJAX)======

app.get("/usernamecheck",(req,res)=>{
	User.find({username:req.query.input},(err,result)=>{
		if (err) {
			console.log(err)
		} else {
			res.send(""+result.length);
		}
	})
})

//=====REGISTER USER=======

app.post("/register",(req,res)=>{
	User.register(new User({username:req.body.username}),req.body.password,(err,newUser)=>{
		if (err) {
			console.log(err)
			return res.redirect("/register")
		} else {
			newUser.creditBalance=500;
			newUser.save()
			passport.authenticate("local")(req,res,()=>{
				res.redirect("/");
			})			
		}
	})
})


//======SHOW LOGIN FORM=======

app.get("/login",(req,res)=>{
	res.render("login");
})


//======LOGIN THE USER========

app.post("/login",passport.authenticate("local",
	{
		successRedirect:"/",
		failureRedirect:"/login"
	}),(req,res)=>{}
);


//========LOGOUT ROUTE==============

app.get("/logout",isWaitingForRequest,(req,res)=>{
	req.logout();
	res.redirect("/");
})

//==============CHECK FOR LOGIN==========

function isLoggedIn(req,res,next){
	if (req.user) {
		return next();
	} else {
		res.redirect('/login');
	}
}


app.listen(3000,()=>{
	console.log("Server has started")
})  