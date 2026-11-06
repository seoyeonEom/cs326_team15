import * as authService from "../services/authService.js";

export const signup = async (req, res) => {
  const result = await authService.signup(req.body);
  if (!result.ok) {
    res.status(result.error.status).json({ error: result.error.message });
    return;
  }
  res.status(201).json(result.value);
};
