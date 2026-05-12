import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDashboardRoute } from "@/lib/auth";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = userData?.role || user.user_metadata?.role || "staff";
  const redirectTo = getDashboardRoute(role);
  
  redirect(redirectTo);
}
