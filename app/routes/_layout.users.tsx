import React, { useEffect, useState } from "react";
import {
  getUsersFromAPI,
  getRoles,
  getUserRole
} from "utils/users.service";
import { fetchUserRole } from "utils/role.service";
import UsersTable from "../components/userstable";
import type { Route } from "./+types/_layout.users";
import { redirect, useLoaderData } from "react-router";
import { isAuthenticated, session } from "utils/auth.service";
import { toast } from "sonner";
export async function clientLoader({ params }: Route.ClientLoaderArgs) {
  const isLoggedIn = await isAuthenticated();
  if (!isLoggedIn) {
    toast("Please log in to access settings");
    return redirect("/");
  }

  const roleDetails = await getRoles();
  const sessDetails = await session();
  const role = await getUserRole(sessDetails.sessionDetails);
  const users = await getUsersFromAPI(role, sessDetails.sessionDetails);

  return {
    users: users,
    roleDetails: roleDetails,
    role: role,
  };
}
export default function Page() {
  const { users, roleDetails, role } =
    useLoaderData<typeof clientLoader>();
  console.log("role: ", role);
  return (
    <div className="m-2">
      <h1 className="text-2xl font-bold my-4 mx-2">Users</h1>
      <UsersTable users={users} roleDetails={roleDetails} role={role} />
    </div>
  );
}
