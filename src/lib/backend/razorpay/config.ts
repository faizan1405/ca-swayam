import { RAZORPAY_KEY_ID } from "./env";

export type FormatFeeEntry = {
  formatName: string;
  paise: number;
};

export const FORMAT_FEES: readonly FormatFeeEntry[] = [
  { formatName: "20-min Phone Call", paise: 50_000 },
  { formatName: "45-min Video Call", paise: 100_000 },
  { formatName: "Subsidy Roadmap Session (60 min)", paise: 500_000 },
] as const;

export function getFeeInPaise(formatName: string): number {
  const entry = FORMAT_FEES.find((f) => f.formatName === formatName);
  if (!entry) {
    throw new Error(`Unknown consultation format: ${formatName}`);
  }
  return entry.paise;
}

export function formatCurrencyFromPaise(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString("en-IN")}`;
}

export function getKeyId(): string {
  return RAZORPAY_KEY_ID;
}
