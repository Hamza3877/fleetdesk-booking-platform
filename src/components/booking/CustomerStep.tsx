"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { customerSchema, type CustomerInput } from "@/lib/schemas";

interface CustomerStepProps {
  defaultValues: CustomerInput;
  onNext: (customer: CustomerInput) => void;
  onBack: () => void;
}

export function CustomerStep({ defaultValues, onNext, onBack }: CustomerStepProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerInput>({ resolver: zodResolver(customerSchema), defaultValues });

  return (
    <form onSubmit={handleSubmit(onNext)} noValidate className="space-y-5">
      <h2 className="text-xl font-semibold">Who is driving?</h2>
      <Input label="Full name" autoComplete="name" error={errors.customerName?.message} {...register("customerName")} />
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        hint="We use this to contact you about your booking."
        error={errors.customerEmail?.message}
        {...register("customerEmail")}
      />
      <Input label="Phone" type="tel" autoComplete="tel" error={errors.customerPhone?.message} {...register("customerPhone")} />
      <div className="flex gap-3">
        <Button variant="secondary" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button type="submit" size="lg">
          Continue
        </Button>
      </div>
    </form>
  );
}
