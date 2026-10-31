import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role;

  const pathname = nextUrl.pathname;

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  const isPortalRoute = pathname.startsWith("/portal");
  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/payments") ||
    pathname.startsWith("/staff") ||
    pathname.startsWith("/billing-run") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/plans") ||
    pathname.startsWith("/subscriptions") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/customers");

  // If logged in and visiting auth pages (login/signup), redirect to appropriate home
  if (isLoggedIn && (pathname === "/login" || pathname === "/signup")) {
    if (role === "CUSTOMER") {
      return NextResponse.redirect(new URL("/portal", nextUrl));
    }
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // If unauthenticated and visiting protected app or portal routes, redirect to login
  if (!isLoggedIn && (isAppRoute || isPortalRoute)) {
    const callbackUrl = encodeURIComponent(pathname + nextUrl.search);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
  }

  // Role guard: Customers cannot access app routes (dashboard, staff, billing, etc.)
  if (isLoggedIn && role === "CUSTOMER" && isAppRoute) {
    return NextResponse.redirect(new URL("/portal", nextUrl));
  }

  // Role guard: Staff cannot access Admin-only /staff route
  if (isLoggedIn && role === "STAFF" && pathname.startsWith("/staff")) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export default proxy;

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};

