/**
 * @swagger
 * tags:
 *   name: Leaderboard
 *   description: Leaderboard management endpoints
 */

/**
 * @swagger
 * /leaderboard:
 *   get:
 *     summary: Get top 10 players
 *     tags: [Leaderboard]
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *       500:
 *         description: Server error
 */

import express from "express";
import User from "../models/User.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const leaderboard = await User.find()
      .sort({ bestScore: -1 })
      .limit(10)
      .select("username bestScore");

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
