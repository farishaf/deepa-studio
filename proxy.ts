import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only (cookie present?). Real verification happens in lib/auth.ts on every page and action.
export function proxy(req: NextRequest) {
  if (req.cookies.has("deepa_session")) return NextResponse.next();
  const url = new URL("/login", req.url);
  url.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = { matcher: ["/studio/:path*"] };
