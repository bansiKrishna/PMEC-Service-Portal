import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Lock, Server, RefreshCw } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const AdminSettingsPage: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);
    try {
      await authApi.changePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password Changed', {
        description: 'Your administrator password has been updated successfully.',
      });
      reset();
    } catch (error) {
      console.error('Failed to change password:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          System Settings & Security
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage system parameters, environment configurations, and admin password settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Lock className="w-5 h-5 text-blue-600" /> Change Administrator Password
            </CardTitle>
            <CardDescription>
              Update your secret login credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="oldPassword">Current Password</Label>
                <Input id="oldPassword" type="password" placeholder="••••••••" {...register('oldPassword')} />
                {errors.oldPassword && <p className="text-xs text-rose-500">{errors.oldPassword.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" placeholder="••••••••" {...register('newPassword')} />
                {errors.newPassword && <p className="text-xs text-rose-500">{errors.newPassword.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" placeholder="••••••••" {...register('confirmPassword')} />
                {errors.confirmPassword && <p className="text-xs text-rose-500">{errors.confirmPassword.message}</p>}
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : null}
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-600" /> Environment Configuration
            </CardTitle>
            <CardDescription>
              Backend API connection details.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-semibold text-slate-500">Backend Base URL</span>
              <p className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-semibold text-slate-500">JWT Interceptor</span>
              <p className="text-slate-800 dark:text-slate-200">
                Active. Automatic Bearer token header injection enabled for all secure endpoints.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-1">
              <span className="font-semibold text-slate-500">Security Architecture</span>
              <p className="text-slate-800 dark:text-slate-200">
                Stateless JWT session management. Role protection enforced at Spring Boot SecurityFilterChain.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
