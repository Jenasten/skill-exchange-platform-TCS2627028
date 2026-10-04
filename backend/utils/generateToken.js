const jwt = require("jsonwebtoken");

// Creates a JWT that expires in 30 days, containing the user's id
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

module.exports = generateToken;
