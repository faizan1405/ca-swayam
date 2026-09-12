import { listFormats } from "./src/lib/backend/consultations/index";
import * as dotenv from "dotenv";

async function main() {
  try {
    const res = await listFormats();
    console.log("Returned from listFormats():", res);
    console.log("Is it a Response object?", res instanceof Response);
    console.log("Keys in res:", Object.keys(res as any));
  } catch (error) {
    console.error("Error calling listFormats:", error);
  }
}

main().catch(console.error);
