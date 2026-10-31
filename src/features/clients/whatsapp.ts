// Links do WhatsApp (contato principal e cobrança). Números brasileiros com DDD.

/** Só os dígitos; acrescenta o 55 do Brasil quando o número vem com DDD e sem código do país. */
export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function isValidPhone(value: string) {
  const digits = normalizePhone(value);
  return digits.length >= 12 && digits.length <= 13;
}

/** Exibição amigável: +55 (11) 98765-4321. */
export function formatPhone(value: string) {
  const digits = normalizePhone(value);
  const match = digits.match(/^55(\d{2})(\d{4,5})(\d{4})$/);
  return match ? `+55 (${match[1]}) ${match[2]}-${match[3]}` : value;
}

/** Conversa no WhatsApp, opcionalmente com o texto já escrito. */
export function whatsappLink(phone: string, text?: string) {
  const base = `https://wa.me/${normalizePhone(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/** Link de convite de grupo do WhatsApp (grupo não tem número). */
export function isGroupLink(value: string) {
  return /^https:\/\/chat\.whatsapp\.com\/[A-Za-z0-9]+$/.test(value.trim());
}
