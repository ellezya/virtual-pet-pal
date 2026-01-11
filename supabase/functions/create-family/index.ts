/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.90.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return json({ error: "Server misconfigured" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return json({ error: "Missing Authorization" }, 401);
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: userRes, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userRes?.user) {
      return json({ error: "Unauthorized" }, 401);
    }

    const userId = userRes.user.id;

    const body = await req.json().catch(() => ({}));
    const name = typeof body?.name === "string" && body.name.trim() ? body.name.trim() : "My Family";

    // 1) Create family
    const { data: family, error: familyError } = await supabaseAdmin
      .from("families")
      .insert({ name })
      .select("id")
      .single();

    if (familyError || !family) {
      return json({ error: familyError?.message ?? "Failed to create family" }, 400);
    }

    const familyId = family.id as string;

    // 2) Add membership
    const { error: memberError } = await supabaseAdmin
      .from("family_members")
      .insert({ family_id: familyId, user_id: userId, role: "parent" });

    if (memberError) {
      return json({ error: memberError.message }, 400);
    }

    // 3) Update profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ family_id: familyId })
      .eq("id", userId);

    if (profileError) {
      return json({ error: profileError.message }, 400);
    }

    // 4) Add role (avoid duplicates)
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "parent" }, { onConflict: "user_id,role" });

    if (roleError) {
      return json({ error: roleError.message }, 400);
    }

    return json({ family_id: familyId }, 200);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return json({ error: message }, 500);
  }
});
