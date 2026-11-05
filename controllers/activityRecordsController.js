import * as activitiesService from "../services/activitiesService.js";
import { isValidId } from "../repositories/activitiesRepository.js";

const badId = (res) => res.status(400).json({ error: "id must be a valid id" });
const sendError = (res, result) =>
  res.status(result.error.status).json({ error: result.error.message });

export const show = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return badId(res);
  const result = await activitiesService.getActivity(id);
  if (!result.ok) return sendError(res, result);
  return res.status(200).json(result.value);
};

export const update = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return badId(res);
  const result = await activitiesService.updateActivity(id, req.body);
  if (!result.ok) return sendError(res, result);
  return res.status(200).json(result.value);
};

export const destroy = async (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) return badId(res);
  const result = await activitiesService.deleteActivity(id);
  if (!result.ok) return sendError(res, result);
  // Unit 14: an HTMX outerHTML deletion needs an empty HTTP 200, not 204.
  if (req.get("HX-Request") === "true") return res.status(200).send("");
  return res.status(204).send();
};
