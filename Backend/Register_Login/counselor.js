const bcrypt = require('bcrypt');
const Counselor = require("../Schema/counselor");
const {
  createAccessToken,
  createRefreshToken,
  sendAccessToken,
  sendRefreshToken
} = require("../token_order/token");


const Counselor_reg = async (req, res) => {
  try {
    const { name, email, password, privilige } = req.body;

    // Validate fields
    if (!name || !email || !password || !privilige) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate email format
    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if counselor already exists
    const existingCounselor = await Counselor.findOne({ email });
    if (existingCounselor) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save counselor
    const newCounselor = new Counselor({
      name,
      email,
      password: hashedPassword,
      privilige,
    });

    await newCounselor.save();
    return res.status(201).json({ message: "Counselor registered successfully" });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    return res.status(500).json({ message: "Server error, please try again" });
  }
}

const Counselor_login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user exists
    const user = await Counselor.findOne({ email });
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

module.exports = { Counselor_reg ,Counselor_login}; // Correct export
