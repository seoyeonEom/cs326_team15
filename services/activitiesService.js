import { Ok, Err } from "../result.js";
import * as activitiesRepository from "../repositories/activitiesRepository.js";
import { toActivityDto } from "../dtos/activityDto.js";

const EMISSION_FACTORS = {
  walking: 0,
  cycling: 0,
  bus: 0.1,
  car: 0.2,
};

const KM_PER_MILE = 1.609344;

const withEmissions = ({ date, method, distance, unit }) => {
  const distanceKm = unit === "mi" ? distance * KM_PER_MILE : distance;

  return {
    date,
    method,
    distance,
    unit,
    emissions: Number((distanceKm * EMISSION_FACTORS[method]).toFixed(3)),
  };
};

const validDate = (date) => {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === date
  );
};

const validateActivity = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return Err({
      status: 400,
      message: "A valid activity object is required.",
    });
  }

  const { date, method, distance, unit } = data;

  if (
    date == null ||
    method == null ||
    distance == null ||
    unit == null ||
    date === "" ||
    method === "" ||
    distance === "" ||
    unit === ""
  ) {
    return Err({
      status: 400,
      message: "date, method, distance, and unit are required.",
    });
  }

  if (!validDate(date)) {
    return Err({
      status: 400,
      message: "date must be a valid date in YYYY-MM-DD format.",
    });
  }

  if (typeof method !== "string" || !Object.hasOwn(EMISSION_FACTORS, method)) {
    return Err({
      status: 400,
      message: "method must be walking, cycling, bus, or car.",
    });
  }

  if (unit !== "km" && unit !== "mi") {
    return Err({ status: 400, message: "unit must be km or mi." });
  }

  if (
    (typeof distance !== "number" && typeof distance !== "string") ||
    (typeof distance === "string" && !distance.trim()) ||
    !Number.isFinite(Number(distance)) ||
    Number(distance) <= 0
  ) {
    return Err({ status: 400, message: "distance must be a positive number." });
  }

  return Ok({ date, method, distance: Number(distance), unit });
};

export const listActivities = async () =>
  (await activitiesRepository.getAll()).map(toActivityDto);

// Sprint 2's breakdown, rebuilt on the per-record repository.
// An empty method ("All transportation") means no filter.
export const getEmissionsBreakdown = async (method) => {
  const filter = method === undefined || method === "" ? null : method;

  if (
    filter !== null &&
    (typeof filter !== "string" || !Object.hasOwn(EMISSION_FACTORS, filter))
  ) {
    return Err({ status: 400, message: "Invalid transportation method." });
  }

  const activities = (await activitiesRepository.getAll())
    .filter((activity) => filter === null || activity.method === filter)
    .map(toActivityDto);

  const totalEmissions = activities.reduce(
    (total, activity) => total + activity.emissions,
    0,
  );

  return Ok({
    activities,
    totalEmissions: Number(totalEmissions.toFixed(3)),
    activityCount: activities.length,
  });
};

export const getActivity = async (id) => {
  const activity = await activitiesRepository.findById(id);
  if (!activity) return Err({ status: 404, message: "Activity not found." });
  return Ok(toActivityDto(activity));
};

export const createActivity = async (data) => {
  const result = validateActivity(data);
  if (!result.ok) return result;
  const saved = await activitiesRepository.create(withEmissions(result.value));
  return Ok(toActivityDto(saved));
};

export const updateActivity = async (id, data) => {
  const existing = await activitiesRepository.findById(id);
  if (!existing) return Err({ status: 404, message: "Activity not found." });
  const result = validateActivity(data);
  if (!result.ok) return result;
  const updated = await activitiesRepository.updateById(
    id,
    withEmissions(result.value),
  );
  if (!updated) return Err({ status: 404, message: "Activity not found." });
  return Ok(toActivityDto(updated));
};

export const deleteActivity = async (id) => {
  const existing = await activitiesRepository.findById(id);
  if (!existing) return Err({ status: 404, message: "Activity not found." });
  await activitiesRepository.removeById(id);
  return Ok(null);
};