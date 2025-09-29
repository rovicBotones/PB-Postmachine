import React, { useEffect, useState } from "react";
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
import {
  Settings,
  Save,
  Plus,
  Trash2,
  Edit3,
  Shield,
  Users,
  Eye,
  UserPlus,
  UserX,
  FileText
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Alert,
  AlertDescription,
} from "~/components/ui/alert";
import {
  upsertPermission,
  deletePermission as deleteOldPermission,
  createRole,
  updateRole,
  deleteRole,
  createPermission,
  getAllPermissions,
  updatePermission,
  deletePermission,
  assignPermissionToRole,
  removePermissionFromRole,
} from "utils/role.service";
import { toast } from "sonner";
import { useUser } from "~/hooks/use-user";

type Roles = {
  id: string[];
  name: string;
  claims: any[];
  role_id: string;
  description?: string;
};

type RoleManagementProps = {
  roles: Roles[];
  allRoles: Roles[];
  currentUserRole: string;
};

type Permis = {
  id: number;
  claim: string;
  name: string;
  role_id: string;
};

type InsertPermis = {
  claim: string;
  name: string;
  role_id: string;
};

type Delete = {
  id: number;
};

type NewRole = {
  name: string;
  description: string;
  permissions: string[];
};

export default function RoleManagement({ roles, allRoles, currentUserRole }: RoleManagementProps) {
  const [userRoles, setUserRoles] = useState<Roles[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isNewRoleDialogOpen, setIsNewRoleDialogOpen] = useState(false);
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Roles | null>(null);
  const [newRole, setNewRole] = useState<NewRole>({
    name: "",
    description: "",
    permissions: []
  });

  // Permission creation state
  const [isNewPermissionDialogOpen, setIsNewPermissionDialogOpen] = useState(false);
  const [newPermission, setNewPermission] = useState({
    label: "",
    value: "",
    description: "",
    category: ""
  });

  // Get current user for super admin detection
  const { user: currentUser } = useUser();

  // Check if current user is admin
  const isCurrentUserAdmin = currentUserRole?.toLowerCase() === 'admin';

  // Protected user ID that cannot be edited (from environment variable)
  const PROTECTED_USER_ID = import.meta.env.VITE_PROTECTED_USER_ID || "58eb73bd-f087-47f8-a6b3-11c08c6f7eb4";

  // Helper function to check if current user is the super admin (protected user)
  const isSuperAdmin = () => currentUser?.id === PROTECTED_USER_ID;

  useEffect(() => {
    if (roles.length > 0) {
      setUserRoles(roles);
    }
  }, [roles]);

  // Load permissions from database
  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const dbPermissions = await getAllPermissions();

        // Convert database permissions to the format expected by the component
        const formattedPermissions = dbPermissions.map(perm => ({
          label: perm.label,
          value: perm.value,
          description: perm.description,
          icon: Shield, // You can map different icons based on perm.icon field
          category: perm.category,
          id: perm.id,
          isSystem: perm.is_system
        }));

        setPermissionTypes(formattedPermissions);
      } catch (error) {
        console.error("Error loading permissions:", error);
        // Keep default permissions if database load fails
      }
    };

    loadPermissions();
  }, []);

  const [permissionTypes, setPermissionTypes] = useState([
    {
      label: "View Users",
      value: "users.view",
      description: "Can view user accounts and their details",
      icon: Eye,
      category: "User Management"
    },
    {
      label: "Add Users",
      value: "users.add",
      description: "Can create new user accounts",
      icon: UserPlus,
      category: "User Management"
    },
    {
      label: "Edit Users",
      value: "users.edit",
      description: "Can modify existing user accounts",
      icon: Edit3,
      category: "User Management"
    },
    {
      label: "Delete Users",
      value: "users.delete",
      description: "Can delete user accounts",
      icon: UserX,
      category: "User Management"
    },
    {
      label: "Post to Facebook",
      value: "post.post",
      description: "Can publish posts to Facebook pages",
      icon: FileText,
      category: "Content Management"
    },
    {
      label: "Manage Roles",
      value: "roles.manage",
      description: "Can create and modify user roles and permissions",
      icon: Shield,
      category: "Administration"
    },
  ]);

  const saveChanges = async () => {
    if (!isCurrentUserAdmin) {
      toast.error("Only administrators can save role changes");
      return;
    }

    try {
      console.log("Saving role changes with new permission structure");
      console.log("Current roles:", userRoles);

      // Update each permission with its assigned roles using the new structure
      for (const permission of permissionTypes) {
        const assignedRoles: string[] = [];

        // Check which roles have this permission checked
        userRoles.forEach(role => {
          if (role.claims.includes(permission.value)) {
            assignedRoles.push(role.name);
          }
        });

        console.log(`Permission ${permission.value} assigned to roles:`, assignedRoles);

        // Update the permission with the new assigned roles
        await updatePermission(permission.id, {
          assigned_roles: assignedRoles
        });
      }

      toast.success("Permissions successfully saved");
      setHasChanges(false);

      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error("Failed to save permissions");
      console.error("Error saving permissions:", error);
    }
  };

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    // Prevent creating admin role
    if (newRole.name.toLowerCase() === 'admin') {
      toast.error("Cannot create 'admin' role - this is a reserved system role");
      return;
    }

    // Check if role name already exists
    const existingRole = userRoles.find(role =>
      role.name.toLowerCase() === newRole.name.toLowerCase()
    );
    if (existingRole) {
      toast.error("A role with this name already exists");
      return;
    }

    try {
      await createRole({
        name: newRole.name,
        description: newRole.description,
        permissions: newRole.permissions
      });

      toast.success("Role created successfully");
      setIsNewRoleDialogOpen(false);
      setNewRole({ name: "", description: "", permissions: [] });

      // Refresh the page to show the new role
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error("Failed to create role");
      console.error("Error creating role:", error);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    // Prevent deleting admin role
    if (roleName.toLowerCase() === 'admin') {
      toast.error("Cannot delete the admin role - this is a protected system role");
      return;
    }

    if (confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      try {
        await deleteRole(roleId);
        toast.success("Role deleted successfully");

        // Refresh the page to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        toast.error("Failed to delete role");
        console.error("Error deleting role:", error);
      }
    }
  };

  const resetNewRoleForm = () => {
    setNewRole({ name: "", description: "", permissions: [] });
  };

  const resetNewPermissionForm = () => {
    setNewPermission({ label: "", value: "", description: "", category: "" });
  };

  const handleCreatePermission = async () => {
    if (!isSuperAdmin()) {
      toast.error("Only super admin can create new permissions");
      return;
    }

    if (!newPermission.label.trim() || !newPermission.value.trim()) {
      toast.error("Permission label and value are required");
      return;
    }

    // Check if permission value already exists
    const existingPermission = permissionTypes.find(perm =>
      perm.value.toLowerCase() === newPermission.value.toLowerCase()
    );
    if (existingPermission) {
      toast.error("A permission with this value already exists");
      return;
    }

    try {
      // Save the new permission to the database
      const createdPermission = await createPermission({
        label: newPermission.label,
        value: newPermission.value,
        description: newPermission.description || `Permission for ${newPermission.label}`,
        category: newPermission.category || "Custom",
        createdBy: currentUser?.id || ""
      });

      // Add the new permission to the local state
      const newPerm = {
        label: createdPermission.label,
        value: createdPermission.value,
        description: createdPermission.description,
        icon: Shield, // Default icon for custom permissions
        category: createdPermission.category,
        id: createdPermission.id,
        isSystem: false
      };

      setPermissionTypes(prev => [...prev, newPerm]);

      toast.success("Permission created and saved to database");
      setIsNewPermissionDialogOpen(false);
      resetNewPermissionForm();
    } catch (error) {
      toast.error("Failed to create permission");
      console.error("Error creating permission:", error);
    }
  };

  const groupedPermissions = permissionTypes.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, typeof permissionTypes>);

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Role Management
              {!isCurrentUserAdmin && (
                <Badge variant="secondary" className="ml-2">
                  Read Only
                </Badge>
              )}
              {isSuperAdmin() && (
                <Badge variant="default" className="ml-2 bg-purple-100 text-purple-800 hover:bg-purple-100">
                  <Plus className="w-3 h-3 mr-1" />
                  Super Admin
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {isCurrentUserAdmin
                ? "Manage user roles and their permissions across the system"
                : "View user roles and their permissions across the system"
              }
              {isSuperAdmin() && permissionTypes.length > 6 && (
                <><br />Custom permissions created: {permissionTypes.length - 6}</>
              )}
            </CardDescription>
          </div>
          {isCurrentUserAdmin && (
            <div className="flex gap-2">
              {isSuperAdmin() && (
                <Button
                  onClick={() => {
                    setIsNewPermissionDialogOpen(true);
                    resetNewPermissionForm();
                  }}
                  variant="outline"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Permission
                </Button>
              )}
              <Button
                onClick={() => {
                  setIsNewRoleDialogOpen(true);
                  resetNewRoleForm();
                }}
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                New Role
              </Button>
              <Button onClick={saveChanges} className="gap-2" disabled={!hasChanges}>
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Role</TableHead>
                  {permissionTypes.map((perm) => (
                    <TableHead key={perm.value} className="text-center min-w-[120px]">
                      <div className="flex flex-col items-center gap-1">
                        <perm.icon className="h-4 w-4" />
                        <span className="text-xs">{perm.label}</span>
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userRoles.map((role, roleIdx) => {
                  const isAdminRole = role.name.toLowerCase() === 'admin';

                  return (
                    <TableRow key={role.name} className={isAdminRole ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{role.name}</div>
                            {isAdminRole && (
                              <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                System Role
                              </Badge>
                            )}
                          </div>
                          {role.description && (
                            <div className="text-sm text-muted-foreground">
                              {role.description}
                            </div>
                          )}
                          <Badge variant="outline" className="w-fit">
                            {isAdminRole ? "All permissions" : `${role.claims.length} permissions`}
                          </Badge>
                        </div>
                      </TableCell>
                      {permissionTypes.map((perm) => (
                        <TableCell key={perm.value} className="text-center">
                          <Checkbox
                            checked={isAdminRole || role.claims.includes(perm.value)}
                            disabled={isAdminRole || !isCurrentUserAdmin}
                            onCheckedChange={(checked) => {
                              if (isAdminRole || !isCurrentUserAdmin) return; // Prevent changes to admin role or by non-admin users

                              setUserRoles((prev) =>
                                prev.map((r, idx) =>
                                  idx === roleIdx
                                    ? {
                                        ...r,
                                        claims: checked
                                          ? [...r.claims, perm.value]
                                          : r.claims.filter(
                                              (c) => c !== perm.value
                                            ),
                                      }
                                    : r
                                )
                              );
                              setHasChanges(true);
                            }}
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <div className="flex gap-1 justify-center">
                          {isAdminRole ? (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Shield className="h-4 w-4" />
                              <span>Protected</span>
                            </div>
                          ) : !isCurrentUserAdmin ? (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Eye className="h-4 w-4" />
                              <span>View Only</span>
                            </div>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRole(role);
                                  setIsEditRoleDialogOpen(true);
                                }}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRole(role.role_id, role.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Role Dialog */}
      <Dialog open={isNewRoleDialogOpen} onOpenChange={setIsNewRoleDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a new role with specific permissions for your users.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="roleName">Role Name</Label>
              <Input
                id="roleName"
                value={newRole.name}
                onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter role name (e.g., Editor, Moderator)"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="roleDescription">Description</Label>
              <Textarea
                id="roleDescription"
                value={newRole.description}
                onChange={(e) => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this role can do..."
                rows={3}
              />
            </div>
            <div className="grid gap-4">
              <Label>Permissions</Label>
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category} className="space-y-3">
                  <h4 className="font-medium text-sm">{category}</h4>
                  <div className="grid gap-3 ml-4">
                    {perms.map((perm) => (
                      <div key={perm.value} className="flex items-start space-x-3">
                        <Checkbox
                          id={`new-${perm.value}`}
                          checked={newRole.permissions.includes(perm.value)}
                          onCheckedChange={(checked) => {
                            setNewRole(prev => ({
                              ...prev,
                              permissions: checked
                                ? [...prev.permissions, perm.value]
                                : prev.permissions.filter(p => p !== perm.value)
                            }));
                          }}
                        />
                        <div className="grid gap-1">
                          <label
                            htmlFor={`new-${perm.value}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {perm.label}
                          </label>
                          <p className="text-xs text-muted-foreground">
                            {perm.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateRole} disabled={!newRole.name.trim()}>
              Create Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Permission Dialog - Super Admin Only */}
      {isSuperAdmin() && (
        <Dialog open={isNewPermissionDialogOpen} onOpenChange={setIsNewPermissionDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Permission</DialogTitle>
              <DialogDescription>
                Define a new permission that can be assigned to roles.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="permissionLabel">Permission Label</Label>
                <Input
                  id="permissionLabel"
                  value={newPermission.label}
                  onChange={(e) => setNewPermission(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Enter permission label (e.g., Manage Posts)"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="permissionValue">Permission Value</Label>
                <Input
                  id="permissionValue"
                  value={newPermission.value}
                  onChange={(e) => setNewPermission(prev => ({ ...prev, value: e.target.value }))}
                  placeholder="Enter permission value (e.g., posts.manage)"
                />
                <p className="text-xs text-muted-foreground">
                  Use dot notation (e.g., posts.create, users.delete, system.admin)
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="permissionDescription">Description</Label>
                <Textarea
                  id="permissionDescription"
                  value={newPermission.description}
                  onChange={(e) => setNewPermission(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this permission allows..."
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="permissionCategory">Category</Label>
                <Input
                  id="permissionCategory"
                  value={newPermission.category}
                  onChange={(e) => setNewPermission(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Enter category (e.g., Content Management, System)"
                />
                <p className="text-xs text-muted-foreground">
                  Groups permissions together in the interface
                </p>
              </div>
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Super Admin Only:</strong> Only you can create new permissions.
                  These will be available for assignment to all roles.
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewPermissionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreatePermission}
                disabled={!newPermission.label.trim() || !newPermission.value.trim()}
              >
                Create Permission
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Permission Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Permission Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* Admin Role Notice */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Admin Role:</strong> The admin role is a protected system role that automatically has all permissions enabled.
                It cannot be edited or deleted to ensure system security and stability.
                {!isCurrentUserAdmin && (
                  <><br /><strong>Note:</strong> Only administrators can edit roles and permissions.</>
                )}
                {isSuperAdmin() && (
                  <><br /><strong>Super Admin:</strong> You can create new permissions that will be available for all roles.</>
                )}
              </AlertDescription>
            </Alert>

            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category} className="space-y-2">
                <h4 className="font-medium">{category}</h4>
                <div className="grid gap-2 ml-4">
                  {perms.map((perm) => (
                    <div key={perm.value} className="flex items-center gap-2 text-sm">
                      <perm.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{perm.label}:</span>
                      <span className="text-muted-foreground">{perm.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}