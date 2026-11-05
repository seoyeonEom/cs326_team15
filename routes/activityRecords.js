import { Router } from "express";
import * as controller from "../controllers/activityRecordsController.js";
import { asyncHandler } from "../asyncHandler.js";

const router = Router();

// Mount this AFTER the existing /activities router so /data and /breakdown win.
router.get("/:id", asyncHandler(controller.show));
router.put("/:id", asyncHandler(controller.update));
router.delete("/:id", asyncHandler(controller.destroy));

export default router;
