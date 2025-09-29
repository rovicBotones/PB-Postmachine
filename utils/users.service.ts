import {
  AuthError,
  createClient,
  type Session,
  type User,
  type WeakPassword,
} from "@supabase/supabase-js";
import { useState } from "react";
export const supabase = createClient(
  import.meta.env.VITE_WP_SUPABASE_PROJ,
  import.meta.env.VITE_SERVICE_ROLE,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
export const getRolesFromAPI = async () => {
  let { data: roles, error } = await supabase.from("roles").select(`*`);
  if (error || !roles) {
    console.error("Error fetching roles:", error);
    return [];
  }

  const permissions = await Promise.all(
    roles.map(async (role) => {
      // Get permissions for this role from the permissions table
      const { data: role_permissions } = await supabase
        .from("permissions")
        .select("*")
        .contains("assigned_roles", [role.role]);

      return {
        id: role_permissions?.map((x) => x.id) || [],
        name: role.role,
        claims: role_permissions?.map((x) => x.value) || [],
        role_id: role.id,
      };
    })
  );
  return permissions;
};

export const getUsersFromAPI = async (
  role: string,
  sess: string | undefined
) => {
  let userRoles: any[] = [];
  const {
    data: { users },
    error,
  } = await supabase.auth.admin.listUsers();
  if (error || !users) {
    console.error("Error fetching user:", error);
    return [];
  }
  console.log("users: ", sess);
  if (role !== "admin") {
    userRoles = await Promise.all(
      users
        .filter((u) => u.id === sess)
        .map(async (user) => {
          const { data: user_roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id);
          return {
            id: user.id,
            email: user.email,
            claims: user_roles[0] || "No Role",
          };
        })
    );
    // const { data: user_roles } = await supabase
    //       .from("user_roles")
    //       .select("*")
    //       .eq("user_id", sess);
    // userRoles?.push({
    //   id: user_roles[0].id,
    //   email: user_roles[0].email,
    //   claims: sess
    // })
  } else {
    userRoles = await Promise.all(
      users.map(async (user) => {
        const { data: user_roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        return {
          id: user.id,
          email: user.email,
          claims: user_roles[0] || "No Role",
        };
      })
    );
  }
  console.log("this: ", userRoles);
  return userRoles;
};
export const getRoles = async () => {
  const { data: roles, error } = await supabase.from("roles").select("*");
  if (error || !roles) {
    console.error("Error fetching roles:", error);
    return [];
  }
  return roles;
};
export const getCurrentUserId = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error("Failed to get user:", error);
    return null;
  }

  return user?.id || null;
};

