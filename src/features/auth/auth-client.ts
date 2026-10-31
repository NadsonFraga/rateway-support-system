"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, inferAdditionalFields, twoFactorClient } from "better-auth/client/plugins";
import type { auth } from "./auth";
import { ac, roles } from "./permissions";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>(), twoFactorClient(), adminClient({ ac, roles })],
});
