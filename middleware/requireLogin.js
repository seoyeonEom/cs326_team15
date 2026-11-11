const message = "you must be logged in to do that.";

export const requireLogin = (req, res, next) => {
  if (!req.user) {
    if (req.get("HX-Request") === "true") {
      res.set("HX-Redirect", "/login");
      res.status(401).send(message);
      return;
    }

    if (req.is("application/x-www-form-urlencoded")) {
      res.redirect(303, "/login");
      return;
    }
    res.status(401).json({ error: message });
    return;
  }
  next();
};
