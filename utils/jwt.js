const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY || "not-safe";

const generateToken = (payload) =>
  jwt.sign(payload, SECRET_KEY, {
    expiresIn: "1h",
  });
const readPayload = (token) => jwt.verify(token, SECRET_KEY);

module.exports = {
  generateToken,
  readPayload,
};
