import { headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/features/auth/auth";

// Encerra a sessão no servidor (usado quando ela passa do limite de 12h) e volta ao login.
export async function GET(request: NextRequest) {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch {
    // Sessão já inexistente: segue para o login.
  }
  const motivo = request.nextUrl.searchParams.get("motivo");
  const destino = new URL("/entrar", request.url);
  if (motivo === "expirada") destino.searchParams.set("motivo", "expirada");
  return NextResponse.redirect(destino);
}
