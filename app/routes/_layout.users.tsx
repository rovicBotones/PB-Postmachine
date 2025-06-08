
import React, { useEffect, useState } from "react";
import { getRolesFromAPI, getUsersFromAPI, getRoles } from "utils/users.service";
import UserRoleTable from "../components/user-tole-table";
import UsersTable from "../components/userstable";
import type { Route } from "./+types/_layout.users";
import { useLoaderData } from "react-router";
export async function clientLoader({params}: Route.ClientLoaderArgs) {
  const permission = await getRolesFromAPI();
  const users = await getUsersFromAPI();
  const roleDetails = await getRoles();
  return { roles: permission, users: users, roleDetails: roleDetails };
}
export default function Page(){
  const { roles, users, roleDetails } = useLoaderData<typeof clientLoader>();
  console.log('roles from useres: ', roles);
  return (
    <div className="m-2">
      
      <h1 className="text-2xl font-bold my-4 mx-2">Roles</h1>
          <UserRoleTable roles={roles}/>
      <h1 className="text-2xl font-bold my-4 mx-2">Users</h1>
          <UsersTable users={users} roleDetails={roleDetails} />
    </div>
    
  )
}