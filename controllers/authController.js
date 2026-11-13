import { toUserDto } from "../dtos/userDto.js";
import * as authService from "../services/authService.js";
import { createSession, destroySession } from "../sessions.js";

const fromForm = (req) => Boolean(req.is("application/x-www-form-urlencoded"));

const startSession = (req, res, userId) => {
  const sessionId = createSession(userId);
  const cookieOptions = { signed: true, httpOnly: true };
  if (req.body.rememberMe) {
    cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
  }
  res.cookie("sessionId", sessionId, cookieOptions);
};

export const signupPage = (req, res) => {
  if (req.user) return res.redirect("/activities");
  res.render("signup", { title: "Sign up", error: null, email: "" });
};

export const loginPage = (req, res) => {
  if (req.user) return res.redirect("/activities");
  res.render("login", { title: "Log in", error: null, email: "" });
};

export const signup = async (req, res) => {
  const result = await authService.signup(req.body);
  if (!fromForm(req)) {
    if (!result.ok) {
      res.status(result.error.status).json({ error: result.error.message });
      return;
    }
    res.status(201).json(result.value);
    return;
  }
  if (!result.ok) {
    res.status(result.error.status).render("signup", {
      title: "Sign up",
      error: result.error.message,
      email: req.body.email || "",
    });
    return;
  }
  startSession(req, res, result.value.id);
  res.redirect(303, "/activities");
};

export const login = async (req, res) => {
  const result = await authService.login(req.body);
  if (!result.ok) {
    if (fromForm(req)) {
      res.status(result.error.status).render("login", {
        title: "Log in",
        error: result.error.message,
        email: req.body.email || "",
      });
      return;
    }
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }

  startSession(req, res, result.value._id.toString());
  if (fromForm(req)) {
    res.redirect(303, "/activities");
    return;
  }
  res.status(200).json({ loggedIn: true });
};

export const logout = (req, res) => {
  const sessionId = req.signedCookies.sessionId;
  if (sessionId) destroySession(sessionId);
  res.clearCookie("sessionId");
  if (fromForm(req)) {
    res.redirect(303, "/login");
    return;
  }
  res.status(200).send("");
};

export const me = async (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: "not logged in" });
    return;
  }

  const user = await userRepository.findById(req.user.id);
  if (!user) {
    res.status(401).json({ error: "not logged in" });
    return;
  }
  res.status(200).json(toUserDto(user));
};
