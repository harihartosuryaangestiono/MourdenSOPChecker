import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import type { UserRole } from "@/types/auth.types";

const PUBLIC_ROUTES = ["/login", "/api/seed", "/api/auth"];

const ROLE_ROUTES: Record<UserRole, string[]> = {
  owner: ["/owner", "/admin", "/staff"],
  admin: ["/admin", "/staff"],
  staff: ["/staff"],
};

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const pathname = request.nextUrl.pathname;

  // Allow public routes and API routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return response;
  }
  
  // Skip auth check for all API routes
  if (pathname.startsWith("/api/")) {
    return response;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Get user role from user metadata or database
  const role = (user.user_metadata?.role as UserRole) || "staff";

  // Check role-based access
  const allowedRoutes = ROLE_ROUTES[role] || ["/staff"];
  const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route));

  if (!hasAccess) {
    // Redirect to their allowed dashboard
    const defaultRoute = allowedRoutes[0] || "/staff";
    return NextResponse.redirect(new URL(defaultRoute, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
