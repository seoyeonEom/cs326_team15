import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { asyncHandler } from "../asyncHandler.js";

const router = Router();

router.get("/signup", asyncHandler(authController.signupPage));
router.get("/login", asyncHandler(authController.loginPage));
router.post("/signup", asyncHandler(authController.signup));
router.post("/login", asyncHandler(authController.login));
router.post("/logout", authController.logout);
router.get("/me", asyncHandler(authController.me));

export default router;
