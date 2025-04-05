import express from "express";
import Question from "../models/Question.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
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
      category,
    });

    await question.save();
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
