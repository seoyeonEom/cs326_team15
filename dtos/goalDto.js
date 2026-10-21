export const toGoalDto = (goal) => ({
  id: goal.id,
  weekStart: goal.weekStart,
  weekEnd: goal.weekEnd,
  method: goal.method,
  targetDays: goal.targetDays,
  completedDays: goal.completedDays,
  achieved: goal.completedDays >= goal.targetDays,
});