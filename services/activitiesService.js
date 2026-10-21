import { Ok, Err } from "../result.js";
import { getAll, save } from "../repositories/activitiesRepository.js";
import { toActivityDto } from "../dtos/activityDto.js";
import { randomUUID } from "crypto";

const EMISSION_FACTORS = {
  walking: 0,
  cycling: 0,
  bus: 0.1,
  car: 0.2,
};

const KM_PER_MILE = 1.609344;

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


export const listActivities = async (method) => {
  const activities = await getAll();

  const filteredActivities = method
    ? activities.filter((activity) => activity.method === method)
    : activities;

  return filteredActivities.map(toActivityDto);
};

export const getEmissionsBreakdown = async (method) => {
  const validMethods = ["walking", "cycling", "bus", "car"];

  if (method !== undefined && !validMethods.includes(method)) {
    return Err({
      status: 400,
      message: "Invalid transportation method."
    });
  }

  const activities = await listActivities(method);
  
  const totalEmissions = activities.reduce(
    (total, activity) => total + activity.emissions,
    0
  );

  return Ok({
    activities,
    totalEmissions: Number(totalEmissions.toFixed(3)),
    activityCount: activities.length
  });
};



export const createActivity = async (data) => {
  const result = validateActivity(data);
  if (!result.ok) return result;

  const { date, method, distance, unit } = result.value;
  const distanceKm = unit === "mi" ? distance * KM_PER_MILE : distance;
  const emissions = Number((distanceKm * EMISSION_FACTORS[method]).toFixed(3));

  const activity = {
    id: randomUUID(),
    date,
    method,
    distance,
    unit,
    emissions,
  };

  const activities = await getAll();

  activities.push(activity);
  await save(activities);
  return Ok(toActivityDto(activity));
};
