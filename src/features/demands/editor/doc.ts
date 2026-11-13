// Documento do editor (Tiptap/ProseMirror em JSON): guardado estruturado, nunca como HTML (D-96).

type Node = { type?: string; text?: string; attrs?: Record<string, unknown>; content?: Node[] };

/** Menção: id "pessoa:<id do usuário>" ou "cliente:<código>" (D-97). */
export type MentionId = `pessoa:${string}` | `cliente:${string}`;

function walk(node: unknown, visit: (node: Node) => void) {
  if (!node || typeof node !== "object") return;
  const current = node as Node;
  visit(current);
  if (Array.isArray(current.content)) current.content.forEach((child) => walk(child, visit));
}

/** Texto puro do documento (para comparar no histórico e para a busca). */
export function docText(doc: unknown) {
  const parts: string[] = [];
  walk(doc, (node) => {
    if (node.type === "text" && node.text) parts.push(node.text);
    if (node.type === "mention") parts.push(`@${String(node.attrs?.label ?? "")}`);
    if (node.type === "paragraph" || node.type === "listItem") parts.push("\n");
  });
  return parts.join("").replace(/\n+/g, "\n").trim();
}

export function docMentions(doc: unknown) {
  const people = new Set<string>();
  const clients = new Set<string>();
  walk(doc, (node) => {
    if (node.type !== "mention") return;
    const id = String(node.attrs?.id ?? "");
    if (id.startsWith("pessoa:")) people.add(id.slice(7));
    if (id.startsWith("cliente:")) clients.add(id.slice(8));
  });
  return { people: [...people], clients: [...clients] };
}

export function isEmptyDoc(doc: unknown) {
  return docText(doc) === "";
}

/** Documento aceitável: objeto "doc" de tamanho razoável. */
export function isValidDoc(doc: unknown) {
  if (doc === null) return true;
  if (!doc || typeof doc !== "object" || (doc as Node).type !== "doc") return false;
  return JSON.stringify(doc).length <= 60_000;
}
