"use client";

import { Button } from "@/components/ui/Button";

/** Error boundary: if anything crashes while rendering a page, the user sees this instead of a blank screen. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-muted-foreground">An unexpected error happened. Please try again. If it keeps happening, contact support.</p>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
