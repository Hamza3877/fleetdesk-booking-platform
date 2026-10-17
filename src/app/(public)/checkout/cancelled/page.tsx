import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";

export default async function CheckoutCancelledPage({ searchParams }: { searchParams: Promise<{ booking?: string }> }) {
  const { booking } = await searchParams;
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Payment cancelled</h1>
      <p className="mt-2 text-muted-foreground">No money was taken. Your car stays held for a short time if you want to try again.</p>
      <div className="mt-6 flex justify-center gap-3">
        {booking && (
          <Link href={`/checkout/${booking}`} className={buttonStyles()}>
            Try payment again
          </Link>
        )}
        <Link href="/vehicles" className={buttonStyles({ variant: "secondary" })}>
          Back to fleet
        </Link>
      </div>
    </div>
  );
}
