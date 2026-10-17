"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { api, errorMessage } from "@/lib/api";
import { loginSchema, type LoginInput } from "@/lib/schemas";

export function LoginForm({ demo }: { demo: LoginInput }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), defaultValues: { email: "", password: "" } });

  const loginMutation = useMutation({
    mutationFn: (values: LoginInput) => api("/api/auth/login", { method: "POST", body: values }),
    onSuccess: () => {
      router.push("/dashboard");
      router.refresh();
    },
  });

  return (
    <form onSubmit={handleSubmit((values) => loginMutation.mutate(values))} noValidate className="space-y-4">
      <Input label="Email" type="email" autoComplete="username" error={errors.email?.message} {...register("email")} />
      <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />

      {loginMutation.isError && (
        <p role="alert" className="rounded-lg bg-danger-bg p-3 text-sm font-medium text-danger">
          {errorMessage(loginMutation.error)}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" loading={loginMutation.isPending}>
        Sign in
      </Button>

      <div className="rounded-lg bg-muted p-3 text-sm">
        <p className="font-medium">Demo account</p>
        <p className="text-muted-foreground">
          {demo.email} / {demo.password}
        </p>
        <button
          type="button"
          className="mt-2 font-medium text-primary hover:underline"
          onClick={() => {
            setValue("email", demo.email, { shouldValidate: true });
            setValue("password", demo.password, { shouldValidate: true });
          }}
        >
          Fill in demo login
        </button>
      </div>
    </form>
  );
}
