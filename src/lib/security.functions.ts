import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Returns the public Turnstile site key (safe to expose client-side).
export const getTurnstileSiteKey = createServerFn({ method: "GET" }).handler(
  async () => {
    return { siteKey: process.env.TURNSTILE_SITE_KEY ?? "" };
  },
);

// Verifies a Turnstile token against Cloudflare's siteverify endpoint.
export const verifyTurnstile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().min(10).max(4096),
    }),
  )
  .handler(async ({ data }) => {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
      // If unconfigured, fail closed in production but allow dev to proceed.
      return { success: false, error: "turnstile_not_configured" };
    }
    const body = new URLSearchParams({
      secret,
      response: data.token,
    });
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const json = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };
    return {
      success: json.success === true,
      error: json.success ? null : (json["error-codes"]?.join(",") ?? "failed"),
    };
  });
