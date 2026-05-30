import { createServerFn } from "@tanstack/react-start";
import { getRequestIP, getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Returns the public Turnstile site key (safe to expose client-side).
export const getTurnstileSiteKey = createServerFn({ method: "GET" }).handler(
  async () => {
    return { siteKey: process.env.TURNSTILE_SITE_KEY ?? "" };
  },
);

// Verifies a Turnstile token against Cloudflare's siteverify endpoint.
// Records a security event automatically on failure so repeated failures
// from the same IP/email/user trigger the auto-block rule.
export const verifyTurnstile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      token: z.string().min(10).max(4096),
      email: z.string().email().max(200).optional(),
      userId: z.string().uuid().optional(),
      context: z.enum(["signup", "signin", "submit"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    const ip = getRequestIP({ xForwardedFor: true }) ?? "";
    const ua = getRequestHeader("user-agent") ?? "";


    if (!secret) {
      return { success: false, error: "turnstile_not_configured", blocked: false };
    }

    const body = new URLSearchParams({ secret, response: data.token });
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body },
    );
    const json = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (!json.success) {
      const { data: rec } = await supabaseAdmin.rpc("record_security_event", {
        _event_type: "captcha_fail",
        _user_id: data.userId ?? "",
        _email: data.email ?? "",
        _ip: ip,
        _user_agent: ua,
        _metadata: { errors: json["error-codes"] ?? [], context: data.context ?? null },
      });
      const blocked = (rec as { blocked?: boolean } | null)?.blocked === true;
      return {
        success: false,
        error: json["error-codes"]?.join(",") ?? "failed",
        blocked,
      };
    }

    // Track signup attempts (success) for IP-rate-limit rule.
    if (data.context === "signup") {
      await supabaseAdmin.rpc("record_security_event", {
        _event_type: "signup_attempt",
        _user_id: data.userId ?? "",
        _email: data.email ?? "",
        _ip: ip,
        _user_agent: ua,
        _metadata: {},
      });
    }


    return { success: true, error: null, blocked: false };
  });

// Record an OTP / login failure from the client (after Supabase Auth rejects).
export const recordAuthFailure = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      type: z.enum(["otp_fail", "login_fail"]),
      email: z.string().email().max(200).optional(),
      userId: z.string().uuid().optional(),
      reason: z.string().max(200).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const ip = getRequestIP({ xForwardedFor: true }) ?? "";
    const ua = getRequestHeader("user-agent") ?? "";
    const { data: rec } = await supabaseAdmin.rpc("record_security_event", {
      _event_type: data.type,
      _user_id: data.userId ?? "",
      _email: data.email ?? "",
      _ip: ip,
      _user_agent: ua,
      _metadata: { reason: data.reason ?? null },
    });

    return {
      blocked: (rec as { blocked?: boolean } | null)?.blocked === true,
      reason: (rec as { reason?: string } | null)?.reason ?? null,
    };
  });

// Check whether a given user is currently auto-blocked.
export const getBlockStatus = createServerFn({ method: "GET" })
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ data }) => {
    const { data: row } = await supabaseAdmin
      .from("profiles")
      .select("blocked_at, blocked_until, block_reason")
      .eq("id", data.userId)
      .maybeSingle();

    const blockedUntil = row?.blocked_until ?? null;
    const blockedAt = (row as { blocked_at?: string | null } | null)?.blocked_at ?? null;
    const isBlocked = blockedUntil ? new Date(blockedUntil).getTime() > Date.now() : false;

    let recentEvents: Array<{ type: string; at: string }> = [];
    if (isBlocked) {
      const { data: ev } = await supabaseAdmin
        .from("security_events")
        .select("event_type, created_at")
        .eq("user_id", data.userId)
        .in("event_type", ["captcha_fail", "otp_fail", "login_fail", "signup_attempt"])
        .order("created_at", { ascending: false })
        .limit(8);
      recentEvents = (ev ?? []).map((e) => ({
        type: e.event_type as string,
        at: e.created_at as string,
      }));
    }

    return {
      blocked: isBlocked,
      blockedAt,
      blockedUntil,
      reason: row?.block_reason ?? null,
      recentEvents,
    };
  });

