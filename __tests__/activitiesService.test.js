import { jest } from "@jest/globals";

jest.unstable_mockModule("../repositories/activitiesRepository.js", () => ({
  isValidId: jest.fn(() => true),
  getAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  removeById: jest.fn(),
}));

jest.unstable_mockModule("../repositories/userRepository.js", () => ({
  findById: jest.fn(),
}));

const repo = await import("../repositories/activitiesRepository.js");
const userRepo = await import("../repositories/userRepository.js");
const service = await import("../services/activitiesService.js");

const owner = { id: "user-1" };
const otherUser = { id: "user-2" };
const admin = { id: "admin-1" };

const valid = {
  date: "2026-10-19",
  method: "cycling",
  distance: 5,
  unit: "km",
};

beforeEach(() => {
  jest.clearAllMocks();
  repo.getAll.mockResolvedValue([]);
  repo.findById.mockResolvedValue(null);
  repo.create.mockImplementation(async (data) => ({
    _id: "activity-1",
    ...data,
  }));
  repo.updateById.mockImplementation(async (id, data) => ({
    _id: id,
    ...data,
  }));
  repo.removeById.mockResolvedValue({ _id: "activity-1" });
  userRepo.findById.mockResolvedValue({
    _id: otherUser.id,
    role: "member",
  });
});

test("createActivity rejects a non-object payload", async () => {
  const result = await service.createActivity(null);
  expect(result).toEqual({
    ok: false,
    error: { status: 400, message: "A valid activity object is required." },
  });
  expect(repo.create).not.toHaveBeenCalled();
});

test.each(["date", "method", "distance", "unit"])(
  "createActivity rejects a missing %s",
  async (field) => {
    const input = { ...valid };
    delete input[field];
    const result = await service.createActivity(input);
    expect(result.ok).toBe(false);
    expect(result.error.status).toBe(400);
    expect(repo.create).not.toHaveBeenCalled();
  },
);

test.each(["2026-02-30", "2026/10/19", "invalid"])(
  "createActivity rejects invalid date %s",
  async (date) => {
    const result = await service.createActivity({ ...valid, date });
    expect(result.error.message).toMatch(/valid date/);
    expect(repo.create).not.toHaveBeenCalled();
  },
);

test("createActivity rejects an unsupported transportation method", async () => {
  const result = await service.createActivity({ ...valid, method: "train" });
  expect(result.error.status).toBe(400);
  expect(repo.create).not.toHaveBeenCalled();
});

test("createActivity rejects an unsupported unit", async () => {
  const result = await service.createActivity({ ...valid, unit: "meters" });
  expect(result.error.message).toBe("unit must be km or mi.");
});

test.each([0, -5, "abc", " ", Infinity, true])(
  "createActivity rejects invalid distance %s",
  async (distance) => {
    const result = await service.createActivity({ ...valid, distance });
    expect(result.error.status).toBe(400);
    expect(repo.create).not.toHaveBeenCalled();
  },
);

test("createActivity computes emissions and calls per-record create", async () => {
  const result = await service.createActivity(
    {
      ...valid,
      method: "bus",
      distance: "5",
    },
    owner,
  );
  expect(repo.create).toHaveBeenCalledWith({
    date: "2026-10-19",
    method: "bus",
    distance: 5,
    unit: "km",
    emissions: 0.5,
    ownerId: owner.id,
  });
  expect(result).toEqual({
    ok: true,
    value: {
      id: "activity-1",
      date: "2026-10-19",
      method: "bus",
      distance: 5,
      unit: "km",
      emissions: 0.5,
    },
  });
});

test("createActivity converts miles to kilometers for emissions", async () => {
  const result = await service.createActivity(
    {
      ...valid,
      method: "car",
      distance: 1,
      unit: "mi",
    },
    owner,
  );
  expect(result.value.emissions).toBe(0.322);
  expect(repo.create).toHaveBeenCalledWith(
    expect.objectContaining({ emissions: 0.322, ownerId: owner.id }),
  );
});

test("listActivities returns MongoDB ids as DTO ids", async () => {
  repo.getAll.mockResolvedValue([{ _id: "mongo-id", ...valid, emissions: 0 }]);
  const result = await service.listActivities();
  expect(result).toEqual([{ id: "mongo-id", ...valid, emissions: 0 }]);
});

test("getActivity returns 404 if the id does not exist", async () => {
  expect(await service.getActivity("missing")).toEqual({
    ok: false,
    error: { status: 404, message: "Activity not found." },
  });
});

test("getActivity returns one record when found", async () => {
  repo.findById.mockResolvedValue({ _id: "a1", ...valid, emissions: 0 });
  const result = await service.getActivity("a1");
  expect(result.value.id).toBe("a1");
  expect(repo.findById).toHaveBeenCalledWith("a1");
});

test("updateActivity rejects an id not found", async () => {
  const result = await service.updateActivity("missing", valid, owner);
  expect(result.error.status).toBe(404);
  expect(repo.updateById).not.toHaveBeenCalled();
});

test("updateActivity validates data before modifying existing record", async () => {
  repo.findById.mockResolvedValue({
    _id: "a1",
    ...valid,
    emissions: 0,
    ownerId: owner.id,
  });
  const result = await service.updateActivity(
    "a1",
    { ...valid, distance: -1 },
    owner,
  );
  expect(result.error.status).toBe(400);
  expect(repo.updateById).not.toHaveBeenCalled();
});

