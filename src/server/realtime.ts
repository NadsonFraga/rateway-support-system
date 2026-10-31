// Servidor de tempo real (D-63, D-75): roda no mesmo processo do sistema, na VPS.
// Fluxo: algo é salvo → o PostgreSQL avisa (LISTEN/NOTIFY) → este servidor repassa na hora
// para os navegadores inscritos naquele tópico, por uma conexão permanente (Socket.IO).
import type { Server as HttpServer } from "node:http";
import { Client } from "pg";
import { Server, type Socket } from "socket.io";
import { auth } from "@/features/auth/auth";
import { isPastMaxAge } from "@/features/auth/session-policy";
import { prisma } from "@/lib/db";
import { locksNearIdleTimeout, releaseStaleLocks, touchLock } from "@/features/locks/service";
import {
  PG_CHANNEL,
  userTopic,
  type PresenceUser,
  type RealtimeMessage,
} from "@/features/realtime/types";

type SocketData = { user: PresenceUser };
type AppSocket = Socket<Record<string, never>, Record<string, never>, Record<string, never>, SocketData>;

const SWEEP_INTERVAL_MS = 15_000;

export function startRealtime(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    path: "/socket.io",
    // Não derruba conexões de outros (ex.: recarga automática do Next em desenvolvimento).
    destroyUpgrade: false,
    // Detecta conexão perdida em ~45s; a trava só cai após 2 min sem sinal.
    pingInterval: 20_000,
    pingTimeout: 25_000,
  });

  // Só entra quem tem sessão válida e completou o primeiro acesso.
  io.use(async (socket, nextMiddleware) => {
    try {
      const headers = new Headers();
      const cookie = socket.handshake.headers.cookie;
      if (cookie) headers.set("cookie", cookie);
      const session = await auth.api.getSession({ headers });
      if (
        !session ||
        isPastMaxAge(session.session.createdAt) ||
        session.user.mustChangePassword ||
        !session.user.twoFactorEnabled
      ) {
        return nextMiddleware(new Error("nao-autorizado"));
      }
      (socket as AppSocket).data.user = { userId: session.user.id, name: session.user.name };
      nextMiddleware();
    } catch {
      nextMiddleware(new Error("nao-autorizado"));
    }
  });

  const presence = new Map<string, Map<string, PresenceUser>>();

  function emitPresence(topic: string) {
    const bySocket = presence.get(topic);
    const unique = new Map<string, PresenceUser>();
    bySocket?.forEach((user) => unique.set(user.userId, user));
    io.to(topic).emit("presenca", { topic, users: [...unique.values()] });
  }

  function leavePresence(socketId: string, topic: string) {
    const bySocket = presence.get(topic);
    if (!bySocket?.delete(socketId)) return;
    if (bySocket.size === 0) presence.delete(topic);
    emitPresence(topic);
  }

  io.on("connection", (rawSocket) => {
    const socket = rawSocket as AppSocket;
    const { user } = socket.data;
    void socket.join(userTopic(user.userId));

    socket.on("inscrever", (topic: unknown, ack?: (ok: boolean) => void) => {
      // Tópicos particulares de outro usuário são recusados.
      if (typeof topic !== "string" || (topic.startsWith("usuario:") && topic !== userTopic(user.userId))) {
        return ack?.(false);
      }
      void socket.join(topic);
      ack?.(true);
    });

    socket.on("desinscrever", (topic: unknown) => {
      if (typeof topic === "string") void socket.leave(topic);
    });

    socket.on("presenca:entrar", (topic: unknown) => {
      if (typeof topic !== "string" || !topic.startsWith("registro:")) return;
      void socket.join(topic);
      if (!presence.has(topic)) presence.set(topic, new Map());
      presence.get(topic)!.set(socket.id, user);
      emitPresence(topic);
    });

    socket.on("presenca:sair", (topic: unknown) => {
      if (typeof topic === "string") leavePresence(socket.id, topic);
    });

    socket.on("trava:sinal", (payload: unknown) => {
      const data = payload as { entityType?: unknown; entityId?: unknown; atividade?: unknown };
      if (typeof data?.entityType !== "string" || typeof data?.entityId !== "string") return;
      void touchLock(prisma, data.entityType, data.entityId, user.userId, data.atividade === true).catch(
        () => undefined
      );
    });

    socket.on("disconnect", () => {
      for (const topic of [...presence.keys()]) leavePresence(socket.id, topic);
    });
  });

  void listenToDatabase(io);
  startLockSweeper(io);
  return io;
}

/** Conexão dedicada ao LISTEN, com reconexão automática se o banco reiniciar. */
async function listenToDatabase(io: Server, attempt = 0): Promise<void> {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  const retry = () => {
    client.removeAllListeners();
    void client.end().catch(() => undefined);
    const delay = Math.min(30_000, 1000 * 2 ** attempt);
    setTimeout(() => void listenToDatabase(io, attempt + 1), delay);
  };

  try {
    await client.connect();
    await client.query(`LISTEN ${PG_CHANNEL}`);
    attempt = 0;
    console.log("> Tempo real: ouvindo alterações do banco");
    client.on("notification", (notification) => {
      if (!notification.payload) return;
      try {
        const message = JSON.parse(notification.payload) as RealtimeMessage;
        io.to(message.topic).emit("mensagem", message);
      } catch {
        // Mensagem fora do formato: ignorada.
      }
    });
    client.on("error", retry);
    client.on("end", retry);
  } catch {
    console.error("> Tempo real: sem conexão com o banco, tentando de novo");
    retry();
  }
}

/** Vigia das travas: libera as caducadas e avisa quem está a 1 minuto de perder por inatividade. */
function startLockSweeper(io: Server) {
  let warned = new Set<string>();

  const sweep = async () => {
    try {
      await releaseStaleLocks(prisma);
      const near = await locksNearIdleTimeout(prisma);
      const current = new Set<string>();
      for (const lock of near) {
        const key = `${lock.entityType}:${lock.entityId}:${lock.userId}`;
        current.add(key);
        if (warned.has(key)) continue;
        const topic = userTopic(lock.userId);
        const message: RealtimeMessage = {
          topic,
          event: "trava:aviso-inatividade",
          data: { entityType: lock.entityType, entityId: lock.entityId },
          at: Date.now(),
        };
        io.to(topic).emit("mensagem", message);
      }
      warned = current;
    } catch {
      // Banco indisponível: tenta de novo no próximo ciclo.
    }
  };

  setInterval(() => void sweep(), SWEEP_INTERVAL_MS).unref();
}
