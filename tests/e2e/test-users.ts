// Onde ficam as credenciais geradas para os testes (pasta ignorada pelo git).
export const CREDENTIALS_FILE = "test-results/e2e-usuarios.json";

export type TestUser = { username: string; email: string; password: string; name: string; totpSecret: string };
