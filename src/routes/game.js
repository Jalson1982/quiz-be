/**
 * @swagger
 * tags:
 *   name: Game
 *   description: Game management endpoints
 */

/**
 * @swagger
 * /game/start:
 *   post:
 *     summary: Start a new game
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Game started successfully
 *       400:
 *         description: No questions available
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /game/answer:
 *   post:
 *     summary: Submit an answer
 *     tags: [Game]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - gameId
 *               - questionId
 *               - answer
 *             properties:
 *               gameId:
 *                 type: string
 *               questionId:
 *                 type: string
 *               answer:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Answer submitted successfully
 *       400:
 *         description: Invalid game or question
 *       500:
 *         description: Server error
 */

import express from "express";
import auth from "../middleware/auth.js";
import Game from "../models/Game.js";
import Question from "../models/Question.js";
import User from "../models/User.js";

const router = express.Router();

router.post("/start", auth, async (req, res) => {
  try {
    // Mark all active games for the user as inactive
    await Game.updateMany(
      { userId: req.user.id, isActive: true },
      { isActive: false }
    );

    const game = new Game({ userId: req.user.id });
    await game.save();

    // Add random sorting using MongoDB's aggregation
    const question = await Question.aggregate([
      { $match: { _id: { $nin: game.answeredQuestions } } },
      { $sample: { size: 1 } },
      {
        $project: {
          title: 1,
          timeLimit: 1,
          category: 1,
          "options.text": 1,
        },
      },
    ]).then((questions) => questions[0]);

    if (!question) {
      return res.status(400).json({ message: "No questions available" });
    }

    res.json({ gameId: game._id, question });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/answer", auth, async (req, res) => {
  try {
    const { gameId, questionId, answer } = req.body;
    const game = await Game.findById(gameId);

    if (!game || !game.isActive) {
      return res.status(400).json({ message: "Invalid game" });
    }

    const question = await Question.findById(questionId);

    if (!question) {
      return res.status(400).json({ message: "Question not found" });
    }

    const isCorrect = question.options.find(
      (option) => option.text === answer
    )?.isCorrect;

    if (!isCorrect) {
      game.isActive = false;
      await game.save();

      const user = await User.findById(req.user.id);
      if (game.score > user.bestScore) {
        user.bestScore = game.score;
        await user.save();
      }

      return res.json({
        gameOver: true,
        reason: "wrong_answer",
        score: game.score,
        bestScore: user.bestScore,
      });
    }

    game.score += 1;
    game.answeredQuestions.push(questionId);
    await game.save();

    // Get next random question
    const nextQuestion = await Question.aggregate([
      {
        $match: {
          _id: { $nin: game.answeredQuestions },
        },
      },
      { $sample: { size: 1 } },
      {
        $project: {
          title: 1,
          timeLimit: 1,
          category: 1,
          "options.text": 1,
        },
      },
    ]).then((questions) => questions[0]);

    if (!nextQuestion) {
      game.isActive = false;
      await game.save();

      const user = await User.findById(req.user.id);
      if (game.score > user.bestScore) {
        user.bestScore = game.score;
        await user.save();
      }

      return res.json({
        gameOver: true,
        reason: "completed",
        score: game.score,
        bestScore: user.bestScore,
        message: "Congratulations! You've answered all questions correctly!",
      });
    }

    res.json({
      correct: true,
      score: game.score,
      nextQuestion,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
