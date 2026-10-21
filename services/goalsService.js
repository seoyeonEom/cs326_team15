import { Ok, Err } from "../result.js";
import * as goalsRepository from "../repositories/goalsRepository.js";
import * as activitiesRepository from "../repositories/activitiesRepository.js";
import { toGoalDto } from "../dtos/goalDto.js";
import { randomUUID } from "crypto";

const METHODS = ["walking", "cycling", "bus", "car"];
const DAY_MS = 24 * 60 * 60 * 1000;

const isBlank = (value) => value == null || value === "";

const parseDate = (date) => {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    return null;
  }
  return parsed;
};

const toDateString = (date) => date.toISOString().slice(0, 10);

const mondayOf = (date) =>
  new Date(date.getTime() - ((date.getUTCDay() + 6) % 7) * DAY_MS);

const addDays = (dateString, days) =>
  toDateString(new Date(parseDate(dateString).getTime() + days * DAY_MS));

const validateGoal = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return Err({ status: 400, message: "A valid goal object is required." });
  }

  const { week, method, targetDays } = data;

  if (isBlank(week) || isBlank(method) || isBlank(targetDays)) {
    return Err({
      status: 400,
      message: "week, method, and targetDays are required.",
    });
  }

  const weekDate = parseDate(week);
  if (!weekDate) {
    return Err({
      status: 400,
      message: "week must be a valid date in YYYY-MM-DD format.",
    });
  }

  if (typeof method !== "string" || !METHODS.includes(method)) {
    return Err({
      status: 400,
      message: "method must be walking, cycling, bus, or car.",
    });
  }

  const target = Number(targetDays);
  if (
    (typeof targetDays !== "number" && typeof targetDays !== "string") ||
    (typeof targetDays === "string" && !targetDays.trim()) ||
    !Number.isInteger(target) ||
    target < 1 ||
    target > 7
  ) {
    return Err({
      status: 400,
      message: "targetDays must be a whole number from 1 to 7.",
    });
  }

  return Ok({
    weekStart: toDateString(mondayOf(weekDate)),
    method,
    targetDays: target,
  });
};

const withProgress = (goal, activities) => {
  const weekEnd = addDays(goal.weekStart, 6);
  const days = new Set(
    activities
      .filter(
        (activity) =>
          activity.method === goal.method &&
          activity.date >= goal.weekStart &&
          activity.date <= weekEnd,
      )
      .map((activity) => activity.date),
  );
  return toGoalDto({ ...goal, weekEnd, completedDays: days.size });
};

export const listGoals = async () => {
  const [goals, activities] = await Promise.all([
    goalsRepository.getAll(),
    activitiesRepository.getAll(),
  ]);
  return goals.map((goal) => withProgress(goal, activities));
};

export const getGoal = async (id) => {
  const goal = await goalsRepository.findById(id);
  if (!goal) {
    return Err({ status: 404, message: "Goal not found." });
  }
  const activities = await activitiesRepository.getAll();
  return Ok(withProgress(goal, activities));
};

export const createGoal = async (data) => {
  const result = validateGoal(data);
  if (!result.ok) return result;

  const { weekStart, method, targetDays } = result.value;
  const goals = await goalsRepository.getAll();

  const duplicate = goals.some(
    (goal) => goal.weekStart === weekStart && goal.method === method,
  );
  if (duplicate) {
    return Err({
      status: 409,
      message: `You already have a ${method} goal for the week of ${weekStart}.`,
    });
  }

  const goal = { id: randomUUID(), weekStart, method, targetDays };
  goals.push(goal);
  await goalsRepository.save(goals);

  const activities = await activitiesRepository.getAll();
  return Ok(withProgress(goal, activities));
};