import { supabase } from "./auth.service";
type PermissionDto = {
  role: string;
  id: string;
  permission: any;
  role_id: string;
};
type Permission = {
  perms: PermissionDto[];
};
type InsertPermissionDto = {
  role: string;
  permission: any;
};
type InsertPermission = {
  perms: InsertPermissionDto[];
};
type DeletePermissionDto = {
  id: number;
};
type DeletePermission = {
  perms: DeletePermissionDto[];
};
export const upsertPermission = async (
  perms: {
    claim: string;
    name: string;
    role_id: string;
  }[]
): Promise<any[] | null> => {
  try {
    // Group permissions by claim (permission value)
    const permissionUpdates: { [key: string]: string[] } = {};

    perms.forEach((perm) => {
      if (!permissionUpdates[perm.claim]) {
        permissionUpdates[perm.claim] = [];
      }
      permissionUpdates[perm.claim].push(perm.name);
    });

    // Update each permission with its assigned roles
    const results = [];
    for (const [permissionValue, roles] of Object.entries(permissionUpdates)) {
      const { data, error } = await supabase
        .from("permissions")
        .update({ assigned_roles: roles })
        .eq("value", permissionValue)
        .select();

      if (error) {
        throw new Error(error.message);
      }
      results.push(...(data || []));
    }

    return results;
  } catch (error) {
    console.error("Error upserting permissions:", error);
    throw error;
  }
};
export const deletePermission = async (deletes: { id: number }[]) => {
  try {
    let deleteMapper: number[] = [];
    deletes.map((y) => {
      deleteMapper.push(y.id);
    });

    const { error } = await supabase
      .from("permissions")
      .delete()
      .in("id", deleteMapper);

    if (error) throw new Error(error.message);
    return null;
  } catch (error) {
    console.error("Error deleting permissions:", error);
    throw error;
  }
};

export const fetchExistingPermissions = async (): Promise<PermissionDto[]> => {
  const { data, error } = await supabase
    .from("user_permissions_view")
    .select("user_role as role, permission_value as permission, user_id as role_id");

  if (error) {
    console.error("Error fetching existing permissions:", error.message);
    return [];
  }

  return data as PermissionDto[];
};

export const fetchUserRole = async (userId: string | null) => {
  console.log('idNum: ', userId);
  let { data: user_roles, error } = await supabase
  .from('user_roles')
  .select('*')
  .eq('user_id', userId)
  return user_roles[0].role;
}

// Get user permissions directly from permissions table
export const fetchUserPermissions = async (userId: string | undefined): Promise<any[]> => {
  try {
    // First try the view
    const { data: viewData, error: viewError } = await supabase
      .from('user_permissions_view')
      .select('*')
      .eq('user_id', userId);

    if (!viewError && viewData) {
      console.log('Got permissions from view:', viewData);
      return viewData;
    }

    console.log('View failed, trying direct query. Error:', viewError?.message);

    // Fallback: Query directly using joins
    const { data: userData, error: userError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user role:', userError.message);
      return [];
    }

    console.log('User role from direct query:', userData.role);

    // Get permissions for this role
    const { data: permissionsData, error: permError } = await supabase
      .from('permissions')
      .select('*')
      .contains('assigned_roles', [userData.role]);

    if (permError) {
      console.error('Error fetching permissions:', permError.message);
      return [];
    }

    console.log('Permissions from direct query:', permissionsData);

    // Transform to match view format
    const transformedData = (permissionsData || []).map(p => ({
      user_id: userId,
      user_role: userData.role,
      permission_id: p.id,
      permission_label: p.label,
      permission_value: p.value,
      permission_description: p.description,
      permission_category: p.category,
      permission_icon: p.icon,
      is_system: p.is_system,
      assigned_roles: p.assigned_roles
    }));

    return transformedData;
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return [];
  }
};

export const createRole = async (roleData: {
  name: string;
  description: string;
  permissions: string[];
}): Promise<any> => {
  try {
    // First create the role
    const { data: roleResult, error: roleError } = await supabase
      .from("roles")
      .insert({
        role: roleData.name,
        description: roleData.description
      })
      .select()
      .single();

    if (roleError) {
      throw new Error(roleError.message);
    }

    // Add the new role to permissions
    if (roleData.permissions.length > 0) {
      for (const permissionValue of roleData.permissions) {
        const { data: currentPermission, error: fetchError } = await supabase
          .from("permissions")
          .select("assigned_roles")
          .eq("value", permissionValue)
          .single();

        if (!fetchError && currentPermission) {
          const updatedRoles = [...(currentPermission.assigned_roles || []), roleData.name];
          const { error: updateError } = await supabase
            .from("permissions")
            .update({ assigned_roles: updatedRoles })
            .eq("value", permissionValue);

          if (updateError) {
            console.error(`Error updating permission ${permissionValue}:`, updateError);
          }
        }
      }
    }

    return roleResult;
  } catch (error) {
    console.error("Error creating role:", error);
    throw error;
  }
};

export const updateRole = async (roleId: string, roleData: {
  name?: string;
  description?: string;
}): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from("roles")
      .update(roleData)
      .eq("id", roleId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Error updating role:", error);
    throw error;
  }
};

