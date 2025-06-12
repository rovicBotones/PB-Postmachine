import { supabase } from "./auth.service";
type PermissionDto = {
  role: string;
  id: string;
  permission: any;
  role_id: string;
};
type Permission = {
  perms: PermissionDto[];
};
type InsertPermissionDto = {
  role: string;
  permission: any;
};
type InsertPermission = {
  perms: InsertPermissionDto[];
};
type DeletePermissionDto = {
  id: number;
};
type DeletePermission = {
  perms: DeletePermissionDto[];
};
export const upsertPermission = async (
  perms: {
    claim: string;
    name: string;
    role_id: string;
  }[]
): Promise<any[] | null> => {
  let upsertMapper: { role: string; permission: string; role_id: string }[] = [];
  perms.map((y) => {
    upsertMapper.push({
      role: y.name,
      permission: y.claim,
      role_id: y.role_id,
    });
  });
  console.log("upsertMapper: ", upsertMapper);
  const { data, error } = await supabase
    .from("role_permissions")
    .insert(upsertMapper)
    .select();
  if (error) {
    throw new Error(error.message);
  }
  return data;
  // return null
};
export const deletePermission = async (deletes: { id: number }[]) => {
  let deleteMapper: number[] = [];
  deletes.map((y) => {
    deleteMapper.push(y.id);
  });
  const { error } = await supabase
    .from("role_permissions")
    .delete()
    .in("id", deleteMapper);
  if (error) throw new Error(error.message);
  return error;
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

export const fetchUserRole = async (userId: string | null) => {
  console.log('idNum: ', userId);
  let { data: user_roles, error } = await supabase
  .from('user_roles')
  .select('*')
  .eq('user_id', userId)
  return user_roles[0].role;
}