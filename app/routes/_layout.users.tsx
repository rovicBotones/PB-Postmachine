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
import { useLoaderData } from "react-router";
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const permission = await getRolesFromAPI();
  const users = await getUsersFromAPI();
  const roleDetails = await getRoles();
  // const userId = await getCurrentUserId();
  // const roleofUser = await fetchUserRole(userId);
  // console.log("roleofUser: ", roleofUser);
  return {
    roles: permission,
    users: users,
    roleDetails: roleDetails
  };
}
export default function Page() {
  const { roles, users, roleDetails} =
    useLoaderData<typeof clientLoader>();
  return (
    <div className="m-2">
      
          <h1 className="text-2xl font-bold my-4 mx-2">Roles</h1>
          <UserRoleTable roles={roles} allRoles={roleDetails} />
        

      <h1 className="text-2xl font-bold my-4 mx-2">Users</h1>
      <UsersTable users={users} roleDetails={roleDetails} />
    </div>
  );
}
