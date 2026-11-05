import mongoose from "mongoose";

const goalSchema = new mongoose.Schema(
  {
    weekStart: {
      type: String,
      required: true,
    },
    method: {
      type: String,
      required: true,
      enum: ["walking", "cycling", "bus", "car"],
    },
    targetDays: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
    },
  },
  { timestamps: true },
);

// Prevent duplicate goals for the same week and method.
goalSchema.index({ weekStart: 1, method: 1 }, { unique: true });

const Goal = mongoose.model("Goal", goalSchema);

export const isValidId = (id) =>
  typeof id === "string" &&
  /^[a-f\d]{24}$/i.test(id) &&
  mongoose.Types.ObjectId.isValid(id);

export const getAll = async () => Goal.find().sort({ _id: 1 }).lean();

export const findById = async (id) => Goal.findById(id).lean();

export const create = async (data) => (await Goal.create(data)).toObject();

export const updateById = async (id, data) =>
  Goal.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

export const removeById = async (id) => Goal.findByIdAndDelete(id).lean();
