var mongoose              = require("mongoose"),
    passportLocalMongoose = require("passport-local-mongoose");

var userSchema=new mongoose.Schema({
	username:String,
	password:String,
	cycle: {
		type:mongoose.Schema.Types.ObjectId,
		ref:"cycle"
	},
	lastLocation:{
		lat:String,
		lng:String
	},
	creditBalance:Number
})

userSchema.plugin(passportLocalMongoose);

module.exports=mongoose.model("user",userSchema);