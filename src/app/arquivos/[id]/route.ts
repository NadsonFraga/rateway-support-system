import { prisma } from "@/lib/db";

// Entrega de imagens guardadas no banco (D-89). Público porque logos aparecem na tela de login;
// os endereços são aleatórios e cada envio gera um novo, então dá para guardar em cache para sempre.
export async function GET(_request: Request, context: RouteContext<"/arquivos/[id]">) {
  const { id } = await context.params;
  if (!/^[a-z0-9]{20,40}$/.test(id)) return new Response(null, { status: 404 });

  const asset = await prisma.asset.findUnique({ where: { id }, select: { data: true, contentType: true } });
  if (!asset) return new Response(null, { status: 404 });

  return new Response(new Uint8Array(asset.data), {
    headers: {
      "Content-Type": asset.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      // Mesmo aberto direto no navegador, um SVG não executa nada.
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
