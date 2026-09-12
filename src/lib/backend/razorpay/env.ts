import "@tanstack/react-start/server-only";

export const getRazorpayKeyId = () => {
  const key = process.env["RAZORPAY_KEY_ID"];
  if (!key) throw new Error("RAZORPAY_KEY_ID is missing in Vercel Environment Variables");
  return key;
};

export const getRazorpayKeySecret = () => {
  const key = process.env["RAZORPAY_KEY_SECRET"];
  if (!key) throw new Error("RAZORPAY_KEY_SECRET is missing in Vercel Environment Variables");
  return key;
};

export const getRazorpayWebhookSecret = () => {
  const key = process.env["RAZORPAY_WEBHOOK_SECRET"];
  if (!key) throw new Error("RAZORPAY_WEBHOOK_SECRET is missing in Vercel Environment Variables");
  return key;
};
