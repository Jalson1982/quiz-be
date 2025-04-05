import crypto from "crypto";

export const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString("hex");
};

export const sanitizeUser = (user) => {
  const { password, __v, ...sanitizedUser } = user.toObject();
  return sanitizedUser;
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};
