import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "mySuperSecretKey123";

export function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    return null;
  }
}
