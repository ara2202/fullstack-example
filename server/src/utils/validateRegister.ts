import { UsernamePasswordInput } from "src/resolvers/UsernamePasswordInput";

export const validateRegister = (options: UsernamePasswordInput) => {
  if (options.username.length <= 2) {
    return [
      {
        field: "username",
        message: "username should contain at least 3 characters",
      },
    ];
  }

  if (options.username.includes("@")) {
    return [
      {
        field: "username",
        message: "username should not contain @ symbol",
      },
    ];
  }

  if (options.email.length <= 5 || !options.email.includes("@")) {
    return [
      {
        field: "email",
        message: "email should contain @ symbol + at least 5 characters",
      },
    ];
  }

  if (options.password.length <= 5) {
    return [
      {
        field: "password",
        message: "password should contain at least 5 characters",
      },
    ];
  }
  return null;
};
