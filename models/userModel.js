import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["member", "admin"], default: "member" },
    optInLeaderboard: { type: Boolean, default: true },
    stats: {
      score: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
