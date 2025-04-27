const jwt = require("jsonwebtoken");

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.ACCESS_SECRET);
  } catch (err) {
    return null;
  }
};

module.exports = { verifyToken };
