import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { asyncHandler } from "../asyncHandler.js";

const router = Router();

router.post("/signup", asyncHandler(authController.signup));
router.post("/login", asyncHandler(authController.login));
router.post("/logout", authController.logout);

export default router;
