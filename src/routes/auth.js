import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, username } = req.body;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const isValidEmail = emailRegex.test(email);

    if (!isValidEmail)
      return res.status(400).json({ message: "Invalid email" });

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Email or username already exists" });
    }

    const upperCase = /(.*[A-Z])/;
    const lowerCase = /(.*[a-z])/;
    const digit = /(.*[0-9])/;
    const specialChar = /([^A-Za-z0-9])/;

    if (password.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be minimum 8 characters" });

    if (!upperCase.test(password) || !lowerCase.test(password))
      return res.status(400).json({
        message: "Password must include one upper and lower case letter",
      });

    if (!digit.test(password) || !specialChar.test(password))
      return res
        .status(400)
        .json({
          message: "Password must include one digit and one special character",
        });

    const user = new User({ email, password, username });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      email: user.email,
      username: user.username,
      bestScore: user.bestScore,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
