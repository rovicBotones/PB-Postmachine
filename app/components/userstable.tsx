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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

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
};

type UserRoleTableProps = {
  users: Users[];
  roleDetails: RoleDetails[];
  role: string;
};
export default function Component({
  users,
  roleDetails,
  role,
}: UserRoleTableProps) {
  const [hasChanges, setHasChanges] = useState(false);
  const roleName = role;
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
        {role === "admin" ? (
          <Button onClick={saveChanges} className="gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        ) : (
          <></>
        )}
      </CardHeader>
      <CardContent>
        <div className="">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>{role.email}</TableCell>
                  <TableCell>
                    <Select disabled={roleName !== "admin"}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={role.claims.role} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Roles</SelectLabel>
                          {roleDetails.map((roleDetail) => (
                            <SelectItem
                              key={roleDetail.id}
                              value={roleDetail.role}
                            >
                              {roleDetail.role}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        console.log("hello");
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline">Change Password</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>
                              Make changes to your profile here. Click save when
                              you&apos;re done.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4">
                            <div className="grid gap-3">
                              <Label htmlFor="pass-1">Password</Label>
                              <Input
                                id="pass-1"
                                name="pass-1"
                                type="password"
                              />
                            </div>
                            <div className="grid gap-3">
                              <Label htmlFor="pass-2">Re-type Password</Label>
                              <Input
                                id="pass-2"
                                name="pass-2"
                                type="password"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button type="submit">Save changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </form>
                    </Dialog>
                    
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
