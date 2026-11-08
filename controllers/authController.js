import { toUserDto } from "../dtos/userDto.js";
import * as authService from "../services/authService.js";
import { createSession, destroySession } from "../sessions.js";

export const signup = async (req, res) => {
  const result = await authService.signup(req.body);
  if (!result.ok) {
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }
  res.status(201).json(result.value);
};

export const login = async (req, res) => {
  const result = await authService.login(req.body);
  if (!result.ok) {
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }

  const sessionId = createSession(result.value._id.toString());
  const cookieOptions = { signed: true, httpOnly: true };
  if (req.body.rememberMe) {
    cookieOptions.maxAge = 30 * 24 * 60 * 60 * 1000;
  }
  res.cookie("sessionId", sessionId, cookieOptions);
  res.status(200).json({ loggedIn: true });
};

export const logout = (req, res) => {
  const sessionId = req.signedCookies.sessionId;
  if (sessionId) destroySession(sessionId);
  res.clearCookie("sessionId");
  res.status(200).send("");
};
