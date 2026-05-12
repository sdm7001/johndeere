import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/", "/api/claims(.*)"]);
const clerkIsConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
);

const protectedProxy = clerkMiddleware(async (auth, req) => {
  const sanitizedAuthRedirect = sanitizeAuthRedirect(req);
  if (sanitizedAuthRedirect) {
    return sanitizedAuthRedirect;
  }

  if (isProtectedRoute(req)) {
    const { userId } = await auth();

    if (userId) {
      return NextResponse.next();
    }

    if (req.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const publicOrigin = getPublicOrigin(req);
    const signInUrl = new URL("/sign-in", publicOrigin);
    const returnUrl = new URL(`${req.nextUrl.pathname}${req.nextUrl.search}`, publicOrigin);
    signInUrl.searchParams.set("redirect_url", returnUrl.toString());
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

function sanitizeAuthRedirect(req: Request) {
  const url = new URL(req.url);

  if (!url.pathname.startsWith("/sign-in") && !url.pathname.startsWith("/sign-up")) {
    return null;
  }

  const redirectUrl = url.searchParams.get("redirect_url");
  if (!redirectUrl) {
    return null;
  }

  const publicOrigin = getPublicOrigin(req);
  const parsedRedirect = safeUrl(redirectUrl);
  const parsedPublicOrigin = new URL(publicOrigin);

  if (parsedRedirect?.host === parsedPublicOrigin.host) {
    return null;
  }

  url.searchParams.set("redirect_url", `${publicOrigin}/`);
  return NextResponse.redirect(url);
}

function getPublicOrigin(req: Request) {
  const forwardedHost = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const forwardedProto = req.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return req.url;
}

function safeUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export default clerkIsConfigured
  ? protectedProxy
  : function proxy() {
      return NextResponse.next();
    };

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)", "/api/(.*)"],
};
