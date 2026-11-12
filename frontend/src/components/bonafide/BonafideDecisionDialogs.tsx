import { useState, type FC } from 'react';
import { LoaderCircle } from 'lucide-react';
import type { BonafideApplicationResponseDto } from '../../types/bonafide';
import type { BonafideViewer } from '../../hooks/queries/useBonafideReview';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';

interface BonafideDecisionDialogsProps {
  viewer: BonafideViewer;
  approveApplication: BonafideApplicationResponseDto | null;
  rejectApplication: BonafideApplicationResponseDto | null;
  approving: boolean;
  rejecting: boolean;
  onCloseApprove: () => void;
  onCloseReject: () => void;
  onApprove: (id: number, remarks?: string) => Promise<void>;
  onReject: (id: number, reason: string) => Promise<void>;
}

export const BonafideDecisionDialogs: FC<BonafideDecisionDialogsProps> = ({
  viewer,
  approveApplication,
  rejectApplication,
  approving,
  rejecting,
  onCloseApprove,
  onCloseReject,
  onApprove,
  onReject,
}) => {
  const [remarks, setRemarks] = useState('');
  const [reason, setReason] = useState('');

  const closeApprove = () => {
    setRemarks('');
    onCloseApprove();
  };
  const closeReject = () => {
    setReason('');
    onCloseReject();
  };

  const submitApprove = async () => {
    if (!approveApplication || approving) return;
    try {
      await onApprove(approveApplication.id, remarks.trim() || undefined);
      setRemarks('');
      closeApprove();
    } catch {
      // The API interceptor displays the request error; keep the dialog open.
    }
  };

  const submitReject = async () => {
    if (!rejectApplication || rejecting || !reason.trim()) return;
    try {
      await onReject(rejectApplication.id, reason.trim());
      setReason('');
      closeReject();
    } catch {
      // The API interceptor displays the request error; keep the dialog open.
    }
  };

  return (
    <>
      <Dialog
        open={approveApplication !== null}
        onOpenChange={(open) => {
          if (!open && !approving) closeApprove();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve application</DialogTitle>
            <DialogDescription>
              {viewer === 'principal'
                ? 'Approval generates the Bonafide certificate.'
                : 'The application will be forwarded to the Principal.'}
            </DialogDescription>
          </DialogHeader>
          {viewer === 'dsw' && (
            <div className="space-y-2">
              <Label htmlFor="bonafide-remarks">Remarks (optional)</Label>
              <textarea
                id="bonafide-remarks"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                className="min-h-20 w-full rounded-md border border-input bg-background p-2 text-sm"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeApprove} disabled={approving}>
              Cancel
            </Button>
            <Button onClick={() => void submitApprove()} disabled={approving}>
              {approving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {approving ? 'Approving…' : 'Approve'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectApplication !== null}
        onOpenChange={(open) => {
          if (!open && !rejecting) closeReject();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
            <DialogDescription>
              A reason is required and will be visible to the student.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="bonafide-rejection-reason">Reason</Label>
            <textarea
              id="bonafide-rejection-reason"
              required
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="min-h-24 w-full rounded-md border border-input bg-background p-2 text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeReject} disabled={rejecting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => void submitReject()}
              disabled={rejecting || !reason.trim()}
            >
              {rejecting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              {rejecting ? 'Rejecting…' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
