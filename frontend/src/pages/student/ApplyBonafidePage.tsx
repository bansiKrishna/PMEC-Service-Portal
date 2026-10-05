import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { FilePlus2, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { studentApi } from '../../api/studentApi';
import type { BonafideApplicationRequestDto } from '../../types/bonafide';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const bonafideSchema = z.object({
  academicYear: z.string().min(1, 'Academic year is required (e.g. 2024-2025)'),
  collegeAdmissionDate: z.string().min(1, 'College admission date is required'),
  hostelAdmissionDate: z.string().optional(),
  hostelName: z.string().optional(),
  roomNumber: z.string().optional(),
  parentName: z.string().min(2, 'Parent / Guardian name is required'),
  phoneNumber: z
    .string()
    .min(10, 'Valid 10-digit phone number is required')
    .max(15, 'Phone number is too long'),
  reason: z.string().min(5, 'Please state the reason for requesting Bonafide Certificate'),
});

type BonafideFormData = z.infer<typeof bonafideSchema>;

export const ApplyBonafidePage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<number | null>(null);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BonafideFormData>({
    resolver: zodResolver(bonafideSchema),
    defaultValues: {
      academicYear: '2024-2025',
      collegeAdmissionDate: '',
      hostelAdmissionDate: '',
      hostelName: '',
      roomNumber: '',
      parentName: '',
      phoneNumber: '',
      reason: '',
    },
  });

  const onSubmit = async (data: BonafideFormData) => {
    setIsSubmitting(true);
    try {
      const payload: BonafideApplicationRequestDto = {
        academicYear: data.academicYear,
        collegeAdmissionDate: data.collegeAdmissionDate,
        hostelAdmissionDate: data.hostelAdmissionDate || undefined,
        hostelName: data.hostelName || undefined,
        roomNumber: data.roomNumber || undefined,
        parentName: data.parentName,
        phoneNumber: data.phoneNumber,
        reason: data.reason,
      };

      const response = await studentApi.applyBonafide(payload);
      await studentApi.submitApplication(response.id);
      setSubmittedId(response.id);
      toast.success('Application Submitted Successfully', {
        description: `Your Bonafide Application #${response.id} is now forwarded for DSW review.`,
      });
    } catch (error) {
      console.error('Failed to submit application:', error);
      toast.error('Could not submit Bonafide application', {
        description: 'Check your application history; if the application was saved as a draft, submit it from there.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedId) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="glass-panel text-center p-8 border-emerald-500/30 space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Application Submitted Successfully!
            </h2>
            <p className="text-sm text-slate-500">
              Your Bonafide Certificate Application reference ID is:
            </p>
            <div className="inline-block px-4 py-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-bold text-xl border border-blue-500/20">
              APP #{submittedId}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900/50 text-xs text-slate-500 text-left space-y-1">
            <p className="font-semibold text-slate-700 dark:text-slate-300">Next Workflow Steps:</p>
            <p>1. DSW Review (Dean Student Welfare will verify hostel & college details)</p>
            <p>2. Principal Review (Principal approves application)</p>
            <p>3. Automatic PDF Certificate Generation & Download availability</p>
          </div>
          <div className="flex justify-center space-x-3 pt-2">
            <Button variant="outline" onClick={() => navigate('/student/dashboard')}>
              Go to Dashboard
            </Button>
            <Button onClick={() => navigate(`/student/applications/${submittedId}`)}>
              View Application Details
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Apply for Bonafide Certificate
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Fill in your personal, hostel, and academic details to submit a new request.
          </p>
        </div>
      </div>

      <Card className="glass-panel">
        <CardHeader className="border-b border-slate-200/60 dark:border-slate-800/60 pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FilePlus2 className="w-5 h-5 text-blue-600" /> Bonafide Request Form
          </CardTitle>
          <CardDescription>
            All fields marked with an asterisk (*) are mandatory.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Academic & Personal Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                1. Academic & Personal Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="academicYear">Academic Year *</Label>
                  <Input id="academicYear" placeholder="2024-2025" {...register('academicYear')} />
                  {errors.academicYear && <p className="text-xs text-rose-500">{errors.academicYear.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="collegeAdmissionDate">College Admission Date *</Label>
                  <Input id="collegeAdmissionDate" type="date" {...register('collegeAdmissionDate')} />
                  {errors.collegeAdmissionDate && (
                    <p className="text-xs text-rose-500">{errors.collegeAdmissionDate.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="parentName">Parent / Guardian Name *</Label>
                  <Input id="parentName" placeholder="Father or Mother Name" {...register('parentName')} />
                  {errors.parentName && <p className="text-xs text-rose-500">{errors.parentName.message}</p>}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="phoneNumber">Contact Phone Number *</Label>
                  <Input id="phoneNumber" placeholder="9876543210" {...register('phoneNumber')} />
                  {errors.phoneNumber && <p className="text-xs text-rose-500">{errors.phoneNumber.message}</p>}
                </div>
              </div>
            </div>

            {/* Hostel Section */}
            <div className="space-y-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                2. Hostel Accommodation Details (Optional)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="hostelName">Hostel Name</Label>
                  <Input id="hostelName" placeholder="APJ Abdul Kalam Hostel" {...register('hostelName')} />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="roomNumber">Room Number</Label>
                  <Input id="roomNumber" placeholder="302" {...register('roomNumber')} />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="hostelAdmissionDate">Hostel Admission Date</Label>
                  <Input id="hostelAdmissionDate" type="date" {...register('hostelAdmissionDate')} />
                </div>
              </div>
            </div>

            {/* Reason Section */}
            <div className="space-y-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                3. Purpose / Reason
              </h3>

              <div className="space-y-1">
                <Label htmlFor="reason">Reason for Certificate *</Label>
                <textarea
                  id="reason"
                  rows={3}
                  placeholder="State the purpose (e.g. State Scholarship, Bank Loan, Passport Application, Bus Pass...)"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                  {...register('reason')}
                />
                {errors.reason && <p className="text-xs text-rose-500">{errors.reason.message}</p>}
              </div>
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full h-11 text-base font-semibold shadow-lg shadow-blue-500/20">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting Request...
                </>
              ) : (
                'Submit Bonafide Application'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
