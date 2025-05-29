/**
 * @swagger
 * tags:
 *   name: Questions
 *   description: Question management endpoints
 */

/**
 * @swagger
 * /questions:
 *   post:
 *     summary: Add a new question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - options
 *               - timeLimit
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               options:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                     isCorrect:
 *                       type: boolean
 *               timeLimit:
 *                 type: integer
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Question added successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */

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
      category,
      createdBy: {
        _id: user._id,
        username: user.username,
        email: user.email,
      },
    });

    await question.save();
    res.status(201).json(question);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/bulk", async (req, res) => {
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
  const { questions } = req.body;
  if (!questions) {
    return res.status(400).json({ message: "Questions are required" });
  }

  const formattedQuestions = questions.map((question) => ({
    ...question,
    createdBy: {
      _id: user._id,
      username: user.username,
      email: user.email,
    },
  }));
  const respon = await Question.insertMany(formattedQuestions);

  res.status(201).json(respon);
});

router.get("/", async (req, res) => {
  // return all questions
  const questions = await Question.find();
  console.log(questions.length);
  res.status(200).json(questions);
});

export default router;
