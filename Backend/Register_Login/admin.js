const bcrypt = require('bcrypt');
const Admin = require("../Schema/admin");
const fs = require('fs').promises;
const {
  createAccessToken,
  createRefreshToken,
  sendAccessToken,
  sendRefreshToken
} = require("../token_order/token");

// Admin Registration
const admin_reg = async (req, res) => {
  try {
    const { name, email, password, hash, privilige } = req.body;

    // Validate fields
    if (!name || !email || !password || !hash || !privilige) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate email format
    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Read the hash from the file
    let fileHash;
    try {
      fileHash = await fs.readFile('./Register/checker.txt', 'utf8');
    } catch (err) {
      console.error('Error reading the hash file:', err.message);
      return res.status(500).json({ error: "Internal server error" });
    }

    // Check hash
    if (hash !== fileHash.trim()) {
      return res.status(403).json({ error: "Unauthorized access: Invalid hash" });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save admin
    const newAdmin = new Admin({ name, email, password: hashedPassword, privilige });
    await newAdmin.save();

    return res.status(201).json({ message: "Admin registered successfully" });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    return res.status(500).json({ message: "Server error, please try again" });
  }
}

// Admin Login
const admin_login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user exists
    const user = await Admin.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found. Please register first" });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate tokens using correct field
    const accessToken = createAccessToken(user._id, user.privilige);
    const refreshToken = createRefreshToken(user._id, user.privilige);

    // Send Tokens
    sendRefreshToken(res, refreshToken);  
    sendAccessToken(res, accessToken); 

    return res.status(200).json({ message: "Login successful" });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    return res.status(500).json({ message: "Server error, try again later" });
  }
}

module.exports = { admin_reg, admin_login };
