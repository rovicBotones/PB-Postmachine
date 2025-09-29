import React from "react";
import {
  getRolesFromAPI,
  getRoles,
  getUserRole
} from "utils/users.service";
import { fetchUserRole } from "utils/role.service";
import RoleManagement from "../components/role-management";
import type { Route } from "./+types/_layout.settings";
import { redirect, useLoaderData } from "react-router";
import { isAuthenticated, session } from "utils/auth.service";
import { toast } from "sonner";

export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const isLoggedIn = await isAuthenticated();
  if (!isLoggedIn) {
    toast("Please log in to access settings");
    return redirect("/");
  }

  const sessDetails = await session();
  const role = await getUserRole(sessDetails.sessionDetails);

  // Only admins can access settings
  // if (role !== "admin") {
  //   toast.error("Access denied. Admin privileges required.");
  //   return redirect("/home");
  // }

  const permission = await getRolesFromAPI();
  const roleDetails = await getRoles();

  return {
    roles: permission,
    roleDetails: roleDetails,
    role: role,
  };
}

export default function Settings() {
  const { roles, roleDetails, role } = useLoaderData<typeof clientLoader>();

  return (
    <div className="m-2">
      <h1 className="text-2xl font-bold my-4 mx-2">Settings</h1>
      <div className="space-y-6">
        <RoleManagement roles={roles} allRoles={roleDetails} currentUserRole={role} />
      </div>
    </div>
  );
}