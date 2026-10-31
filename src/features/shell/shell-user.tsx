"use client";

import * as React from "react";
import type { Role } from "@/features/auth/permissions";

export type ShellUser = { id: string; name: string; username: string; role: Role; image: string | null };

const ShellUserContext = React.createContext<ShellUser | null>(null);

export const ShellUserProvider = ShellUserContext.Provider;

/** Pessoa logada, disponível para qualquer tela dentro da casca. */
export function useShellUser() {
  const user = React.useContext(ShellUserContext);
  if (!user) throw new Error("useShellUser precisa estar dentro da casca.");
  return user;
}
