"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CarFront, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { VehicleForm } from "@/components/dashboard/VehicleForm";
import { Badge, VehicleStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { VehicleImage } from "@/components/vehicles/VehicleImage";
import { api, errorMessage } from "@/lib/api";
import { CATEGORY_LABELS } from "@/lib/labels";
import { formatCurrency } from "@/lib/utils";
import type { Vehicle } from "@/types";

export function FleetManager() {
  const queryClient = useQueryClient();
  const toast = useToast();

  // `editing`: undefined = form closed, null = adding a new vehicle, a Vehicle = editing that one.
  const [editing, setEditing] = useState<Vehicle | null | undefined>(undefined);
  const [toDelete, setToDelete] = useState<Vehicle | null>(null);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["vehicles"],
    queryFn: () => api<Vehicle[]>("/api/vehicles?scope=all"),
  });

  const deleteMutation = useMutation({
    mutationFn: (vehicle: Vehicle) => api(`/api/vehicles/${vehicle.id}`, { method: "DELETE" }),
    onSuccess: (_result, vehicle) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success(`${vehicle.name} removed`);
    },
    onError: (problem) => toast.error(errorMessage(problem)),
    onSettled: () => setToDelete(null),
  });

  // Newest vehicles first. The sort is stable, so cars added at the same time keep their order.
const newestFirst = [...(data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const columns: Column<Vehicle>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      render: (vehicle) => (
        <div className="flex items-center gap-3">
          <VehicleImage vehicle={vehicle} className="h-12 w-20 shrink-0 rounded-md" />
          <div>
            <p className="font-medium">{vehicle.name}</p>
            <p className="text-xs text-muted-foreground">
              {vehicle.year} · {CATEGORY_LABELS[vehicle.category]}
            </p>
          </div>
        </div>
      ),
    },
    { key: "price", header: "Price / day", render: (vehicle) => formatCurrency(vehicle.pricePerDay) },
    {
      key: "status",
      header: "Status",
      render: (vehicle) => (
        <div className="flex flex-wrap gap-1.5">
          <VehicleStatusBadge status={vehicle.status} />
          {vehicle.featured && <Badge tone="info">Featured</Badge>}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (vehicle) => (
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(vehicle)} aria-label={`Edit ${vehicle.name}`}>
            <Pencil className="size-4" aria-hidden /> Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setToDelete(vehicle)} aria-label={`Delete ${vehicle.name}`}>
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Fleet"
        description="Add, edit and remove the vehicles customers can book."
        action={
          <Button onClick={() => setEditing(null)}>
            <Plus className="size-4" aria-hidden /> Add vehicle
          </Button>
        }
      />

      {isError ? (
        <ErrorMessage message={errorMessage(error)} onRetry={() => refetch()} />
      ) : (
        <DataTable
          caption="Fleet"
          columns={columns}
         rows={newestFirst}
          getRowKey={(vehicle) => vehicle.id}
          loading={isPending}
          empty={
            <EmptyState
              icon={CarFront}
              title="Your fleet is empty"
              description="Add your first vehicle so customers can start booking."
              action={<Button onClick={() => setEditing(null)}>Add vehicle</Button>}
            />
          }
        />
      )}

      <Modal open={editing !== undefined} onClose={() => setEditing(undefined)} title={editing ? `Edit ${editing.name}` : "Add a vehicle"}>
        {editing !== undefined && <VehicleForm vehicle={editing ?? undefined} onDone={() => setEditing(undefined)} />}
      </Modal>

      <Modal open={toDelete !== null} onClose={() => setToDelete(null)} title="Remove this vehicle?">
        {toDelete && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              {toDelete.name} will be removed from your fleet and the website. Past bookings stay in your records. This can&apos;t be undone.
              To hide it for a while, set its status to &quot;In maintenance&quot; instead.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setToDelete(null)}>
                Keep vehicle
              </Button>
              <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(toDelete)}>
                Remove vehicle
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
