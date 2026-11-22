import bcrypt from "bcrypt";
import { Ok, Err } from "../result.js";
import * as userRepository from "../repositories/userRepository.js";
import { toUserDto } from "../dtos/userDto.js";

export const signup = async ({ email, username, password }) => {
  const trimmedEmail = (email || "").trim().toLowerCase();
  const trimmedUsername = (username || "").trim().toLowerCase();
  if (!trimmedEmail || !trimmedUsername || !password) {
    return Err({
      status: 400,
      message: "email, username, and password are required",
    });
  }

  const existingEmail = await userRepository.findByEmail(trimmedEmail);
  const existingUsername = await userRepository.findByUsername(trimmedUsername);
  if (existingEmail)
    return Err({ status: 409, message: "that email is already registered" });
  if (existingUsername)
    return Err({ status: 409, message: "that username is already taken" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await userRepository.create({
    email: trimmedEmail,
    username: trimmedUsername,
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

export const getMe = async (id) => {
  const user = await userRepository.findById(id);
  if (!user)
    return Err({ status: 401, error: { error: "getMe: not logged in" } });
  return Ok(toUserDto(user));
};
