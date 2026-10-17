import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export interface Column<Row> {
  /** Unique name of the column. Also used as the sort key when `sortable` is true. */
  key: string;
  header: string;
  /** How to show one cell of this column. */
  render: (row: Row) => ReactNode;
  sortable?: boolean;
  /** Hide on small screens to keep the table readable on phones. */
  hideOnMobile?: boolean;
  align?: "left" | "right";
}

interface DataTableProps<Row> {
  columns: Column<Row>[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  caption: string;
  loading?: boolean;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  /** Shown when there are no rows. */
  empty?: ReactNode;
}

/**
 * Generic table used by both the bookings and the fleet screens.
 * It only draws rows: searching, sorting and paging happen on the server.
 * The <Row> in the code is a TypeScript generic: it means "any kind of row object".
 */
export function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  caption,
  loading,
  sortKey,
  sortDir,
  onSort,
  empty,
}: DataTableProps<Row>) {
  if (!loading && rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-border bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {columns.map((column) => {
              const isSorted = sortKey === column.key;
              return (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={isSorted ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                  className={cn("px-4 py-3 font-medium", column.hideOnMobile && "hidden md:table-cell", column.align === "right" && "text-right")}
                >
                  {column.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.key)}
                      className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-foreground"
                    >
                      {column.header}
                      {isSorted ? (
                        sortDir === "asc" ? <ArrowUp className="size-3.5" aria-hidden /> : <ArrowDown className="size-3.5" aria-hidden />
                      ) : (
                        <ChevronsUpDown className="size-3.5 opacity-50" aria-hidden />
                      )}
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading
            ? Array.from({ length: 6 }, (_, index) => (
                <tr key={index}>
                  {columns.map((column) => (
                    <td key={column.key} className={cn("px-4 py-3", column.hideOnMobile && "hidden md:table-cell")}>
                      <Skeleton className="h-5 w-full max-w-32" />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row) => (
                <tr key={getRowKey(row)} className="hover:bg-muted/40">
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={cn("px-4 py-3 align-middle", column.hideOnMobile && "hidden md:table-cell", column.align === "right" && "text-right")}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
