require("dotenv").config();  // Load environment variables
const express = require("express");
const cors = require("cors"); // 📞 Frontend & Backend Communication
const { verify } = require("jsonwebtoken");
const { hash, compare } = require("bcryptjs"); // Cryptographic functions
const mongoose = require("mongoose");
const power_play = require("./Schema/power_play");
const bcrypt = require("bcryptjs");
const {
    createAccessToken,
    createRefreshToken,
    sendAccessToken,
    sendRefreshToken
} = require("./token_order/token");
const {authenticateToken} = require("./middleware/authenticateToken");
const cookieParser = require("cookie-parser");

const app = express(); 

app.use(cors({
}));
app.use(cookieParser()); 
app.use(express.json()); // JSON parsing
app.use(express.urlencoded({ extended: true })); // Read URL-encoded post data

const PORT = process.env.PORT;

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/power_play", {  
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("🔥 MongoDB Connected"))
.catch(err => console.log("❌ MongoDB Connection Error:", err));

// User Registration
app.post("/register", async (req, res) => {
    const { name, email, password, privilige } = req.body;
    try {
        if (!name || !email || !password || !privilige) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const existingUser = await power_play.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already exists" });
        }

        const hashed_pass = await hash(password, 10); // Hash password with salt
        const newUser = new power_play({
            name,
            email,
            password: hashed_pass,
            power: privilige
        });

        await newUser.save();
        return res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        console.error(`Error: ${error}`);
        return res.status(500).json({ message: "Server error, please try again" });
    }
});

// User Login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await power_play.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found. Please register first" });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ message: "Invalid password" });
        }
        //console.log("User Privilege:", user.power);

        const accessToken = createAccessToken(user._id, user.power);
        const refreshToken = createRefreshToken(user._id, user.power);

        // Send Refresh Token as HTTP-Only Cookie
        sendRefreshToken(res, refreshToken);  
        sendAccessToken(res, accessToken); 
        // Send Access Token in Response
        return  res.status(200).json({ message: "good" });

    } catch (error) {
        console.error(`Error: ${error}`);
        return res.status(500).json({ message: "Server error, try again later" });
    }
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


// Basic Route
app.get("/", (req, res) => {
    res.send("Welcome to the Power Play API!");
});

// Start Server
app.listen(PORT, () => {
    console.log(`👂 Listening on Port: ${PORT}`);
});
