const { promisify } = require("util");
const jwt = require("jsonwebtoken");

exports.protect = async (req, res, next) => {
  try {
    let token = req.headers?.authorization;
    if (!token || !token.startsWith("Bearer")) {
      return res.status(401).json({ message: "No token in Bearer auth!" })
    }

    token = token.split(" ")[1];
    // if (!req.cookies.refreshToken) {
    //   return next(new appError("No refreshToken in cookie!", 401));
    // }
    // more security-> may compare it with the stored in db
    // if (!req.cookies?.refreshToken) {
    //   return res.status(401).json({ message: "No refreshToken found in cookie" })
    // }
    let decoded
    try {
      decoded = await promisify(jwt.verify)(token, process.env.ACCESS_SECRET);
    } catch (err) {
      console.log(err)
      return res.status(401).json({ message: "Unable to verify token" })
    }
    req.userId = decoded.id;
    next();
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Internal Server Error' })
  }
};