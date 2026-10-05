export type BonafideStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_DSW'
  | 'DSW_APPROVED'
  | 'DSW_REJECTED'
  | 'PENDING_PRINCIPAL'
  | 'PRINCIPAL_APPROVED'
  | 'PRINCIPAL_REJECTED'
  | 'CERTIFICATE_GENERATED';

export interface BonafideApplicationRequestDto {
  phoneNumber: string;
  hostelName?: string;
  roomNumber?: string;
  reason: string;
  parentName: string;
  hostelAdmissionDate?: string; // YYYY-MM-DD
  collegeAdmissionDate: string; // YYYY-MM-DD
  academicYear: string;
}

export interface BonafideApplicationResponseDto {
  id: number;
  studentId?: number;
  studentName?: string;
  studentEmail?: string;
  rollNumber?: string;
  department?: string;
  semester?: number;
  phoneNumber: string;
  hostelName?: string;
  roomNumber?: string;
  reason: string;
  parentName: string;
  hostelAdmissionDate?: string;
  collegeAdmissionDate: string;
  academicYear: string;
  status: BonafideStatus | string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BonafideStatusResponseDto {
  applicationId: number;
  status: BonafideStatus | string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RejectBonafideRequestDto {
  reason: string;
}

export interface ApprovalHistoryItem {
  id?: number;
  action: string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  remarks?: string;
}
