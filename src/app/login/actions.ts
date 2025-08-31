"use server";

import { createServerAction } from "zsa";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { loginSchema } from "./_core/login.schemas";
import { signIn } from "../(auth)/auth";

export const loginAction = createServerAction()
  .input(loginSchema)
  .handler(async ({ input }) => {
    const { email, password } = input;

    const { success, user } = await signIn(email, password);

    redirect("/dashboard");
  });
