import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
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
import { Heading1, Save, UserCheck } from "lucide-react";
import type { Route } from "../routes/+types/_layout.users";

// type Role = "View" | "Add" | "Edit" | "Delete";

type Roles = {
  id: string;
  name: string;
  claims: any[];
};

type UserRoleTableProps = {
  roles: Roles[];
};
export default function Component({ roles }: UserRoleTableProps) {
  const claims = [
    {
      id: "1",
      name: "View",
    },
    {
      id: "2",
      name: "Add",
    },
    {
      id: "3",
      name: "Edit",
    },
    {
      id: "4",
      name: "Delete",
    },
  ];
  const [userRoles, setUserRoles] = useState<Roles[]>([]);

  useEffect(() => {
    if (roles.length > 0) {
      setUserRoles(roles);
    }
  }, [roles]);

  const [hasChanges, setHasChanges] = useState(false);

  const saveChanges = () => {
    // Here you would typically save to your backend
    console.log("Saving user roles:", roles);
    setHasChanges(false);
  };
  const permissionTypes = [
    { label: "View", value: "users.view" },
    { label: "Add", value: "users.add" },
    { label: "Edit", value: "users.edit" },
    { label: "post", value: "post.post" },
  ];
  return (
    <Card className="w-full ">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            User Role Management
          </CardTitle>
          {/* <CardDescription>Manage user permissions and access levels</CardDescription>a  */}
        </div>
        {
          <Button onClick={saveChanges} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        }
      </CardHeader>
      <CardContent>
        <div className="">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roles</TableHead>
                <TableHead>View User</TableHead>
                <TableHead>Add User</TableHead>
                <TableHead>Edit User</TableHead>
                <TableHead>Post To FB</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {userRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  {permissionTypes.map((perm) => (
                    <TableCell key={perm.value}>
                      <Checkbox checked={role.claims.includes(perm.value)} />
                      
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
