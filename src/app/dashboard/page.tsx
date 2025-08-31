'use client'

import { signOut } from "../(auth)/auth";

export default function DashboardPage() {

    const handleLogout = async () => {
        await signOut();
    };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard - AireBot ERP</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">Bienvenido</h2>
          <p className="text-muted-foreground">
            Has iniciado sesión exitosamente en AireBot ERP
          </p>
        </div>
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">Órdenes de Trabajo</h2>
          <p className="text-muted-foreground">
            Gestiona las reparaciones de equipos de aire acondicionado
          </p>
        </div>
        <div className="bg-card p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-2">Clientes</h2>
          <p className="text-muted-foreground">
            Administra la información de tus clientes
          </p>
        </div>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>
    </div>
  )
}
