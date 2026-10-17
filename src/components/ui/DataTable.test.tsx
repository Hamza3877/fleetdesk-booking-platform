import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable, type Column } from "@/components/ui/DataTable";

interface Row {
  id: string;
  name: string;
  price: number;
}

const columns: Column<Row>[] = [
  { key: "name", header: "Name", sortable: true, render: (row) => row.name },
  { key: "price", header: "Price", render: (row) => `$${row.price}` },
];
const rows: Row[] = [
  { id: "1", name: "Corolla", price: 42 },
  { id: "2", name: "Civic", price: 48 },
];

describe("DataTable", () => {
  it("renders a row for every item", () => {
    render(<DataTable caption="Cars" columns={columns} rows={rows} getRowKey={(row) => row.id} />);
    expect(screen.getByText("Corolla")).toBeInTheDocument();
    expect(screen.getByText("$48")).toBeInTheDocument();
  });

  it("calls onSort when a sortable header is clicked", async () => {
    const onSort = vi.fn();
    render(<DataTable caption="Cars" columns={columns} rows={rows} getRowKey={(row) => row.id} onSort={onSort} />);

    await userEvent.click(screen.getByRole("button", { name: /name/i }));
    expect(onSort).toHaveBeenCalledWith("name");
  });

  it("tells screen readers which column is sorted", () => {
    render(<DataTable caption="Cars" columns={columns} rows={rows} getRowKey={(row) => row.id} sortKey="name" sortDir="asc" onSort={() => {}} />);
    expect(screen.getByRole("columnheader", { name: /name/i })).toHaveAttribute("aria-sort", "ascending");
  });

  it("shows the empty state when there are no rows", () => {
    render(<DataTable caption="Cars" columns={columns} rows={[]} getRowKey={(row) => row.id} empty={<p>Nothing here</p>} />);
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("shows loading placeholders instead of rows while loading", () => {
    render(<DataTable caption="Cars" columns={columns} rows={rows} getRowKey={(row) => row.id} loading />);
    expect(screen.queryByText("Corolla")).not.toBeInTheDocument();
  });
});
