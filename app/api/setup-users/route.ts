import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const users = [
  { email: "owner@mourden.co", password: "mourden123", name: "Owner Mourden", role: "owner", shift: "all" },
  { email: "admin@mourden.co", password: "mourden123", name: "Admin Mourden", role: "admin", shift: "all" },
  { email: "staff1@mourden.co", password: "mourden123", name: "Budi Santoso", role: "staff", shift: "opening" },
  { email: "staff2@mourden.co", password: "mourden123", name: "Ani Wijaya", role: "staff", shift: "middle" },
  { email: "staff3@mourden.co", password: "mourden123", name: "Dedi Kurniawan", role: "staff", shift: "closing" },
];

export async function POST() {
  const results = [];

  for (const user of users) {
    try {
      // Delete existing user first
      const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
      const found = existing.users.find(u => u.email === user.email);
      if (found) {
        await supabaseAdmin.auth.admin.deleteUser(found.id);
        results.push({ email: user.email, action: "deleted existing" });
      }

      // Create new user with Supabase Auth (proper password hashing)
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { role: user.role, name: user.name },
      });

      if (error) {
        results.push({ email: user.email, status: "error", error: error.message });
        continue;
      }

      if (data.user) {
        // Create public.users profile
        const { error: profileError } = await supabaseAdmin
          .from("users")
          .upsert({
            id: data.user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            shift_preference: user.shift,
            is_active: true,
          }, { onConflict: "id" });

        results.push({ 
          email: user.email, 
          status: profileError ? "partial" : "success", 
          id: data.user.id,
          error: profileError?.message 
        });
      }
    } catch (error) {
      results.push({ email: user.email, status: "error", error: String(error) });
    }
  }

  return NextResponse.json({ results });
}

export async function GET() {
  return POST();
}
