import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Checagem rápida antes da página: sem cookie de sessão, vai direto para o login.
// A validação de verdade (banco, 12h, primeiro acesso) acontece em requireUser().
const PUBLIC_PATHS = ["/entrar", "/sair", "/arquivos"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.next();
  }

  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/|_next/|favicon.ico|.*\\.(?:svg|png|jpg|webp|ico|woff2)$).*)"],
};
