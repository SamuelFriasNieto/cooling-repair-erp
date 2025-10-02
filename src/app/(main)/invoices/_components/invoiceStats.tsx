import { Card, CardContent } from "@/components/ui/card";
import { getInvoiceStatsAction } from "../actions";
import { InvoiceStatsCard } from "./invoiceStatsCard";

export async function InvoiceStats() {
  try {
    const [result, error] = await getInvoiceStatsAction();
    
    if (error || !result?.success) {
      throw new Error("Error al cargar estadísticas");
    }

    const stats = result.stats;

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <InvoiceStatsCard
          title="Total Facturas"
          value={stats.totalInvoices}
          description="Todas las facturas registradas"
        />
        <InvoiceStatsCard
          title="Pendientes"
          value={stats.pendingInvoices}
          description="Facturas por cobrar"
          variant="warning"
        />
        <InvoiceStatsCard
          title="Pagadas"
          value={stats.paidInvoices}
          description="Facturas completadas"
          variant="success"
        />
        <InvoiceStatsCard
          title="Monto Total"
          value={`€${stats.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}`}
          description="Valor total de facturas"
        />
      </div>
    );
  } catch (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Error al cargar estadísticas</p>
          </CardContent>
        </Card>
      </div>
    );
  }
}