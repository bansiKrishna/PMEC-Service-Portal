import { apiClient } from './axios';
import type {
  AcademicBranch,
  AcademicSubject,
  BranchStaffAssignment,
  CreateAcademicSubjectRequest,
  CreateBranchRequest,
  RegistrationDocument,
  RegistrationDocumentType,
  RegistrationFeeRequest,
  RegistrationReview,
  RegistrationReviewListItem,
  SemesterRegistration,
  SemesterRegistrationDetails,
} from '../types/semesterRegistration';
import type { ReviewTab, ReviewSummary } from '../types/review';

const BASE_PATH = '/api/semester-registration';

export const semesterRegistrationApi = {
  getReviewList: async (status: ReviewTab): Promise<RegistrationReviewListItem[]> => {
    const response = await apiClient.get<RegistrationReviewListItem[]>(
      `${BASE_PATH}/reviews`,
      { params: { status } },
    );
    return response.data;
  },

  getReviewSummary: async (): Promise<ReviewSummary> => {
    const response = await apiClient.get<ReviewSummary>(
      `${BASE_PATH}/reviews/summary`,
    );
    return response.data;
  },

  getPendingReviews: async (): Promise<SemesterRegistration[]> => {
    const response = await apiClient.get<SemesterRegistration[]>(
      `${BASE_PATH}/reviews/pending`,
    );
    return response.data;
  },

  getReviewHistory: async (): Promise<SemesterRegistration[]> => {
    const response = await apiClient.get<SemesterRegistration[]>(
      `${BASE_PATH}/reviews/history`,
    );
    return response.data;
  },

  submitReview: async (
    registrationId: number,
    decision: 'APPROVED' | 'REJECTED' | 'REVISION_REQUESTED',
    comments?: string,
  ): Promise<void> => {
    await apiClient.post(
      `${BASE_PATH}/applications/${registrationId}/review`,
      { decision, comments },
    );
  },

  getDocumentContent: async (
    registrationId: number,
    documentId: number,
  ): Promise<Blob> => {
    const response = await apiClient.get<Blob>(
      `${BASE_PATH}/applications/${registrationId}/documents/${documentId}/content`,
      { responseType: 'blob' },
    );
    return response.data;
  },

  getBranches: async (): Promise<AcademicBranch[]> => {
    const response = await apiClient.get<AcademicBranch[]>(
      `${BASE_PATH}/branches`,
    );
    return response.data;
  },

  getAllBranches: async (): Promise<AcademicBranch[]> => {
    const response = await apiClient.get<AcademicBranch[]>(
      `${BASE_PATH}/branches/all`,
    );
    return response.data;
  },

  createBranch: async (request: CreateBranchRequest): Promise<AcademicBranch> => {
    const response = await apiClient.post<AcademicBranch>(
      `${BASE_PATH}/branches`,
      request,
    );
    return response.data;
  },

  setBranchActive: async (
    branchId: number,
    active: boolean,
  ): Promise<AcademicBranch> => {
    const response = await apiClient.patch<AcademicBranch>(
      `${BASE_PATH}/branches/${branchId}/active`,
      { active },
    );
    return response.data;
  },

  getMyRegistrations: async (): Promise<SemesterRegistration[]> => {
    const response = await apiClient.get<SemesterRegistration[]>(
      `${BASE_PATH}/students/me`,
    );
    return response.data;
  },

  getRegistration: async (registrationId: number): Promise<SemesterRegistration> => {
    const response = await apiClient.get<SemesterRegistration>(
      `${BASE_PATH}/applications/${registrationId}`,
    );
    return response.data;
  },

  getApplicationReviewHistory: async (
    registrationId: number,
  ): Promise<RegistrationReview[]> => {
    const response = await apiClient.get<RegistrationReview[]>(
      `${BASE_PATH}/applications/${registrationId}/review-history`,
    );
    return response.data;
  },

  createDraft: async (
    details: SemesterRegistrationDetails,
  ): Promise<SemesterRegistration> => {
    const response = await apiClient.post<SemesterRegistration>(
      `${BASE_PATH}/drafts`,
      details,
    );
    return response.data;
  },

  updateDetails: async (
    registrationId: number,
    details: SemesterRegistrationDetails,
  ): Promise<SemesterRegistration> => {
    const response = await apiClient.put<SemesterRegistration>(
      `${BASE_PATH}/applications/${registrationId}/details`,
      details,
    );
    return response.data;
  },

  getSubjects: async (
    branchId: number,
    academicYear: string,
    semester: number,
  ): Promise<AcademicSubject[]> => {
    const response = await apiClient.get<AcademicSubject[]>(
      `${BASE_PATH}/subjects`,
      { params: { branchId, academicYear, semester } },
    );
    return response.data;
  },

  getAllSubjects: async (
    branchId: number,
    academicYear: string,
    semester: number,
  ): Promise<AcademicSubject[]> => {
    const response = await apiClient.get<AcademicSubject[]>(
      `${BASE_PATH}/subjects/all`,
      { params: { branchId, academicYear, semester } },
    );
    return response.data;
  },

  createSubject: async (
    request: CreateAcademicSubjectRequest,
  ): Promise<AcademicSubject> => {
    const response = await apiClient.post<AcademicSubject>(
      `${BASE_PATH}/subjects`,
      request,
    );
    return response.data;
  },

  setSubjectActive: async (
    subjectId: number,
    active: boolean,
  ): Promise<AcademicSubject> => {
    const response = await apiClient.patch<AcademicSubject>(
      `${BASE_PATH}/subjects/${subjectId}/active`,
      { active },
    );
    return response.data;
  },

  getBranchStaff: async (branchId: number): Promise<BranchStaffAssignment[]> => {
    const response = await apiClient.get<BranchStaffAssignment[]>(
      `${BASE_PATH}/admin/branches/${branchId}/staff`,
    );
    return response.data;
  },

  assignBranchStaff: async (
    branchId: number,
    userId: number,
  ): Promise<BranchStaffAssignment> => {
    const response = await apiClient.post<BranchStaffAssignment>(
      `${BASE_PATH}/admin/branches/${branchId}/staff`,
      { userId },
    );
    return response.data;
  },

  deactivateBranchStaff: async (
    branchId: number,
    userId: number,
  ): Promise<BranchStaffAssignment> => {
    const response = await apiClient.delete<BranchStaffAssignment>(
      `${BASE_PATH}/admin/branches/${branchId}/staff/${userId}`,
    );
    return response.data;
  },

  saveSubjects: async (
    registrationId: number,
    subjectIds: number[],
  ): Promise<SemesterRegistration> => {
    const response = await apiClient.put<SemesterRegistration>(
      `${BASE_PATH}/applications/${registrationId}/subjects`,
      { subjectIds },
    );
    return response.data;
  },

  saveFees: async (
    registrationId: number,
    fees: RegistrationFeeRequest,
  ): Promise<SemesterRegistration> => {
    const response = await apiClient.put<SemesterRegistration>(
      `${BASE_PATH}/applications/${registrationId}/fees`,
      fees,
    );
    return response.data;
  },

  uploadDocument: async (
    registrationId: number,
    documentType: RegistrationDocumentType,
    file: File,
  ): Promise<RegistrationDocument> => {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    const response = await apiClient.post<RegistrationDocument>(
      `${BASE_PATH}/applications/${registrationId}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  getDocuments: async (registrationId: number): Promise<RegistrationDocument[]> => {
    const response = await apiClient.get<RegistrationDocument[]>(
      `${BASE_PATH}/applications/${registrationId}/documents`,
    );
    return response.data;
  },

  submit: async (
    registrationId: number,
    subjectIds: number[],
  ): Promise<SemesterRegistration> => {
    const response = await apiClient.post<SemesterRegistration>(
      `${BASE_PATH}/applications/${registrationId}/submit`,
      { registrationId, subjectIds },
    );
    return response.data;
  },
};
