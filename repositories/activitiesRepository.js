import mongoose from "mongoose";

const activitySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    method: {
      type: String,
      required: true,
      enum: ["walking", "cycling", "bus", "car"],
    },
    distance: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, enum: ["km", "mi"] },
    emissions: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
);

const Activity = mongoose.model("Activity", activitySchema);

export const isValidId = (id) =>
  typeof id === "string" &&
  /^[a-f\d]{24}$/i.test(id) &&
  mongoose.Types.ObjectId.isValid(id);

export const getAll = async () => Activity.find().sort({ _id: 1 }).lean();

export const findById = async (id) => Activity.findById(id).lean();

export const create = async (data) => (await Activity.create(data)).toObject();

export const updateById = async (id, data) =>
  Activity.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  }).lean();

export const removeById = async (id) => Activity.findByIdAndDelete(id).lean();
