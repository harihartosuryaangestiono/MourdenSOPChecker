import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

const users = [
  { email: "owner@mourden.co", password: "mourden123", name: "Owner Mourden", role: "owner", shift: "all" },
  { email: "admin@mourden.co", password: "mourden123", name: "Admin Mourden", role: "admin", shift: "all" },
  { email: "staff1@mourden.co", password: "mourden123", name: "Budi Santoso", role: "staff", shift: "opening" },
  { email: "staff2@mourden.co", password: "mourden123", name: "Ani Wijaya", role: "staff", shift: "middle" },
  { email: "staff3@mourden.co", password: "mourden123", name: "Dedi Kurniawan", role: "staff", shift: "closing" },
];

export async function GET() {
  return POST();
}

export async function POST() {
  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    return NextResponse.json(
      {
        error:
          "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 500 }
    );
  }

  const results = [];

  for (const user of users) {
    try {
      // Create auth user with Supabase Admin API (proper password hashing)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { role: user.role, name: user.name },
      });

      if (authError) {
        results.push({ email: user.email, status: "error", error: authError.message });
        continue;
      }

      if (authData.user) {
        // Create public.users profile
        const { error: profileError } = await supabaseAdmin
          .from("users")
          .insert({
            id: authData.user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            shift_preference: user.shift,
            is_active: true,
          });

        if (profileError) {
          results.push({ email: user.email, status: "partial", error: profileError.message });
        } else {
          results.push({ email: user.email, status: "success", id: authData.user.id });
        }
      }
    } catch (error) {
      results.push({ email: user.email, status: "error", error: String(error) });
    }
  }

  return NextResponse.json({ results });
}
