import { AuthError, createClient, type Session, type User, type WeakPassword } from "@supabase/supabase-js";
import { useState } from "react";

export const supabase = createClient(import.meta.env.VITE_WP_SUPABASE_PROJ, import.meta.env.VITE_WP_ANON_KEY);
type Login =  {
    data: data; // Replace `any` with the actual type if known
    error: AuthError | null;
}
type data = {
    user: User;
    session: Session;
    weakPassword?: WeakPassword;
} | {
    user: null;
    session: null;
    weakPassword?: null;
}
export const singInService = async (
    email: string,
    password: string
): Promise<Login> => {
    let { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    })
    return { data, error };
}

export const isAuthenticated = async (): Promise<boolean> => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
        console.error("Error fetching session:", error);
        return false;
    }
    return session !== null;
}
export const getAcessToken = async (): Promise<string | null> => {
    let { data: Access, error } = await supabase
      .from('Access')
      .select('access_token')
      .order('id', { ascending: false }) // Or use 'created_at' if that's your timestamp field
      .limit(1);
      return error ? null : Access?.[0]?.access_token || null;
}

// 