export const getUserRole = async (userId: string | undefined) => {
  console.log('getUserRole called with userId:', userId);

  if (!userId) {
    console.log('No userId provided');
    return null;
  }

  let { data: user_roles, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  console.log('getUserRole query result:', { user_roles, error });

  if (error) {
    console.error('Error fetching user role:', error.message);
    throw new Error(error.message);
  }

  if (!user_roles || user_roles.length === 0) {
    console.log('No role found for user:', userId);
    return null;
  }

  const role = user_roles[0].role;
  console.log('User role found:', role);
  return role;
};

// Password change functionality
type PasswordChangeResult = {
  success: boolean;
  error?: string;
  message?: string;
};

// Verify current password by attempting to update with the same password
export const verifyCurrentPassword = async (
  userId: string,
  currentPassword: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get user details first
    const { data: user } = await supabase.auth.admin.getUserById(userId);

    if (!user.user?.email) {
      return { success: false, error: "User not found" };
    }

    // Create a temporary supabase client to test the password
    const tempSupabase = createClient(
      import.meta.env.VITE_WP_SUPABASE_PROJ,
      import.meta.env.VITE_WP_SUPABASE_ANON_KEY
    );

    // Try to sign in with the current password to verify it
    const { error } = await tempSupabase.auth.signInWithPassword({
      email: user.user.email,
      password: currentPassword
    });

    // Sign out immediately to avoid session issues
    await tempSupabase.auth.signOut();

    if (error) {
      return { success: false, error: "Current password is incorrect" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify password"
    };
  }
};

export const changeUserPassword = async (
  userId: string,
  newPassword: string,
  currentPassword?: string
): Promise<PasswordChangeResult> => {
  try {
    // If current password is provided, verify it first
    if (currentPassword) {
      console.log('Password change attempt:', {
        userId,
        currentPassword: currentPassword.substring(0, 3) + '***',
        newPassword: newPassword.substring(0, 3) + '***',
        areEqual: currentPassword === newPassword
      });

      // Check if current password equals new password
      if (currentPassword === newPassword) {
        console.log('BLOCKING: Current password equals new password');
        return {
          success: false,
          error: "New password must be different from current password"
        };
      }

      // Verify the current password
      console.log('Verifying current password...');
      const verification = await verifyCurrentPassword(userId, currentPassword);
      console.log('Verification result:', verification);

      if (!verification.success) {
        console.log('BLOCKING: Current password verification failed');
        return {
          success: false,
          error: verification.error || "Current password verification failed"
        };
      }
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return {
        success: false,
        error: "Password must be at least 6 characters long"
      };
    }

    // Update user password using Supabase Admin API
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      message: "Password updated successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
};

export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

export const validatePasswordStrength = (password: string): { valid: boolean; message?: string } => {
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters long" };
  }

  if (password.length < 8) {
    return { valid: false, message: "Password should be at least 8 characters for better security" };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasNonalphas = /\W/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
    return {
      valid: false,
      message: "Password should contain uppercase, lowercase, and numbers for better security"
    };
  }

  return { valid: true };
};

// Create new user functionality
type CreateUserResult = {
  success: boolean;
  error?: string;
  message?: string;
  user?: any;
};

export const createNewUser = async (
  email: string,
  password: string,
  role: string
): Promise<CreateUserResult> => {
  try {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: "Please enter a valid email address"
      };
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return {
        success: false,
        error: passwordValidation.message || "Password is not strong enough"
      };
    }

    // Create user using Supabase Admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Auto-confirm email
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    if (!data.user) {
      return {
        success: false,
        error: "Failed to create user"
      };
    }

    // Assign role to the new user
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: data.user.id,
        role: role
      });

    if (roleError) {
      // If role assignment fails, we should clean up the created user
      console.error('Role assignment failed:', roleError);
      // Note: You might want to delete the user here if role assignment fails
      return {
        success: false,
        error: "User created but role assignment failed. Please assign role manually."
      };
    }

    return {
      success: true,
      message: "User created successfully",
      user: data.user
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
};

// User activation/deactivation functionality
type UserStatusResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export const toggleUserStatus = async (
  userId: string,
  activate: boolean
): Promise<UserStatusResult> => {
  try {
    // Update user status using Supabase Admin API
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: activate ? "none" : "876000h" // Ban for 100 years if deactivating, remove ban if activating
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      message: activate ? "User activated successfully" : "User deactivated successfully"
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
};

export const getUserStatus = async (userId: string): Promise<{ isActive: boolean; error?: string }> => {
  try {
    const { data: user, error } = await supabase.auth.admin.getUserById(userId);

    if (error || !user.user) {
      return { isActive: false, error: error?.message || "User not found" };
    }

    // Check if user is banned (banned_until exists and is in the future)
    const isActive = !user.user.banned_until || new Date(user.user.banned_until) <= new Date();

    return { isActive };
  } catch (error) {
    return {
      isActive: false,
      error: error instanceof Error ? error.message : "Failed to check user status"
    };
  }
};

// Update user role functionality
type UpdateUserRoleResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export const updateUserRole = async (
  userId: string,
  newRole: string
): Promise<UpdateUserRoleResult> => {
  try {
    // Check if user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError || !user.user) {
      return {
        success: false,
        error: "User not found"
      };
    }

    // Check if role exists in roles table
    const { data: roleData, error: roleError } = await supabase
      .from('roles')
      .select('id, role')
      .eq('role', newRole)
      .single();

    if (roleError || !roleData) {
      return {
        success: false,
        error: "Invalid role specified"
      };
    }

    // Check if user already has a role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingRole) {
      // Update existing role
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (updateError) {
        return {
          success: false,
          error: updateError.message
        };
      }
    } else {
      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: newRole
        });

      if (insertError) {
        return {
          success: false,
          error: insertError.message
        };
      }
    }

    return {
      success: true,
      message: `User role updated to ${newRole} successfully`
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "An unexpected error occurred"
    };
  }
};
