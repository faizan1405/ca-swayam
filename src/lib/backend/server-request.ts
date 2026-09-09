import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

export const serverRequestInputSchema = z.object({
  url: z.string().url().optional(),
  body: z.unknown().optional(),
});

export type ServerRequestInput = z.infer<typeof serverRequestInputSchema>;

export function buildServerRequest(
  method: "GET" | "POST",
  input?: ServerRequestInput,
): Request {
  const incomingRequest = getRequest();
  const url = input?.url ?? incomingRequest.url;
  const headers = new Headers();
  const cookie = incomingRequest.headers.get("cookie");
  if (cookie) headers.set("cookie", cookie);

  if (method === "POST") {
    headers.set("content-type", "application/json");
    return new Request(url, {
      method,
      headers,
      body: JSON.stringify(input?.body ?? null),
    });
  }

  return new Request(url, { method, headers });
}
