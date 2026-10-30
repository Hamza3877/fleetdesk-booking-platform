import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { BOOKING_STATUS_LABELS } from "@/lib/labels";
import type { Booking, BookingListItem, BookingStatus, Paginated } from "@/types";

type BookingPage = Paginated<BookingListItem>;

export function useBookingStatusMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) =>
      api<Booking>(`/api/bookings/${id}`, { method: "PATCH", body: { status } }),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["bookings"] });
      const snapshot = queryClient.getQueriesData<BookingPage>({ queryKey: ["bookings"] });

      queryClient.setQueriesData<BookingPage>({ queryKey: ["bookings"] }, (page) =>
        page && {
          ...page,
          items: page.items.map((booking) =>
            booking.id === id
              ? {
                  ...booking,
                  status,
                  paymentStatus: status === "cancelled" && booking.paymentStatus === "paid" ? "refunded" : booking.paymentStatus,
                }
              : booking,
          ),
        },
      );

      return { snapshot };
    },

    onError: (error, _variables, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error(errorMessage(error));
    },

    onSuccess: (booking) => {
      toast.success(`${booking.reference} is now ${BOOKING_STATUS_LABELS[booking.status].toLowerCase()}`);
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}
