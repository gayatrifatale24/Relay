import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE = "token";
const AUTH_PAGES = ["/login", "/signup"];

/**
 * Optimistic route guard based on cookie presence. The Express API verifies the JWT on
 * every request; an invalid cookie is cleared client-side when the API returns 401.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = request.cookies.has(AUTH_COOKIE);

  if (pathname.startsWith("/chat") && !hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (AUTH_PAGES.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/chat", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/chat/:path*", "/login", "/signup"],
};
