import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Fingerprint, Heading1, Save, UserCheck, Eye, EyeOff, AlertCircle, CheckCircle, UserPlus, UserX, Clock, Settings, Shield } from "lucide-react";
import { toast } from "sonner";
import { changeUserPassword, validatePasswordMatch, validatePasswordStrength, verifyCurrentPassword, createNewUser, toggleUserStatus, getUserStatus, updateUserRole } from "utils/users.service";
import { Alert, AlertDescription } from "~/components/ui/alert";
import type { Route } from "../routes/+types/_layout.users";
import { useUser } from "~/hooks/use-user";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { useAuthSessionTimeoutContext } from "./auth-session-timeout-provider";

// type Role = "View" | "Add" | "Edit" | "Delete";

type Users = {
  id: string;
  email: string;
  claims: string;
};
type RoleDetails = {
  id: string;
  role: string;
  description?: string;
};

type UserRoleTableProps = {
  users: Users[];
  roleDetails: RoleDetails[];
  role: string;
};
export default function Component({
  users,
  roleDetails,
  role,
}: UserRoleTableProps) {
  const [hasChanges, setHasChanges] = useState(false);
  const [userRoleChanges, setUserRoleChanges] = useState<Record<string, string>>({});
  const [roleUpdateLoading, setRoleUpdateLoading] = useState<Record<string, boolean>>({});
  const roleName = role;
  const { user: currentUser } = useUser();

  // Protected user ID that cannot be edited (from environment variable)
  const PROTECTED_USER_ID = import.meta.env.VITE_PROTECTED_USER_ID || "58eb73bd-f087-47f8-a6b3-11c08c6f7eb4";

  // Helper function to check if a user is protected
  const isProtectedUser = (userId: string) => userId === PROTECTED_USER_ID;

  // Helper function to check if current user is the super admin (protected user)
  const isSuperAdmin = () => currentUser?.id === PROTECTED_USER_ID;

  // Password change state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    password: '',
    confirmPassword: ''
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<{ valid: boolean; message?: string }>({ valid: true, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add user state
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    email: '',
    role: ''
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // User status state
  const [userStatuses, setUserStatuses] = useState<Record<string, boolean>>({});
  const [statusLoading, setStatusLoading] = useState<Record<string, boolean>>({});

  // Session timeout state
  const [sessionTimeoutDialogOpen, setSessionTimeoutDialogOpen] = useState(false);
  const [sessionTimeoutHours, setSessionTimeoutHours] = useState<number>(8);

  // Use session timeout context
  const {
    remainingTime,
    formattedRemainingTime,
    isActive: sessionTimeoutActive,
    timeoutHours: currentTimeoutHours,
    updateTimeoutHours,
    refreshSession
  } = useAuthSessionTimeoutContext();


  // Load user statuses on component mount
  useEffect(() => {
    const loadUserStatuses = async () => {
      const statuses: Record<string, boolean> = {};
      for (const user of users) {
        try {
          const status = await getUserStatus(user.id);
          statuses[user.id] = status.isActive;
        } catch (error) {
          console.error(`Failed to load status for user ${user.id}:`, error);
          statuses[user.id] = true; // Default to active if can't determine
        }
      }
      setUserStatuses(statuses);
    };

    if (users.length > 0) {
      loadUserStatuses();
    }
  }, [users]);

  // Update session timeout hours state when context changes
  useEffect(() => {
    setSessionTimeoutHours(currentTimeoutHours);
  }, [currentTimeoutHours]);

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    // Prevent changes to protected user (except by super admin themselves)
    if (isProtectedUser(userId) && !isSuperAdmin()) {
      toast.error("This user account is protected and cannot be modified");
      return;
    }

    // Super admin can change anyone's status
    if (isSuperAdmin()) {
      // Super admin has no restrictions for status changes
    } else {
      // Prevent toggling if current user is trying to deactivate themselves
      if (currentUser?.id === userId && currentStatus) {
        toast.error("You cannot deactivate your own account");
        return;
      }
    }

    setStatusLoading(prev => ({ ...prev, [userId]: true }));

    try {
      const result = await toggleUserStatus(userId, !currentStatus);

      if (result.success) {
        setUserStatuses(prev => ({ ...prev, [userId]: !currentStatus }));
        toast.success(result.message || 'User status updated successfully');
      } else {
        toast.error(result.error || 'Failed to update user status');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Status toggle error:', error);
    } finally {
      setStatusLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    // Prevent changes to protected user (except by super admin themselves)
    if (isProtectedUser(userId) && !isSuperAdmin()) {
      toast.error("This user account is protected and cannot be modified");
      return;
    }

    // Super admin can change anyone's role, including other admins
    if (isSuperAdmin()) {
      // Super admin has no restrictions
    } else {
      // Regular admin restrictions
      // Prevent admin from changing their own role
      if (currentUser?.id === userId && roleName === 'admin') {
        toast.error("You cannot change your own admin role");
        return;
      }

      // Prevent changing other admin users' roles (except your own, which is already blocked above)
      const user = users.find(u => u.id === userId);
      const userCurrentRole = typeof user?.claims === 'string'
        ? user.claims
        : (user?.claims as any)?.role;

      if (userCurrentRole === 'admin' && currentUser?.id !== userId) {
        toast.error("Cannot change another admin user's role");
        return;
      }
    }

    const user = users.find(u => u.id === userId);
    const userCurrentRole = typeof user?.claims === 'string'
      ? user.claims
      : (user?.claims as any)?.role;

    if (newRole !== userCurrentRole) {
      setUserRoleChanges(prev => ({ ...prev, [userId]: newRole }));
      setHasChanges(true);
    } else {
      // Remove from changes if reverting to original
      setUserRoleChanges(prev => {
        const newChanges = { ...prev };
        delete newChanges[userId];
        return newChanges;
      });

      // Check if there are any remaining changes
      const remainingChanges = Object.keys(userRoleChanges).filter(id => id !== userId);
      setHasChanges(remainingChanges.length > 0);
    }
  };

  const saveChanges = async () => {
    if (Object.keys(userRoleChanges).length === 0) {
      toast.info("No changes to save");
      return;
    }

    console.log("Saving user role changes:", userRoleChanges);

    for (const [userId, newRole] of Object.entries(userRoleChanges)) {
      setRoleUpdateLoading(prev => ({ ...prev, [userId]: true }));

      try {
        const result = await updateUserRole(userId, newRole);

        if (result.success) {
          toast.success(result.message || `Role updated successfully`);
        } else {
          toast.error(result.error || `Failed to update role for user`);
        }
      } catch (error) {
        toast.error('An unexpected error occurred');
        console.error('Role update error:', error);
      } finally {
        setRoleUpdateLoading(prev => ({ ...prev, [userId]: false }));
      }
    }

    // Clear changes and refresh page to show updated data
    setUserRoleChanges({});
    setHasChanges(false);

    // Refresh page to show updated roles
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const resetPasswordForm = () => {
    setPasswordForm({ oldPassword: '', password: '', confirmPassword: '' });
    setPasswordValidation({ valid: true, message: '' });
    setShowOldPassword(false);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const resetNewUserForm = () => {
    setNewUserForm({ email: '', role: '' });
  };

  const handlePasswordChange = (field: 'oldPassword' | 'password' | 'confirmPassword', value: string) => {
    const newForm = { ...passwordForm, [field]: value };
    setPasswordForm(newForm);

    if (field === 'password') {
      const validation = validatePasswordStrength(value);
      setPasswordValidation(validation);
    }
  };

  const handleNewUserChange = (field: 'email' | 'role', value: string) => {
    const newForm = { ...newUserForm, [field]: value };
    setNewUserForm(newForm);
  };

  const handleSessionTimeoutUpdate = async () => {
    try {
      await updateTimeoutHours(sessionTimeoutHours);
      setSessionTimeoutDialogOpen(false);
    } catch (error) {
      console.error('Session timeout update error:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    if (!newUserForm.email) {
      toast.error('Email is required');
      return;
    }

    // Validate role
    if (!newUserForm.role) {
      toast.error('Role is required');
      return;
    }

    setIsCreatingUser(true);

    try {
      // Use default password "P@$$w0rd"
      const result = await createNewUser(newUserForm.email, 'P@$$w0rd', newUserForm.role);

      if (result.success) {
        toast.success('User created successfully with password "P@$$w0rd"');
        setAddUserDialogOpen(false);
        resetNewUserForm();
        // Optionally refresh the page or user list here
        window.location.reload();
      } else {
        toast.error(result.error || 'Failed to create user');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('User creation error:', error);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUserId) {
      toast.error('No user selected');
      return;
    }

    // Super admin can change anyone's password without restrictions
    if (isSuperAdmin()) {
      // Super admin has no restrictions
    } else {
      // Special handling for protected user - only allow self password change
      if (isProtectedUser(selectedUserId) && currentUser?.id !== selectedUserId) {
        toast.error('This protected user account can only change their own password');
        return;
      }

      // Security check: ensure user can only change their own password unless they're admin
      if (roleName !== "admin" && currentUser?.id !== selectedUserId && !isProtectedUser(selectedUserId)) {
        toast.error('You can only change your own password');
        return;
      }
    }

    // For non-admin users changing their own password, require old password
    // Also require old password for protected user changing their own password
    // Super admin doesn't need old password
    if (!isSuperAdmin() &&
        ((roleName !== "admin" && currentUser?.id === selectedUserId && !passwordForm.oldPassword) ||
         (isProtectedUser(selectedUserId) && currentUser?.id === selectedUserId && !passwordForm.oldPassword))) {
      toast.error('Current password is required');
      return;
    }

    // Validate password match
    if (!validatePasswordMatch(passwordForm.password, passwordForm.confirmPassword)) {
      toast.error('Passwords do not match');
      return;
    }

    // Validate password strength
    const strengthValidation = validatePasswordStrength(passwordForm.password);
    if (!strengthValidation.valid) {
      toast.error(strengthValidation.message || 'Password is not strong enough');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Password form debug:', {
        roleName,
        currentUserId: currentUser?.id,
        selectedUserId,
        oldPassword: passwordForm.oldPassword ? passwordForm.oldPassword.substring(0, 3) + '***' : 'empty',
        isAdmin: roleName === "admin",
        isOwnPassword: currentUser?.id === selectedUserId,
        shouldPassCurrentPassword: roleName !== "admin" && currentUser?.id === selectedUserId
      });

      // Pass current password for verification (for non-admin users changing their own password OR protected user changing their own password)
      // Super admin doesn't need to provide current password
      const currentPassword = (!isSuperAdmin() &&
                              ((roleName !== "admin" && currentUser?.id === selectedUserId) ||
                               (isProtectedUser(selectedUserId) && currentUser?.id === selectedUserId)))
        ? passwordForm.oldPassword
        : undefined;

      console.log('Calling changeUserPassword with:', {
        selectedUserId,
        newPassword: passwordForm.password.substring(0, 3) + '***',
        currentPassword: currentPassword ? currentPassword.substring(0, 3) + '***' : 'undefined',
        isAdmin: roleName === "admin",
        isOwnPassword: currentUser?.id === selectedUserId
      });

      const result = await changeUserPassword(selectedUserId, passwordForm.password, currentPassword);

      if (result.success) {
        toast.success(result.message || 'Password updated successfully');
        setDialogOpen(false);
        setSelectedUserId(null);
        resetPasswordForm();
      } else {
        toast.error(result.error || 'Failed to update password');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Password change error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full ">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            User Management
            {isSuperAdmin() && (
              <Badge variant="default" className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                <Shield className="w-3 h-3 mr-1" />
                Super Admin Mode
              </Badge>
            )}
          </CardTitle>
          {/* <CardDescription>Manage user permissions and access levels</CardDescription>a  */}
        </div>
        <div className="flex gap-2">
          {role === "admin" ? (
            <>
            {/* Session Timeout Settings - admin role Available only */}
              <Button
                onClick={() => setSessionTimeoutDialogOpen(true)}
                variant="outline"
                className="gap-2"
              >
                <Clock className="h-4 w-4" />
                Session Timeout ({currentTimeoutHours < 1 ? `${Math.round(currentTimeoutHours * 60)}min` : `${currentTimeoutHours % 1 === 0 ? Math.round(currentTimeoutHours) : currentTimeoutHours}h`})
              </Button>
              <Button
                onClick={() => {
                  setAddUserDialogOpen(true);
                  resetNewUserForm();
                }}
                variant="outline"
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
              <Button onClick={saveChanges} className="gap-2">
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <div className="">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((role) => (
                <TableRow key={role.id} className={isProtectedUser(role.id) ? "bg-amber-50/50 dark:bg-amber-950/20" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {role.email}
                      {isProtectedUser(role.id) && (
                        <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
                          <Shield className="w-3 h-3 mr-1" />
                          System Protected
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select
                      disabled={
                        (!isSuperAdmin() && roleName !== "admin") ||
                        roleUpdateLoading[role.id] ||
                        (!isSuperAdmin() && isProtectedUser(role.id)) ||
                        (!isSuperAdmin() && currentUser?.id === role.id && roleName === 'admin') ||
                        (!isSuperAdmin() && (typeof role.claims === 'string' ? role.claims : (role.claims as any)?.role) === 'admin' && currentUser?.id !== role.id)
                      }
                      value={userRoleChanges[role.id] || (typeof role.claims === 'string' ? role.claims : (role.claims as any)?.role) || ""}
                      onValueChange={(newRole) => handleRoleChange(role.id, newRole)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Roles</SelectLabel>
                          {roleDetails.map((roleDetail) => (
                            <SelectItem
                              key={roleDetail.id}
                              value={roleDetail.role}
                            >
                              {roleDetail.role}
                              {userRoleChanges[role.id] === roleDetail.role && " (pending)"}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {roleName === "admin" ? (
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={userStatuses[role.id] ?? true}
                          onCheckedChange={() => handleStatusToggle(role.id, userStatuses[role.id] ?? true)}
                          disabled={
                            statusLoading[role.id] ||
                            (!isSuperAdmin() && currentUser?.id === role.id) ||
                            (!isSuperAdmin() && isProtectedUser(role.id))
                          }
                        />
                        <div className="flex items-center gap-1">
                          {userStatuses[role.id] ?? true ? (
                            <>
                              <UserCheck className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-green-600">Active</span>
                            </>
                          ) : (
                            <>
                              <UserX className="h-4 w-4 text-red-600" />
                              <span className="text-sm text-red-600">Inactive</span>
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {userStatuses[role.id] ?? true ? (
                          <>
                            <UserCheck className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">Active</span>
                          </>
                        ) : (
                          <>
                            <UserX className="h-4 w-4 text-red-600" />
                            <span className="text-sm text-red-600">Inactive</span>
                          </>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {/* Super admin can change anyone's password, including protected user */}
                    {isSuperAdmin() ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedUserId(role.id);
                          setDialogOpen(true);
                          resetPasswordForm();
                        }}
                      >
                        Change Password
                      </Button>
                    ) : /* Allow password change for protected user only if they are logged in as themselves */
                    isProtectedUser(role.id) && currentUser?.id === role.id ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedUserId(role.id);
                          setDialogOpen(true);
                          resetPasswordForm();
                        }}
                      >
                        Change Password
                      </Button>
                    ) : (roleName === "admin" || currentUser?.id === role.id) && !isProtectedUser(role.id) ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedUserId(role.id);
                          setDialogOpen(true);
                          resetPasswordForm();
                        }}
                      >
                        Change Password
                      </Button>
                    ) : isProtectedUser(role.id) ? (
                      <Badge variant="secondary" className="gap-1">
                        <Shield className="w-3 h-3" />
                        Protected
                      </Badge>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Password Change Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open && !isSubmitting) {
          setSelectedUserId(null);
          resetPasswordForm();
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handlePasswordSubmit}>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                {selectedUserId === currentUser?.id
                  ? "Enter your new password"
                  : `Enter a new password for ${selectedUserId ? users.find(u => u.id === selectedUserId)?.email : ''}`
                }
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Show old password field for non-admin users changing their own password OR protected user changing their own password */}
              {/* Super admin doesn't need to provide old password */}
              {!isSuperAdmin() && ((roleName !== "admin" && currentUser?.id === selectedUserId) ||
                (isProtectedUser(selectedUserId || '') && currentUser?.id === selectedUserId)) && (
                <div className="grid gap-3">
                  <Label htmlFor="oldPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="oldPassword"
                      type={showOldPassword ? "text" : "password"}
                      value={passwordForm.oldPassword}
                      onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
              <div className="grid gap-3">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={passwordForm.password}
                    onChange={(e) => handlePasswordChange('password', e.target.value)}
                    placeholder="Enter new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {!passwordValidation.valid && passwordForm.password && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {passwordValidation.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {passwordForm.confirmPassword && passwordForm.password !== passwordForm.confirmPassword && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Passwords do not match
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              {passwordValidation.valid && passwordForm.password && passwordForm.confirmPassword && passwordForm.password === passwordForm.confirmPassword && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Password looks good!
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  !passwordValidation.valid ||
                  !passwordForm.password ||
                  !passwordForm.confirmPassword ||
                  passwordForm.password !== passwordForm.confirmPassword ||
                  (!isSuperAdmin() && ((roleName !== "admin" && currentUser?.id === selectedUserId && !passwordForm.oldPassword) ||
                   (isProtectedUser(selectedUserId || '') && currentUser?.id === selectedUserId && !passwordForm.oldPassword))) ||
                  isSubmitting
                }
              >
                {isSubmitting ? "Updating..." : "Update Password"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addUserDialogOpen} onOpenChange={(open) => {
        setAddUserDialogOpen(open);
        if (!open) {
          resetNewUserForm();
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleCreateUser}>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account with password "P@$$w0rd" and assign a role
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-3">
                <Label htmlFor="newEmail">Email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newUserForm.email}
                  onChange={(e) => handleNewUserChange('email', e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="newRole">Role</Label>
                <Select value={newUserForm.role} onValueChange={(value) => handleNewUserChange('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Roles</SelectLabel>
                      {roleDetails.map((roleDetail) => (
                        <SelectItem
                          key={roleDetail.id}
                          value={roleDetail.role}
                        >
                          {roleDetail.role}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Default password will be set to "P@$$w0rd"
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" type="button">Cancel</Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={
                  !newUserForm.email ||
                  !newUserForm.role ||
                  isCreatingUser
                }
              >
                {isCreatingUser ? "Creating..." : "Create User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Session Timeout Configuration Dialog */}
      <Dialog open={sessionTimeoutDialogOpen} onOpenChange={setSessionTimeoutDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Session Timeout Settings
            </DialogTitle>
            <DialogDescription>
              Configure how long your session stays active before automatic logout
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="sessionHours">Session Timeout (Hours)</Label>
              <Select
                value={sessionTimeoutHours.toString()}
                onValueChange={(value) => setSessionTimeoutHours(parseFloat(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeout duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Timeout Duration</SelectLabel>
                    <SelectItem value="0.0833">5 minutes (testing)</SelectItem>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="6">6 hours</SelectItem>
                    <SelectItem value="8">8 hours (default)</SelectItem>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="16">16 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Current Session Status */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Current Session</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={sessionTimeoutActive ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"}>
                    {sessionTimeoutActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Time Remaining:</span>
                  <span className="font-mono text-blue-600 dark:text-blue-300">
                    {sessionTimeoutActive ? formattedRemainingTime : '--:--:--'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Timeout Duration:</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {currentTimeoutHours < 1 ? `${Math.round(currentTimeoutHours * 60)} minutes` : `${currentTimeoutHours % 1 === 0 ? Math.round(currentTimeoutHours) : currentTimeoutHours} hours`}
                  </span>
                </div>
              </div>
              {sessionTimeoutActive && (
                <Button
                  onClick={refreshSession}
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                >
                  Refresh Session
                </Button>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your session will automatically expire after the specified time of inactivity.
                You'll receive a warning 10 minutes before expiration.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </DialogClose>
            <Button
              onClick={handleSessionTimeoutUpdate}
              disabled={sessionTimeoutHours === currentTimeoutHours}
            >
              Update Timeout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
