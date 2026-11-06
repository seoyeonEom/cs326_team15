import { jest } from "@jest/globals";

jest.unstable_mockModule("../repositories/goalsRepository.js", () => ({
  isValidId: jest.fn(() => true),
  getAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  removeById: jest.fn(),
}));

jest.unstable_mockModule("../repositories/activitiesRepository.js", () => ({
  isValidId: jest.fn(() => true),
  getAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  removeById: jest.fn(),
}));

const goalsRepo = await import("../repositories/goalsRepository.js");
const activitiesRepo = await import("../repositories/activitiesRepository.js");
const service = await import("../services/goalsService.js");

const valid = { week: "2026-10-21", method: "cycling", targetDays: 3 };
const stored = {
  _id: "g1",
  weekStart: "2026-10-19",
  method: "cycling",
  targetDays: 3,
};

beforeEach(() => {
  jest.clearAllMocks();
  goalsRepo.getAll.mockResolvedValue([]);
  goalsRepo.findById.mockResolvedValue(null);
  goalsRepo.create.mockImplementation(async (data) => ({ _id: "g1", ...data }));
  activitiesRepo.getAll.mockResolvedValue([]);
});

test("createGoal rejects a non-object payload", async () => {
  const result = await service.createGoal(null);
  expect(result.error.status).toBe(400);
  expect(goalsRepo.create).not.toHaveBeenCalled();
});

test.each(["week", "method", "targetDays"])(
  "createGoal rejects missing %s",
  async (field) => {
    const input = { ...valid };
    delete input[field];
    const result = await service.createGoal(input);
    expect(result.error.status).toBe(400);
    expect(goalsRepo.create).not.toHaveBeenCalled();
  },
);

test.each(["2026-02-30", "not-a-date"])(
  "createGoal rejects invalid date %s",
  async (week) => {
    const result = await service.createGoal({ ...valid, week });
    expect(result.error.message).toMatch(/valid date/);
  },
);

test("createGoal rejects an unsupported method", async () => {
  const result = await service.createGoal({ ...valid, method: "airplane" });
  expect(result.error.status).toBe(400);
  expect(goalsRepo.create).not.toHaveBeenCalled();
});

test.each([0, 8, 2.5, "foo", " ", true])(
  "createGoal rejects invalid targetDays %s",
  async (targetDays) => {
    const result = await service.createGoal({ ...valid, targetDays });
    expect(result.error.status).toBe(400);
    expect(goalsRepo.create).not.toHaveBeenCalled();
  },
);

test("createGoal rejects an existing method/week combination", async () => {
  goalsRepo.getAll.mockResolvedValue([stored]);
  const result = await service.createGoal(valid);
  expect(result.error.status).toBe(409);
  expect(goalsRepo.create).not.toHaveBeenCalled();
});

test("createGoal converts a selected Wednesday to Monday and creates one record", async () => {
  const result = await service.createGoal({ ...valid, targetDays: "3" });
  expect(goalsRepo.create).toHaveBeenCalledWith({
    weekStart: "2026-10-19",
    method: "cycling",
    targetDays: 3,
  });
  expect(result).toEqual({
    ok: true,
    value: {
      id: "g1",
      weekStart: "2026-10-19",
      weekEnd: "2026-10-25",
      method: "cycling",
      targetDays: 3,
      completedDays: 0,
      achieved: false,
    },
  });
});

test("createGoal counts only distinct days in its week and matching method", async () => {
  activitiesRepo.getAll.mockResolvedValue([
    { date: "2026-10-19", method: "cycling" },
    { date: "2026-10-19", method: "cycling" },
    { date: "2026-10-20", method: "cycling" },
    { date: "2026-10-22", method: "cycling" },
    { date: "2026-10-22", method: "car" },
    { date: "2026-10-26", method: "cycling" },
  ]);
  const result = await service.createGoal(valid);
  expect(result.value.completedDays).toBe(3);
  expect(result.value.achieved).toBe(true);
});

test("createGoal rethrows database errors that are not duplicate keys", async () => {
  goalsRepo.create.mockRejectedValue(new Error("connection lost"));
  await expect(service.createGoal(valid)).rejects.toThrow("connection lost");
});

test("createGoal maps a database duplicate-key error to 409", async () => {
  goalsRepo.create.mockRejectedValue({ code: 11000 });
  const result = await service.createGoal(valid);
  expect(result.error.status).toBe(409);
});

test("getGoal returns 404 when the id is missing", async () => {
  const result = await service.getGoal("no-such-goal");
  expect(result.error.status).toBe(404);
  expect(activitiesRepo.getAll).not.toHaveBeenCalled();
});

test("getGoal returns a DTO with progress", async () => {
  goalsRepo.findById.mockResolvedValue(stored);
  activitiesRepo.getAll.mockResolvedValue([
    { date: "2026-10-19", method: "cycling" },
  ]);
  const result = await service.getGoal("g1");
  expect(result.value).toEqual({
    id: "g1",
    weekStart: "2026-10-19",
    weekEnd: "2026-10-25",
    method: "cycling",
    targetDays: 3,
    completedDays: 1,
    achieved: false,
  });
});

test("listGoals shows saved goals with progress", async () => {
  goalsRepo.getAll.mockResolvedValue([stored]);
  activitiesRepo.getAll.mockResolvedValue([
    { date: "2026-10-19", method: "cycling" },
  ]);
  const result = await service.listGoals();
  expect(result).toHaveLength(1);
  expect(result[0].completedDays).toBe(1);
  expect(result[0].id).toBe("g1");
});