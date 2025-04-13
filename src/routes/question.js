import express from "express";
import jwt from "jsonwebtoken";
import xlsx from "xlsx";
import { fileURLToPath } from "url";
import { dirname } from "path";
import User from "../models/User.js";
import Question from "../models/Question.js";

const __filename = fileURLToPath(import.meta.url);

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

    if (user.role !== "admin")
      return res.status(401).json({ message: "You are not an admin!" });

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

router.get("/", async (req, res) => {
  try {
    const questions = await Question.find();
    if (questions.length === 0) return;

    const cleanedData = questions.map((q) => ({
      Pitanje: q.title,
      "Odgovor A": q.options[0]?.text || "",
      "Tačnost A": q.options[0]?.isCorrect ? "tačno" : "netačno",
      "Odgovor B": q.options[1]?.text || "",
      "Tačnost B": q.options[1]?.isCorrect ? "tačno" : "netačno",
      "Odgovor C": q.options[2]?.text || "",
      "Tačnost C": q.options[2]?.isCorrect ? "tačno" : "netačno",
      "Odgovor D": q.options[3]?.text || "",
      "Tačnost D": q.options[3]?.isCorrect ? "tačno" : "netačno",
      Vrijeme: q.timeLimit,
      Kategorija: q.category,
    }));

    const worksheet = xlsx.utils.json_to_sheet(cleanedData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Questions");

    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", "attachment; filename=questions.xlsx");
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
