import { CONFIRM_WINDOW_MS } from "./constants";

// Has a pending subscriber's confirmation link run out (7 days after they signed up)?
export function isConfirmationExpired(consentAt, now = Date.now()) {
  return now - new Date(consentAt).getTime() > CONFIRM_WINDOW_MS;
}