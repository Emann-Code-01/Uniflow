import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getSubdomain,
  isSuperAdmin,
  isUniversityPortal,
} from "@/lib/subdomain";

const publicRoutes = ["/", "/register", "/login"];
const authRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname } = request.nextUrl;
  const subdomain = getSubdomain(hostname);

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── on localhost — normal routing ──
  if (!subdomain) {
    // if logged in and trying to visit auth routes — redirect to dashboard
    if (user && authRoutes.includes(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // if not logged in and trying to visit protected routes
    if (!user && !publicRoutes.includes(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  // ── super admin portal (admin.uniflow.com.ng) ──
  if (isSuperAdmin(hostname)) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // check if user is uniflow_admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "uniflow_admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  // ── university portal (aaua-admin.uniflow.com.ng) ──
  if (isUniversityPortal(hostname)) {
    if (pathname === "/login") return supabaseResponse;

    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // check user belongs to this university and has correct role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, university_id, universities(short_name)")
      .eq("id", user.id)
      .single();

    const allowedRoles = ["university_admin", "dean", "hod"];
    if (!profile || !allowedRoles.includes(profile.role)) {
      const url = request.nextUrl.clone();
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
