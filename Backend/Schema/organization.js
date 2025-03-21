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
    price:{ //credits
        type:Number,
        required:true,
    },
    pocket:{ //wallet
        type:Number,
        required:true,
    },
    privilige:{ //array like
        type:String,
        required:true,
    },//organization owned prod array liek obejct 
})

const org_schema=mongoose.model("organization",Organization);

module.exports=org_schema

// product schema 
//servies price  info_about  content 