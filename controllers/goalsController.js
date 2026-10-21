import * as goalsService from "../services/goalsService.js";

export const index = async (req, res) => {
  const goals = await goalsService.listGoals();
  res.status(200).render("goals", { title: "Weekly Goals", goals });
};

export const list = async (req, res) => {
  const goals = await goalsService.listGoals();
  res.set("X-Total-Count", goals.length);
  res.status(200).json(goals);
};

export const show = async (req, res) => {
  const result = await goalsService.getGoal(req.params.id);
  if (!result.ok) {
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.value);
};

export const create = async (req, res) => {
  const result = await goalsService.createGoal(req.body);
  if (!result.ok) {
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }
  res.status(201).json(result.value);
};