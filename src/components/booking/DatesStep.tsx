"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { addDays, hasRangeConflict, todayISO } from "@/lib/dates";
import { datesSchema, type DatesInput } from "@/lib/schemas";
import type { DateRange } from "@/types";

interface DatesStepProps {
  defaultValues: DatesInput;
  bookedRanges: DateRange[];
  onNext: (dates: DatesInput) => void;
}

export function DatesStep({ defaultValues, bookedRanges, onNext }: DatesStepProps) {
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<DatesInput>({ resolver: zodResolver(datesSchema), defaultValues });

  const startDate = useWatch({ control, name: "startDate" });

  function submit(values: DatesInput) {
    // The server checks again when the booking is created. This check just gives instant feedback.
    if (hasRangeConflict(bookedRanges, values)) {
      setError("endDate", { message: "This car is already booked for part of that range. Try other dates." });
      return;
    }
    onNext(values);
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-5">
      <h2 className="text-xl font-semibold">When do you need the car?</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Pickup date" type="date" min={todayISO()} error={errors.startDate?.message} {...register("startDate")} />
        <Input
          label="Return date"
          type="date"
          min={startDate ? addDays(startDate, 1) : addDays(todayISO(), 1)}
          error={errors.endDate?.message}
          {...register("endDate")}
        />
      </div>
      <Button type="submit" size="lg">
        Continue
      </Button>
    </form>
  );
}
