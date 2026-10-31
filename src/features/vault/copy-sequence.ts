// "Copiar e Abrir Extranet" (D-37, clientes-design-v2.md 04.5):
// 1. copia a SENHA; 2. espera ~700ms; 3. copia o USUÁRIO; 4. abre a extranet.
// Assim o Ctrl+V cola o usuário e o Win+V (histórico do Windows) oferece a senha.
// A extranet abre por último porque o navegador só grava na área de transferência com a janela em foco.

export const COPY_INTERVAL_MS = 700;

type Clipboard = { writeText: (text: string) => Promise<void> };

export async function copyAndOpen(
  secrets: { username: string; password: string },
  extranetUrl: string | null,
  deps: { clipboard: Clipboard; wait?: (ms: number) => Promise<void>; open?: (url: string) => void }
) {
  const wait = deps.wait ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  await deps.clipboard.writeText(secrets.password);
  await wait(COPY_INTERVAL_MS);
  await deps.clipboard.writeText(secrets.username);
  if (extranetUrl) (deps.open ?? ((url: string) => window.open(url, "_blank", "noopener,noreferrer")))(extranetUrl);
}
