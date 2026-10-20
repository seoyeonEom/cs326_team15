export const toActivityDto = (activity) => ({
  id: activity.id,
  date: activity.date,
  method: activity.method,
  distance: activity.distance,
  unit: activity.unit,
  emissions: activity.emissions,
});
