import type { CSSProperties, ReactNode } from "react";

export function FadeIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const style: CSSProperties = { animationDelay: `${delay}s` };
  return (
    <div className={className ? `fade-in ${className}` : "fade-in"} style={style}>
      {children}
    </div>
  );
}
