import type { CSSProperties, ReactNode } from "react";

/**
 * Fades and slides content in when the page appears.
 * Plain CSS (see ".fade-in" in globals.css) instead of an animation library, so the home page
 * downloads less JavaScript. Visitors who prefer reduced motion get no movement (also in globals.css).
 */
export function FadeIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const style: CSSProperties = { animationDelay: `${delay}s` };
  return (
    <div className={className ? `fade-in ${className}` : "fade-in"} style={style}>
      {children}
    </div>
  );
}
