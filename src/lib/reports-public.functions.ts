import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export const getPublicReport = createServerFn({ method: "GET" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );
    const { data: row } = await supabase
      .from("reports")
      .select("id,subject_name,alias,category,country,city,risk,status,description,created_at,industry,transaction_type,amount_usd")
      .eq("id", data.id)
      .in("status", ["approved", "resolved"])
      .maybeSingle();
    return row;
  });
