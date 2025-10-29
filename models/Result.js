import mongoose from "mongoose";

const ResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  language: { type: String, required: true },
  totalQuestions: { type: Number, required: true },
  correctAnswers: { type: Number, required: true },
  scorePercent: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

export default mongoose.models.Result || mongoose.model("Result", ResultSchema);
