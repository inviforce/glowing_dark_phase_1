require("dotenv").config();  // Load environment variables
const express = require("express");
const cors = require("cors"); // 📞 Frontend & Backend Communication
const { verify } = require("jsonwebtoken");
const { hash, compare } = require("bcryptjs"); // Cryptographic functions
const mongoose = require("mongoose");
const power_play = require("./Schema/power_play");
const bcrypt = require("bcryptjs");
const { authenticateToken } = require("./middleware/authenticateToken");
const cookieParser = require("cookie-parser");
const {admin_reg,admin_login}=require("./Register_Login/admin");
const {csr_reg,csr_login}=require("./Register_Login/csr");
const {Student_reg,Student_login}=require("./Register_Login/student");
const {Organization_reg,Organization_login}=require("./Register_Login/organization");
const{Counselor_reg,Counselor_login}=require("./Register_Login/counselor")
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const Admin = require("./Schema/admin");
const Counselor = require("./Schema/counselor");
const Csr = require("./Schema/csr_manager");
const Organization = require("./Schema/organization");
const Student = require("./Schema/student");


const app = express(); 

app.use(cors({}));
app.use(cookieParser()); 
app.use(express.json()); // JSON parsing
app.use(express.urlencoded({ extended: true })); // Read URL-encoded post data

const PORT = process.env.PORT;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS  // Your email password
  }
});

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/power_play", {  
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("🔥 MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

app.post("/register", async (req, res) => {
  try {
    const { privilige } = req.body;
    if (!privilige) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (privilige === "ADMIN") {
      return await admin_reg(req, res); // Call the Admin function without authentication
    }
    
    if (privilige === "CSR") {
      // Authenticate with "ORGANIZATION" privilege
      await authenticateToken("ORGANIZATION")(req, res, async () => {
        return await csr_reg(req, res); // Call the CSR function
      });
      return;
    }
    
    if (privilige === "ORGANIZATION") {
      await authenticateToken("ADMIN")(req, res, async () => {
        return await Organization_reg(req, res);
      });
      return;
    }
    
    if (privilige === "STUDENT") {
      await authenticateToken("ORGANIZATION")(req, res, async () => {
        return await Student_reg(req, res);
      });
      return;
    }

    if (privilige === "COUNSELOR") {
      await authenticateToken("ADMIN")(req, res, async () => {
        return await Counselor_reg(req, res);
      });
      return;
    }

    return res.status(403).json({ error: "Unauthorized privilege" });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    return res.status(500).json({ message: "Server error, please try again" });
  }
});



  
// User Login
app.post("/login", async (req, res) => {
    try {
        const { privilige } = req.body;
        if (!privilige) {
          return res.status(400).json({ error: "All fields are required" });
        }
    
        if (privilige === "ADMIN") {
          return await admin_login(req, res); // Call the admin function
        }
        if (privilige === "CSR") {
          return await csr_login(req, res); // Call the admin function
        }
        if(privilige==="ORGANIZATION"){
          return await Organization_login(req,res);
        }
        if(privilige==="STUDENT"){
          return await Student_login(req,res);
        }
        if(privilige==="COUNSELOR"){
          return await Counselor_login(req,res);
        }
        return res.status(403).json({ error: "Unauthorized privilege" });
    
      } catch (error) {
        console.error(`Error: ${error}`);
        return res.status(500).json({ message: "Server error, please try again" });
      }
});


app.post("/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  return res.status(200).json({ message: "Logged out successfully" });
});

app.get("/restricted", authenticateToken(), (req, res) => {
    res.json({ message: "Welcome to the Area 51!", user: req.user });
});

app.get("/admin-area", authenticateToken("ADMIN"), (req, res) => {
    res.json({ message: "Welcome, Admin!", user: req.user });
});

app.get("/csr-area", authenticateToken("CSR"), (req, res) => {
    res.json({ message: "Welcome, CSR!", user: req.user });
});

