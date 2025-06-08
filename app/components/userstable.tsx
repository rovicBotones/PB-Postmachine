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
import { Fingerprint, Heading1, Save, UserCheck } from "lucide-react";
import type { Route } from "../routes/+types/_layout.users";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";

// type Role = "View" | "Add" | "Edit" | "Delete";

type Users = {
  id: string;
  email: string;
  claims: string;
};
type RoleDetails = {
    id: string;
    role: string;
    description?: string;
}

type UserRoleTableProps = {
  users: Users[];
  roleDetails: RoleDetails[];
};
export default function Component({ users, roleDetails }: UserRoleTableProps) {
  const [hasChanges, setHasChanges] = useState(false);
  const saveChanges = () => {
    // Here you would typically save to your backend
    console.log("Saving user roles:", users);
    setHasChanges(false);
  };
  return (
    <Card className="w-full ">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            User Management
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
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.email}</TableCell>
                  <TableCell>
                    <Select>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={role.claims.role}/>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Roles</SelectLabel>
                          {roleDetails.map((roleDetail) => (
                            <SelectItem key={roleDetail.id} value={roleDetail.role}>{roleDetail.role}</SelectItem>
                          ))}
                          
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
