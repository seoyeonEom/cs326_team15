export const toUserDto = (user) => ({
  id: user._id.toString(),
  username: user.username,
  email: user.email,
});
