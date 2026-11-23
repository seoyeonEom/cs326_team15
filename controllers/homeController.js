import { getLeaderboard } from "../services/leaderboardService.js";

export const renderHome = async (req, res) => {
  const result = await getLeaderboard();
  if (!result.ok) {
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }

  res.render("home", {
    title: "Carbon Footprint Tracker",
    leaderboard: result.value,
  });
};
