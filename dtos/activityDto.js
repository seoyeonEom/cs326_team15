export const toActivityDto = (activity) => ({
  id: String(activity._id ?? activity.id),
  date: activity.date,
  method: activity.method,
  distance: activity.distance,
  unit: activity.unit,
  emissions: activity.emissions,
});
