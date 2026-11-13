// Ponto de partida do sistema: sobe o Next.js e o servidor de tempo real na mesma porta.
// Desenvolvimento: `npm run dev`. Produção (VPS): `npm run build` e depois `npm start`.
import { createServer } from "node:http";
import { config } from "dotenv";
import next from "next";

config({ path: ".env.local", quiet: true });

const production = process.argv.includes("--producao");
if (production) Object.assign(process.env, { NODE_ENV: "production" });

const port = Number(process.env.PORT ?? 3000);

async function main() {
  const httpServer = createServer();
  const app = next({ dev: !production, httpServer, port });
  const handle = app.getRequestHandler();
  await app.prepare();

  // Importado depois do .env.local carregado: banco e login dependem dele.
  const { startRealtime } = await import("./src/server/realtime");

  httpServer.on("request", (request, response) => {
    // O Socket.IO responde no próprio caminho; o resto é do Next.
    if (request.url?.startsWith("/socket.io")) return;
    void handle(request, response);
  });
  startRealtime(httpServer);

  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`> Sistema em http://localhost:${port} (${production ? "produção" : "desenvolvimento"})`);
    console.log(`> Rede local: http://192.168.3.114:${port}`);
  });
}

main().catch((error) => {
  console.error("Falha ao iniciar:", error);
  process.exit(1);
});
