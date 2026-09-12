import "@tanstack/react-start/server-only";

export const getRazorpayKeyId = () => {
  const value = process.env.RAZORPAY_KEY_ID || process.env["RAZORPAY_KEY_ID"];
  if (!value) throw new Error("RAZORPAY_KEY_ID must be set");
  return value;
};

export const getRazorpayKeySecret = () => {
  const value = process.env.RAZORPAY_KEY_SECRET || process.env["RAZORPAY_KEY_SECRET"];
  if (!value) throw new Error("RAZORPAY_KEY_SECRET must be set");
  return value;
};

export const getRazorpayWebhookSecret = () => {
  const value = process.env.RAZORPAY_WEBHOOK_SECRET || process.env["RAZORPAY_WEBHOOK_SECRET"];
  if (!value) throw new Error("RAZORPAY_WEBHOOK_SECRET must be set");
  return value;
};
