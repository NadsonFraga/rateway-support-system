"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { STAGGER_LIMIT, staggerContainer, staggerItem } from "@/lib/motion";

// Escopos (abas) que já animaram nesta sessão do navegador. Ao voltar para a aba, nada reanima (D-31).
const animatedScopes = new Set<string>();

type StaggerListProps = {
  /** Identificador da aba/tela. A animação roda só na primeira abertura deste escopo. */
  scope: string;
  children: React.ReactNode;
  className?: string;
};

export function StaggerList({ scope, children, className }: StaggerListProps) {
  const reducedMotion = useReducedMotion();
  const [shouldAnimate] = React.useState(() => !animatedScopes.has(scope));

  React.useEffect(() => {
    animatedScopes.add(scope);
  }, [scope]);

  const items = React.Children.toArray(children);

  if (!shouldAnimate || reducedMotion) {
    return <div className={className}>{items}</div>;
  }

  return (
    <motion.div className={className} variants={staggerContainer} initial="hidden" animate="visible">
      {items.map((child, index) =>
        // Só as primeiras 15 linhas animam; as demais aparecem prontas.
        index < STAGGER_LIMIT ? (
          <motion.div key={(child as React.ReactElement).key ?? index} variants={staggerItem}>
            {child}
          </motion.div>
        ) : (
          <div key={(child as React.ReactElement).key ?? index}>{child}</div>
        )
      )}
    </motion.div>
  );
}
