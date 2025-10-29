import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const PUBLIC_PATHS = ["/", "/auth/login", "/auth/register"];

export function middleware(req) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET);
    return NextResponse.next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    const res = NextResponse.redirect(new URL("/auth/login", req.url));
    res.cookies.delete("token");
    return res;
  }
}

// ✅ برای Next.js باید این export دقیقاً به این صورت باشه:
export const config = {
  matcher: ["/dashboard/:path*", "/test/:path*", "/placement/:path*"],
};
