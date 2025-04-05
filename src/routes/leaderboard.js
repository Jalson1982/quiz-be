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
