"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "motion/react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";
import { motionSprings } from "@/lib/motion";

// Primário é monocromático (lei Anti-Arco-Íris); fantasma para ações secundárias de cabeçalho.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border font-medium whitespace-nowrap select-none outline-none transition-colors duration-150 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg]:stroke-[1.75]",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-accent-primary text-ink-inverse hover:bg-accent-hover",
        ghost:
          "border-transparent bg-transparent text-ink-secondary hover:bg-surface-hover hover:text-ink aria-expanded:bg-surface-hover aria-expanded:text-ink",
        outline:
          "border-line-medium bg-surface text-ink hover:bg-surface-hover",
        danger:
          "border-transparent bg-transparent text-coral hover:bg-surface-hover",
      },
      size: {
        sm: "h-8 px-3 text-[13px]",
        md: "h-9 px-3.5 text-sm",
        lg: "h-10 px-4 text-sm",
        icon: "size-8",
        "icon-md": "size-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild) {
    return <Slot.Root data-slot="button" className={classes} {...props} />;
  }

  // Eventos com o mesmo nome no React e no motion têm tipos diferentes: ficam de fora do botão animado.
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const {
    onAnimationStart: _onAnimationStart,
    onDrag: _onDrag,
    onDragStart: _onDragStart,
    onDragEnd: _onDragEnd,
    ...rest
  } = props;
  /* eslint-enable @typescript-eslint/no-unused-vars */

  return (
    <motion.button
      data-slot="button"
      whileTap={{ scale: 0.97 }}
      transition={motionSprings.taptic}
      className={classes}
      {...rest}
    />
  );
}

export { Button, buttonVariants };
