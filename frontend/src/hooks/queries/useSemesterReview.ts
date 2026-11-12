import {
  keepPreviousData,
  useQuery,
} from '@tanstack/react-query';
import { semesterRegistrationApi } from '../../api/semesterRegistrationApi';
import type { ReviewTab } from '../../types/review';

export const semesterReviewKeys = {
  root: ['semester-review'] as const,
  list: (tab: ReviewTab) => ['semester-review', 'list', tab] as const,
  summary: ['semester-review', 'summary'] as const,
  registration: (id: number) => ['semester-registration', id] as const,
  reviews: (id: number) => ['semester-registration', id, 'reviews'] as const,
};

export const useSemesterReviewList = (tab: ReviewTab) =>
  useQuery({
    queryKey: semesterReviewKeys.list(tab),
    queryFn: () => semesterRegistrationApi.getReviewList(tab),
    placeholderData: keepPreviousData,
  });

export const useSemesterReviewSummary = () =>
  useQuery({
    queryKey: semesterReviewKeys.summary,
    queryFn: semesterRegistrationApi.getReviewSummary,
  });

export const useRegistrationDetail = (selectedId: number | null) =>
  useQuery({
    queryKey: selectedId === null
      ? ['semester-registration', 'none']
      : semesterReviewKeys.registration(selectedId),
    queryFn: () => {
      if (selectedId === null) {
        throw new Error('A registration must be selected before loading details.');
      }
      return semesterRegistrationApi.getRegistration(selectedId);
    },
    enabled: selectedId !== null,
    staleTime: 0,
  });

export const useRegistrationReviewHistory = (selectedId: number | null) =>
  useQuery({
    queryKey: selectedId === null
      ? ['semester-registration', 'none', 'reviews']
      : semesterReviewKeys.reviews(selectedId),
    queryFn: () => {
      if (selectedId === null) {
        throw new Error('A registration must be selected before loading reviews.');
      }
      return semesterRegistrationApi.getApplicationReviewHistory(selectedId);
    },
    enabled: selectedId !== null,
    staleTime: 0,
  });
