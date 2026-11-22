import { Router } from "express";
import * as goalsController from "../controllers/goalsController.js";
import { asyncHandler } from "../asyncHandler.js";
import { requireLogin } from "../middleware/requireLogin.js";

const router = Router();

router.get("/", asyncHandler(goalsController.index));
router.get("/data", requireLogin, asyncHandler(goalsController.list));
router.get("/:id", asyncHandler(goalsController.show));
router.post("/", requireLogin, asyncHandler(goalsController.create));

export default router;
