'use server'

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export async function signIn(email: string, password: string) {
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    success: true,
    user: authData.user,
  };
}

export async function signOut() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  redirect("/login");

  return {
    success: true,
  };
}
