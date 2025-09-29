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
  deletePermission,
  fetchExistingPermissions,
} from "utils/role.service";
import { toast } from "sonner";

// type Role = "View" | "Add" | "Edit" | "Delete";

type Roles = {
  id: string[];
  name: string;
  claims: any[];
  role_id: string;
};

type UserRoleTableProps = {
  roles: Roles[];
  allRoles: Roles[];
};
type Permis = {
  id: number;
  claim: string;
  name: string;
  role_id: string;
};
type InsertPermis = {
  claim: string;
  name: string;
  role_id: string;
};
type Delete = {
  id: number;
};
export default function Component({ roles, allRoles }: UserRoleTableProps) {
  const [userRoles, setUserRoles] = useState<Roles[]>([]);

  useEffect(() => {
    if (roles.length > 0) {
      setUserRoles(roles);
    }
  }, [roles]);
  const [hasChanges, setHasChanges] = useState(false);
  const saveChanges = async () => {
    console.log("roles: ", userRoles, roles);
    const userRoleCount = userRoles.flatMap((x) => x).length;
    const idCount = userRoles.flatMap((x) => x.claims).length;
    const permsUpdate: Permis[] = [];
    const perms: any[] = [];
    const permsInsert: Permis[] = [];

    roles.forEach((x) => {
      for (let i = 0; i < x.id.length; i++) {
        const claim = x.claims[i];
        const roleId = x.role_id;
        const id = x.id[i];
        perms.push({
          id: id,
          claim: claim,
          roleId: roleId,
        });
      }
    });
    userRoles.forEach(async (x) => {
      for (let i = 0; i < x.claims.length; i++) {
        const claim = x.claims[i];
        const roleId = x.role_id;
        const id = x.id[i];
        if (claim) {
          permsInsert.push({
            id: Number(id),
            claim: claim,
            name: x.name,
            role_id: String(roleId),
          });
          permsUpdate.push({
            id: Number(id),
            claim: claim,
            name: x.name,
            role_id: String(roleId),
          });
        }
      }
    });
    console.log("claim: ", userRoles, roles, permsUpdate);
    let permisnew: Permis[] = [];
    let toDelete: Delete[] = [];
    let toInsert: InsertPermis[] = [];
    permsInsert.forEach((e) => {
      if (isNaN(Number(e.id))) {
        toInsert.push({
          claim: e.claim,
          name: e.name,
          role_id: e.role_id
        });
      }
    });
    perms.forEach((e) => {
      const existsInUpdate = permsUpdate.some((element) => element.id === e.id);
      if (!existsInUpdate) {
        toDelete.push({
          id: e.id,
        });
      }
    });
    if (toDelete.length > 0 && toDelete) {
      await deletePermission(toDelete);
    }
    if (permsUpdate.length > 0 && permsUpdate) {
      await upsertPermission(toInsert);
    }
    console.log("toDelete: ", toDelete);

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
                <TableRow key={role.name}>
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
