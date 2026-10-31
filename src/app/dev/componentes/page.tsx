import type { Metadata } from "next";
import { Catalogo } from "./catalogo";

export const metadata: Metadata = { title: "Catálogo de componentes" };

export default function Page() {
  return <Catalogo />;
}
