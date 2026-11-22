import bcrypt from "bcrypt";
import { Ok, Err } from "../result.js";
import * as userRepository from "../repositories/userRepository.js";
import { toUserDto } from "../dtos/userDto.js";

export const signup = async ({ email, password }) => {
  const trimmedEmail = (email || "").trim().toLowerCase();
  if (!trimmedEmail || !password) {
    return Err({ status: 400, message: "email and password are required" });
  }

  const existing = await userRepository.findByEmail(trimmedEmail);
  if (existing)
    return Err({ status: 409, message: "that email is already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepository.create({
    email: trimmedEmail,
    passwordHash,
  });

  return Ok(toUserDto(user));
};

export const login = async ({ email, password }) => {
  const user = await userRepository.findByEmail(
    (email || "").trim().toLowerCase(),
  );
  if (!user)
    return Err({ status: 401, message: "incorrect email or password" });

  const matches = await bcrypt.compare(password || "", user.passwordHash);
  if (!matches)
    return Err({ status: 401, message: "incorrect email or password" });

  return Ok(user);
};