app.get("/student-area", authenticateToken("STUDENT"), (req, res) => {
    res.json({ message: "Welcome, Student!", user: req.user });
});

app.get("/counsellor-area", authenticateToken("COUNSELLOR"), (req, res) => {
    res.json({ message: "Welcome, Counsellor!", user: req.user });
});

app.post("/reset-password-request", async (req, res) => {
  const { email,privilige } = req.body;

  try {
      if (!email || !privilige) return res.status(400).json({ message: "Email is required" });
      let user
      if (privilige === "ADMIN") {
        user = await Admin.findOne({ email });
      }
      if (privilige === "CSR") {
        user = await Csr.findOne({ email });
      }
      if(privilige==="ORGANIZATION"){
        user = await Organization.findOne({ email });
      }
      if(privilige==="STUDENT"){
        user = await Student.findOne({ email });
      }
      if(privilige==="COUNSELOR"){
        user = await Counselor.findOne({ email });
      }
      if (!user) return res.status(404).json({ message: "User not found" });

      // Generate a secure token
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour

      // Store the reset token & expiry in the database
      user.resetToken = resetToken;
      user.resetTokenExpiry = resetTokenExpiry;
      await user.save();

      // Send Email with Reset Link
      const resetLink = `localhost:${PORT}/reset-password/${resetToken}`;
      await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Password Reset Request",
          text: `Click the link to reset your password: ${resetLink}`
      });

      res.json({ message: "Password reset link sent to your email" });

  } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error, try again later" });
  }
});


// app.post("/reset-password/:token", async (req, res) => {
//   const { token } = req.params; // Extract token from URL
//   const { newPassword } = req.body; // Extract new password from request body

//   try {
//       if (!token || !newPassword) {
//           return res.status(400).json({ message: "Token and new password are required" });
//       }

//       const user = await power_play.findOne({
//           resetToken: token,
//           resetTokenExpiry: { $gt: Date.now() } // Ensure token is still valid
//       });

//       if (!user) {
//           return res.status(400).json({ message: "Invalid or expired token" });
//       }

//       // Hash the new password
//       user.password = await bcrypt.hash(newPassword, 10);
//       user.resetToken = undefined;  // Clear token
//       user.resetTokenExpiry = undefined;  // Clear expiry
//       await user.save();

//       res.json({ message: "Password has been reset successfully" });

//   } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: "Server error, try again later" });
//   }
// });

// Initialize Razorpay
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// // Create an order
// app.post("/create-order", authenticateToken(), async (req, res) => {
//   try {
//       const { amount } = req.body;
//       if (!amount) {
//           return res.status(400).json({ error: "Amount is required" });
//       }

//       const options = {
//           amount: amount * 100, // Convert INR to paise
//           currency: "INR",
//           receipt: `receipt_${Date.now()}`,
//       };

//       const order = await razorpay.orders.create(options);
//       res.json({ success: true, orderId: order.id });
//   } catch (error) {
//       res.status(500).json({ error: error.message });
//   }
// });

// // Verify payment (webhook)
// app.post("/verify-payment", authenticateToken(), async (req, res) => {
//   try {
//       const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body;
//       const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
//       shasum.update(razorpay_order_id + "|" + razorpay_payment_id);
//       const generatedSignature = shasum.digest("hex");

//       if (generatedSignature === razorpay_signature) {
//           await payment.create({
//               orderId: razorpay_order_id,
//               paymentId: razorpay_payment_id,
//               signature: razorpay_signature,
//               amount: amount,
//               status: "success",
//               user: req.user.email
//           })
//       res.json({ success: true, message: "Payment Verified" });
//       } else {
//       res.status(400).json({ success: false, message: "Invalid Payment Signature" });
//       }
//   } catch (error) {
//       res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// });

// Basic Route
app.get("/", (req, res) => {
    res.send("Welcome to the Power Play API!");
});

// Start Server
app.listen(PORT, () => {
    console.log(`👂 Listening on Port: ${PORT}`);
});