test("updateActivity recomputes emissions and uses updateById", async () => {
  repo.findById.mockResolvedValue({
    _id: "a1",
    ...valid,
    emissions: 0,
    ownerId: owner.id,
  });
  const result = await service.updateActivity(
    "a1",
    {
      ...valid,
      method: "car",
    },
    owner,
  );
  expect(repo.updateById).toHaveBeenCalledWith("a1", {
    ...valid,
    method: "car",
    emissions: 1,
  });
  expect(result.value.emissions).toBe(1);
});

test("updateActivity returns 404 if a record disappears before update", async () => {
  repo.findById.mockResolvedValue({ _id: "a1", ...valid, ownerId: owner.id });
  repo.updateById.mockResolvedValue(null);
  const result = await service.updateActivity("a1", valid, owner);
  expect(result.error.status).toBe(404);
});

test("deleteActivity rejects an id not found", async () => {
  const result = await service.deleteActivity("missing", owner);
  expect(result.error.status).toBe(404);
  expect(repo.removeById).not.toHaveBeenCalled();
});

test("deleteActivity calls removeById for a real record", async () => {
  repo.findById.mockResolvedValue({ _id: "a1", ...valid, ownerId: owner.id });
  const result = await service.deleteActivity("a1", owner);
  expect(result).toEqual({ ok: true, value: null });
  expect(repo.removeById).toHaveBeenCalledWith("a1");
  expect(repo.removeById).toHaveBeenCalledTimes(1);
});

test("deleteActivity returns 404 if the record disappears during deletion", async () => {
  repo.findById.mockResolvedValue({
    _id: "a1",
    ...valid,
    emissions: 0,
    ownerId: owner.id,
  });

  repo.removeById.mockResolvedValue(null);

  const result = await service.deleteActivity("a1", owner);

  expect(result).toEqual({
    ok: false,
    error: {
      status: 404,
      message: "Activity not found.",
    },
  });

  expect(repo.removeById).toHaveBeenCalledWith("a1");
});

test("deleteActivity does not attempt deletion if the record does not exist", async () => {
  repo.findById.mockResolvedValue(null);

  const result = await service.deleteActivity("missing", owner);

  expect(result.ok).toBe(false);
  expect(result.error.status).toBe(404);
  expect(repo.removeById).not.toHaveBeenCalled();
});

const storedActivities = [
  { _id: "a1", ...valid, method: "bus", emissions: 0.1 },
  { _id: "a2", ...valid, method: "bus", emissions: 0.2 },
  { _id: "a3", ...valid, method: "car", emissions: 1 },
];

test.each(["train", "Car", ["bus"], "constructor"])(
  "getEmissionsBreakdown rejects invalid method %p",
  async (method) => {
    const result = await service.getEmissionsBreakdown(method);
    expect(result).toEqual({
      ok: false,
      error: { status: 400, message: "Invalid transportation method." },
    });
    expect(repo.getAll).not.toHaveBeenCalled();
  },
);

test.each([undefined, ""])(
  "getEmissionsBreakdown with method %p totals every activity",
  async (method) => {
    repo.getAll.mockResolvedValue(storedActivities);
    const result = await service.getEmissionsBreakdown(method);
    expect(result.ok).toBe(true);
    expect(result.value.activityCount).toBe(3);
    expect(result.value.totalEmissions).toBe(1.3);
    expect(result.value.activities.map((a) => a.id)).toEqual([
      "a1",
      "a2",
      "a3",
    ]);
  },
);

test("getEmissionsBreakdown filters by method and rounds the total", async () => {
  repo.getAll.mockResolvedValue(storedActivities);
  const result = await service.getEmissionsBreakdown("bus");
  expect(result.value.activityCount).toBe(2);
  // 0.1 + 0.2 is 0.30000000000000004 in floating point
  expect(result.value.totalEmissions).toBe(0.3);
  expect(result.value.activities.every((a) => a.method === "bus")).toBe(true);
});

test("getEmissionsBreakdown returns zeros when nothing matches", async () => {
  repo.getAll.mockResolvedValue(storedActivities);
  const result = await service.getEmissionsBreakdown("walking");
  expect(result.value).toEqual({
    activities: [],
    totalEmissions: 0,
    activityCount: 0,
  });
});

test("non-owner cannot update another user's activity", async () => {
  repo.findById.mockResolvedValue({
    _id: "a1",
    ...valid,
    ownerId: owner.id,
  });

  const result = await service.updateActivity("a1", valid, otherUser);

  expect(result.ok).toBe(false);
  expect(result.error.status).toBe(403);
  expect(repo.updateById).not.toHaveBeenCalled();
});

test("non-owner cannot delete another user's activity", async () => {
  repo.findById.mockResolvedValue({
    _id: "a1",
    ...valid,
    ownerId: owner.id,
  });

  const result = await service.deleteActivity("a1", otherUser);

  expect(result.ok).toBe(false);
  expect(result.error.status).toBe(403);
  expect(repo.removeById).not.toHaveBeenCalled();
});

test("owner can update their own activity", async () => {
  repo.findById.mockResolvedValue({
    _id: "a1",
    ...valid,
    ownerId: owner.id,
  });

  const result = await service.updateActivity("a1", valid, owner);

  expect(result.ok).toBe(true);
  expect(repo.updateById).toHaveBeenCalledWith(
    "a1",
    expect.objectContaining({
      date: valid.date,
      method: valid.method,
    }),
  );
});

test("admin can delete another user's activity", async () => {
  repo.findById.mockResolvedValue({
    _id: "a1",
    ...valid,
    ownerId: owner.id,
  });

  userRepo.findById.mockResolvedValue({
    _id: admin.id,
    role: "admin",
  });

  const result = await service.deleteActivity("a1", admin);

  expect(result.ok).toBe(true);
  expect(repo.removeById).toHaveBeenCalledWith("a1");
});
