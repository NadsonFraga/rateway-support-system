import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins/admin";
import { twoFactor } from "better-auth/plugins/two-factor";
import { username } from "better-auth/plugins/username";
import { prisma } from "@/lib/db";
import { ac, roles, ROLES } from "./permissions";
import { USERNAME_MAX, USERNAME_MIN, validateUsername } from "./username";
import {
  isTempPasswordExpired,
  SESSION_IDLE_SECONDS,
  SESSION_REFRESH_SECONDS,
} from "./session-policy";

export const TEMP_PASSWORD_EXPIRED = "SENHA_TEMPORARIA_EXPIRADA";
export const FIRST_ACCESS_PENDING = "PRIMEIRO_ACESSO_PENDENTE";

// Enquanto o primeiro acesso não termina (senha nova + autenticador), só estes caminhos funcionam.
// Sem isso, quem tivesse apenas a senha temporária usaria o resto do sistema sem o segundo fator.
const FIRST_ACCESS_PATHS = new Set([
  "/get-session",
  "/sign-out",
  "/sign-in/username",
  "/two-factor/enable",
  "/two-factor/verify-totp",
  "/two-factor/get-totp-uri",
]);

const SIGN_IN_LIMIT = Number(process.env.AUTH_SIGNIN_RATE_LIMIT ?? 10);

// Login próprio com e-mail, senha e Google Authenticator (D-55, D-56, D-76).
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  // Entrada só por usuário (D-85). O e-mail fica na conta, mas não serve para entrar,
  // e ninguém de fora consegue consultar se um usuário existe.
  disabledPaths: ["/sign-in/email", "/is-username-available"],

  emailAndPassword: {
    enabled: true,
    // Ninguém se cadastra sozinho: o Administrador cria os membros (D-62).
    disableSignUp: true,
    minPasswordLength: 8, // D-78
    maxPasswordLength: 128,
  },

  session: {
    expiresIn: SESSION_IDLE_SECONDS,
    updateAge: SESSION_REFRESH_SECONDS,
  },

  user: {
    additionalFields: {
      mustChangePassword: { type: "boolean", required: false, defaultValue: false, input: false },
      tempPasswordExpiresAt: { type: "date", required: false, input: false },
    },
  },

  databaseHooks: {
    session: {
      create: {
        // Roda depois de a senha ser conferida: barra senha temporária vencida (48h).
        before: async (session) => {
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { mustChangePassword: true, tempPasswordExpiresAt: true },
          });
          if (user?.mustChangePassword && isTempPasswordExpired(user.tempPasswordExpiresAt)) {
            throw new APIError("FORBIDDEN", { code: TEMP_PASSWORD_EXPIRED, message: TEMP_PASSWORD_EXPIRED });
          }
        },
      },
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (FIRST_ACCESS_PATHS.has(ctx.path)) return;
      const session = await getSessionFromCtx(ctx);
      if (session && (session.user.mustChangePassword || !session.user.twoFactorEnabled)) {
        throw new APIError("FORBIDDEN", { code: FIRST_ACCESS_PENDING, message: FIRST_ACCESS_PENDING });
      }
    }),
  },

  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      // Proteção contra tentativas repetidas de senha e de código (por endereço, por minuto).
      "/sign-in/username": { window: 60, max: SIGN_IN_LIMIT },
      "/two-factor/verify-totp": { window: 60, max: SIGN_IN_LIMIT },
    },
  },

  plugins: [
    username({
      minUsernameLength: USERNAME_MIN,
      maxUsernameLength: USERNAME_MAX,
      // Converte para minúsculas antes de validar: "Nadson.Fraga" entra como "nadson.fraga".
      validationOrder: { username: "post-normalization" },
      usernameValidator: (value) => validateUsername(value) === null,
      displayUsername: false,
    }),
    twoFactor({ totpOptions: { digits: 6, period: 30 } }),
    admin({
      ac,
      roles,
      defaultRole: ROLES.operadorRotina,
      adminRoles: [ROLES.administrador],
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
