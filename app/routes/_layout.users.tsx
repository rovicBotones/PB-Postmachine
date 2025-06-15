import React, { useEffect, useState } from "react";
import {
  getRolesFromAPI,
  getUsersFromAPI,
  getRoles,
} from "utils/users.service";
import { fetchUserRole } from "utils/role.service";
import { getCurrentUserId } from "utils/users.service";
import UserRoleTable from "../components/user-tole-table";
import UsersTable from "../components/userstable";
import type { Route } from "./+types/_layout.users";
import { getUserRole } from "utils/users.service";
import { redirect, useLoaderData } from "react-router";
import { isAuthenticated, session } from "utils/auth.service";
import { toast } from "sonner";
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const isLoggedIn = await isAuthenticated();
  if (!isLoggedIn) {
    toast("My first toast");
    return redirect("/");
  }
  const permission = await getRolesFromAPI();

  const roleDetails = await getRoles();
  const sessDetails = await session();
  const role = await getUserRole(sessDetails.sessionDetails);
    const users = await getUsersFromAPI(role, sessDetails.sessionDetails);
  // const userId = await getCurrentUserId();
  // const roleofUser = await fetchUserRole(userId);
  // console.log("roleofUser: ", roleofUser);
  return {
    roles: permission,
    users: users,
    roleDetails: roleDetails,
    role: role,
  };
}
export default function Page() {
  const { roles, users, roleDetails, role } =
    useLoaderData<typeof clientLoader>();
  console.log("role: ", role);
  return (
    <div className="m-2">
      {role === "admin" ? (
        <>
          <h1 className="text-2xl font-bold my-4 mx-2">Roles</h1>
          <UserRoleTable roles={roles} allRoles={roleDetails} />
        </>
      ) : (
        <></>
      )}

      <h1 className="text-2xl font-bold my-4 mx-2">Users</h1>
      <UsersTable users={users} roleDetails={roleDetails} role={role} />
    </div>
  );
}
