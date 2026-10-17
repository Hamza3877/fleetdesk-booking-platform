import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "@/components/ui/Field";

describe("Input", () => {
  it("connects the label to the input", () => {
    render(<Input label="Email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("shows the error and marks the field invalid for screen readers", () => {
    render(<Input label="Email" error="Enter a valid email address" />);
    const input = screen.getByLabelText("Email");

    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email address");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a valid email address");
  });
});
