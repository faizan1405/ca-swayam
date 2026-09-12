import "@tanstack/react-start/server-only";

export const RAZORPAY_KEY_ID = (() => {
  const value = process.env["RAZORPAY_KEY_ID"];
  if (!value) throw new Error("RAZORPAY_KEY_ID must be set");
  return value;
})();

export const RAZORPAY_KEY_SECRET = (() => {
  const value = process.env["RAZORPAY_KEY_SECRET"];
  if (!value) throw new Error("RAZORPAY_KEY_SECRET must be set");
  return value;
})();

export const RAZORPAY_WEBHOOK_SECRET = (() => {
  const value = process.env["RAZORPAY_WEBHOOK_SECRET"];
  if (!value) throw new Error("RAZORPAY_WEBHOOK_SECRET must be set");
  return value;
})();
