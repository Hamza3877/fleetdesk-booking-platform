import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CustomerStep } from "@/components/booking/CustomerStep";
import { emptyCustomer } from "@/store/bookingDraftSlice";

describe("CustomerStep", () => {
  it("shows validation messages and does not continue with an empty form", async () => {
    const onNext = vi.fn();
    render(<CustomerStep defaultValues={emptyCustomer} onNext={onNext} onBack={() => {}} />);

    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Please enter your full name")).toBeInTheDocument();
    expect(screen.getByText("Enter a valid email address")).toBeInTheDocument();
    expect(onNext).not.toHaveBeenCalled();
  });

  it("continues with the typed details when everything is valid", async () => {
    const onNext = vi.fn();
    render(<CustomerStep defaultValues={emptyCustomer} onNext={onNext} onBack={() => {}} />);

    await userEvent.type(screen.getByLabelText("Full name"), "Hamza Ali");
    await userEvent.type(screen.getByLabelText("Email"), "hamza@example.com");
    await userEvent.type(screen.getByLabelText("Phone"), "+92 300 1234567");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => expect(onNext).toHaveBeenCalled());
    expect(onNext.mock.calls[0][0]).toEqual({
      customerName: "Hamza Ali",
      customerEmail: "hamza@example.com",
      customerPhone: "+92 300 1234567",
    });
  });

  it("goes back when Back is clicked", async () => {
    const onBack = vi.fn();
    render(<CustomerStep defaultValues={emptyCustomer} onNext={() => {}} onBack={onBack} />);
    await userEvent.click(screen.getByRole("button", { name: "Back" }));
    expect(onBack).toHaveBeenCalled();
  });
});
