import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAuthenticated = Boolean(request.cookies.get("auth-token")?.value);
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith("/login");
  const isProtected = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");
  const isSuper = pathname.startsWith("/super");

  // Tenant belirleme (cookie)
  const tenantId = request.cookies.get("tenant-id")?.value || null;
  if (!tenantId) {
    const url = new URL("/api/tenant/bootstrap", request.url);
    url.searchParams.set("return", pathname || "/");
    return NextResponse.redirect(url);
  }

  if ((isProtected || isAdmin || isSuper) && !isAuthenticated) {
    const url = new URL("/login", request.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdmin && isAuthenticated) {
    const role = request.cookies.get("role")?.value;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (isSuper && isAuthenticated) {
    const role = request.cookies.get("role")?.value;
    if (role !== "super") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const response = NextResponse.next();
  response.headers.set("x-pathname", pathname);
  return response;
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/login",
    "/admin/:path*",
    "/super/:path*",
    "/otel/:path*",
    "/tur/:path*",
    "/transfer/:path*",
    "/ucak/:path*",
    "/saglik/:path*",
    "/arac/:path*",
    "/muhasebe/:path*",
    "/reports/:path*",
    "/users/:path*",
    "/api/:path*"
  ],
};


