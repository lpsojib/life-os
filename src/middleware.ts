import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/tasks/:path*",
    "/habits/:path*",
    "/goals/:path*",
    "/planner/:path*",
    "/journal/:path*",
    "/finance/:path*",
    "/focus/:path*",
    "/ai/:path*",
  ],
};