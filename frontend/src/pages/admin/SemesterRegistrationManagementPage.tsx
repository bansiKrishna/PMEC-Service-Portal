import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { BookOpen, Building2, Eye, Plus, RefreshCw, Search, Users } from 'lucide-react';
import { toast } from 'sonner';
import { semesterRegistrationApi } from '../../api/semesterRegistrationApi';
import type {
  AcademicBranch,
  AcademicSubject,
  AcademicSubjectType,
  BranchStaffAssignment,
  CreateAcademicSubjectRequest,
  CreateBranchRequest,
} from '../../types/semesterRegistration';
import { EmptyState } from '../../components/common/EmptyState';
import { ErrorState } from '../../components/common/ErrorState';
import { RegistrationPageHeader } from '../semester-registration/RegistrationPageHeader';
import { RegistrationStatCard } from '../semester-registration/RegistrationStatCard';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../../components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';

type PendingAction =
  | { kind: 'branch'; branchId: number; active: boolean }
  | { kind: 'subject'; subjectId: number; active: boolean }
  | { kind: 'assignment'; branchId: number; userId: number };

interface SubjectFormState {
  branchId: string;
  academicYear: string;
  semester: string;
  code: string;
  name: string;
  subjectType: AcademicSubjectType;
  credits: string;
  compulsory: boolean;
}

const emptySubjectForm = (): SubjectFormState => ({
  branchId: '',
  academicYear: '',
  semester: '',
  code: '',
  name: '',
  subjectType: 'THEORY',
  credits: '',
  compulsory: true,
});

const isAcademicSubjectType = (value: string): value is AcademicSubjectType =>
  value === 'THEORY' ||
  value === 'PRACTICAL' ||
  value === 'LAB' ||
  value === 'ELECTIVE';

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (import.meta.env.DEV) {
      console.error('Semester registration management request failed', {
        status: error.response?.status,
        method: error.config?.method,
        url: error.config?.url,
        message: error.message,
      });
    }
    const data: unknown = error.response?.data;
    if (data && typeof data === 'object') {
      const responseData = data as Record<string, unknown>;
      const standardMessage =
        responseData.detail || responseData.error || responseData.message;
      if (typeof standardMessage === 'string' && standardMessage.trim()) {
        return standardMessage;
      }
      const fieldMessages = Object.entries(responseData)
        .map(([field, value]) => {
          if (typeof value === 'string' && value.trim()) {
            return `${field}: ${value}`;
          }
          if (Array.isArray(value) && value.length > 0) {
            return `${field}: ${value.join(', ')}`;
          }
          return null;
        })
        .filter((message): message is string => message !== null);
      if (fieldMessages.length > 0) return fieldMessages.join(' · ');
    }
    return error.message || 'The request failed. Please try again.';
  }
  return error instanceof Error ? error.message : 'The request failed. Please try again.';
};

const validateAcademicYear = (value: string): boolean => {
  const match = /^(\d{4})-(\d{4})$/.exec(value.trim());
  return Boolean(match && Number(match[2]) === Number(match[1]) + 1);
};

