import * as activitiesService from "../services/activitiesService.js";

const isHtmx = (req) => req.get("HX-Request") === "true";

export const index = async (req, res) => {
  const result = await activitiesService.getEmissionsBreakdown();
  if (!result.ok) {
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }
  res.status(200).render("activities", {
    title: "Transportation Activities",
    breakdown: result.value,
  });
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

// HTMX asks for an HTML partial; any other client still gets JSON.
export const breakdown = async (req, res) => {
  const { method } = req.query;
  const result = await activitiesService.getEmissionsBreakdown(method);
  res.vary("HX-Request");
  if (!result.ok) {
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }
  if (isHtmx(req)) {
    res.status(200).render("partials/breakdown", { breakdown: result.value });
    return;
  }
  res.status(200).json(result.value);
};