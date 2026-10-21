import { Router } from "express";
import * as goalsController from "../controllers/goalsController.js";
import { asyncHandler } from "../asyncHandler.js";

const router = Router();

router.get("/", asyncHandler(goalsController.index));
router.get("/data", asyncHandler(goalsController.list));
router.get("/:id", asyncHandler(goalsController.show));
router.post("/", asyncHandler(goalsController.create));

export default router;