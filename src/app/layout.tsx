import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { InlineScript } from "@/components/inline-script";
import { TooltipProvider } from "@/components/ui/tooltip";
import { themeBootScript } from "@/features/settings/theme";
import { getInstanceIdentity } from "@/features/settings/instance";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

// Título da aba do navegador com o nome da instância (white-label).
export async function generateMetadata(): Promise<Metadata> {
  const { name } = await getInstanceIdentity();
  return { title: { default: name, template: name ? `%s · ${name}` : "%s" } };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      data-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <head>
        <InlineScript html={themeBootScript} />
      </head>
      <body className="min-h-full">
        <TooltipProvider delayDuration={400}>{children}</TooltipProvider>
      </body>
    </html>
  );
}
