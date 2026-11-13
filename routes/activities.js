import { Router } from "express";
import * as activitiesController from "../controllers/activitiesController.js";
import { asyncHandler } from "../asyncHandler.js";
import { requireLogin } from "../middleware/requireLogin.js";

const router = Router();

router.get("/", asyncHandler(activitiesController.index));
router.get("/data", requireLogin, asyncHandler(activitiesController.list));

router.get(
  "/breakdown",
  requireLogin,
  asyncHandler(activitiesController.breakdown),
);

router.post("/", requireLogin, asyncHandler(activitiesController.create));

export default router;
