"use client";

import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { CustomerStep } from "@/components/booking/CustomerStep";
import { DatesStep } from "@/components/booking/DatesStep";
import { ReviewStep } from "@/components/booking/ReviewStep";
import { StepIndicator } from "@/components/booking/StepIndicator";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import { api, ApiError, errorMessage } from "@/lib/api";
import type { BookingInput } from "@/lib/schemas";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { goToStep, resetDraft, saveCustomer, saveDates, startDraft } from "@/store/bookingDraftSlice";
import type { Booking, DateRange, Vehicle } from "@/types";

interface BookingWizardProps {
  vehicle: Vehicle;
  bookedRanges: DateRange[];
  initialDates?: { startDate: string; endDate: string };
}

/**
 * The 3-step booking flow. It only coordinates: each step is its own component,
 * the draft lives in Redux, and the server does the real work (see /api/bookings).
 */
export function BookingWizard({ vehicle, bookedRanges, initialDates }: BookingWizardProps) {
  const dispatch = useAppDispatch();
  const toast = useToast();
  const draft = useAppSelector((state) => state.bookingDraft);

  // If checkout fails after the booking was created, a retry must reuse it instead of creating a second one.
  const createdBookingId = useRef<string | null>(null);

  useEffect(() => {
    dispatch(startDraft({ vehicleId: vehicle.id, ...initialDates }));
  }, [dispatch, vehicle.id, initialDates]);

  const payMutation = useMutation({
    mutationFn: async () => {
      if (!createdBookingId.current) {
        const input: BookingInput = { vehicleId: vehicle.id, ...draft.dates, ...draft.customer };
        const booking = await api<Booking>("/api/bookings", { method: "POST", body: input });
        createdBookingId.current = booking.id;
      }
      return api<{ url: string }>("/api/payments/checkout", { method: "POST", body: { bookingId: createdBookingId.current } });
    },
    onSuccess: ({ url }) => {
      dispatch(resetDraft());
      window.location.assign(url);
    },
    onError: (error) => {
      // 409 means someone else took the dates. Send the customer back to choose new ones.
      if (error instanceof ApiError && error.status === 409 && !createdBookingId.current) {
        toast.error(error.message);
        dispatch(goToStep(1));
      }
    },
  });

  // The draft belongs to another vehicle for a moment until startDraft runs.
  if (draft.vehicleId !== vehicle.id) return null;

  const stepContent = {
    1: (
      <DatesStep
        defaultValues={draft.dates}
        bookedRanges={bookedRanges}
        onNext={(dates) => dispatch(saveDates(dates))}
      />
    ),
    2: (
      <CustomerStep
        defaultValues={draft.customer}
        onNext={(customer) => dispatch(saveCustomer(customer))}
        onBack={() => dispatch(goToStep(1))}
      />
    ),
    3: (
      <ReviewStep
        vehicle={vehicle}
        dates={draft.dates}
        customer={draft.customer}
        loading={payMutation.isPending}
        errorMessage={payMutation.isError ? errorMessage(payMutation.error) : undefined}
        onEditDates={() => dispatch(goToStep(1))}
        onEditCustomer={() => dispatch(goToStep(2))}
        onPay={() => payMutation.mutate()}
      />
    ),
  } as const;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <StepIndicator current={draft.step} />
        <Card className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={draft.step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              {stepContent[draft.step]}
            </motion.div>
          </AnimatePresence>
        </Card>
      </div>
      <BookingSummary vehicle={vehicle} startDate={draft.dates.startDate} endDate={draft.dates.endDate} />
    </div>
  );
}
