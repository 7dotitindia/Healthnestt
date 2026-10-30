// One place for password rules. Staff accounts can publish and manage content, so they need a longer password.
export const MIN_LENGTH = { reader: 8, staff: 10 };

// Returns a message describing the first problem, or null if the password is acceptable.
export function passwordProblem(password, role) {
  if (typeof password !== "string") return "Enter a password.";
  const min = role === "admin" || role === "freelancer" ? MIN_LENGTH.staff : MIN_LENGTH.reader;
  if (password.length < min) return `Password must be at least ${min} characters.`;
  if (password.length > 200) return "That password is too long.";
  if (!/[a-zA-Z]/.test(password)) return "Password needs a letter.";
  if (!/[0-9]/.test(password)) return "Password needs a number.";
  return null;
}
