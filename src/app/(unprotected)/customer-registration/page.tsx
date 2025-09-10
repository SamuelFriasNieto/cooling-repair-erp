"use client";

import { use, useEffect } from "react";
import { redirect } from "next/navigation";
import { CustomerRegistrationForm } from "./_components/customerRegistrationForm";

export default function SolicitudPage() {


  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full sm:max-w-md max-w-sm flex-col gap-6">
        <img className="w-[65%] mx-auto" src="/logo-1.png" alt="" />
        <CustomerRegistrationForm />
      </div>
    </div>
  )
}