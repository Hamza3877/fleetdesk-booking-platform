import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="text-3xl font-bold">We couldn&apos;t find that page</h1>
      <p className="max-w-md text-muted-foreground">The page may have moved, or the link is wrong. Let&apos;s get you back on the road.</p>
      <Link href="/" className={buttonStyles()}>
        Back to home
      </Link>
    </main>
  );
}
