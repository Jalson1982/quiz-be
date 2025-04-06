import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  options: [
    {
      text: String,
      isCorrect: Boolean,
    },
  ],
  timeLimit: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  createdBy: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
});

export default mongoose.model("Question", questionSchema);
