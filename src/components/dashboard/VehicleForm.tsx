"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { ImageUploadField } from "@/components/dashboard/ImageUploadField";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { api, errorMessage } from "@/lib/api";
import { CATEGORY_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, VEHICLE_STATUS_LABELS } from "@/lib/labels";
import { parseFeatures, vehicleFormSchema, type VehicleFormValues, type VehicleInput } from "@/lib/schemas";
import { FUEL_TYPES, TRANSMISSIONS, VEHICLE_CATEGORIES, VEHICLE_STATUSES, type Vehicle } from "@/types";

const toOptions = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((value) => ({ value, label: labels[value] }));

const EMPTY_VALUES: VehicleFormValues = {
  name: "",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  category: "sedan",
  transmission: "automatic",
  fuel: "petrol",
  seats: 5,
  pricePerDay: 60,
  description: "",
  features: "",
  color: "#4f46e5",
  imageUrl: "",
  status: "available",
  featured: false,
};

function toFormValues(vehicle: Vehicle): VehicleFormValues {
  return { ...vehicle, features: vehicle.features.join(", ") };
}

interface VehicleFormProps {
  vehicle?: Vehicle;
  onDone: () => void;
}

export function VehicleForm({ vehicle, onDone }: VehicleFormProps) {
  const queryClient = useQueryClient();
  const toast = useToast();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: vehicle ? toFormValues(vehicle) : EMPTY_VALUES,
  });

  const [imageUrl, color, category, name] = useWatch({ control, name: ["imageUrl", "color", "category", "name"] });

  const saveMutation = useMutation({
    mutationFn: (values: VehicleFormValues) => {
      const body: VehicleInput = { ...values, features: parseFeatures(values.features) };
      return vehicle
        ? api<Vehicle>(`/api/vehicles/${vehicle.id}`, { method: "PATCH", body })
        : api<Vehicle>("/api/vehicles", { method: "POST", body });
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success(vehicle ? `${saved.name} updated` : `${saved.name} added to your fleet`);
      onDone();
    },
  });

  const number = (name: "year" | "seats" | "pricePerDay") => register(name, { valueAsNumber: true });

  return (
    <form onSubmit={handleSubmit((values) => saveMutation.mutate(values))} noValidate className="space-y-4">
      <ImageUploadField
        value={imageUrl}
        onChange={(value) => setValue("imageUrl", value, { shouldDirty: true, shouldValidate: true })}
        color={color}
        category={category}
        name={name}
      />
      {errors.imageUrl && (
        <p role="alert" className="text-xs font-medium text-danger">
          {errors.imageUrl.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Display name" error={errors.name?.message} {...register("name")} />
        <Select label="Type" options={toOptions(VEHICLE_CATEGORIES, CATEGORY_LABELS)} error={errors.category?.message} {...register("category")} />
        <Input label="Make" error={errors.make?.message} {...register("make")} />
        <Input label="Model" error={errors.model?.message} {...register("model")} />
        <Input label="Year" type="number" error={errors.year?.message} {...number("year")} />
        <Input label="Seats" type="number" error={errors.seats?.message} {...number("seats")} />
        <Select label="Transmission" options={toOptions(TRANSMISSIONS, TRANSMISSION_LABELS)} {...register("transmission")} />
        <Select label="Fuel" options={toOptions(FUEL_TYPES, FUEL_LABELS)} {...register("fuel")} />
        <Input label="Price per day (USD)" type="number" error={errors.pricePerDay?.message} {...number("pricePerDay")} />
        <Select label="Status" options={toOptions(VEHICLE_STATUSES, VEHICLE_STATUS_LABELS)} {...register("status")} />
      </div>

      <Textarea label="Description" error={errors.description?.message} {...register("description")} />
      <Input label="Features" hint="Separate with commas, for example: Bluetooth, Backup camera" error={errors.features?.message} {...register("features")} />

      <div className="flex flex-wrap items-center gap-6">
        <div className="w-40">
                    <Input
            label="Illustration colour"
            type="color"
            className="p-1"
            value={color}
            onChange={(event) => setValue("color", event.target.value, { shouldDirty: true })}
            error={errors.color?.message}
          />
        </div>
        <label className="flex items-center gap-2 pt-6 text-sm font-medium">
          <input type="checkbox" className="size-4 accent-[var(--primary)]" {...register("featured")} />
          Show on the home page
        </label>
      </div>

      {saveMutation.isError && (
        <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm font-medium text-danger">
          {errorMessage(saveMutation.error)}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={saveMutation.isPending}>
          {vehicle ? "Save changes" : "Add vehicle"}
        </Button>
      </div>
    </form>
  );
}
