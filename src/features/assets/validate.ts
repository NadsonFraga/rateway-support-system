// Validação de imagens enviadas (D-89). Função pura: confere o tipo real pelos primeiros bytes,
// não pelo nome do arquivo, e recusa SVG com qualquer coisa que possa executar código.

export const MAX_ASSET_BYTES = 512 * 1024;

export type ImageType = "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";

export type AssetCheck = { ok: true; contentType: ImageType } | { ok: false; error: string };

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((value, index) => bytes[offset + index] === value);

// Elementos e atributos de SVG que podem rodar código ou buscar coisas de fora.
const DANGEROUS_SVG = [
  /<script/i,
  /<foreignobject/i,
  /<iframe/i,
  /<embed/i,
  /<object/i,
  /<!entity/i,
  /\son[a-z]+\s*=/i,
  /javascript:/i,
  /(href|src)\s*=\s*["']?\s*(https?:|data:text|\/\/)/i,
];

export function checkImage(bytes: Uint8Array): AssetCheck {
  if (bytes.length === 0) return { ok: false, error: "O arquivo está vazio." };
  if (bytes.length > MAX_ASSET_BYTES) return { ok: false, error: "A imagem passa de 512 KB. Use uma versão menor." };

  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { ok: true, contentType: "image/png" };
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { ok: true, contentType: "image/jpeg" };
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return { ok: true, contentType: "image/webp" };
  }

  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes.subarray(0, Math.min(bytes.length, MAX_ASSET_BYTES)));
  if (/^\s*(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*<svg[\s>]/i.test(text)) {
    if (DANGEROUS_SVG.some((pattern) => pattern.test(text))) {
      return { ok: false, error: "Este SVG tem código ou links externos e não pode ser usado. Exporte de novo como imagem simples." };
    }
    return { ok: true, contentType: "image/svg+xml" };
  }

  return { ok: false, error: "Formato não aceito. Use PNG, SVG, WebP ou JPG." };
}