export const deleteRole = async (roleId: string): Promise<void> => {
  try {
    // Get role name first
    const { data: roleData, error: fetchError } = await supabase
      .from("roles")
      .select("role")
      .eq("id", roleId)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const roleName = roleData.role;

    // Remove role from all permissions
    const { data: permissions, error: permFetchError } = await supabase
      .from("permissions")
      .select("id, assigned_roles")
      .contains("assigned_roles", [roleName]);

    if (!permFetchError && permissions) {
      for (const permission of permissions) {
        const updatedRoles = (permission.assigned_roles || []).filter((r: string) => r !== roleName);
        await supabase
          .from("permissions")
          .update({ assigned_roles: updatedRoles })
          .eq("id", permission.id);
      }
    }

    // Delete user role assignments
    const { error: userRoleError } = await supabase
      .from("user_roles")
      .delete()
      .eq("role_id", roleId);

    if (userRoleError) {
      throw new Error(userRoleError.message);
    }

    // Then delete the role itself
    const { error: roleError } = await supabase
      .from("roles")
      .delete()
      .eq("id", roleId);

    if (roleError) {
      throw new Error(roleError.message);
    }
  } catch (error) {
    console.error("Error deleting role:", error);
    throw error;
  }
};

// Permission management functions

export const createPermission = async (permissionData: {
  label: string;
  value: string;
  description?: string;
  category?: string;
  createdBy: string;
}): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from("permissions")
      .insert({
        label: permissionData.label,
        value: permissionData.value,
        description: permissionData.description || `Permission for ${permissionData.label}`,
        category: permissionData.category || "Custom",
        created_by: permissionData.createdBy,
        is_system: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Error creating permission:", error);
    throw error;
  }
};

export const getAllPermissions = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .order("category", { ascending: true })
      .order("label", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching permissions:", error);
    throw error;
  }
};

export const updatePermission = async (permissionId: number, updates: {
  label?: string;
  value?: string;
  description?: string;
  category?: string;
  assigned_roles?: string[];
}): Promise<any> => {
  try {
    const { data, error } = await supabase
      .from("permissions")
      .update(updates)
      .eq("id", permissionId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    console.error("Error updating permission:", error);
    throw error;
  }
};


export const deleteCustomPermission = async (permissionId: number): Promise<void> => {
  try {
    // First check if this is a system permission
    const { data: permission, error: fetchError } = await supabase
      .from("permissions")
      .select("is_system")
      .eq("id", permissionId)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    if (permission?.is_system) {
      throw new Error("Cannot delete system permissions");
    }

    // Note: With the new structure, deleting a permission automatically removes role assignments
    // since roles are stored in the assigned_roles array within the permissions table
    // No separate deletion needed

    // Delete the permission
    const { error: deleteError } = await supabase
      .from("permissions")
      .delete()
      .eq("id", permissionId);

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  } catch (error) {
    console.error("Error deleting permission:", error);
    throw error;
  }
};

export const assignPermissionToRole = async (roleId: string, permissionId: number): Promise<void> => {
  try {
    // Get role name
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("role")
      .eq("id", roleId)
      .single();

    if (roleError) {
      throw new Error(roleError.message);
    }

    // Get current permission roles
    const { data: permissionData, error: permError } = await supabase
      .from("permissions")
      .select("assigned_roles")
      .eq("id", permissionId)
      .single();

    if (permError) {
      throw new Error(permError.message);
    }

    // Add role to permission if not already assigned
    const currentRoles = permissionData.assigned_roles || [];
    if (!currentRoles.includes(roleData.role)) {
      const updatedRoles = [...currentRoles, roleData.role];
      const { error } = await supabase
        .from("permissions")
        .update({ assigned_roles: updatedRoles })
        .eq("id", permissionId);

      if (error) {
        throw new Error(error.message);
      }
    }
  } catch (error) {
    console.error("Error assigning permission to role:", error);
    throw error;
  }
};

export const removePermissionFromRole = async (roleId: string, permissionId: number): Promise<void> => {
  try {
    // Get role name
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("role")
      .eq("id", roleId)
      .single();

    if (roleError) {
      throw new Error(roleError.message);
    }

    // Get current permission roles
    const { data: permissionData, error: permError } = await supabase
      .from("permissions")
      .select("assigned_roles")
      .eq("id", permissionId)
      .single();

    if (permError) {
      throw new Error(permError.message);
    }

    // Remove role from permission
    const currentRoles = permissionData.assigned_roles || [];
    const updatedRoles = currentRoles.filter((role: string) => role !== roleData.role);
    const { error } = await supabase
      .from("permissions")
      .update({ assigned_roles: updatedRoles })
      .eq("id", permissionId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    console.error("Error removing permission from role:", error);
    throw error;
  }
};

export const getRolePermissions = async (roleId: string): Promise<any[]> => {
  try {
    // Get role name
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("role")
      .eq("id", roleId)
      .single();

    if (roleError) {
      throw new Error(roleError.message);
    }

    // Get permissions for this role
    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .contains("assigned_roles", [roleData.role]);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    throw error;
  }
};