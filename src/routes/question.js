import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Question from "../models/Question.js"; 

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

router.post("/", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { title, options, timeLimit, category } = req.body;

    // Validate request body
    if (!title || !options || !timeLimit || !category) {
      return res.status(400).json({
        message:
          "All fields are required (title, options, timeLimit, category)",
      });
    }

    // Validate options format
    if (!Array.isArray(options) || options.length !== 4) {
      return res
        .status(400)
        .json({ message: "Options must be an array with exactly 4 items" });
    }

    // Check if at least one option is correct
    const hasCorrectOption = options.some((option) => option.isCorrect);
    if (!hasCorrectOption) {
      return res
        .status(400)
        .json({ message: "At least one option must be correct" });
    }

    const question = new Question({
      title,
      options,
      timeLimit,
      category
    });

    await question.save();
    res.status(201).json(question);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
