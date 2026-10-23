export type SemesterRegistrationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REVISION_REQUIRED'
  | 'APPROVED'
  | 'DEPARTMENT_DRAFTED';

export type RegistrationDocumentType =
  | 'COLLEGE_FEE_RECEIPT'
  | 'HOSTEL_FEE_RECEIPT'
  | 'MESS_FEE_RECEIPT'
  | 'OTHER';

export type AcademicSubjectType = 'THEORY' | 'PRACTICAL' | 'LAB' | 'ELECTIVE';

export interface AcademicBranch {
  id: number;
  code: string;
  name: string;
  degreeLevel: 'BTECH' | 'MTECH';
  active: boolean;
}

export interface CreateBranchRequest {
  code: string;
  name: string;
  degreeLevel: AcademicBranch['degreeLevel'];
}

export interface AcademicSubject {
  id: number;
  branchId: number;
  branchCode: string;
  branchName: string;
  academicYear: string;
  semester: number;
  code: string;
  name: string;
  subjectType: AcademicSubjectType;
  credits: number | null;
  compulsory: boolean;
  active: boolean;
}

export interface CreateAcademicSubjectRequest {
  branchId: number;
  academicYear: string;
  semester: number;
  code: string;
  name: string;
  subjectType: AcademicSubjectType;
  credits: number | null;
  compulsory: boolean;
}

export interface BranchStaffAssignment {
  assignmentId: number;
  branchId: number;
  branchCode: string;
  branchName: string;
  userId: number;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface RegistrationDocument {
  id: number;
  documentType: RegistrationDocumentType;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  uploadedAt: string;
}

export interface RegistrationFees {
  collegeFeeDue: number | null;
  collegeFeePaid: number | null;
  collegeAdvance: number | null;
  hostelFeeDue: number | null;
  hostelFeePaid: number | null;
  hostelAdvance: number | null;
  messFeeDue: number | null;
  messFeePaid: number | null;
  messAdvance: number | null;
}

export interface SemesterRegistration extends RegistrationFees {
  id: number;
  applicationNumber: string;
  studentId: number;
  studentName: string | null;
  studentEmail: string;
  rollNumber: string | null;
  branchId: number;
  branchCode: string;
  branchName: string;
  academicYear: string;
  semester: number;
  section: string;
  hostelName: string | null;
  hostelRoom: string | null;
  status: SemesterRegistrationStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  selectedSubjects: AcademicSubject[];
  documents: RegistrationDocument[];
}

export interface SemesterRegistrationDetails {
  branchId: number;
  academicYear: string;
  semester: number;
  section: string;
  hostelName: string | null;
  hostelRoom: string | null;
}

export interface RegistrationFeeRequest {
  collegeFeeDue: number;
  collegeFeePaid: number;
  collegeAdvance: number;
  hostelFeeDue: number;
  hostelFeePaid: number;
  hostelAdvance: number;
  messFeeDue: number;
  messFeePaid: number;
  messAdvance: number;
}
