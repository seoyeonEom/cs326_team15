import { readFile, writeFile } from "fs/promises";

const DATA_FILE = "data/activities.json";

export const getAll = async () => {
  const data = await readFile(DATA_FILE, "utf-8");
  return JSON.parse(data);
};

export const save = async (activities) => {
  await writeFile(DATA_FILE, JSON.stringify(activities, null, 2));
};
