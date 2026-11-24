import User from "../models/userModel.js";

export const findByEmail = async (email) => User.findOne({ email }).lean();

export const findByUsername = async (username) =>
  User.findOne({ username }).lean();

export const findById = async (id) => User.findById(id).lean();

export const create = async (data) => (await User.create(data)).toObject();

export const getLeaderboardRanks = async () => {
  return User.find(
    { optInLeaderboard: true },
    { username: 1, "stats.score": 1, _id: 0 },
  )
    .sort({ "stats.score": -1 })
    .limit(10)
    .lean();
};
