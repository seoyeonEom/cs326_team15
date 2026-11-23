import { getLeaderboardRanks } from "../repositories/userRepository.js";
import { Ok, Err } from "../result.js";

export const getLeaderboard = async () => {
  const users = await getLeaderboardRanks();
  if (!users)
    return Err({
      status: 500,
      message: "Leaderboard: Unable to retrieve Users",
    });
  const rankList = users.map((user, i) => ({
    rank: i + 1,
    username: user.username,
    score: user.stats?.score ?? 0,
  }));

  return Ok(rankList);
};
