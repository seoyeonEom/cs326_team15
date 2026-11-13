import { getSession } from "../sessions.js";

export const attachUser = (req, res, next) => {
  const sessionId = req.signedCookies.sessionId;
  const session = sessionId ? getSession(sessionId) : undefined;
  if (session) {
    req.user = { id: session.userId };
  }
  next();
};
