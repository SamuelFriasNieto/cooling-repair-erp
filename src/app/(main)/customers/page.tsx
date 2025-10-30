import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerTable } from "./_components/customer-table";
import { CustomerStats } from "./_components/customer-stats";
import { CreateCustomerDialog } from "./_components/create-customer-dialog";
import { Plus, Users } from "lucide-react";

interface CustomersPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    city?: string;
    state?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const params = await searchParams;
  
  // Parámetros de filtrado con valores por defecto
  const filters = {
    page: parseInt(params.page || "1"),
    search: params.search || "",
    city: params.city || "",
    state: params.state || "",
    sortBy: (params.sortBy as "name" | "email" | "city" | "created_at" | "updated_at") || "name",
    sortOrder: (params.sortOrder as "asc" | "desc") || "asc",
    limit: 10,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Users className="h-6 w-6" />
            Gestión de Clientes
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra la información de tus clientes y sus datos de contacto
          </p>
        </div>
        <CreateCustomerDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Cliente
          </Button>
        </CreateCustomerDialog>
      </div>

      {/* Stats Cards */}
      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cargando...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-6 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      }>
        <CustomerStats />
      </Suspense>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            Visualiza y gestiona todos los clientes registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Suspense fallback={
            <div className="p-6">
              <div className="space-y-4">
                <div className="h-8 bg-muted animate-pulse rounded" />
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted/50 animate-pulse rounded" />
                ))}
              </div>
            </div>
          }>
            <CustomerTable filters={filters} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: "Clientes - ERP Reparación",
  description: "Gestión de clientes del sistema ERP",
};
