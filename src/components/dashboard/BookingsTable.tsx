"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CalendarX, Search } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { BookingStatusBadge, PaymentBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Modal } from "@/components/ui/Modal";
import { Pagination } from "@/components/ui/Pagination";
import { useBookingStatusMutation } from "@/hooks/useBookingStatusMutation";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { api, errorMessage } from "@/lib/api";
import { ALLOWED_TRANSITIONS, TRANSITION_LABELS } from "@/lib/bookingStatus";
import {
  BOOKING_SORT_FIELDS,
  DEFAULT_BOOKING_QUERY,
  bookingQueryToParams,
  type BookingQuery,
  type BookingSortField,
} from "@/lib/bookingQuery";
import { formatShortDate } from "@/lib/dates";
import { BOOKING_STATUS_LABELS } from "@/lib/labels";
import { formatCurrency } from "@/lib/utils";
import { BOOKING_STATUSES, type BookingListItem, type BookingStatus, type Paginated } from "@/types";

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  ...BOOKING_STATUSES.map((status) => ({ value: status, label: BOOKING_STATUS_LABELS[status] })),
];

export function BookingsTable() {
  const [query, setQuery] = useState<BookingQuery>(DEFAULT_BOOKING_QUERY);
  const [searchText, setSearchText] = useState("");
  const [toCancel, setToCancel] = useState<BookingListItem | null>(null);

  const search = useDebouncedValue(searchText.trim());
  const effectiveQuery = { ...query, search };

  const { data, isPending, isError, error, refetch, isPlaceholderData } = useQuery({
    queryKey: ["bookings", effectiveQuery],
    queryFn: () => api<Paginated<BookingListItem>>(`/api/bookings?${bookingQueryToParams(effectiveQuery)}`),
    placeholderData: keepPreviousData,
  staleTime: 0,
  });

  const statusMutation = useBookingStatusMutation();

  function updateQuery(changes: Partial<BookingQuery>) {
    setQuery((current) => ({ ...current, page: 1, ...changes }));
  }

  function handleSort(key: string) {
    const field = key as BookingSortField;
    if (!BOOKING_SORT_FIELDS.includes(field)) return;
    updateQuery({ sortBy: field, sortDir: query.sortBy === field && query.sortDir === "asc" ? "desc" : "asc" });
  }

  function changeStatus(booking: BookingListItem, status: BookingStatus) {
    if (status === "cancelled") setToCancel(booking);
    else statusMutation.mutate({ id: booking.id, status });
  }

  const columns: Column<BookingListItem>[] = [
    { key: "reference", header: "Booking", render: (row) => <span className="font-medium">{row.reference}</span> },
    {
      key: "customerName",
      header: "Customer",
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium">{row.customerName}</p>
          <p className="text-xs text-muted-foreground">{row.customerEmail}</p>
        </div>
      ),
    },
    { key: "vehicleName", header: "Vehicle", hideOnMobile: true, render: (row) => row.vehicleName },
    {
      key: "startDate",
      header: "Dates",
      sortable: true,
      hideOnMobile: true,
      render: (row) => `${formatShortDate(row.startDate)} - ${formatShortDate(row.endDate)}`,
    },
    { key: "totalPrice", header: "Total", sortable: true, align: "right", render: (row) => formatCurrency(row.totalPrice) },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <BookingStatusBadge status={row.status} />
          <PaymentBadge status={row.paymentStatus} />
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (row) => (
        <div className="flex justify-end gap-2">
          {ALLOWED_TRANSITIONS[row.status].map((status) => (
            <Button key={status} size="sm" variant={status === "cancelled" ? "ghost" : "secondary"} onClick={() => changeStatus(row, status)}>
              {TRANSITION_LABELS[status]}
            </Button>
          ))}
          {ALLOWED_TRANSITIONS[row.status].length === 0 && <span className="text-xs text-muted-foreground">No actions</span>}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Bookings" description="Search, filter and manage every reservation." />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <label htmlFor="booking-search" className="sr-only">
            Search bookings
          </label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            id="booking-search"
            type="search"
            value={searchText}
            onChange={(event) => {
              setSearchText(event.target.value);
              setQuery((current) => ({ ...current, page: 1 }));
            }}
            placeholder="Search by reference, customer, email or vehicle"
            className="h-10 w-full rounded-lg border border-input bg-card pr-3 pl-9 text-sm"
          />
        </div>
        <div>
          <label htmlFor="booking-status" className="sr-only">
            Filter by status
          </label>
          <select
            id="booking-status"
            value={query.status}
            onChange={(event) => updateQuery({ status: event.target.value as BookingQuery["status"] })}
            className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm sm:w-48"
          >
            {STATUS_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isError ? (
        <ErrorMessage message={errorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <div className="space-y-4" aria-busy={isPending || isPlaceholderData}>
          <div className={isPlaceholderData ? "opacity-60 transition-opacity" : "transition-opacity"}>
            <DataTable
              caption="Bookings"
              columns={columns}
              rows={data?.items ?? []}
              getRowKey={(row) => row.id}
              loading={isPending}
              sortKey={query.sortBy}
              sortDir={query.sortDir}
              onSort={handleSort}
              empty={
                <EmptyState
                  icon={CalendarX}
                  title="No bookings found"
                  description="Try a different search or status filter."
                  action={
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setSearchText("");
                        setQuery(DEFAULT_BOOKING_QUERY);
                      }}
                    >
                      Reset filters
                    </Button>
                  }
                />
              }
            />
          </div>
          {data && (
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              pageSize={data.pageSize}
              onPageChange={(page) => setQuery((current) => ({ ...current, page }))}
            />
          )}
        </div>
      )}

      <Modal open={toCancel !== null} onClose={() => setToCancel(null)} title="Cancel this booking?">
        {toCancel && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              {toCancel.reference} for {toCancel.customerName} ({toCancel.vehicleName}, {formatShortDate(toCancel.startDate)} -{" "}
              {formatShortDate(toCancel.endDate)}) will be cancelled and the dates will be free again.
              {toCancel.paymentStatus === "paid" && " The payment will be marked as refunded."}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setToCancel(null)}>
                Keep booking
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  statusMutation.mutate({ id: toCancel.id, status: "cancelled" });
                  setToCancel(null);
                }}
              >
                Cancel booking
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
