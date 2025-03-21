const mongoose=require("mongoose");

const Student=mongoose.Schema({
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
    mobile_no:{
        type:String,
        required:true,
    },
    grade:{
        type:String,
    },
    iforg:{
        type:Boolean,
        required:true,
    },
    enable:{
        type:Boolean,
        required:true,
    },
    info:{
        type:Boolean,
    },
    privilige:{
        type:String,
        required:true,
    }
})

const student_schema=mongoose.model("Student",Student);

module.exports=student_schema