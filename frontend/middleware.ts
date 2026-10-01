import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const session = request.cookies.get("roadwise_session")?.value;
  const role = request.cookies.get("roadwise_role")?.value;

  if (!session || !role) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  const homeByRole: Record<string, string> = {
    student: "/",
    instructor: "/instructor",
    admin: "/admin",
  };
  const home = homeByRole[role];
  if (!home) {
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("roadwise_session");
    response.cookies.delete("roadwise_role");
    return response;
  }

  const isAllowed =
    (role === "student" && request.nextUrl.pathname === "/") ||
    (role === "instructor" &&
      request.nextUrl.pathname.startsWith("/instructor")) ||
    (role === "admin" && request.nextUrl.pathname.startsWith("/admin"));
  if (!isAllowed) return NextResponse.redirect(new URL(home, request.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/student/:path*", "/instructor/:path*", "/admin/:path*"],
};
