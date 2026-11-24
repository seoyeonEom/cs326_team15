import { Router } from "express";
import { renderHome } from "../controllers/homeController.js";
import { asyncHandler } from "../asyncHandler.js";

const router = Router();
router.get("/", asyncHandler(renderHome));

export default router;
