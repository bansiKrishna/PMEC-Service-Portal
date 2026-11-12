import {
  keepPreviousData,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { dswApi } from '../../api/dswApi';
import { principalApi } from '../../api/principalApi';
import { queryClient } from '../../lib/queryClient';
import type { ReviewTab } from '../../types/review';

export type BonafideViewer = 'dsw' | 'principal';

const api = (viewer: BonafideViewer) =>
  viewer === 'dsw' ? dswApi : principalApi;

export const bonafideKeys = {
  root: (viewer: BonafideViewer) => ['bonafide', viewer] as const,
  list: (viewer: BonafideViewer, tab: ReviewTab) =>
    ['bonafide', viewer, 'list', tab] as const,
  summary: (viewer: BonafideViewer) =>
    ['bonafide', viewer, 'summary'] as const,
};

export const useBonafideList = (
  viewer: BonafideViewer,
  tab: ReviewTab,
) =>
  useQuery({
    queryKey: bonafideKeys.list(viewer, tab),
    queryFn: () => api(viewer).getApplications(tab),
    placeholderData: keepPreviousData,
  });

export const useBonafideSummary = (viewer: BonafideViewer) =>
  useQuery({
    queryKey: bonafideKeys.summary(viewer),
    queryFn: () => api(viewer).getSummary(),
  });

export const useApproveBonafide = (viewer: BonafideViewer) =>
  useMutation({
    mutationFn: ({ id, remarks }: { id: number; remarks?: string }) =>
      viewer === 'dsw'
        ? dswApi.approveApplication(id, remarks)
        : principalApi.approveApplication(id),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: bonafideKeys.root(viewer),
      });
      toast.success(
        viewer === 'dsw'
          ? 'Application Approved'
          : 'Application Approved by Principal',
        { description: `Application #${variables.id} has been approved.` },
      );
    },
  });

export const useRejectBonafide = (viewer: BonafideViewer) =>
  useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      api(viewer).rejectApplication(id, { reason }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: bonafideKeys.root(viewer),
      });
      toast.success('Application Rejected', {
        description: `Application #${variables.id} has been rejected.`,
      });
    },
  });
