import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import {
  ArrowUpDown,
  BadgeCheck,
  ClipboardList,
  Clock3,
  Eye,
  ExternalLink,
  FilePenLine,
  FileText,
  Plus,
  RotateCcw,
  Search,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { semesterRegistrationApi } from '@/api/semesterRegistrationApi';
import type {
  AcademicBranch,
  AcademicSubject,
  RegistrationDocument,
  RegistrationDocumentType,
  RegistrationFeeRequest,
  SemesterRegistration,
} from '@/types/semesterRegistration';
import { FileUpload } from '@/components/common/FileUpload';
import { RegistrationStatusBadge } from '@/pages/semester-registration/RegistrationStatusBadge';
import { RegistrationPageHeader } from '@/pages/semester-registration/RegistrationPageHeader';
import { RegistrationStatCard } from '@/pages/semester-registration/RegistrationStatCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Stage = 'details' | 'subjects' | 'fees' | 'documents' | 'review';
type FeeForm = Record<keyof RegistrationFeeRequest, string>;
type SubjectSort = 'code' | 'name' | 'credits';
const wizardStages: { id: Stage; label: string }[] = [
  { id: 'details', label: 'Student details' },
  { id: 'subjects', label: 'Subjects' },
  { id: 'fees', label: 'Fees' },
  { id: 'documents', label: 'Documents' },
  { id: 'review', label: 'Review' },
];

const feeFields: {
  key: keyof RegistrationFeeRequest;
  label: string;
}[] = [
  { key: 'collegeFeeDue', label: 'College fee due' },
  { key: 'collegeFeePaid', label: 'College fee paid' },
  { key: 'collegeAdvance', label: 'College advance' },
  { key: 'hostelFeeDue', label: 'Hostel fee due' },
  { key: 'hostelFeePaid', label: 'Hostel fee paid' },
  { key: 'hostelAdvance', label: 'Hostel advance' },
  { key: 'messFeeDue', label: 'Mess fee due' },
  { key: 'messFeePaid', label: 'Mess fee paid' },
  { key: 'messAdvance', label: 'Mess advance' },
];

const feeSections: {
  title: string;
  fields: (typeof feeFields)[number][];
}[] = [
  {
    title: 'College fees',
    fields: feeFields.filter(({ key }) => key.startsWith('college')),
  },
  {
    title: 'Hostel fees',
    fields: feeFields.filter(({ key }) => key.startsWith('hostel')),
  },
  {
    title: 'Mess fees',
    fields: feeFields.filter(({ key }) => key.startsWith('mess')),
  },
];

const receiptTypes: {
  type: RegistrationDocumentType;
  label: string;
  paidKey: keyof RegistrationFeeRequest;
  advanceKey: keyof RegistrationFeeRequest;
}[] = [
  {
    type: 'COLLEGE_FEE_RECEIPT',
    label: 'College fee receipt',
    paidKey: 'collegeFeePaid',
    advanceKey: 'collegeAdvance',
  },
  {
    type: 'HOSTEL_FEE_RECEIPT',
    label: 'Hostel fee receipt',
    paidKey: 'hostelFeePaid',
    advanceKey: 'hostelAdvance',
  },
  {
    type: 'MESS_FEE_RECEIPT',
    label: 'Mess fee receipt',
    paidKey: 'messFeePaid',
    advanceKey: 'messAdvance',
  },
];

const emptyFees = (): FeeForm => ({
  collegeFeeDue: '',
  collegeFeePaid: '',
  collegeAdvance: '',
  hostelFeeDue: '',
  hostelFeePaid: '',
  hostelAdvance: '',
  messFeeDue: '',
  messFeePaid: '',
  messAdvance: '',
});

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    if (import.meta.env.DEV) {
      console.error('Semester registration request failed', {
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
  return error instanceof Error
    ? error.message
    : 'The request failed. Please try again.';
};

const feeValuesFrom = (
  registration: SemesterRegistration | null,
): FeeForm => {
  const values = emptyFees();
  if (!registration) return values;
  for (const { key } of feeFields) {
    const amount = registration[key];
    values[key] = amount == null ? '' : String(amount);
  }
  return values;
};

const formatMoney = (value: number | null): string =>
  value == null
    ? 'Not entered'
    : new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
      }).format(value);

const SemesterRegistrationPage: React.FC = () => {
  const { user } = useAuth();
  const [branches, setBranches] = useState<AcademicBranch[]>([]);
  const [registrations, setRegistrations] = useState<SemesterRegistration[]>([]);
  const [viewRegistration, setViewRegistration] = useState<SemesterRegistration | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [registration, setRegistration] = useState<SemesterRegistration | null>(null);
  const [subjects, setSubjects] = useState<AcademicSubject[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [documents, setDocuments] = useState<RegistrationDocument[]>([]);
  const [fees, setFees] = useState<FeeForm>(emptyFees);
  const [branchId, setBranchId] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [semester, setSemester] = useState('');
  const [section, setSection] = useState('');
  const [hostelName, setHostelName] = useState('');
  const [hostelRoom, setHostelRoom] = useState('');
  const [stage, setStage] = useState<Stage>('details');
  const [showForm, setShowForm] = useState(false);
  const [confirmSubmitOpen, setConfirmSubmitOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [uploadingType, setUploadingType] =
    useState<RegistrationDocumentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] =
    useState<SemesterRegistration | null>(null);
  const [registrationSearch, setRegistrationSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [subjectTypeFilter, setSubjectTypeFilter] = useState('ALL');
  const [subjectSort, setSubjectSort] = useState<SubjectSort>('code');
  const [subjectSortDescending, setSubjectSortDescending] = useState(false);
  const [registrationSortDescending, setRegistrationSortDescending] = useState(true);
  const [registrationPage, setRegistrationPage] = useState(1);
  const submitInFlight = useRef(false);

  // Registration history drives this page, so do not make it wait for the
  // independent branch list request. Both requests still run concurrently.
  const refreshPageData = async () => {
    setLoading(true);
    setError(null);

    const branchesRequest = semesterRegistrationApi.getBranches()
      .then((branchData) => setBranches(branchData))
      .catch((requestError: unknown) => {
        setError((current) => current ?? getErrorMessage(requestError));
      });

    try {
      const registrationData = await semesterRegistrationApi.getMyRegistrations();
      setRegistrations(registrationData);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }

    // Do not block the history table on branch metadata.
    void branchesRequest;
  };

  useEffect(() => {
    let isActive = true;

    semesterRegistrationApi.getBranches()
      .then((branchData) => {
        if (isActive) setBranches(branchData);
      })
      .catch((requestError: unknown) => {
        if (isActive) setError((current) => current ?? getErrorMessage(requestError));
      });

    semesterRegistrationApi.getMyRegistrations()
      .then((registrationData) => {
        if (isActive) setRegistrations(registrationData);
      })
      .catch((requestError: unknown) => {
        if (isActive) setError(getErrorMessage(requestError));
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const resetDraftForm = () => {
    setRegistration(null);
    setSelectedSubjectIds([]);
    setSubjects([]);
    setDocuments([]);
    setFees(emptyFees());
    setBranchId('');
    setAcademicYear('');
    setSemester('');
    setSection('');
    setHostelName('');
    setHostelRoom('');
    setStage('details');
    setError(null);
  };

  const startNewRegistration = () => {
    const existingDraft = registrations.find(
      (item) => item.status === 'DRAFT' || item.status === 'REVISION_REQUIRED',
    );
    if (existingDraft) {
      void resumeRegistration(existingDraft);
      return;
    }
    resetDraftForm();
    setSubmissionResult(null);
    setShowForm(true);
  };

  const resumeRegistration = async (selected: SemesterRegistration) => {
    setBusy(true);
    setError(null);
    try {
      const current = await semesterRegistrationApi.getRegistration(selected.id);
      setRegistration(current);
      setBranchId(String(current.branchId));
      setAcademicYear(current.academicYear);
      setSemester(String(current.semester));
      setSection(current.section);
      setHostelName(current.hostelName ?? '');
      setHostelRoom(current.hostelRoom ?? '');
      setSelectedSubjectIds(current.selectedSubjects.map((subject) => subject.id));
      setDocuments(current.documents);
      setFees(feeValuesFrom(current));
      setSubjects([]);
      setStage('details');
      setShowForm(true);
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const saveDetails = async (advance = true) => {
    const parsedBranchId = Number(branchId);
    const parsedSemester = Number(semester);
    if (!Number.isInteger(parsedBranchId) || parsedBranchId <= 0) {
      setError('Select a valid branch.');
      return;
    }
    if (!/^\d{4}-\d{4}$/.test(academicYear.trim())) {
      setError('Enter the academic year in YYYY-YYYY format.');
      return;
    }
    if (!Number.isInteger(parsedSemester) || parsedSemester < 1 || parsedSemester > 10) {
      setError('Semester must be between 1 and 10.');
      return;
    }
    if (!section.trim()) {
      setError('Section is required.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const details = {
        branchId: parsedBranchId,
        academicYear: academicYear.trim(),
        semester: parsedSemester,
        section: section.trim(),
        hostelName: hostelName.trim() || null,
        hostelRoom: hostelRoom.trim() || null,
      };
      const saved = registration
        ? await semesterRegistrationApi.updateDetails(registration.id, details)
        : await semesterRegistrationApi.createDraft(details);
      setRegistration(saved);
      setBranchId(String(saved.branchId));
      setAcademicYear(saved.academicYear);
      setSemester(String(saved.semester));
      setSection(saved.section);
      setHostelName(saved.hostelName ?? '');
      setHostelRoom(saved.hostelRoom ?? '');
      setDocuments(saved.documents);
      setFees(feeValuesFrom(saved));
      setRegistrations((current) => [
        saved,
        ...current.filter((item) => item.id !== saved.id),
      ]);
      if (!advance) {
        toast.success('Draft saved', {
          description: `${saved.applicationNumber} remains a draft.`,
        });
        return;
      }
      const availableSubjects = await semesterRegistrationApi.getSubjects(
        saved.branchId,
        saved.academicYear,
        saved.semester,
      );
      setSubjects(availableSubjects);
      const eligibleSubjectIds = new Set(
        availableSubjects.map((subject) => subject.id),
      );
      const savedSubjectIds = saved.selectedSubjects
        .filter((subject) => eligibleSubjectIds.has(subject.id))
        .map((subject) => subject.id);
      const requiredSubjectIds = availableSubjects
        .filter((subject) => subject.compulsory)
        .map((subject) => subject.id);
      setSelectedSubjectIds([...new Set([...savedSubjectIds, ...requiredSubjectIds])]);
      setStage('subjects');
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const toggleSubject = (subjectId: number) => {
    if (subjects.some((subject) => subject.id === subjectId && subject.compulsory)) {
      return;
    }
    setSelectedSubjectIds((selected) =>
      selected.includes(subjectId)
        ? selected.filter((id) => id !== subjectId)
        : [...selected, subjectId],
    );
  };

  const saveSubjects = async (advance = true) => {
    if (!registration) return;
    const requiredIds = subjects
      .filter((subject) => subject.compulsory)
      .map((subject) => subject.id);
    const selectedIds = [...new Set([...selectedSubjectIds, ...requiredIds])];
    if (selectedIds.length === 0) {
      setError('Select at least one subject.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const saved = await semesterRegistrationApi.saveSubjects(
        registration.id,
        selectedIds,
      );
      setRegistration(saved);
      setSelectedSubjectIds(selectedIds);
      setRegistrations((current) => [
        saved,
        ...current.filter((item) => item.id !== saved.id),
      ]);
      if (advance) {
        setStage('fees');
      } else {
        toast.success('Draft saved', {
          description: `${saved.applicationNumber} remains a draft.`,
        });
      }
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const saveFees = async (advance = true) => {
    if (!registration) return;
    const values = feeFields.map(({ key }) => fees[key].trim());
    if (values.some((value) =>
      !/^\d{1,10}(?:\.\d{1,2})?$/.test(value) ||
      !Number.isFinite(Number(value)) ||
      Number(value) < 0,
    )) {
      setError('Enter non-negative amounts with up to 10 whole-number digits and 2 decimal places.');
      return;
    }

    const feeRequest: RegistrationFeeRequest = {
      collegeFeeDue: Number(fees.collegeFeeDue),
      collegeFeePaid: Number(fees.collegeFeePaid),
      collegeAdvance: Number(fees.collegeAdvance),
      hostelFeeDue: Number(fees.hostelFeeDue),
      hostelFeePaid: Number(fees.hostelFeePaid),
      hostelAdvance: Number(fees.hostelAdvance),
      messFeeDue: Number(fees.messFeeDue),
      messFeePaid: Number(fees.messFeePaid),
      messAdvance: Number(fees.messAdvance),
    };

    setBusy(true);
    setError(null);
    try {
      const saved = await semesterRegistrationApi.saveFees(
        registration.id,
        feeRequest,
      );
      setRegistration(saved);
      setFees(feeValuesFrom(saved));
      setRegistrations((current) => [
        saved,
        ...current.filter((item) => item.id !== saved.id),
      ]);
      if (advance) {
        setStage('documents');
      } else {
        toast.success('Draft saved', {
          description: `${saved.applicationNumber} remains a draft.`,
        });
      }
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusy(false);
    }
  };

  const uploadReceipt = async (
    documentType: RegistrationDocumentType,
    file: File,
  ) => {
    if (!registration) return;
    setUploadingType(documentType);
    setError(null);
    try {
      const savedDocument = await semesterRegistrationApi.uploadDocument(
        registration.id,
        documentType,
        file,
      );
      setDocuments((current) => [savedDocument, ...current]);
      setRegistration((current) =>
        current
          ? { ...current, documents: [savedDocument, ...current.documents] }
          : current,
      );
      toast.success(`${savedDocument.originalFileName} uploaded`);
    } catch (requestError: unknown) {
      const message = getErrorMessage(requestError);
      setError(message);
      toast.error('Receipt upload failed', { description: message });
    } finally {
      setUploadingType(null);
    }
  };

  const isReceiptRequired = (
    paidKey: keyof RegistrationFeeRequest,
    advanceKey: keyof RegistrationFeeRequest,
  ) =>
    Number(fees[paidKey] || 0) + Number(fees[advanceKey] || 0) > 0;

  const hasRequiredReceipts = receiptTypes.every(({ type, paidKey, advanceKey }) =>
    !isReceiptRequired(paidKey, advanceKey)
    || documents.some((document) => document.documentType === type),
  );

  const requiredSubjectIds = subjects
    .filter((subject) => subject.compulsory)
    .map((subject) => subject.id);
  const hasRequiredSubjects = requiredSubjectIds.every((id) =>
    selectedSubjectIds.includes(id),
  ) && selectedSubjectIds.length > 0;
  const hasValidFees = feeFields.every(({ key }) => {
    const amount = Number(fees[key]);
    return fees[key].trim() !== '' && Number.isFinite(amount) && amount >= 0;
  });
  const canSubmit =
    registration !== null &&
    hasRequiredSubjects &&
    hasValidFees &&
    hasRequiredReceipts;
  const subjectTypes = [...new Set(subjects.map((subject) => subject.subjectType))]
    .sort((left, right) => left.localeCompare(right));
  const visibleSubjects = subjects
    .filter((subject) => {
      const query = subjectSearch.trim().toLowerCase();
      const matchesSearch =
        !query ||
        subject.code.toLowerCase().includes(query) ||
        subject.name.toLowerCase().includes(query);
      const matchesType =
        subjectTypeFilter === 'ALL' || subject.subjectType === subjectTypeFilter;
      return matchesSearch && matchesType;
    })
    .sort((left, right) => {
      let comparison: number;
      if (subjectSort === 'code') {
        comparison = left.code.localeCompare(right.code);
      } else if (subjectSort === 'name') {
        comparison = left.name.localeCompare(right.name);
      } else {
        comparison = (left.credits ?? Number.POSITIVE_INFINITY) -
          (right.credits ?? Number.POSITIVE_INFINITY);
      }
      return subjectSortDescending ? -comparison : comparison;
    });
  const sortSubjectsBy = (key: SubjectSort) => {
    if (subjectSort === key) {
      setSubjectSortDescending((descending) => !descending);
    } else {
      setSubjectSort(key);
      setSubjectSortDescending(false);
    }
  };

  const counts = {
    total: registrations.length,
    draft: registrations.filter((item) => item.status === 'DRAFT').length,
    submitted: registrations.filter((item) =>
      item.status === 'SUBMITTED',
    ).length,
    underReview: registrations.filter((item) => item.status === 'UNDER_REVIEW').length,
    approved: registrations.filter((item) => item.status === 'APPROVED').length,
    revision: registrations.filter((item) => item.status === 'REVISION_REQUIRED').length,
  };
  const search = registrationSearch.trim().toLowerCase();
  const filteredRegistrations = registrations
    .filter((item) => {
      const matchesSearch =
        !search ||
        item.applicationNumber.toLowerCase().includes(search) ||
        item.academicYear.toLowerCase().includes(search) ||
        item.branchName.toLowerCase().includes(search) ||
        item.branchCode.toLowerCase().includes(search);
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((left, right) => {
      const leftUpdated = new Date(left.updatedAt || left.createdAt).getTime();
      const rightUpdated = new Date(right.updatedAt || right.createdAt).getTime();
      return registrationSortDescending
        ? rightUpdated - leftUpdated
        : leftUpdated - rightUpdated;
    });
  const registrationPageSize = 10;
  const registrationPageCount = Math.max(
    1,
    Math.ceil(filteredRegistrations.length / registrationPageSize),
  );
  const currentRegistrationPage = Math.min(registrationPage, registrationPageCount);
  const displayedRegistrations = filteredRegistrations.slice(
    (currentRegistrationPage - 1) * registrationPageSize,
    currentRegistrationPage * registrationPageSize,
  );
  const currentAcademicPeriod = registrations[0];

  const submitRegistration = async () => {
    if (!registration || submitInFlight.current) return;
    if (!hasRequiredSubjects) {
      setError('Select at least one subject and every compulsory subject.');
      setStage('subjects');
      return;
    }
    if (!hasValidFees) {
      setError('Enter a valid, non-negative amount for every fee field.');
      setStage('fees');
      return;
    }
    if (!hasRequiredReceipts) {
      setError('Upload a receipt for every fee category with a payment or advance.');
      setStage('documents');
      return;
    }
    submitInFlight.current = true;
    setBusy(true);
    setError(null);
    try {
      const submitted = await semesterRegistrationApi.submit(
        registration.id,
        selectedSubjectIds,
      );
      setRegistration(submitted);
      setConfirmSubmitOpen(false);
      setSubmissionResult(submitted);
      setRegistrations((current) => [
        submitted,
        ...current.filter((item) => item.id !== submitted.id),
      ]);
      setShowForm(false);
      toast.success('Semester registration submitted', {
        description: `${submitted.applicationNumber} is ${submitted.status}.`,
      });
    } catch (requestError: unknown) {
      const message = getErrorMessage(requestError);
      setError(message);
      toast.error('Submission failed', { description: message });
    } finally {
      submitInFlight.current = false;
      setBusy(false);
    }
  };

  const openRegistrationView = async (item: SemesterRegistration) => {
    setViewOpen(true);
    setViewLoading(true);
    setViewRegistration(item);
    try {
      const details = await semesterRegistrationApi.getRegistration(item.id);
      setViewRegistration(details);
    } catch (requestError: unknown) {
      const message = getErrorMessage(requestError);
      toast.error('Could not load registration details', { description: message });
      // Keep the history-row data visible if the details request fails.
    } finally {
      setViewLoading(false);
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setError(null);
  };

  const saveDraftAndClose = () => {
    setShowForm(false);
    setError(null);
    toast.success('Draft saved', {
      description: registration
        ? `${registration.applicationNumber} can be continued later.`
        : 'Your progress is saved.',
    });
  };

  const registrationDetails = (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="grid gap-2">
        <Label htmlFor="branch">Branch</Label>
        <Select value={branchId} onValueChange={setBranchId}>
          <SelectTrigger id="branch">
            <SelectValue placeholder="Select your branch" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={String(branch.id)}>
                {branch.name} ({branch.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="academic-year">Academic year</Label>
        <Input
          id="academic-year"
          value={academicYear}
          onChange={(event) => setAcademicYear(event.target.value)}
          placeholder="2026-2027"
          maxLength={9}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="semester">Semester</Label>
        <Input
          id="semester"
          type="number"
          min={1}
          max={10}
          value={semester}
          onChange={(event) => setSemester(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="section">Section</Label>
        <Input
          id="section"
          value={section}
          onChange={(event) => setSection(event.target.value)}
          placeholder="e.g. A"
          maxLength={20}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="hostel-name">Hostel name (if applicable)</Label>
        <Input
          id="hostel-name"
          value={hostelName}
          onChange={(event) => setHostelName(event.target.value)}
          maxLength={100}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="hostel-room">Hostel room (if applicable)</Label>
        <Input
          id="hostel-room"
          value={hostelRoom}
          onChange={(event) => setHostelRoom(event.target.value)}
          maxLength={30}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="w-full min-w-0 space-y-4" aria-busy="true">
        <RegistrationPageHeader
          title="Semester Registration"
          description="Your academic registration and application history."
          icon={ClipboardList}
        />
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-[92px] animate-pulse border border-border bg-muted/30" />
          ))}
        </div>
        <div className="space-y-2 border border-border p-3">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-8 animate-pulse bg-muted/40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 space-y-4 text-xs">
      <RegistrationPageHeader
        title="Semester Registration"
        description="Complete your academic details, select subjects, record fee details, and submit your registration for review."
        icon={ClipboardList}
        action={!showForm ? (
          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5"
            disabled={busy || branches.length === 0}
            title={branches.length === 0 ? 'No active branches are available from the server.' : undefined}
            onClick={startNewRegistration}
          >
            {registrations.some((item) => item.status === 'DRAFT' || item.status === 'REVISION_REQUIRED')
              ? <Eye aria-hidden="true" className="size-4" />
              : <Plus aria-hidden="true" className="size-4" />}
            {registrations.some((item) => item.status === 'DRAFT' || item.status === 'REVISION_REQUIRED')
              ? 'Continue draft'
              : 'New registration'}
          </Button>
        ) : undefined}
      />

      {!showForm && currentAcademicPeriod && (
        <div className="flex flex-wrap items-center gap-2 border border-border bg-card px-3 py-2 text-xs">
          <span className="font-medium text-foreground">Latest registration period</span>
          <span className="text-muted-foreground">
            {currentAcademicPeriod.academicYear} · Semester {currentAcademicPeriod.semester}
          </span>
          <span className="hidden text-muted-foreground sm:inline">|</span>
          <span className="text-muted-foreground">
            {currentAcademicPeriod.branchName} ({currentAcademicPeriod.branchCode})
          </span>
        </div>
      )}

      {error && (
        <div role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      {submissionResult && !showForm && (
        <div role="status" className="border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          <p className="font-semibold">Registration submitted successfully.</p>
          <p>
            Application {submissionResult.applicationNumber} — {submissionResult.status}
          </p>
        </div>
      )}

      {showForm && registration && (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Application {registration.applicationNumber}</span>
          <RegistrationStatusBadge status={registration.status} />
        </div>
      )}

      {showForm ? (
        <Card className="rounded-none border-border shadow-none">
          <CardHeader className="border-b border-border px-3 py-3">
            <CardTitle className="text-sm">
              {stage === 'details' && 'Academic and student details'}
              {stage === 'subjects' && 'Select subjects'}
              {stage === 'fees' && 'Fee details'}
              {stage === 'documents' && 'Upload fee receipts'}
              {stage === 'review' && 'Review and submit'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-3">
            <nav aria-label="Registration progress" className="overflow-x-auto">
              <ol className="flex min-w-[560px] items-center">
                {wizardStages.map((item, index) => {
                  const currentIndex = wizardStages.findIndex((step) => step.id === stage);
                  const complete = index < currentIndex;
                  const current = item.id === stage;
                  return (
                    <li
                      key={item.id}
                      className={`flex min-w-0 flex-1 items-center ${index < wizardStages.length - 1 ? 'after:mx-2 after:h-px after:flex-1 after:bg-border after:content-[""]' : ''}`}
                    >
                      <button
                        type="button"
                        disabled={!complete || busy}
                        aria-current={current ? 'step' : undefined}
                        onClick={() => setStage(item.id)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-none text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
                      >
                        <span
                          className={`flex size-6 items-center justify-center border text-[10px] font-semibold ${
                            current
                              ? 'border-primary bg-primary text-primary-foreground'
                              : complete
                                ? 'border-primary/40 bg-primary/10 text-primary'
                                : 'border-border bg-background text-muted-foreground'
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className={`text-xs ${current ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                          {item.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>

            {stage === 'details' && (
              <>
                <div className="grid gap-2 border border-border bg-muted/30 p-3 text-xs sm:grid-cols-2">
                  <p><span className="font-medium">Student:</span> {user?.name ?? 'Authenticated student'}</p>
                  <p><span className="font-medium">Email:</span> {user?.email ?? '—'}</p>
                  {registration?.rollNumber && (
                    <p><span className="font-medium">Roll number:</span> {registration.rollNumber}</p>
                  )}
                </div>
                {registrationDetails}
                <div className="flex flex-wrap justify-between gap-3">
                  <Button type="button" variant="outline" onClick={cancelForm}>
                    My registrations
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void saveDetails(false)}
                    >
                      Save Draft
                    </Button>
                    <Button type="button" disabled={busy} onClick={() => void saveDetails()}>
                      {busy ? 'Saving...' : registration ? 'Save and continue' : 'Create draft'}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {stage === 'subjects' && (
              <>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Compulsory subjects are marked. Every compulsory subject must be selected before submission.
                </p>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="subject-search">Search subjects</Label>
                      <div className="relative">
                        <Search aria-hidden="true" className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="subject-search"
                          className="w-64 pl-8"
                          placeholder="Search code or name"
                          value={subjectSearch}
                          onChange={(event) => setSubjectSearch(event.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="subject-type-filter">Subject type</Label>
                      <Select value={subjectTypeFilter} onValueChange={setSubjectTypeFilter}>
                        <SelectTrigger id="subject-type-filter" className="w-44">
                          <SelectValue placeholder="All types" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All types</SelectItem>
                          {subjectTypes.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={subjects.every((subject) => subject.compulsory)}
                      onClick={() => setSelectedSubjectIds((current) => [
                        ...new Set([
                          ...current,
                          ...subjects.filter((subject) => !subject.compulsory).map((subject) => subject.id),
                        ]),
                      ])}
                    >
                      Select all eligible
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={!selectedSubjectIds.some((id) => !requiredSubjectIds.includes(id))}
                      onClick={() => setSelectedSubjectIds(requiredSubjectIds)}
                    >
                      Clear optional
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border border-border bg-muted/30 px-3 py-2 text-xs">
                  <span>
                    {selectedSubjectIds.length} selected
                    {selectedSubjectIds.every((id) =>
                      subjects.find((subject) => subject.id === id)?.credits != null,
                    )
                      ? ` · ${subjects
                          .filter((subject) => selectedSubjectIds.includes(subject.id))
                          .reduce((total, subject) => total + (subject.credits ?? 0), 0)} credits`
                      : ''}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {requiredSubjectIds.length} compulsory subjects must remain selected
                  </span>
                </div>

                {subjects.length === 0 ? (
                  <p className="rounded-md border p-4 text-sm">
                    No active subjects are configured for this branch, academic year, and semester.
                  </p>
                ) : visibleSubjects.length === 0 ? (
                  <p className="rounded-md border p-4 text-sm text-muted-foreground">
                    No subjects match the current search and type filter.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">Select</TableHead>
                          <TableHead>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 hover:text-foreground"
                              onClick={() => {
                                sortSubjectsBy('code');
                              }}
                            >
                              Subject code <ArrowUpDown aria-hidden="true" className="size-3.5" />
                            </button>
                          </TableHead>
                          <TableHead>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 hover:text-foreground"
                              onClick={() => {
                                sortSubjectsBy('name');
                              }}
                            >
                              Subject name <ArrowUpDown aria-hidden="true" className="size-3.5" />
                            </button>
                          </TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 hover:text-foreground"
                              onClick={() => {
                                sortSubjectsBy('credits');
                              }}
                            >
                              Credits <ArrowUpDown aria-hidden="true" className="size-3.5" />
                            </button>
                          </TableHead>
                          <TableHead>Requirement</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleSubjects.map((subject) => {
                          const compulsory = Boolean(subject.compulsory);
                          return (
                            <TableRow key={subject.id}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  aria-label={`Select ${subject.code} ${subject.name}`}
                                  checked={selectedSubjectIds.includes(subject.id)}
                                  disabled={compulsory || busy}
                                  onChange={() => toggleSubject(subject.id)}
                                  className="size-4 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                              </TableCell>
                              <TableCell className="font-medium">{subject.code}</TableCell>
                              <TableCell>{subject.name}</TableCell>
                              <TableCell>{subject.subjectType}</TableCell>
                              <TableCell>{subject.credits ?? '—'}</TableCell>
                              <TableCell>
                                <span className={compulsory
                                  ? 'border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
                                  : 'border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground'}>
                                  {compulsory ? 'Compulsory' : 'Elective'}
                                </span>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <Button type="button" variant="outline" onClick={() => setStage('details')}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void saveSubjects(false)}
                    >
                      Save Draft
                    </Button>
                    <Button
                      type="button"
                      disabled={busy || subjects.length === 0}
                      onClick={() => void saveSubjects()}
                    >
                      {busy ? 'Saving...' : 'Save subjects and continue'}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {stage === 'fees' && (
              <>
                <p className="text-sm text-muted-foreground">
                  Enter the amounts from your fee records. The portal does not calculate or prescribe fee amounts.
                </p>
                <div className="grid gap-4 lg:grid-cols-3">
                  {feeSections.map((section) => (
                    <section key={section.title} className="rounded-none border border-border p-3">
                      <h3 className="mb-4 text-sm font-semibold">{section.title}</h3>
                      <div className="grid gap-4">
                        {section.fields.map(({ key, label }) => (
                          <div className="grid gap-2" key={key}>
                            <Label htmlFor={key}>{label}</Label>
                            <Input
                              id={key}
                              type="number"
                              min={0}
                              step="0.01"
                              inputMode="decimal"
                              value={fees[key]}
                              onChange={(event) =>
                                setFees((current) => ({
                                  ...current,
                                  [key]: event.target.value,
                                }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
                <div className="flex justify-between gap-3">
                  <Button type="button" variant="outline" onClick={() => setStage('subjects')}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={() => void saveFees(false)}
                    >
                      Save Draft
                    </Button>
                    <Button type="button" disabled={busy} onClick={() => void saveFees()}>
                      {busy ? 'Saving...' : 'Save fees and continue'}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {stage === 'documents' && (
              <>
                <p className="text-sm text-muted-foreground">
                  Upload PDF, JPEG, or PNG receipts (maximum 1 MB each). A receipt is required for each fee category with a payment or advance.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {receiptTypes.map(({ type, label, paidKey, advanceKey }) => {
                    const required = isReceiptRequired(paidKey, advanceKey);
                    const uploaded = documents.filter(
                      (document) => document.documentType === type,
                    );
                    return (
                      <div className="space-y-2" key={type}>
                        <FileUpload
                          key={`${type}-${uploaded.length}`}
                          accept=".pdf,image/jpeg,image/png"
                          maxSizeMb={1}
                          label={`${label}${required ? ' (required)' : ' (optional)'}`}
                          description="PDF, JPEG, or PNG, max 1 MB"
                          success={uploaded.length > 0}
                          onFileSelect={(file) => {
                            void uploadReceipt(type, file);
                          }}
                          isUploading={uploadingType === type}
                          error={uploadingType === type ? null : undefined}
                        />
                        {uploaded.map((document) => (
                          <p className="text-xs text-muted-foreground" key={document.id}>
                            Uploaded: {document.originalFileName}
                          </p>
                        ))}
                      </div>
                    );
                  })}
                  <div className="space-y-2">
                    <FileUpload
                      key={`OTHER-${documents.filter((document) => document.documentType === 'OTHER').length}`}
                      accept=".pdf,image/jpeg,image/png"
                      maxSizeMb={1}
                      label="Other supporting document (optional)"
                      description="PDF, JPEG, or PNG, max 1 MB"
                      success={documents.some((document) => document.documentType === 'OTHER')}
                      onFileSelect={(file) => {
                        void uploadReceipt('OTHER', file);
                      }}
                      isUploading={uploadingType === 'OTHER'}
                    />
                    {documents
                      .filter((document) => document.documentType === 'OTHER')
                      .map((document) => (
                        <p className="text-xs text-muted-foreground" key={document.id}>
                          Uploaded: {document.originalFileName}
                        </p>
                      ))}
                  </div>
                </div>
                <div className="flex justify-between gap-3">
                  <Button type="button" variant="outline" onClick={() => setStage('fees')}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy || uploadingType !== null}
                      onClick={saveDraftAndClose}
                    >
                      Save Draft
                    </Button>
                    <Button
                      type="button"
                      disabled={busy || uploadingType !== null || !hasRequiredReceipts}
                      onClick={() => setStage('review')}
                    >
                      Review registration
                    </Button>
                  </div>
                </div>
              </>
            )}

            {stage === 'review' && registration && (
              <>
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Student and academic details</h2>
                    <Button type="button" variant="outline" size="sm" onClick={() => setStage('details')}>
                      Edit
                    </Button>
                  </div>
                  <div className="grid gap-2 border border-border p-3 text-xs sm:grid-cols-2">
                    <p><span className="font-medium">Student:</span> {registration.studentName ?? '—'}</p>
                    <p><span className="font-medium">Roll number:</span> {registration.rollNumber ?? '—'}</p>
                    <p><span className="font-medium">Email:</span> {registration.studentEmail}</p>
                    <p><span className="font-medium">Branch:</span> {registration.branchName} ({registration.branchCode})</p>
                    <p><span className="font-medium">Academic year:</span> {registration.academicYear}</p>
                    <p><span className="font-medium">Semester / section:</span> {registration.semester} / {registration.section}</p>
                    <p><span className="font-medium">Hostel:</span> {registration.hostelName ?? 'Not applicable'}{registration.hostelRoom ? `, room ${registration.hostelRoom}` : ''}</p>
                  </div>
                </section>

                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Selected subjects</h2>
                    <Button type="button" variant="outline" size="sm" onClick={() => setStage('subjects')}>
                      Edit
                    </Button>
                  </div>
                  <ul className="list-inside list-disc border border-border p-3 text-xs">
                    {subjects
                      .filter((subject) => selectedSubjectIds.includes(subject.id))
                      .map((subject) => (
                        <li key={subject.id}>
                          {subject.code} — {subject.name}
                          {subject.credits == null ? '' : ` · ${subject.credits} credits`}
                        </li>
                      ))}
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    Total selected credits:{' '}
                    {subjects
                      .filter((subject) => selectedSubjectIds.includes(subject.id))
                      .every((subject) => subject.credits != null)
                      ? subjects
                          .filter((subject) => selectedSubjectIds.includes(subject.id))
                          .reduce((total, subject) => total + (subject.credits ?? 0), 0)
                      : 'Unavailable'}
                  </p>
                </section>

                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Fee details</h2>
                    <Button type="button" variant="outline" size="sm" onClick={() => setStage('fees')}>
                      Edit
                    </Button>
                  </div>
                  <div className="grid gap-2 border border-border p-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
                    {feeFields.map(({ key, label }) => (
                      <p key={key}>
                        <span className="font-medium">{label}:</span>{' '}
                        {formatMoney(registration[key])}
                      </p>
                    ))}
                  </div>
                </section>

                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Uploaded documents</h2>
                    <Button type="button" variant="outline" size="sm" onClick={() => setStage('documents')}>
                      Edit
                    </Button>
                  </div>
                  {documents.length === 0 ? (
                    <p className="border border-border p-3 text-xs text-muted-foreground">
                      No documents uploaded.
                    </p>
                  ) : (
                    <ul className="space-y-2 border border-border p-3 text-xs">
                      {documents.map((document) => (
                        <li key={document.id}>
                          {document.originalFileName} — {document.documentType} — {document.contentType} — {(document.fileSizeBytes / 1024).toFixed(1)} KB
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <div className="flex justify-between gap-3">
                  <Button type="button" variant="outline" onClick={() => setStage('documents')}>
                    Back
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={saveDraftAndClose}
                    >
                      Save Draft
                    </Button>
                    <Button
                      type="button"
                      disabled={busy || !canSubmit}
                      onClick={() => setConfirmSubmitOpen(true)}
                    >
                      Submit registration
                    </Button>
                  </div>
                </div>
                {!canSubmit && (
                  <p className="text-xs text-muted-foreground" role="status">
                    Complete required subject selections, all fee fields, and any required receipts before submitting.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <section aria-label="Registration summary" className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { label: 'Total registrations', value: counts.total, description: 'All applications', icon: ClipboardList },
              { label: 'Drafts', value: counts.draft, description: 'Ready to continue', icon: FilePenLine },
              { label: 'Submitted', value: counts.submitted, description: 'Awaiting processing', icon: Send },
              { label: 'Under review', value: counts.underReview, description: 'Currently in review', icon: Clock3 },
              { label: 'Approved', value: counts.approved, description: 'Completed registrations', icon: BadgeCheck },
              { label: 'Revision required', value: counts.revision, description: 'Changes requested', icon: RotateCcw },
            ].map((summary) => (
              <RegistrationStatCard key={summary.label} {...summary} />
            ))}
          </section>

          <Card className="rounded-none border-border shadow-none">
            <CardHeader className="gap-3 border-b border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-sm">Registration history</CardTitle>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Applications returned by the authenticated student registration API.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={loading || busy}
                onClick={() => void refreshPageData()}
              >
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 p-3">
              {error && !showForm && (
                <div role="alert" className="border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                  {error}
                </div>
              )}
              <div className="flex flex-col gap-2 md:flex-row md:items-end">
                <div className="grid flex-1 gap-1.5">
                  <Label htmlFor="registration-search">Search registrations</Label>
                  <div className="relative">
                    <Search aria-hidden="true" className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="registration-search"
                      className="pl-8"
                      placeholder="Application number, academic year, or branch"
                      value={registrationSearch}
                      onChange={(event) => {
                        setRegistrationSearch(event.target.value);
                        setRegistrationPage(1);
                      }}
                    />
                  </div>
                </div>
                <div className="grid gap-1.5 md:w-52">
                  <Label htmlFor="registration-status-filter">Status</Label>
                  <Select
                    value={statusFilter}
                    onValueChange={(value) => {
                      setStatusFilter(value);
                      setRegistrationPage(1);
                    }}
                  >
                    <SelectTrigger id="registration-status-filter">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All statuses</SelectItem>
                      {[
                        'DRAFT',
                        'SUBMITTED',
                        'UNDER_REVIEW',
                        'REVISION_REQUIRED',
                        'APPROVED',
                        'DEPARTMENT_DRAFTED',
                      ].map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replaceAll('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(registrationSearch || statusFilter !== 'ALL') && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setRegistrationSearch('');
                      setStatusFilter('ALL');
                      setRegistrationPage(1);
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>

              {registrations.length === 0 ? (
                <div className="border border-dashed border-border px-4 py-8 text-center">
                  <FileText aria-hidden="true" className="mx-auto mb-2 h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">No semester registrations yet</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Start a registration to create a draft using your authenticated account.
                  </p>
                </div>
              ) : filteredRegistrations.length === 0 ? (
                <div className="border border-dashed border-border px-4 py-7 text-center">
                  <p className="text-sm font-medium">No registrations match these filters</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Clear the search or choose a different status.
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Application number</TableHead>
                          <TableHead>Academic period</TableHead>
                          <TableHead>Branch / section</TableHead>
                          <TableHead>Submission date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1.5 hover:text-foreground"
                              onClick={() => setRegistrationSortDescending((value) => !value)}
                            >
                              Last updated <ArrowUpDown aria-hidden="true" className="size-3.5" />
                            </button>
                          </TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {displayedRegistrations.map((item) => {
                          const editable =
                            item.status === 'DRAFT' || item.status === 'REVISION_REQUIRED';
                          return (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.applicationNumber}</TableCell>
                              <TableCell>
                                {item.academicYear} · Semester {item.semester}
                              </TableCell>
                              <TableCell>
                                {item.branchName} · {item.section}
                              </TableCell>
                              <TableCell>
                                {item.submittedAt
                                  ? new Date(item.submittedAt).toLocaleDateString('en-IN')
                                  : '—'}
                              </TableCell>
                              <TableCell>
                                <RegistrationStatusBadge status={item.status} />
                              </TableCell>
                              <TableCell>
                                {new Date(item.updatedAt || item.createdAt).toLocaleDateString('en-IN')}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void openRegistrationView(item)}
                                  >
                                    <Eye aria-hidden="true" className="mr-1.5 size-3.5" />
                                    View
                                  </Button>
                                  {editable && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={busy}
                                      onClick={() => void resumeRegistration(item)}
                                    >
                                      Continue draft
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <p className="text-muted-foreground">
                      Showing {(currentRegistrationPage - 1) * registrationPageSize + 1}–
                      {Math.min(currentRegistrationPage * registrationPageSize, filteredRegistrations.length)} of{' '}
                      {filteredRegistrations.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={currentRegistrationPage <= 1}
                        onClick={() => setRegistrationPage((page) => Math.max(1, page - 1))}
                      >
                        Previous
                      </Button>
                      <span className="min-w-20 text-center text-xs text-muted-foreground">
                        Page {currentRegistrationPage} of {registrationPageCount}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={currentRegistrationPage >= registrationPageCount}
                        onClick={() => setRegistrationPage((page) => Math.min(registrationPageCount, page + 1))}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Sheet
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) {
            setViewRegistration(null);
            setViewLoading(false);
          }
        }}
      >
        <SheetContent
          side="right"
          className="flex h-[100dvh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg md:max-w-xl"
        >
          <SheetHeader className="shrink-0 border-b border-border px-4 py-3 pr-12 text-left sm:px-5">
            <div className="flex flex-wrap items-center gap-2">
              <SheetTitle className="text-sm font-semibold">
                Registration details
              </SheetTitle>
              {viewRegistration && (
                <RegistrationStatusBadge status={viewRegistration.status} />
              )}
            </div>
            <SheetDescription className="text-[11px] leading-relaxed">
              {viewRegistration?.applicationNumber ?? 'Loading application information'}
              {viewRegistration
                ? ` · ${viewRegistration.academicYear} · Semester ${viewRegistration.semester}`
                : ''}
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] text-[11px] sm:px-5">
            {viewLoading && (
              <div className="space-y-2" aria-live="polite" aria-busy="true">
                <div className="h-16 animate-pulse border border-border bg-muted/40" />
                <div className="h-24 animate-pulse border border-border bg-muted/40" />
                <div className="h-24 animate-pulse border border-border bg-muted/40" />
                <p className="text-[11px] text-muted-foreground">Loading full registration details…</p>
              </div>
            )}

            {viewLoading && viewRegistration && (
              <p className="mb-3 border border-border bg-muted/30 px-3 py-2 text-[10px] text-muted-foreground" role="status">
                Loading the latest full details… Summary information is already shown below.
              </p>
            )}

            {viewRegistration && (
              <div className="space-y-4">
                <section className="space-y-2">
                  <h3 className="text-xs font-semibold">Application</h3>
                  <div className="grid grid-cols-1 gap-2 border border-border p-3 sm:grid-cols-2">
                    <p><span className="text-muted-foreground">Application number</span><br /><span className="break-words font-medium">{viewRegistration.applicationNumber}</span></p>
                    <p><span className="text-muted-foreground">Status</span><br /><RegistrationStatusBadge status={viewRegistration.status} /></p>
                    <p><span className="text-muted-foreground">Created</span><br />{viewRegistration.createdAt ? new Date(viewRegistration.createdAt).toLocaleString('en-IN') : '—'}</p>
                    <p><span className="text-muted-foreground">Last updated</span><br />{viewRegistration.updatedAt ? new Date(viewRegistration.updatedAt).toLocaleString('en-IN') : '—'}</p>
                    <p><span className="text-muted-foreground">Submitted</span><br />{viewRegistration.submittedAt ? new Date(viewRegistration.submittedAt).toLocaleString('en-IN') : 'Not submitted'}</p>
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold">Student and academic details</h3>
                  <div className="grid grid-cols-1 gap-2 border border-border p-3 sm:grid-cols-2">
                    <p><span className="text-muted-foreground">Student name</span><br />{viewRegistration.studentName ?? user?.name ?? '—'}</p>
                    <p><span className="text-muted-foreground">Roll number</span><br />{viewRegistration.rollNumber ?? '—'}</p>
                    <p><span className="text-muted-foreground">Email</span><br /><span className="break-all">{viewRegistration.studentEmail || user?.email || '—'}</span></p>
                    <p><span className="text-muted-foreground">Branch</span><br />{viewRegistration.branchName} ({viewRegistration.branchCode})</p>
                    <p><span className="text-muted-foreground">Academic year</span><br />{viewRegistration.academicYear}</p>
                    <p><span className="text-muted-foreground">Semester / section</span><br />{viewRegistration.semester} / {viewRegistration.section}</p>
                    <p><span className="text-muted-foreground">Hostel</span><br />{viewRegistration.hostelName ?? 'Not applicable'}</p>
                    <p><span className="text-muted-foreground">Hostel room</span><br />{viewRegistration.hostelRoom ?? '—'}</p>
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold">Selected subjects</h3>
                  {viewRegistration.selectedSubjects.length === 0 ? (
                    <p className="border border-border p-3 text-muted-foreground">No subjects recorded.</p>
                  ) : (
                    <div className="overflow-x-auto border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="h-8 px-2 text-[10px]">Code</TableHead>
                            <TableHead className="h-8 px-2 text-[10px]">Subject</TableHead>
                            <TableHead className="h-8 px-2 text-[10px]">Type</TableHead>
                            <TableHead className="h-8 px-2 text-[10px]">Credits</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {viewRegistration.selectedSubjects.map((subject) => (
                            <TableRow key={subject.id}>
                              <TableCell className="px-2 py-2 text-[10px] font-medium">{subject.code}</TableCell>
                              <TableCell className="min-w-32 px-2 py-2 text-[10px]">{subject.name}</TableCell>
                              <TableCell className="px-2 py-2 text-[10px]">{subject.subjectType}</TableCell>
                              <TableCell className="px-2 py-2 text-[10px]">{subject.credits ?? '—'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold">Fee details</h3>
                  <div className="grid grid-cols-1 gap-2 border border-border p-3 sm:grid-cols-2">
                    {feeFields.map(({ key, label }) => (
                      <p key={key} className="flex flex-col gap-0.5">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium tabular-nums">{formatMoney(viewRegistration[key])}</span>
                      </p>
                    ))}
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold">Uploaded documents</h3>
                  {viewRegistration.documents.length === 0 ? (
                    <p className="border border-border p-3 text-muted-foreground">No documents uploaded.</p>
                  ) : (
                    <ul className="space-y-2 border border-border p-3">
                      {viewRegistration.documents.map((document) => (
                        <li
                          key={document.id}
                          className="flex min-w-0 flex-col gap-2 border-b border-border pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0 flex-1 space-y-1">
                            <span className="block break-words font-medium">{document.originalFileName}</span>
                            <span className="block break-words text-[10px] text-muted-foreground">
                              {document.documentType} · {document.contentType} · {(document.fileSizeBytes / 1024).toFixed(1)} KB
                            </span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 w-full shrink-0 gap-1.5 text-[11px] sm:w-auto"
                            onClick={() => {
                              // The backend preview endpoint must return the file inline
                              // with its correct Content-Type (PDF or image).
                              const previewUrl = `/api/semester-registration/${viewRegistration.id}/documents/${document.id}/preview`;
                              window.open(previewUrl, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            <ExternalLink aria-hidden="true" className="size-3.5" />
                            Preview
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}

            {!viewLoading && !viewRegistration && (
              <p className="border border-dashed border-border p-4 text-center text-muted-foreground">
                Registration details are unavailable.
              </p>
            )}
          </div>

          <div className="shrink-0 border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-5">
            <Button
              type="button"
              variant="outline"
              className="h-9 w-full text-xs"
              onClick={() => setViewOpen(false)}
            >
              Close details
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={confirmSubmitOpen} onOpenChange={setConfirmSubmitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit semester registration?</AlertDialogTitle>
            <AlertDialogDescription>
              You are submitting {registration?.applicationNumber ?? 'this registration'} for review.
              The server will validate the selected subjects, fee details, and required receipts.
              You may not be able to edit it after submission unless a reviewer requests a revision.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Back to edit</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(event) => {
                event.preventDefault();
                void submitRegistration();
              }}
            >
              {busy ? 'Submitting...' : 'Confirm submission'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SemesterRegistrationPage;
