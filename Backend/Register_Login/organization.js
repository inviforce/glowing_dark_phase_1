const bcrypt = require('bcrypt');
const Organization = require("../Schema/organization");
const {
  createAccessToken,
  createRefreshToken,
  sendAccessToken,
  sendRefreshToken
} = require("../token_order/token");


const Organization_reg = async (req, res) => {
  try {
    const { name, email, password, price, privilige } = req.body;

    // Validate fields
    if (!name || !email || !password || !omni_id || !privilige) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate email format
    const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if Organization already exists
    const existingOrganization = await Organization.findOne({ email });
    if (existingOrganization) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    price=Number(price)
    // Save new Organization
    const newOrganization = new Organization({
      name,
      email,
      password: hashedPassword,
      price,
      pocket:0,
      privilige,
    });

    await newOrganization.save();
    return res.status(201).json({ message: "Organization registered successfully" });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    return res.status(500).json({ message: "Server error, please try again" });
  }
}

const Organization_login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user exists
    const user = await Organization.findOne({ email });
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
module.exports = { Organization_reg,Organization_login };
