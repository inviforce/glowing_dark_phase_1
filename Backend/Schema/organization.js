const mongoose=require("mongoose");

const Organization=mongoose.Schema({
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
    price:{
        type:Number,
        required:true,
    },
    pocket:{
        type:Number,
        required:true,
    },
    privilige:{
        type:String,
        required:true,
    },
})

const org_schema=mongoose.model("organization",Organization);

module.exports=org_schema