const bcrypt = require('bcrypt');
const Csr = require("../Schema/csr_manager");
const {
  createAccessToken,
  createRefreshToken,
  sendAccessToken,
  sendRefreshToken
} = require("../token_order/token");

// Email validation function using regex
const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

const csr_reg = async (req, res) => {
  try {
    const { name, email, password, mobile_no, manager, email_man, privilige } = req.body;

    // Validate fields
    if (!name || !email || !password || !mobile_no || !privilige) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate manager's email if applicable
    if (!manager && (!email_man || !isValidEmail(email_man))) {
      return res.status(400).json({ error: "Valid manager email is required" });
    }

    // Check if CSR already exists
    const existingCsr = await Csr.findOne({ email });
    if (existingCsr) {
      return res.status(400).json({ error: "Email already registered" });
    }

    let existingManager = null;
    if (!manager) {
      existingManager = await Csr.findOne({ email: email_man });
      if (!existingManager) {
        return res.status(404).json({ error: "Manager not found" });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save new CSR/Manager
    const newCsr = new Csr({
      name,
      email,
      password: hashedPassword,
      mobile_no,
      manager,
      privilige,
      storeId: existingManager?._id,
    });

    await newCsr.save();
    return res.status(201).json({ message: "Csr/Manager registered successfully" });

  } catch (error) {
    console.error(`Error: ${error.message}`);
    return res.status(500).json({ message: "Server error, please try again" });
  }
}

const csr_login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if user exists
    const user = await Csr.findOne({ email });
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

module.exports = { csr_reg,csr_login };
