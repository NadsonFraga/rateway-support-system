"use client";

// Script que roda durante a leitura do HTML, antes da primeira pintura (guia "preventing flash" do Next).
// No navegador vira text/plain, para o React não tentar executá-lo de novo.
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
