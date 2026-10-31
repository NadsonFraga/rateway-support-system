// Presets de mola — cópia fiel de design-tokens-and-laws.md, seção 3. Não criar molas fora desta lista.
import type { Transition, Variants } from "motion/react";

export const motionSprings = {
  /** Botões, checkboxes, microinterações */
  taptic: { type: "spring", stiffness: 500, damping: 32, mass: 0.6 },
  /** Drawer lateral */
  drawer: { type: "spring", stiffness: 380, damping: 30, mass: 0.8 },
  /** Indicador de abas e controle segmentado */
  tabIndicator: { type: "spring", stiffness: 440, damping: 32, mass: 0.7 },
  /** Barras de progresso e linhas do tempo */
  chartBarReveal: { type: "spring", stiffness: 280, damping: 24, mass: 0.85 },
} satisfies Record<string, Transition>;

/** Montagem escalonada: 0,035s entre linhas (D-04). */
export const STAGGER_STEP = 0.035;

/** Só as primeiras 15 linhas de uma lista animam. */
export const STAGGER_LIMIT = 15;

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: STAGGER_STEP, delayChildren: 0.02 } },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: motionSprings.taptic },
};
