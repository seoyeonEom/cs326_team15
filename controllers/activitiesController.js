import { isValidId } from "../repositories/activitiesRepository.js";
import * as activitiesService from "../services/activitiesService.js";

const fromHtmx = (req) => req.get("HX-Request") === "true";

const sendError = (req, res, { status, message }) => {
  if (fromHtmx(req)) {
    res.status(status).send(message);
    return;
  }
  res.status(status).json({ error: message });
};

const badId = (req, res) =>
  sendError(req, res, { status: 400, message: "id must be a valid id" });

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
  const result = await activitiesService.createActivity(req.body, req.user);
  if (!result.ok) {
    return res
      .status(result.error.status)
      .json({ error: result.error.message });
  }
  if (fromHtmx(req)) {
    res
      .status(201)
      .render("partials/activity-created", { entry: result.value });
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
  if (fromHtmx(req)) {
    res.status(200).render("partials/breakdown", { breakdown: result.value });
    return;
  }
  res.status(200).json(result.value);
};
