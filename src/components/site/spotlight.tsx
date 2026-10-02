"use client";

import type { HTMLAttributes, PointerEvent } from "react";

/** Wrapper that feeds the pointer position to the `.spotlight` glow + border. */
export function Spotlight({ className = "", onPointerMove, ...props }: HTMLAttributes<HTMLDivElement>) {
  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
    onPointerMove?.(event);
  };

  return <div {...props} onPointerMove={handleMove} className={`spotlight ${className}`} />;
}
