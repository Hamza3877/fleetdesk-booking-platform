"use client";

import { useMutation } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { api, errorMessage } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

export function TestCheckoutForm({ bookingId, total }: { bookingId: string; total: number }) {
  const router = useRouter();
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");

  const payMutation = useMutation({
    mutationFn: () => api("/api/payments/test-pay", { method: "POST", body: { bookingId, cardNumber } }),
    onSuccess: () => router.push(`/booking/${bookingId}`),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    payMutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Card number"
        inputMode="numeric"
        autoComplete="off"
        value={cardNumber}
        onChange={(event) => setCardNumber(event.target.value)}
        hint="Test card: 4242 4242 4242 4242 (works). 4000 0000 0000 0002 (declines)."
        error={payMutation.isError ? errorMessage(payMutation.error) : undefined}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Expiry" defaultValue="12 / 34" autoComplete="off" readOnly />
        <Input label="CVC" defaultValue="123" autoComplete="off" readOnly />
      </div>
      <Button type="submit" size="lg" className="w-full" loading={payMutation.isPending}>
        <Lock className="size-4" aria-hidden /> Pay {formatCurrency(total)}
      </Button>
    </form>
  );
}
