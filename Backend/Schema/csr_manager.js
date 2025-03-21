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
  manager: {  //will  be removed
    type: Boolean,
    required: true,
    default: false,
  },
  privilige:{// array all
    type:String,
    required:true,
  },
  storeId: { //manager_id
    type: mongoose.Schema.Types.ObjectId,
    ref: "Csr",
    required: function() {
      return this.manager; 
    }
  }, // state active student info (cases) array of object organization====studnet
});

const Csr = mongoose.model("Csr", CsrSchema);

module.exports = Csr;
