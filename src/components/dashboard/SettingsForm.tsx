"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useTheme } from "@/components/providers/ThemeProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { api, errorMessage } from "@/lib/api";
import { settingsSchema } from "@/lib/schemas";
import type { BusinessSettings } from "@/types";
// Set to true to show the "Reset demo data" button in Settings again.
const SHOW_DEMO_RESET = false;

export function SettingsForm() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { theme, toggleTheme } = useTheme();
  const [confirmingReset, setConfirmingReset] = useState(false);

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["settings"],
    queryFn: () => api<BusinessSettings>("/api/settings"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<BusinessSettings>({ resolver: zodResolver(settingsSchema) });

  // Fill the form once the data arrives.
  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: BusinessSettings) => api<BusinessSettings>("/api/settings", { method: "PATCH", body: values }),
    onSuccess: (saved) => {
      queryClient.setQueryData(["settings"], saved);
      reset(saved);
      toast.success("Settings saved");
    },
    onError: (problem) => toast.error(errorMessage(problem)),
  });

  // Puts the demo data back. Every number on the dashboard may change, so refresh everything.
  const resetMutation = useMutation({
    mutationFn: () => api("/api/admin/reset-demo", { method: "POST" }),
    onSuccess: () => {
      setConfirmingReset(false);
      queryClient.invalidateQueries();
      toast.success("Demo data restored");
    },
    onError: (problem) => toast.error(errorMessage(problem)),
  });

  return (
    <>
      <PageHeader title="Settings" description="Your business details appear on the public website." />

      <div className="grid max-w-2xl gap-6">
        <Card className="p-6">
          <h2 className="mb-4 font-semibold">Business details</h2>
          {isError && <ErrorMessage message={errorMessage(error)} onRetry={() => refetch()} />}
          {isPending && (
            <div className="space-y-4">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="h-14" />
              ))}
            </div>
          )}
          {data && (
            <form onSubmit={handleSubmit((values) => saveMutation.mutate(values))} noValidate className="space-y-4">
              <Input label="Business name" error={errors.businessName?.message} {...register("businessName")} />
              <Input label="Support email" type="email" error={errors.supportEmail?.message} {...register("supportEmail")} />
              <Input label="Phone" type="tel" error={errors.phone?.message} {...register("phone")} />
              <Input label="City" error={errors.city?.message} {...register("city")} />
              <Button type="submit" loading={saveMutation.isPending} disabled={!isDirty}>
                Save changes
              </Button>
            </form>
          )}
        </Card>

        <Card className="flex items-center justify-between gap-4 p-6">
          <div>
            <h2 className="font-semibold">Appearance</h2>
            <p className="text-sm text-muted-foreground">Currently using the {theme} theme.</p>
          </div>
          <Button variant="secondary" onClick={toggleTheme}>
            Switch to {theme === "dark" ? "light" : "dark"} mode
          </Button>
        </Card>

{SHOW_DEMO_RESET && (
        <Card className="flex items-center justify-between gap-4 p-6">
          <div>
            <h2 className="font-semibold">Demo data</h2>
            <p className="text-sm text-muted-foreground">
              Restore the sample vehicles, bookings and business details. Handy after trying things out.
            </p>
          </div>
          <Button variant="secondary" onClick={() => setConfirmingReset(true)}>
            Reset demo data
          </Button>
        </Card>
        )}
      </div>

      <Modal open={confirmingReset} onClose={() => setConfirmingReset(false)} title="Reset demo data?">
        <p className="text-sm text-muted-foreground">
          This replaces all vehicles, bookings and settings with fresh sample data. Anything you added or changed will be removed.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmingReset(false)}>
            Keep my data
          </Button>
          <Button variant="danger" loading={resetMutation.isPending} onClick={() => resetMutation.mutate()}>
            Reset demo data
          </Button>
        </div>
      </Modal>
    </>
  );
}
