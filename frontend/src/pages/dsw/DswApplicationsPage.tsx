
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Search,
  RefreshCw,
  AlertTriangle,
  UserRound,
  FileText,
  GraduationCap,
  CalendarDays,
  Building2,
  House,
  Hash,
} from "lucide-react";

import { dswApi } from "../../api/dswApi";
import type { BonafideApplicationResponseDto } from "../../types/bonafide";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "../../components/ui/table";
import { LoadingState } from "../../components/common/LoadingState";
import { EmptyState } from "../../components/common/EmptyState";
import { formatDate } from "../../lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../components/ui/dialog";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "../../components/ui/sheet";

import { Separator } from "../../components/ui/separator";

export const DswApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<
    BonafideApplicationResponseDto[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Selected application for the right-side details Sheet
  const [selectedApplication, setSelectedApplication] =
    useState<BonafideApplicationResponseDto | null>(null);

  // Approval dialog state
  const [approveApp, setApproveApp] =
    useState<BonafideApplicationResponseDto | null>(null);
  const [approveRemarks, setApproveRemarks] = useState("");
  const [isApproving, setIsApproving] = useState(false);

  // Rejection dialog state
  const [rejectApp, setRejectApp] =
    useState<BonafideApplicationResponseDto | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);

    try {
      const data = await dswApi.getPendingApplications();
      setApplications(data);
    } catch (error) {
      console.error("Error fetching DSW applications:", error);
      toast.error("Failed to load pending applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchApplications();
  }, []);

  const handleApprove = async () => {
    if (!approveApp) return;

    setIsApproving(true);

    try {
      await dswApi.approveApplication(
        approveApp.id,
        approveRemarks || undefined
      );

      toast.success("Application Approved", {
        description: `Application #${approveApp.id} has been approved by DSW and forwarded to Principal.`,
      });

      setApproveApp(null);
      setApproveRemarks("");
      setSelectedApplication(null);

      await fetchApplications();
    } catch (error) {
      console.error("Approval failed:", error);
      toast.error("Failed to approve application");
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectApp || !rejectReason.trim()) {
      toast.error("Please specify a rejection reason");
      return;
    }

    setIsRejecting(true);

    try {
      await dswApi.rejectApplication(rejectApp.id, {
        reason: rejectReason.trim(),
      });

      toast.success("Application Rejected", {
        description: `Application #${rejectApp.id} has been rejected with remarks.`,
      });

      setRejectApp(null);
      setRejectReason("");
      setSelectedApplication(null);

      await fetchApplications();
    } catch (error) {
      console.error("Rejection failed:", error);
      toast.error("Failed to reject application");
    } finally {
      setIsRejecting(false);
    }
  };

  const filteredApplications = applications.filter((app) => {
    const query = searchQuery.toLowerCase().trim();

    return (
      app.id.toString().includes(query) ||
      (app.studentName ?? "").toLowerCase().includes(query) ||
      (app.rollNumber ?? "").toLowerCase().includes(query) ||
      (app.reason ?? "").toLowerCase().includes(query)
    );
  });

  const openApprovalDialog = (
    app: BonafideApplicationResponseDto
  ) => {
    setSelectedApplication(null);
    setApproveRemarks("");
    setApproveApp(app);
  };

  const openRejectionDialog = (
    app: BonafideApplicationResponseDto
  ) => {
    setSelectedApplication(null);
    setRejectReason("");
    setRejectApp(app);
  };

  return (
    <div className="w-full min-w-0 space-y-4">
      {/* Compact page header */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />

            <h1 className="text-base font-semibold tracking-tight text-foreground">
              DSW Bonafide Verification
            </h1>
          </div>

          <p className="mt-1 text-[11px] text-muted-foreground">
            Review and process pending student applications
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => void fetchApplications()}
          disabled={loading}
          className="h-8 gap-2 rounded-none text-xs"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </header>

      {/* Applications table */}
      <Card className="min-w-0 rounded-none border-border shadow-none">
        <CardHeader className="space-y-3 border-b border-border px-3 py-3 sm:px-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-semibold">
                Pending Applications
              </CardTitle>

              <p className="mt-1 text-[11px] text-muted-foreground">
                {loading
                  ? "Loading applications..."
                  : `${filteredApplications.length} application(s) found`}
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />

              <Input
                placeholder="Search name, roll no, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 rounded-none pl-8 text-xs"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-3 sm:p-4">
          {loading ? (
            <LoadingState
              rows={4}
              message="Fetching pending applications..."
            />
          ) : filteredApplications.length === 0 ? (
            <EmptyState
              icon={<FileText className="h-4 w-4" />}
              title="No Pending Applications"
              description={
                searchQuery
                  ? "No applications match your search."
                  : "There are currently no pending Bonafide applications."
              }
            />
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] font-semibold uppercase">
                      App ID
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase">
                      Student
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase">
                      Roll Number
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase">
                      Department
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase">
                      Submitted
                    </TableHead>
                    <TableHead className="text-right text-[10px] font-semibold uppercase">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-mono text-xs font-medium">
                        #{app.id}
                      </TableCell>

                      <TableCell className="text-xs font-medium">
                        {app.studentName || `Student #${app.studentId}`}
                      </TableCell>

                      <TableCell className="font-mono text-[11px]">
                        {app.rollNumber || "N/A"}
                      </TableCell>

                      <TableCell className="text-xs">
                        {app.department || "N/A"}
                      </TableCell>

                      <TableCell className="whitespace-nowrap text-[11px] text-muted-foreground">
                        {formatDate(app.createdAt)}
                      </TableCell>

                      <TableCell>
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 rounded-none px-2 text-[11px]"
                            onClick={() => setSelectedApplication(app)}
                          >
                            Details
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1 rounded-none border-emerald-600/30 px-2 text-[11px] text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950"
                            onClick={() => openApprovalDialog(app)}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 gap-1 rounded-none px-2 text-[11px]"
                            onClick={() => openRejectionDialog(app)}
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right-side application details Sheet */}
      <Sheet
        open={!!selectedApplication}
        onOpenChange={(open) => {
          if (!open) setSelectedApplication(null);
        }}
      >
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-lg"
        >
          {selectedApplication && (
            <>
              <SheetHeader className="border-b border-border px-4 py-4 pr-12">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center border border-border bg-muted/30">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0">
                    <SheetTitle className="text-base font-semibold">
                      Application #{selectedApplication.id}
                    </SheetTitle>

                    <SheetDescription className="mt-1 text-[11px]">
                      Bonafide application details and verification
                    </SheetDescription>
                  </div>
                </div>
              </SheetHeader>

              {/* Scrollable details */}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                {/* Student information */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">
                      Student Information
                    </h2>
                  </div>

                  <div className="border border-border">
                    <DetailRow
                      label="Student Name"
                      value={
                        selectedApplication.studentName ||
                        `Student #${selectedApplication.studentId}`
                      }
                    />

                    <DetailRow
                      label="Student ID"
                      value={selectedApplication.studentId}
                    />

                    <DetailRow
                      label="Roll Number"
                      value={selectedApplication.rollNumber}
                    />

                    <DetailRow
                      label="Department"
                      value={selectedApplication.department}
                    />

                    <DetailRow
                      label="Parent Name"
                      value={selectedApplication.parentName}
                      last
                    />
                  </div>
                </section>

                <Separator />

                {/* Application information */}
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <h2 className="text-sm font-semibold">
                      Application Information
                    </h2>
                  </div>

                  <div className="border border-border">
                    <DetailRow
                      label="Application ID"
                      value={`#${selectedApplication.id}`}
                    />

                    <DetailRow
                      label="Reason"
                      value={selectedApplication.reason}
                    />

                    <DetailRow
                      label="Submitted On"
                      value={formatDate(selectedApplication.createdAt)}
                      last={!selectedApplication.hostelName}
                    />

                    {selectedApplication.hostelName && (
                      <>
                        <DetailRow
                          label="Hostel"
                          value={selectedApplication.hostelName}
                        />

                        <DetailRow
                          label="Room Number"
                          value={selectedApplication.roomNumber}
                          last
                        />
                      </>
                    )}
                  </div>
                </section>

                {/* Review note */}
                <div className="flex items-start gap-2 border border-border bg-muted/20 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                  <p className="text-[11px] leading-relaxed text-muted-foreground">
                    Verify the student information and application reason
                    before approving or rejecting this application.
                  </p>
                </div>
              </div>

              {/* Sticky action footer */}
              <div className="flex shrink-0 gap-2 border-t border-border bg-background p-4">
                <Button
                  variant="outline"
                  className="h-9 flex-1 rounded-none text-xs"
                  onClick={() => openRejectionDialog(selectedApplication)}
                >
                  <XCircle className="mr-1.5 h-3.5 w-3.5" />
                  Reject
                </Button>

                <Button
                  className="h-9 flex-1 rounded-none bg-emerald-600 text-xs hover:bg-emerald-700"
                  onClick={() => openApprovalDialog(selectedApplication)}
                >
                  <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                  Approve
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Approval confirmation dialog */}
      <Dialog
        open={!!approveApp}
        onOpenChange={(open) => {
          if (!open && !isApproving) setApproveApp(null);
        }}
      >
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              Approve Bonafide Application?
            </DialogTitle>

            <DialogDescription className="text-xs">
              Confirm approval before forwarding the application to the
              Principal.
            </DialogDescription>
          </DialogHeader>

          {approveApp && (
            <div className="space-y-3 py-2 text-xs">
              <div className="space-y-2 border border-border bg-muted/20 p-3">
                <DetailRow
                  label="Application ID"
                  value={`#${approveApp.id}`}
                />

                <DetailRow
                  label="Student"
                  value={approveApp.studentName}
                />

                <DetailRow
                  label="Reason"
                  value={approveApp.reason}
                  last
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="remarks" className="text-xs">
                  DSW Remarks (Optional)
                </Label>

                <Input
                  id="remarks"
                  placeholder="Enter approval remarks..."
                  value={approveRemarks}
                  onChange={(e) => setApproveRemarks(e.target.value)}
                  className="h-9 rounded-none text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-none text-xs"
              onClick={() => setApproveApp(null)}
              disabled={isApproving}
            >
              Cancel
            </Button>

            <Button
              onClick={() => void handleApprove()}
              disabled={isApproving}
              className="rounded-none bg-emerald-600 text-xs hover:bg-emerald-700"
            >
              {isApproving && (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              {isApproving ? "Approving..." : "Confirm Approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection confirmation dialog */}
      <Dialog
        open={!!rejectApp}
        onOpenChange={(open) => {
          if (!open && !isRejecting) setRejectApp(null);
        }}
      >
        <DialogContent className="rounded-none sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Reject Bonafide Application?
            </DialogTitle>

            <DialogDescription className="text-xs">
              A clear rejection reason is required.
            </DialogDescription>
          </DialogHeader>

          {rejectApp && (
            <div className="space-y-3 py-2">
              <div className="space-y-2 border border-border bg-muted/20 p-3">
                <DetailRow
                  label="Application ID"
                  value={`#${rejectApp.id}`}
                />

                <DetailRow
                  label="Student"
                  value={rejectApp.studentName}
                  last
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rejectReason" className="text-xs">
                  Rejection Reason *
                </Label>

                <textarea
                  id="rejectReason"
                  rows={3}
                  placeholder="Specify why this application is rejected..."
                  className="w-full resize-y border border-input bg-background px-3 py-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-none text-xs"
              onClick={() => setRejectApp(null)}
              disabled={isRejecting}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              className="rounded-none text-xs"
              onClick={() => void handleReject()}
              disabled={isRejecting || !rejectReason.trim()}
            >
              {isRejecting && (
                <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              {isRejecting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/**
 * Reusable compact key-value row for application details.
 */
interface DetailRowProps {
  label: string;
  value: string | number | null | undefined;
  last?: boolean;
}

const DetailRow: React.FC<DetailRowProps> = ({
  label,
  value,
  last = false,
}) => (
  <div
    className={`grid grid-cols-[110px_minmax(0,1fr)] gap-3 px-3 py-2.5 ${
      last ? "" : "border-b border-border"
    }`}
  >
    <span className="text-[10px] font-medium text-muted-foreground">
      {label}
    </span>

    <span className="min-w-0 break-words text-xs font-medium text-foreground">
      {value === null || value === undefined || value === ""
        ? "N/A"
        : value}
    </span>
  </div>
);
