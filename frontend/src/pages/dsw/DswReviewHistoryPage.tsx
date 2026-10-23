


import { useEffect, useMemo, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, RotateCcw, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

type Application = {
  id: number | string;
  studentName?: string;
  fullName?: string;
  studentId?: number | string;
  rollNumber?: string;
  department?: string;
  semester?: string | number;
  studentEmail?: string;
  email?: string;
  phoneNumber?: string;
  reason?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  rejectionReason?: string;
};

type Decision = "DSW APPROVED" | "APPROVED" | "REJECTED" | "PENDING";

function getStudentName(app: Application): string {
  return app.studentName || app.fullName || "Not available";
}

function getDecision(status: string): Decision | string {
  const value = status.toUpperCase();

  if (value.includes("REJECT")) return "REJECTED";

  if (
    value === "PENDING_PRINCIPAL" ||
    value === "DSW_APPROVED"
  ) {
    return "DSW APPROVED";
  }

  if (
    value === "PRINCIPAL_APPROVED" ||
    value === "APPROVED"
  ) {
    return "APPROVED";
  }

  return value;
}

function formatDate(value?: string): string {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return date.toLocaleString("en-IN");
}

function Detail({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="grid grid-cols-1 gap-1 sm:grid-cols-[140px_1fr]">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="break-words text-sm font-medium">
        {value === undefined || value === null || value === ""
          ? "Not available"
          : value}
      </p>
    </div>
  );
}

export default function DswReviewHistoryPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [selected, setSelected] = useState<Application | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updatedAt", desc: true },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadHistory() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/bonafide/dsw/history", {
          credentials: "include",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            `Unable to load review history (${response.status})`
          );
        }

        const result: unknown = await response.json();

        let records: Application[];

        if (Array.isArray(result)) {
          records = result as Application[];
        } else if (
          typeof result === "object" &&
          result !== null &&
          "content" in result &&
          Array.isArray(result.content)
        ) {
          records = result.content as Application[];
        } else if (
          typeof result === "object" &&
          result !== null &&
          "data" in result &&
          Array.isArray(result.data)
        ) {
          records = result.data as Application[];
        } else {
          throw new Error(
            "Unexpected API response. Expected an array of applications."
          );
        }

        setApplications(
          records.filter((app) => {
            const decision = getDecision(app.status);

            return (
              decision === "DSW APPROVED" ||
              decision === "APPROVED" ||
              decision === "REJECTED"
            );
          })
        );
      } catch (err) {
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadHistory();

    return () => controller.abort();
  }, []);

  const departments = useMemo(
    () =>
      [
        ...new Set(
          applications
            .map((app) => app.department)
            .filter((department): department is string =>
              Boolean(department)
            )
        ),
      ].sort(),
    [applications]
  );

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((app) => {
      const decision = getDecision(app.status);

      const matchesStatus =
        statusFilter === "ALL" || decision === statusFilter;

      const matchesDepartment =
        departmentFilter === "ALL" ||
        app.department === departmentFilter;

      const matchesSearch =
        !query ||
        String(app.id).toLowerCase().includes(query) ||
        getStudentName(app).toLowerCase().includes(query) ||
        (app.rollNumber ?? "").toLowerCase().includes(query);

      return matchesStatus && matchesDepartment && matchesSearch;
    });
  }, [applications, search, statusFilter, departmentFilter]);

  const columns = useMemo<ColumnDef<Application>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Application ID",
      },
      {
        id: "studentName",
        accessorFn: getStudentName,
        header: "Student Name",
      },
      {
        accessorKey: "rollNumber",
        header: "Roll Number",
        cell: ({ row }) => row.original.rollNumber || "—",
      },
      {
        accessorKey: "department",
        header: "Department",
        cell: ({ row }) => row.original.department || "—",
      },
      {
        accessorKey: "status",
        header: "Decision",
        cell: ({ row }) => {
          const decision = getDecision(row.original.status);

          return (
            <Badge
              variant={
                decision === "REJECTED" ? "destructive" : "default"
              }
            >
              {decision}
            </Badge>
          );
        },
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <Button
            variant="ghost"
            className="-ml-3"
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
          >
            Decision Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const date = row.original.updatedAt;

          return date ? formatDate(date) : "—";
        },
        sortingFn: (a, b) => {
          const first = a.original.updatedAt
            ? new Date(a.original.updatedAt).getTime()
            : 0;
          const second = b.original.updatedAt
            ? new Date(b.original.updatedAt).getTime()
            : 0;

          return first - second;
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: filteredApplications,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const approvedCount = applications.filter(
    (app) => getDecision(app.status) !== "REJECTED"
  ).length;

  const rejectedCount = applications.filter(
    (app) => getDecision(app.status) === "REJECTED"
  ).length;

  function resetFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setDepartmentFilter("ALL");
    setSorting([{ id: "updatedAt", desc: true }]);
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* <div>
        <h6 className="text-xl font-semibold tracking-tight">
          Review History
        </h6>
        <p className="mt-1 text-sm text-muted-foreground">
          View previously reviewed Bonafide applications.
        </p>
      </div> */}

      <div className="grid gap-4 sm:grid-cols-6">
        <div className="rounded-xl border p-4">
          <p className=" text-muted-foreground">
            Dsw Approved
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {approvedCount}
          </p>
        </div>

        <div className="rounded-xl border p-4">
          <p className=" text-muted-foreground">Dsw Rejected</p>
          <p className="mt-2 text-2xl font-semibold">
            {rejectedCount}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search student, roll number or application ID..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full lg:w-[190px]">
            <SelectValue placeholder="Filter decision" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All decisions</SelectItem>
            <SelectItem value="DSW APPROVED">DSW approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="APPROVED">Fully approved</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={departmentFilter}
          onValueChange={setDepartmentFilter}
        >
          <SelectTrigger className="w-full lg:w-[200px]">
            <SelectValue placeholder="Filter department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All departments</SelectItem>
            {departments.map((department) => (
              <SelectItem key={department} value={department}>
                {department}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" onClick={resetFilters}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id}>
                {group.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center"
                >
                  Loading review history...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-destructive"
                >
                  {error}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  tabIndex={0}
                  role="button"
                  aria-label={`View application ${row.original.id}`}
                  className="cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setSelected(row.original)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelected(row.original);
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-28 text-center text-muted-foreground"
                >
                  No reviewed applications found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-sm text-muted-foreground">
        Showing {table.getRowModel().rows.length} of{" "}
        {applications.length} reviewed applications.
      </p>

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full overflow-y-auto sm:max-w-xl"
        >
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>Application Details</SheetTitle>
                <SheetDescription>
                  Bonafide application #{selected.id}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-5">
                <section className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Decision
                  </p>
                  <Badge
                    variant={
                      getDecision(selected.status) === "REJECTED"
                        ? "destructive"
                        : "default"
                    }
                  >
                    {getDecision(selected.status)}
                  </Badge>
                </section>

                <Separator />

                <section className="space-y-4">
                  <h3 className="font-semibold">
                    Student Information
                  </h3>

                  <Detail
                    label="Student Name"
                    value={getStudentName(selected)}
                  />
                  <Detail label="Student ID" value={selected.studentId} />
                  <Detail label="Roll Number" value={selected.rollNumber} />
                  <Detail label="Department" value={selected.department} />
                  <Detail label="Semester" value={selected.semester} />
                  <Detail
                    label="Email"
                    value={selected.studentEmail || selected.email}
                  />
                  <Detail label="Phone" value={selected.phoneNumber} />
                </section>

                <Separator />

                <section className="space-y-4">
                  <h3 className="font-semibold">
                    Application Information
                  </h3>

                  <Detail label="Application ID" value={selected.id} />
                  <Detail
                    label="Submitted"
                    value={formatDate(selected.createdAt)}
                  />
                  <Detail
                    label="Last Updated"
                    value={formatDate(selected.updatedAt)}
                  />
                  <Detail label="Reason" value={selected.reason} />

                  {getDecision(selected.status) === "REJECTED" && (
                    <Detail
                      label="Rejection Reason"
                      value={selected.rejectionReason}
                    />
                  )}
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
