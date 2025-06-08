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
import {
  upsertPermission,
  insertPermission,
  deletePermission,
  fetchExistingPermissions,
} from "utils/role.service";
import { toast } from "sonner";

// type Role = "View" | "Add" | "Edit" | "Delete";

type Roles = {
  id: string;
  name: string;
  claims: any[];
  role_id: any[];
};

type UserRoleTableProps = {
  roles: Roles[];
};
export default function Component({ roles }: UserRoleTableProps) {
  const [userRoles, setUserRoles] = useState<Roles[]>([]);

  useEffect(() => {
    if (roles.length > 0) {
      setUserRoles(roles);
    }
  }, [roles]);
  const [hasChanges, setHasChanges] = useState(false);
  console.log("roles: ", userRoles);
  const saveChanges = async () => {
    const userRoleCount = userRoles.flatMap((x) => x).length;
    const idCount = userRoles.flatMap((x) => x.claims).length;
    const permsInsert = [];
    const permsUpdate = [];
    const permsDelete = [];
    for (let i = 0; i < userRoleCount; i++) {
      let userRole = userRoles[i];
      for (let j = 0; j < idCount; j++) {
        let name = userRole.name;
        let id = userRole.id[j];
        let permission = userRole.claims[j];
        let role_id = userRole.role_id;
        if (permission) {
          if (id) {
            permsUpdate.push({
              role: name,
              id: id,
              permission: permission,
              role_id: role_id,
            });
          } else {
            permsInsert.push({
              role: name,
              permission: permission,
              role_id: role_id,
            });
          }
        }
        permsDelete.push({
          id: id,
          permission: permission,
        });
      }
    }
    // console.log("perms: ", perms);
    // let permission = await upsertPermission({ perms: perms });
    // if (!permission) {
    //   toast.error("Error on saving permission");
    // }
    if (permsUpdate.length > 0) {
      const updatePermission = await upsertPermission({ perms: permsUpdate });
      if (!updatePermission) {
        toast.error("Error on saving permission");
        return;
      }
    }
    if (permsInsert.length > 0) {
      const insertPermissionResult = await insertPermission({
        perms: permsInsert,
      });
      if (!insertPermissionResult) {
        toast.error("Error on inserting permission");
        return;
      }
    }
    if (permsDelete.length > 0) {
      const res = await deletePermission({ perms: permsDelete });
    }
    console.log("permsDelete: ", permsDelete);
    toast.success("Permission successfully saved");
    setHasChanges(false);
  };
  type PermissionDto = {
    role: string;
    id: string;
    permission: any;
  };
  type InsertPermissionDto = {
    role: string;
    permission: any;
  };
  type DeletePermissionDto = {
    id: string;
    permission: any;
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
            Role Management
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
              {userRoles.map((role, roleIdx) => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  {permissionTypes.map((perm) => (
                    <TableCell key={perm.value}>
                      <Checkbox
                        checked={role.claims.includes(perm.value)}
                        // onCheckedChange={() => toggleRole(perm.label, perm.value)}
                        onCheckedChange={(checked) => {
                          setUserRoles((prev) =>
                            prev.map((r, idx) =>
                              idx === roleIdx
                                ? {
                                    ...r,
                                    claims: checked
                                      ? [...r.claims, perm.value]
                                      : r.claims.filter(
                                          (c) => c !== perm.value
                                        ),
                                  }
                                : r
                            )
                          );
                          setHasChanges(true);
                        }}
                      />
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
