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
  // const { data: { users }, error } = await supabase.auth.admin.listUsers()

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
        id: role.id,
        name: role.role,
        claims: role_permissions?.map((x) => x.permission) || [],
      };
    })
  );
  return permissions;
};
export const getUsersFromAPI = async () => {
  const {
    data: { users },
    error,
  } = await supabase.auth.admin.listUsers();
  if (error || !users) {
    console.error("Error fetching user:", error);
    return [];
  }
  // console.log("users: ", users);
  const userRoles = await Promise.all(
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
  return userRoles;
};
export const getRoles = async () => {
    const { data: roles, error } = await supabase.from("roles").select("*");
    if (error || !roles) {
        console.error("Error fetching roles:", error);
        return [];
    }
    return roles;
}
