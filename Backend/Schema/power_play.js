const mongoose=require("mongoose");

const user=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        unique:true,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    power:{
        type:String,
        required:true
    }
})

const user_schema=mongoose.model("power_play",user);

module.exports=user_schema