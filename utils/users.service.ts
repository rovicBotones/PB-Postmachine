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
    console.error("Error fetching user:", error);
    return [];
  }
  const permissions = await Promise.all(
    roles.map(async (role) => {
      const { data: role_permissions } = await supabase
        .from("role_permissions")
        .select("*")
        .eq("role_id", role.id);

      return {
        id: role_permissions?.map((x) => x.id) || [],
        name: role.role,
        claims: role_permissions?.map((x) => x.permission) || [],
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
  let { data: user_roles, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return user_roles ? user_roles[0].role : null;
};
