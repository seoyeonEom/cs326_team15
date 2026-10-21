import { readFile, writeFile } from "fs/promises";

const DATA_FILE = "data/goals.json";

export const getAll = async () => {
  try {
    const data = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // A fresh clone with no goals file yet just means no goals.
    if (error.code === "ENOENT") return [];
    throw error;
  }
};

export const findById = async (id) => {
  const goals = await getAll();
  return goals.find((goal) => goal.id === id) ?? null;
};

export const save = async (goals) => {
  await writeFile(DATA_FILE, JSON.stringify(goals, null, 2));
};