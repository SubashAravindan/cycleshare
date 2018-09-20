var mongoose=require("mongoose");

var requestSchema= new mongoose.Schema({
	from:{
		lat:Number,
		lng:Number
	},
	to:{
		lat:Number,
		lng:Number
	},
	duration:{
		hours:Number,
		minutes:Number
	},
	requestedUser:String,
	status:Number,        // 0 for waiting, 1 for accepted, -1 for expired    
	created:Number
})

module.exports=mongoose.model("request",requestSchema);