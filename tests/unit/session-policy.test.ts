import { describe, expect, it } from "vitest";
import {
  isPastMaxAge,
  isTempPasswordExpired,
  SESSION_IDLE_SECONDS,
  SESSION_MAX_SECONDS,
} from "@/features/auth/session-policy";
import { generateTempPassword, tempPasswordExpiry } from "@/features/auth/temp-password";

const HOUR = 60 * 60 * 1000;

describe("sessão (D-73) e senha temporária (D-62)", () => {
  it("expira com 2 horas sem uso e no máximo 12 horas", () => {
    expect(SESSION_IDLE_SECONDS).toBe(2 * 60 * 60);
    expect(SESSION_MAX_SECONDS).toBe(12 * 60 * 60);
  });

  it("limite de 12h conta a partir do login, com relógio simulado", () => {
    const login = new Date("2026-11-02T08:00:00Z");
    expect(isPastMaxAge(login, new Date(login.getTime() + 11.9 * HOUR))).toBe(false);
    expect(isPastMaxAge(login, new Date(login.getTime() + 12 * HOUR + 1000))).toBe(true);
  });

  it("senha temporária vale 48 horas", () => {
    const created = new Date("2026-11-02T08:00:00Z");
    const expiry = tempPasswordExpiry(created);
    expect(expiry.getTime() - created.getTime()).toBe(48 * HOUR);
    expect(isTempPasswordExpired(expiry, new Date(expiry.getTime() - 1000))).toBe(false);
    expect(isTempPasswordExpired(expiry, new Date(expiry.getTime() + 1000))).toBe(true);
    expect(isTempPasswordExpired(null)).toBe(false);
  });

  it("senha temporária tem 14 caracteres sem letras ambíguas", () => {
    const password = generateTempPassword();
    expect(password).toMatch(/^[A-Za-z2-9]{4}-[A-Za-z2-9]{4}-[A-Za-z2-9]{4}$/);
    expect(password).not.toMatch(/[0O1lI]/);
  });
});
