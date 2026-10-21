import { Router } from "express";
import * as activitiesController from "../controllers/activitiesController.js";
import { asyncHandler } from "../asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(activitiesController.index));
router.get("/data", asyncHandler(activitiesController.list));
router.get("/breakdown", asyncHandler(activitiesController.breakdown));
router.post("/", asyncHandler(activitiesController.create));

export default router;
