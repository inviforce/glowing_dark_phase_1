const mongoose=require("mongoose");

const Admin=mongoose.Schema({
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

const admin_schema=mongoose.model("Admin",Admin);

module.exports=admin_schema