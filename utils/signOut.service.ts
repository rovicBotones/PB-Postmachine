import { supabase } from './auth.service'
export const signoutService = async () => {
    let { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error signing out:", error);
        return { success: false, error };
    }
    return { success: true };
}