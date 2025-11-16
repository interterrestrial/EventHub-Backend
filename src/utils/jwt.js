import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;

export const signToken = (payload, options = {}) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "7d", ...options });
