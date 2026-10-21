import * as activitiesService from "../services/activitiesService.js";

export const index = async (req, res) => {
  const activities = await activitiesService.listActivities();
  res
    .status(200)
    .render("activities", { title: "Transportation Activities", activities });
};

export const list = async (req, res) => {
  const activities = await activitiesService.listActivities();
  res.set("X-Total-Count", activities.length);
  res.status(200).json(activities);
};

export const create = async (req, res) => {
  const result = await activitiesService.createActivity(req.body);
  if (!result.ok) {
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }
  res.status(201).json(result.value);
};

export const breakdown = async (req, res) => {
  const { method } = req.query;
  const result = await activitiesService.getEmissionsBreakdown(method);
  if (!result.ok) {
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }
  res.status(200).json(result.value);
};
