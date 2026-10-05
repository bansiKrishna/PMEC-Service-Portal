import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { UserPlus, Mail, Lock, User, Hash, BookOpen, Layers, Loader2, Eye, EyeOff } from 'lucide-react';
import { authApi } from '../../api/authApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z
    .string()
    .email('Invalid email address')
    .refine((val) => val.endsWith('@pmec.ac.in'), {
      message: 'College email must end with @pmec.ac.in',
    }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rollNumber: z.string().min(1, 'Roll number is required'),
  department: z.string().min(1, 'Department is required'),
  semester: z.coerce.number().min(1, 'Select a semester').max(8),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      rollNumber: '',
      department: 'Computer Science & Engineering',
      semester: 1,
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await authApi.register(data);
      toast.success('Registration Successful', {
        description: response.message || 'Your account has been created. Please sign in.',
      });
      navigate('/login');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string; message?: string } } }).response?.data?.error ||
            (err as { response?: { data?: { error?: string; message?: string } } }).response?.data?.message ||
            'Registration failed. Make sure your email ends with @pmec.ac.in'
          : 'Unable to connect to server. Please try again.';
      setApiError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-7">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Create account</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Register your PMEC student portal account.
        </p>
      </div>

      {apiError && (
        <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm">
          {apiError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="fullName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Full Name
          </Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input id="fullName" placeholder="Rahul Sharma" className="pl-9 h-10" {...register('fullName')} />
          </div>
          {errors.fullName && <p className="text-xs text-red-600">{errors.fullName.message}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
            College Email
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input id="email" type="email" placeholder="name.21cse@pmec.ac.in" className="pl-9 h-10" {...register('email')} />
          </div>
          {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
        </div>

        {/* Roll + Semester */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="rollNumber" className="text-sm font-medium text-slate-700 dark:text-slate-300">Roll Number</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input id="rollNumber" placeholder="2101105001" className="pl-9 h-10" {...register('rollNumber')} />
            </div>
            {errors.rollNumber && <p className="text-xs text-red-600">{errors.rollNumber.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="semester" className="text-sm font-medium text-slate-700 dark:text-slate-300">Semester</Label>
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input id="semester" type="number" min={1} max={8} className="pl-9 h-10" {...register('semester')} />
            </div>
            {errors.semester && <p className="text-xs text-red-600">{errors.semester.message}</p>}
          </div>
        </div>

        {/* Department */}
        <div className="space-y-1.5">
          <Label htmlFor="department" className="text-sm font-medium text-slate-700 dark:text-slate-300">Department</Label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input id="department" placeholder="Computer Science & Engineering" className="pl-9 h-10" {...register('department')} />
          </div>
          {errors.department && <p className="text-xs text-red-600">{errors.department.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              className="pl-9 pr-9 h-10"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full h-10 font-semibold mt-1" disabled={isLoading}>
          {isLoading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
          ) : (
            <><UserPlus className="w-4 h-4 mr-2" /> Register</>
          )}
        </Button>
      </form>

      <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
