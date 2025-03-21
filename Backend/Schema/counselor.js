const mongoose=require("mongoose");

const Counselor=mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
    privilige:{
        type:String,
        required:true,
    },
})

const couns_schema=mongoose.model("Counselor",Counselor);

module.exports=couns_schema