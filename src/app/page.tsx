'use client'

import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            AireBot <span className="text-sky-600">·</span>{" "}
            <span className="text-slate-600">Presupuestos de A/A en minutos</span>
          </h1>
          <p className="mt-2 text-slate-600">
            Asistente para reparación e instalación de aire acondicionado.
          </p>
        </header>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Chat de presupuesto</h2>
            <span className="text-xs text-slate-500">MVP</span>
          </div>

          <div className="h-[420px] w-full rounded-xl border bg-slate-50 p-4 text-slate-500">
            Aquí irá el flujo de chat (mensajes y formulario).
          </div>

          <div className="mt-4 flex gap-2">
            <input
              placeholder="Describe tu problema…"
              className="w-full rounded-xl border px-3 py-2 outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button className="rounded-xl bg-sky-600 px-4 py-2 text-white hover:bg-sky-700">
              Enviar
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
