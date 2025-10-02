import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconPlus,
  IconFileText,
  IconChartBar,
  IconDownload,
} from "@tabler/icons-react";
import Link from "next/link";
import { InvoicesTable } from "./_components/invoices-table";
import { InvoiceUploadForm } from "./_components/invoice-upload-form";
import { VATReport } from "./_components/vat-report";
import { InvoiceStats } from "./_components/invoiceStats";
import { StatsLoading } from "./_components/statsLoading";

export default function InvoicesPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión de Facturas
          </h1>
          <p className="text-muted-foreground">
            Administra tus facturas y genera reportes
          </p>
        </div>
      {/* Estadísticas */}
      <Suspense fallback={<StatsLoading />}>
        <InvoiceStats />
      </Suspense>

      {/* Contenido Principal */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <IconFileText className="h-4 w-4" />
            Lista de Facturas
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <IconPlus className="h-4 w-4" />
            Subir Factura
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <IconChartBar className="h-4 w-4" />
            Informes IVA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Facturas Registradas</CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense
                fallback={
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                }
              >
                <InvoicesTable />
              </Suspense>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subir Nueva Factura</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceUploadForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informes de IVA</CardTitle>
            </CardHeader>
            <CardContent>
              <VATReport /> 
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
