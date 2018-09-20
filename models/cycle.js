var mongoose=require("mongoose");

mongoose.connect("mongodb://localhost/cycleshare");
var cycleSchema=new mongoose.Schema({
	name: String,
	image:String,
	price:String
})


module.exports= mongoose.model("cycle",cycleSchema);