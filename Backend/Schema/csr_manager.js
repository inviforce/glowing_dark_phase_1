const mongoose = require("mongoose");

const CsrSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  mobile_no: {
    type: String,
    required: true,
  },
  manager: {
    type: Boolean,
    required: true,
    default: false,
  },
  privilige:{
    type:String,
    required:true,
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Csr",
    required: function() {
      return this.manager; 
    }
  },
});

const Csr = mongoose.model("Csr", CsrSchema);

module.exports = Csr;
