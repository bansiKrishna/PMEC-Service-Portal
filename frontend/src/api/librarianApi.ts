import { semesterRegistrationApi } from './semesterRegistrationApi';

export const librarianApi = {
  getReviewList: semesterRegistrationApi.getReviewList,
  getReviewSummary: semesterRegistrationApi.getReviewSummary,
  getPendingApplications: semesterRegistrationApi.getPendingReviews,
  getReviewHistory: semesterRegistrationApi.getReviewHistory,
  submitReview: semesterRegistrationApi.submitReview,
  getDocumentContent: semesterRegistrationApi.getDocumentContent,
};
