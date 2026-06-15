import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ALLOWED_ADMIN_EMAIL = "jayjay2999@gmail.com";

const setupSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(128),
});

/**
 * Bootstrap/reset the admin account.
 * - Only the hard-coded ALLOWED_ADMIN_EMAIL can use this endpoint.
 * - If the user does not exist, creates them (auto-confirmed).
 * - If the user exists, updates their password.
 * - Grants the 'admin' role (idempotent).
 */
export const setupAdminAccount = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => setupSchema.parse(data))
  .handler(async ({ data }) => {
    if (data.email !== ALLOWED_ADMIN_EMAIL) {
      throw new Error("This email is not authorized for admin setup.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Look up existing user by email
    let userId: string | null = null;
    let page = 1;
    // Paginate through users to find the email (Supabase admin API has no direct getByEmail in older versions)
    while (page < 20) {
      const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage: 200,
      });
      if (listErr) throw new Error(listErr.message);
      const found = list.users.find((u) => u.email?.toLowerCase() === data.email);
      if (found) {
        userId = found.id;
        break;
      }
      if (list.users.length < 200) break;
      page++;
    }

    if (userId) {
      // Update existing user's password + ensure email is confirmed
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: data.password,
        email_confirm: true,
      });
      if (updErr) throw new Error(updErr.message);
    } else {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      });
      if (createErr || !created.user) throw new Error(createErr?.message ?? "Failed to create user");
      userId = created.user.id;
    }

    // Grant admin role (idempotent — unique constraint on user_id+role)
    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    if (roleErr) throw new Error(roleErr.message);

    return { ok: true, email: data.email };
  });
