import { supabase } from "./auth.service";
type PermissionDto = {
    role: string;
    id: string;
    permission: any;
}
type Permission ={
    perms: PermissionDto[];
}
type InsertPermissionDto = {
    role: string;
    permission: any;
}
type InsertPermission ={
    perms: InsertPermissionDto[];
}
type DeletePermissionDto = {
    id: string;
    permission: any;
}
type DeletePermission ={
    perms: DeletePermissionDto[];
}
export const upsertPermission = async (perms: Permission): Promise<any[] | null> => {
  const { data, error } = await supabase
    .from("role_permissions")
    .upsert(perms.perms)
    .select();
  if (error) {
    throw new Error(error.message);
  }
  return data;
// console.log("perms: ", JSON.stringify(perms.perms));
// return null
};
export const insertPermission = async (perms: InsertPermission): Promise<any[] | null> => {
  const { data, error } = await supabase
    .from("role_permissions")
    .insert(perms.perms)
    .select();
  if (error) {
    throw new Error(error.message);
  }
  return data;
// console.log("perms: ", JSON.stringify(perms.perms));
// return null
};
export const deletePermission = async (perms: DeletePermission) => {
  const { error } = await supabase
    .from("role_permissions")
    .delete()
    .match(perms.perms);
  if (error) throw new Error(error.message);
  return error
};

export const fetchExistingPermissions = async (): Promise<PermissionDto[]> => {
  const { data, error } = await supabase
    .from("role_permissions")
    .select("id, role, permission, role_id");

  if (error) {
    console.error("Error fetching existing permissions:", error.message);
    return [];
  }

  return data as PermissionDto[];
};