const SemesterRegistrationManagementPage: React.FC = () => {
  const [branches, setBranches] = useState<AcademicBranch[]>([]);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [assignments, setAssignments] = useState<BranchStaffAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [subjectError, setSubjectError] = useState<string | null>(null);
  const [branchSearch, setBranchSearch] = useState('');
  const [branchStatus, setBranchStatus] = useState('ALL');
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [branchForm, setBranchForm] = useState<CreateBranchRequest>({
    code: '',
    name: '',
    degreeLevel: 'BTECH',
  });
  const [branchFormError, setBranchFormError] = useState<string | null>(null);
  const [savingBranch, setSavingBranch] = useState(false);
  const [viewBranch, setViewBranch] = useState<AcademicBranch | null>(null);
  const [subjectBranchId, setSubjectBranchId] = useState('');
  const [subjectYear, setSubjectYear] = useState('');
  const [subjectSemester, setSubjectSemester] = useState('');
  const [subjectTypeFilter, setSubjectTypeFilter] = useState('ALL');
  const [subjectStatusFilter, setSubjectStatusFilter] = useState('ALL');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState<SubjectFormState>(emptySubjectForm);
  const [subjectFormError, setSubjectFormError] = useState<string | null>(null);
  const [savingSubject, setSavingSubject] = useState(false);
  const [viewSubject, setViewSubject] = useState<AcademicSubject | null>(null);
  const [staffBranchId, setStaffBranchId] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const loadManagementData = useCallback(async () => {
    const branchData = await semesterRegistrationApi.getAllBranches();
    let assignmentData: BranchStaffAssignment[] = [];
    let assignmentLoadError: string | null = null;
    try {
      const assignmentLists = await Promise.all(
        branchData.map((branch) => semesterRegistrationApi.getBranchStaff(branch.id)),
      );
      assignmentData = assignmentLists.flat();
    } catch (requestError: unknown) {
      assignmentLoadError = getErrorMessage(requestError);
    }
    return {
      branches: branchData,
      assignments: assignmentData,
      assignmentError: assignmentLoadError,
    };
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const data = await loadManagementData();
      setBranches(data.branches);
      setAssignments(data.assignments);
      setAssignmentError(data.assignmentError);
    } catch (requestError: unknown) {
      const message = getErrorMessage(requestError);
      setError(message);
      toast.error('Unable to load semester registration management', {
        description: message,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadManagementData]);

  useEffect(() => {
    let isActive = true;
    loadManagementData()
      .then((data) => {
        if (!isActive) return;
        setBranches(data.branches);
        setAssignments(data.assignments);
        setAssignmentError(data.assignmentError);
      })
      .catch((requestError: unknown) => {
        if (!isActive) return;
        const message = getErrorMessage(requestError);
        setError(message);
        toast.error('Unable to load semester registration management', {
          description: message,
        });
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, [loadManagementData]);

  const activeBranches = branches.filter((branch) => branch.active);
  const selectedStaffBranch = staffBranchId
    ? branches.find((branch) => branch.id === Number(staffBranchId)) ?? null
    : null;

  const visibleBranches = useMemo(() => {
    const query = branchSearch.trim().toLowerCase();
    return branches.filter((branch) => {
      const matchesSearch =
        !query ||
        branch.name.toLowerCase().includes(query) ||
        branch.code.toLowerCase().includes(query);
      const matchesStatus =
        branchStatus === 'ALL' ||
        (branchStatus === 'ACTIVE' && branch.active) ||
        (branchStatus === 'INACTIVE' && !branch.active);
      return matchesSearch && matchesStatus;
    });
  }, [branchSearch, branchStatus, branches]);

  const visibleSubjects = useMemo(() => {
    const query = subjectSearch.trim().toLowerCase();
    return subjects.filter((subject) => {
      const matchesSearch =
        !query ||
        subject.code.toLowerCase().includes(query) ||
        subject.name.toLowerCase().includes(query);
      const matchesType =
        subjectTypeFilter === 'ALL' || subject.subjectType === subjectTypeFilter;
      const matchesStatus =
        subjectStatusFilter === 'ALL' ||
        (subjectStatusFilter === 'ACTIVE' && subject.active) ||
        (subjectStatusFilter === 'INACTIVE' && !subject.active);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [subjectSearch, subjectStatusFilter, subjectTypeFilter, subjects]);

  const loadSubjects = async () => {
    const branchId = Number(subjectBranchId);
    const semester = Number(subjectSemester);
    if (!Number.isInteger(branchId) || branchId <= 0) {
      setSubjectError('Select a branch to load its subjects.');
      return;
    }
    if (!validateAcademicYear(subjectYear)) {
      setSubjectError('Enter an academic year covering consecutive years, such as 2026-2027.');
      return;
    }
    if (!Number.isInteger(semester) || semester < 1 || semester > 10) {
      setSubjectError('Semester must be between 1 and 10.');
      return;
    }

    setSubjectError(null);
    try {
      setSubjects(
        await semesterRegistrationApi.getAllSubjects(
          branchId,
          subjectYear.trim(),
          semester,
        ),
      );
    } catch (requestError: unknown) {
      const message = getErrorMessage(requestError);
      setSubjectError(message);
      toast.error('Unable to load subjects', { description: message });
    }
  };

  const openSubjectDialog = () => {
    setSubjectForm({
      ...emptySubjectForm(),
      branchId: subjectBranchId || (activeBranches[0] ? String(activeBranches[0].id) : ''),
      academicYear: subjectYear,
      semester: subjectSemester,
    });
    setSubjectFormError(null);
    setSubjectDialogOpen(true);
  };

  const createBranch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const code = branchForm.code.trim().toUpperCase();
    const name = branchForm.name.trim();
    if (!code || !name) {
      setBranchFormError('Branch code and branch name are required.');
      return;
    }
    if (code.length > 20 || name.length > 150) {
      setBranchFormError('Branch code must be 20 characters or fewer and name 150 characters or fewer.');
      return;
    }
    if (branches.some((branch) => branch.code.toUpperCase() === code)) {
      setBranchFormError('A branch with this code already exists.');
      return;
    }

    setSavingBranch(true);
    setBranchFormError(null);
    try {
      const created = await semesterRegistrationApi.createBranch({
        code,
        name,
        degreeLevel: branchForm.degreeLevel,
      });
      toast.success('Branch created', { description: `${created.code} · ${created.name}` });
      setBranchDialogOpen(false);
      setBranchForm({ code: '', name: '', degreeLevel: 'BTECH' });
      await refresh();
    } catch (requestError: unknown) {
      const message = getErrorMessage(requestError);
      setBranchFormError(message);
      toast.error('Branch could not be created', { description: message });
    } finally {
      setSavingBranch(false);
    }
  };

  const createSubject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const branchId = Number(subjectForm.branchId);
    const semester = Number(subjectForm.semester);
    const credits = subjectForm.credits.trim() ? Number(subjectForm.credits) : null;
    if (!Number.isInteger(branchId) || branchId <= 0) {
      setSubjectFormError('Select an active branch.');
      return;
    }
    if (!validateAcademicYear(subjectForm.academicYear)) {
      setSubjectFormError('Enter an academic year covering consecutive years, such as 2026-2027.');
      return;
    }
    if (!Number.isInteger(semester) || semester < 1 || semester > 10) {
      setSubjectFormError('Semester must be between 1 and 10.');
      return;
    }
    if (!subjectForm.code.trim() || !subjectForm.name.trim()) {
      setSubjectFormError('Subject code and subject name are required.');
      return;
    }
    if (subjectForm.code.trim().length > 30 || subjectForm.name.trim().length > 150) {
      setSubjectFormError('Subject code must be 30 characters or fewer and name 150 characters or fewer.');
      return;
    }
    if (credits != null && (!Number.isFinite(credits) || credits < 0 || credits > 99.99)) {
      setSubjectFormError('Credits must be between 0 and 99.99.');
      return;
    }

    const request: CreateAcademicSubjectRequest = {
      branchId,
      academicYear: subjectForm.academicYear.trim(),
      semester,
      code: subjectForm.code.trim().toUpperCase(),
      name: subjectForm.name.trim(),
      subjectType: subjectForm.subjectType,
      credits,
      compulsory: subjectForm.compulsory,
    };

    setSavingSubject(true);
    setSubjectFormError(null);
    try {
      const created = await semesterRegistrationApi.createSubject(request);
      toast.success('Subject created', { description: `${created.code} · ${created.name}` });
      setSubjectDialogOpen(false);
      setSubjectBranchId(String(branchId));
      setSubjectYear(request.academicYear);
      setSubjectSemester(String(semester));
      setSubjectForm(emptySubjectForm());
      await semesterRegistrationApi.getAllSubjects(branchId, request.academicYear, semester)
        .then(setSubjects)
        .catch((requestError: unknown) => {
          const message = getErrorMessage(requestError);
          setSubjectError(message);
          toast.error('Subject created, but the list could not be refreshed', {
            description: message,
          });
        });
    } catch (requestError: unknown) {
      const message = getErrorMessage(requestError);
      setSubjectFormError(message);
      toast.error('Subject could not be created', { description: message });
    } finally {
      setSavingSubject(false);
    }
  };

  const runPendingAction = async () => {
    if (!pendingAction) return;
    const action = pendingAction;
    const actionKey = `${action.kind}-${'branchId' in action ? action.branchId : action.subjectId}`;
    setBusyAction(actionKey);
    try {
      if (action.kind === 'branch') {
        await semesterRegistrationApi.setBranchActive(action.branchId, action.active);
        toast.success(action.active ? 'Branch activated' : 'Branch deactivated');
      } else if (action.kind === 'subject') {
        await semesterRegistrationApi.setSubjectActive(action.subjectId, action.active);
        toast.success(action.active ? 'Subject activated' : 'Subject deactivated');
      } else {
        await semesterRegistrationApi.deactivateBranchStaff(
          action.branchId,
          action.userId,
        );
        toast.success('Branch staff assignment deactivated');
      }
      setPendingAction(null);
      if (action.kind === 'subject') {
        await loadSubjects();
      } else {
        await refresh();
      }
    } catch (requestError: unknown) {
      const message = getErrorMessage(requestError);
      toast.error('The action could not be completed', { description: message });
      if (action.kind === 'subject') {
        setSubjectError(message);
      } else if (action.kind === 'assignment') {
        setAssignmentError(message);
      } else {
        setError(message);
      }
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full min-w-0 space-y-4" aria-busy="true">
        <RegistrationPageHeader
          title="Semester registration management"
          description="Manage academic branches, semester subjects, and branch staff assignments."
          icon={Building2}
        />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-[92px] animate-pulse border border-border bg-muted/30" />
          ))}
        </div>
        <div className="h-64 animate-pulse border border-border bg-muted/30" />
      </div>
    );
  }

  if (error && branches.length === 0) {
    return (
      <ErrorState
        title="Semester registration management unavailable"
        message={error}
        onRetry={() => void refresh()}
      />
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4">
      <RegistrationPageHeader
        title="Semester registration management"
        description="Manage academic branches, semester subjects, and currently active branch assignments."
        icon={Building2}
        action={
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-8"
            disabled={refreshing}
            onClick={() => void refresh()}
          >
            <RefreshCw className={`mr-1.5 size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {error && (
        <div role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      <section aria-label="Branch summary" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <RegistrationStatCard
          label="Total branches"
          value={branches.length}
          description="Configured academic branches"
          icon={Building2}
        />
        <RegistrationStatCard
          label="Active branches"
          value={activeBranches.length}
          description="Available for registration"
          icon={BookOpen}
        />
        {assignmentError ? (
          <RegistrationStatCard
            label="Active staff assignments"
            value="—"
            description="Assignment data unavailable"
            icon={Users}
          />
        ) : (
          <RegistrationStatCard
            label="Active staff assignments"
            value={assignments.length}
            description="Across configured branches"
            icon={Users}
          />
        )}
      </section>

      <Tabs defaultValue="branches" className="space-y-3">
        <TabsList className="h-auto max-w-full flex-wrap justify-start">
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="staff">Branch staff assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="branches">
          <Card className="rounded-none border-border shadow-none">
            <CardHeader className="gap-3 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-sm">Branch management</CardTitle>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Branch records are deactivated rather than deleted, preserving registration history.
                </p>
              </div>
              <Button type="button" size="sm" className="h-8 gap-1.5" onClick={() => {
                setBranchForm({ code: '', name: '', degreeLevel: 'BTECH' });
                setBranchFormError(null);
                setBranchDialogOpen(true);
              }}>
                <Plus aria-hidden="true" className="size-4" />
                Add Branch
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <div className="grid flex-1 gap-1.5">
                  <Label htmlFor="branch-search">Search branches</Label>
                  <div className="relative">
                    <Search aria-hidden="true" className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="branch-search"
                      className="pl-8"
                      placeholder="Branch name or code"
                      value={branchSearch}
                      onChange={(event) => setBranchSearch(event.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-1.5 md:w-48">
                  <Label htmlFor="branch-status-filter">Status</Label>
                  <Select value={branchStatus} onValueChange={setBranchStatus}>
                    <SelectTrigger id="branch-status-filter"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All statuses</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(branchSearch || branchStatus !== 'ALL') && (
                  <Button type="button" variant="ghost" onClick={() => {
                    setBranchSearch('');
                    setBranchStatus('ALL');
                  }}>
                    Clear Filters
                  </Button>
                )}
              </div>

              {visibleBranches.length === 0 ? (
                <EmptyState
                  title="No branches found"
                  description={branches.length === 0
                    ? 'No branches are available from the backend.'
                    : 'No branches match the current filters.'}
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Branch code</TableHead>
                        <TableHead>Branch name</TableHead>
                        <TableHead>Degree level</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleBranches.map((branch) => (
                        <TableRow key={branch.id}>
                          <TableCell className="font-semibold">{branch.code}</TableCell>
                          <TableCell>{branch.name}</TableCell>
                          <TableCell>{branch.degreeLevel}</TableCell>
                          <TableCell>
                            <span className={branch.active
                              ? 'border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}>
                              {branch.active ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button type="button" size="sm" variant="outline" onClick={() => setViewBranch(branch)}>
                                <Eye aria-hidden="true" className="mr-1.5 size-3.5" />
                                View
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={branch.active ? 'destructive' : 'outline'}
                                disabled={busyAction === `branch-${branch.id}`}
                                onClick={() => branch.active
                                  ? setPendingAction({ kind: 'branch', branchId: branch.id, active: false })
                                  : setPendingAction({ kind: 'branch', branchId: branch.id, active: true })}
                              >
                                {branch.active ? 'Deactivate' : 'Activate'}
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
        </TabsContent>

        <TabsContent value="subjects">
          <Card className="rounded-none border-border shadow-none">
            <CardHeader className="gap-3 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-sm">Subject management</CardTitle>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Select a branch, academic year, and semester to query the backend-managed subjects.
                </p>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-8 gap-1.5"
                disabled={activeBranches.length === 0}
                title={activeBranches.length === 0 ? 'Create or activate a branch before adding subjects.' : undefined}
                onClick={openSubjectDialog}
              >
                <Plus aria-hidden="true" className="size-4" />
                Add Subject
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="subject-branch-filter">Branch</Label>
                  <Select value={subjectBranchId} onValueChange={setSubjectBranchId}>
                    <SelectTrigger id="subject-branch-filter"><SelectValue placeholder="Select branch" /></SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                          {branch.code} · {branch.name}{branch.active ? '' : ' (inactive)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="subject-year-filter">Academic year</Label>
                  <Input
                    id="subject-year-filter"
                    placeholder="2026-2027"
                    maxLength={9}
                    value={subjectYear}
                    onChange={(event) => setSubjectYear(event.target.value)}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="subject-semester-filter">Semester</Label>
                  <Input
                    id="subject-semester-filter"
                    type="number"
                    min={1}
                    max={10}
                    value={subjectSemester}
                    onChange={(event) => setSubjectSemester(event.target.value)}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button type="button" variant="outline" onClick={() => void loadSubjects()}>
                    Load subjects
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => {
                    setSubjectBranchId('');
                    setSubjectYear('');
                    setSubjectSemester('');
                    setSubjectTypeFilter('ALL');
                    setSubjectStatusFilter('ALL');
                    setSubjectSearch('');
                    setSubjects([]);
                    setSubjectError(null);
                  }}>
                    Clear Filters
                  </Button>
                </div>
              </div>

              {subjectError && (
                <div role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                  {subjectError}
                </div>
              )}

              {subjects.length > 0 && (
                <div className="grid gap-2 md:grid-cols-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="subject-management-search">Search subjects</Label>
                    <Input
                      id="subject-management-search"
                      placeholder="Code or name"
                      value={subjectSearch}
                      onChange={(event) => setSubjectSearch(event.target.value)}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="subject-management-type">Subject type</Label>
                    <Select value={subjectTypeFilter} onValueChange={setSubjectTypeFilter}>
                      <SelectTrigger id="subject-management-type"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All types</SelectItem>
                        {(['THEORY', 'PRACTICAL', 'LAB', 'ELECTIVE'] as const).map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="subject-management-status">Active status</Label>
                    <Select value={subjectStatusFilter} onValueChange={setSubjectStatusFilter}>
                      <SelectTrigger id="subject-management-status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All statuses</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {!subjectBranchId || !subjectYear || !subjectSemester ? (
                <EmptyState
                  title="Select subject filters"
                  description="Choose a branch, academic year, and semester, then load subjects from the API."
                />
              ) : subjects.length === 0 ? (
                <EmptyState
                  title="No subjects loaded"
                  description="Load subjects for the selected branch and academic period. An empty result means no subject records matched."
                />
              ) : visibleSubjects.length === 0 ? (
                <EmptyState title="No subjects match these filters" description="Clear or adjust the subject filters." />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject code</TableHead>
                        <TableHead>Subject name</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Academic period</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {visibleSubjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell className="font-semibold">{subject.code}</TableCell>
                          <TableCell>{subject.name}</TableCell>
                          <TableCell>{subject.branchCode}</TableCell>
                          <TableCell>{subject.academicYear} · Sem {subject.semester}</TableCell>
                          <TableCell>{subject.subjectType}</TableCell>
                          <TableCell>{subject.credits ?? '—'}</TableCell>
                          <TableCell>{subject.compulsory ? 'Compulsory' : 'Elective'}</TableCell>
                          <TableCell>{subject.active ? 'Active' : 'Inactive'}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button type="button" size="sm" variant="outline" onClick={() => setViewSubject(subject)}>
                                <Eye aria-hidden="true" className="mr-1.5 size-3.5" />
                                View
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={subject.active ? 'destructive' : 'outline'}
                                disabled={
                                  busyAction === `subject-${subject.id}` ||
                                  (!subject.active && !branches.find((branch) => branch.id === subject.branchId)?.active)
                                }
                                title={!subject.active && !branches.find((branch) => branch.id === subject.branchId)?.active
                                  ? 'Activate the branch before activating this subject.'
                                  : undefined}
                                onClick={() => subject.active
                                  ? setPendingAction({ kind: 'subject', subjectId: subject.id, active: false })
                                  : setPendingAction({ kind: 'subject', subjectId: subject.id, active: true })}
                              >
                                {subject.active ? 'Deactivate' : 'Activate'}
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
        </TabsContent>

        <TabsContent value="staff">
          <Card className="rounded-none border-border shadow-none">
            <CardHeader className="border-b border-border px-3 py-3">
              <CardTitle className="text-sm">Branch staff assignments</CardTitle>
              <p className="text-[11px] text-muted-foreground">
                The API returns active assignment records for one branch at a time.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              <div className="grid max-w-md gap-1.5">
                <Label htmlFor="staff-branch-filter">Branch</Label>
                <Select value={staffBranchId} onValueChange={setStaffBranchId}>
                  <SelectTrigger id="staff-branch-filter"><SelectValue placeholder="Select branch" /></SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={String(branch.id)}>
                        {branch.code} · {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                The backend does not expose a branch-staff account creation endpoint or an eligible-user directory.
                Creating or assigning accounts is therefore unavailable here; the existing assignment API only
                supports a known user ID.
              </div>
              {assignmentError && (
                <div role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                  {assignmentError}
                </div>
              )}
              {selectedStaffBranch ? (
                (() => {
                  const branchAssignments = assignments.filter(
                    (assignment) => assignment.branchId === selectedStaffBranch.id,
                  );
                  return branchAssignments.length === 0 ? (
                    <EmptyState
                      title="No active assignments returned"
                      description="There are no active branch assignments for this branch, or the endpoint returned an empty list."
                    />
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Staff name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Assigned since</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {branchAssignments.map((assignment) => (
                            <TableRow key={assignment.assignmentId}>
                              <TableCell className="font-medium">{assignment.fullName}</TableCell>
                              <TableCell>{assignment.email}</TableCell>
                              <TableCell>{assignment.role}</TableCell>
                              <TableCell>
                                {new Date(assignment.createdAt).toLocaleDateString('en-IN')}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  disabled={busyAction === `assignment-${assignment.branchId}`}
                                  onClick={() => setPendingAction({
                                    kind: 'assignment',
                                    branchId: assignment.branchId,
                                    userId: assignment.userId,
                                  })}
                                >
                                  Deactivate assignment
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })()
              ) : (
                <EmptyState
                  title="Select a branch"
                  description="Choose a branch to load its current active staff assignments."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add academic branch</DialogTitle>
            <DialogDescription>
              Create an active branch using the backend branch request fields.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void createBranch(event)}>
            <div className="grid gap-2">
              <Label htmlFor="new-branch-code">Branch code</Label>
              <Input
                id="new-branch-code"
                required
                maxLength={20}
                value={branchForm.code}
                onChange={(event) => setBranchForm((current) => ({ ...current, code: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-branch-name">Branch name</Label>
              <Input
                id="new-branch-name"
                required
                maxLength={150}
                value={branchForm.name}
                onChange={(event) => setBranchForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-branch-level">Degree level</Label>
              <Select
                value={branchForm.degreeLevel}
                onValueChange={(value) => {
                  if (value === 'BTECH' || value === 'MTECH') {
                    setBranchForm((current) => ({ ...current, degreeLevel: value }));
                  }
                }}
              >
                <SelectTrigger id="new-branch-level"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTECH">B.Tech</SelectItem>
                  <SelectItem value="MTECH">M.Tech</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {branchFormError && <p role="alert" className="text-sm text-destructive">{branchFormError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={savingBranch} onClick={() => setBranchDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingBranch}>
                {savingBranch ? 'Creating...' : 'Create branch'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add academic subject</DialogTitle>
            <DialogDescription>
              Subject code, branch, academic year, semester, type, credits, and compulsory flag are sent using the backend DTO.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={(event) => void createSubject(event)}>
            <div className="grid gap-2">
              <Label htmlFor="new-subject-branch">Branch</Label>
              <Select
                value={subjectForm.branchId}
                onValueChange={(value) => setSubjectForm((current) => ({ ...current, branchId: value }))}
              >
                <SelectTrigger id="new-subject-branch"><SelectValue placeholder="Select active branch" /></SelectTrigger>
                <SelectContent>
                  {activeBranches.map((branch) => (
                    <SelectItem key={branch.id} value={String(branch.id)}>
                      {branch.code} · {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="new-subject-year">Academic year</Label>
                <Input
                  id="new-subject-year"
                  required
                  placeholder="2026-2027"
                  maxLength={9}
                  value={subjectForm.academicYear}
                  onChange={(event) => setSubjectForm((current) => ({ ...current, academicYear: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-subject-semester">Semester</Label>
                <Input
                  id="new-subject-semester"
                  type="number"
                  min={1}
                  max={10}
                  required
                  value={subjectForm.semester}
                  onChange={(event) => setSubjectForm((current) => ({ ...current, semester: event.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="new-subject-code">Subject code</Label>
                <Input
                  id="new-subject-code"
                  required
                  maxLength={30}
                  value={subjectForm.code}
                  onChange={(event) => setSubjectForm((current) => ({ ...current, code: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-subject-type">Subject type</Label>
                <Select
                  value={subjectForm.subjectType}
                  onValueChange={(value) => {
                    if (isAcademicSubjectType(value)) {
                      setSubjectForm((current) => ({
                        ...current,
                        subjectType: value,
                      }));
                    }
                  }}
                >
                  <SelectTrigger id="new-subject-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['THEORY', 'PRACTICAL', 'LAB', 'ELECTIVE'] as const).map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-subject-name">Subject name</Label>
              <Input
                id="new-subject-name"
                required
                maxLength={150}
                value={subjectForm.name}
                onChange={(event) => setSubjectForm((current) => ({ ...current, name: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-subject-credits">Credits (optional)</Label>
              <Input
                id="new-subject-credits"
                type="number"
                min={0}
                max={99.99}
                step="0.01"
                inputMode="decimal"
                value={subjectForm.credits}
                onChange={(event) => setSubjectForm((current) => ({ ...current, credits: event.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={subjectForm.compulsory}
                onChange={(event) => setSubjectForm((current) => ({ ...current, compulsory: event.target.checked }))}
                className="size-4 accent-primary"
              />
              Compulsory subject
            </label>
            {subjectFormError && <p role="alert" className="text-sm text-destructive">{subjectFormError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={savingSubject} onClick={() => setSubjectDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingSubject}>
                {savingSubject ? 'Creating...' : 'Create subject'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewBranch)} onOpenChange={(open) => !open && setViewBranch(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Branch details</DialogTitle>
          </DialogHeader>
          {viewBranch && (
            <dl className="grid gap-4 sm:grid-cols-2">
              <SummaryDetail label="Branch code" value={viewBranch.code} />
              <SummaryDetail label="Branch name" value={viewBranch.name} />
              <SummaryDetail label="Degree level" value={viewBranch.degreeLevel} />
              <SummaryDetail label="Status" value={viewBranch.active ? 'Active' : 'Inactive'} />
            </dl>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewBranch(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewSubject)} onOpenChange={(open) => !open && setViewSubject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Subject details</DialogTitle>
          </DialogHeader>
          {viewSubject && (
            <dl className="grid gap-4 sm:grid-cols-2">
              <SummaryDetail label="Subject code" value={viewSubject.code} />
              <SummaryDetail label="Subject name" value={viewSubject.name} />
              <SummaryDetail label="Branch" value={`${viewSubject.branchName} (${viewSubject.branchCode})`} />
              <SummaryDetail label="Academic year" value={viewSubject.academicYear} />
              <SummaryDetail label="Semester" value={String(viewSubject.semester)} />
              <SummaryDetail label="Subject type" value={viewSubject.subjectType} />
              <SummaryDetail label="Credits" value={viewSubject.credits == null ? 'Not configured' : String(viewSubject.credits)} />
              <SummaryDetail label="Selection requirement" value={viewSubject.compulsory ? 'Compulsory' : 'Elective'} />
              <SummaryDetail label="Status" value={viewSubject.active ? 'Active' : 'Inactive'} />
            </dl>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setViewSubject(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingAction !== null} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.kind === 'assignment'
                ? 'Deactivate branch staff assignment?'
                : pendingAction?.active
                  ? 'Activate this record?'
                  : 'Deactivate this record?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.kind === 'assignment'
                ? 'This will deactivate the assignment without deleting its history.'
                : pendingAction?.kind === 'branch'
                  ? 'The branch will remain in the system; deactivation prevents it from being used for new selections.'
                  : 'The subject record will be retained, but its active status will change.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyAction !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busyAction !== null}
              onClick={(event) => {
                event.preventDefault();
                void runPendingAction();
              }}
            >
              {busyAction ? 'Saving...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const SummaryDetail: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
    <dd className="mt-1 break-words text-xs font-medium">{value}</dd>
  </div>
);

export default SemesterRegistrationManagementPage;
