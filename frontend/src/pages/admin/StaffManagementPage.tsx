import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  UserPlus, UserCheck, UserX, Key, RefreshCw, Search,
  MoreHorizontal, Filter
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import type { StaffResponse, CreateStaffRequest } from '../../types/admin';
import type { Role } from '../../types/user';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '../../components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '../../components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { LoadingState } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';

const createStaffSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Invalid email address').refine((val) => val.endsWith('@pmec.ac.in'), {
    message: 'Email must end with @pmec.ac.in',
  }),
  role: z.enum(['DSW', 'PRINCIPAL', 'LIBRARIAN']),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type CreateStaffFormData = z.infer<typeof createStaffSchema>;

export const StaffManagementPage: React.FC = () => {
  const [staffList, setStaffList] = useState<StaffResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [passwordModalStaff, setPasswordModalStaff] = useState<StaffResponse | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateStaffFormData>({
    resolver: zodResolver(createStaffSchema),
    defaultValues: { fullName: '', email: '', role: 'DSW', password: '' },
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAllStaff();
      setStaffList(data);
    } catch (error) {
      console.error('Error fetching staff list:', error);
      toast.error('Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStaff(); }, []);

  const handleCreateStaff = async (data: CreateStaffFormData) => {
    try {
      const created = await adminApi.createStaff(data as CreateStaffRequest);
      toast.success('Staff Account Created', {
        description: `${created.role} account created for ${created.fullName}.`,
      });
      setIsCreateOpen(false);
      reset();
      fetchStaff();
    } catch (error: unknown) {
      console.error('Failed to create staff:', error);
      toast.error('Failed to create staff account');
    }
  };

  const handleToggleEnable = async (staff: StaffResponse) => {
    try {
      if (staff.enabled) {
        await adminApi.disableStaff(staff.id);
        toast.success(`${staff.fullName}'s account disabled.`);
      } else {
        await adminApi.enableStaff(staff.id);
        toast.success(`${staff.fullName}'s account enabled.`);
      }
      fetchStaff();
    } catch (error) {
      console.error('Error toggling staff state:', error);
      toast.error('Failed to update account status');
    }
  };

  const handleResetPassword = async () => {
    if (!passwordModalStaff || !newPassword) return;
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    try {
      await adminApi.changeStaffPassword(passwordModalStaff.id, { password: newPassword });
      toast.success(`Password updated for ${passwordModalStaff.fullName}.`);
      setPasswordModalStaff(null);
      setNewPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    }
  };

  const handleChangeRole = async (staff: StaffResponse, newRole: Role) => {
    try {
      await adminApi.changeStaffRole(staff.id, { role: newRole });
      toast.success(`${staff.fullName} is now ${newRole}.`);
      fetchStaff();
    } catch (error) {
      console.error('Error changing staff role:', error);
      toast.error('Failed to update role');
    }
  };

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch =
      staff.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || staff.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-description">
            Create and manage DSW, Principal, and Librarian accounts.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shrink-0">
          <UserPlus className="w-4 h-4" /> Add Staff
        </Button>
      </div>

      {/* Table Card */}
      <div className="content-card">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-36 h-9">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Roles</SelectItem>
                <SelectItem value="DSW">DSW</SelectItem>
                <SelectItem value="PRINCIPAL">Principal</SelectItem>
                <SelectItem value="LIBRARIAN">Librarian</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={fetchStaff} className="gap-1 h-9">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="px-5 py-4">
            <LoadingState rows={4} message="Fetching staff directory..." />
          </div>
        ) : filteredStaff.length === 0 ? (
          <EmptyState
            title="No Staff Accounts Found"
            description={searchQuery || roleFilter !== 'ALL' ? "No accounts match your filter criteria." : "No staff accounts created yet."}
            actionLabel={!searchQuery && roleFilter === 'ALL' ? "Add Staff Member" : undefined}
            onAction={!searchQuery && roleFilter === 'ALL' ? () => setIsCreateOpen(true) : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200 dark:border-slate-800 hover:bg-transparent">
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                    Staff Member
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                    Role
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                    Status
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/50">
                    Created
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 dark:bg-slate-900/50 text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((staff) => (
                  <TableRow key={staff.id} className="border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/30">
                    <TableCell className="py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{staff.fullName}</p>
                        <p className="text-xs text-slate-500 font-mono">{staff.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <Select value={staff.role} onValueChange={(val) => handleChangeRole(staff, val as Role)}>
                        <SelectTrigger className="w-28 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DSW">DSW</SelectItem>
                          <SelectItem value="PRINCIPAL">Principal</SelectItem>
                          <SelectItem value="LIBRARIAN">Librarian</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                        staff.enabled
                          ? 'badge-approved'
                          : 'badge-rejected'
                      }`}>
                        {staff.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${staff.emailVerified ? 'text-emerald-700 bg-emerald-50' : 'text-slate-500 bg-slate-100'}`}>
                        {staff.emailVerified ? 'Verified' : 'Pending'}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => handleToggleEnable(staff)}
                            className={`gap-2 text-sm ${staff.enabled ? 'text-red-600' : 'text-emerald-600'}`}
                          >
                            {staff.enabled ? (
                              <><UserX className="w-3.5 h-3.5" /> Disable Account</>
                            ) : (
                              <><UserCheck className="w-3.5 h-3.5" /> Enable Account</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setPasswordModalStaff(staff)}
                            className="gap-2 text-sm"
                          >
                            <Key className="w-3.5 h-3.5" /> Reset Password
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create Staff Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" /> Add Staff Member
            </DialogTitle>
            <DialogDescription>
              Create a new DSW, Principal, or Librarian account. Email must end with @pmec.ac.in.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleCreateStaff)} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="Dr. Staff Name" {...register('fullName')} />
              {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staffEmail">Official Email</Label>
              <Input id="staffEmail" placeholder="staff@pmec.ac.in" {...register('email')} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select onValueChange={(val) => setValue('role', val as 'DSW' | 'PRINCIPAL' | 'LIBRARIAN')} defaultValue="DSW">
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DSW">DSW (Dean Student Welfare)</SelectItem>
                  <SelectItem value="PRINCIPAL">Principal</SelectItem>
                  <SelectItem value="LIBRARIAN">Librarian</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && <p className="text-xs text-red-500">{errors.role.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staffPassword">Initial Password</Label>
              <Input id="staffPassword" type="password" placeholder="Min. 8 characters" {...register('password')} />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Create Account
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!passwordModalStaff} onOpenChange={() => setPasswordModalStaff(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-4 h-4 text-blue-600" /> Reset Password
            </DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{passwordModalStaff?.fullName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Minimum 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordModalStaff(null)}>Cancel</Button>
            <Button onClick={handleResetPassword}>Save Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
