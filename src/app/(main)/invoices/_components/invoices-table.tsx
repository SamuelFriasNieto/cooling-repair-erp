"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  IconSearch, 
  IconFilter, 
  IconDotsVertical, 
  IconEye, 
  IconDownload, 
  IconTrash, 
  IconEdit,
  IconCheck
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useServerAction } from "zsa-react";
import { 
  getInvoicesAction, 
  deleteInvoiceAction, 
  markInvoiceAsPaidAction,
  exportInvoicesToCSVAction 
} from "../actions";
import type { Invoice, InvoiceFilters } from "../_core/invoices.schemas";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  paid: "bg-green-100 text-green-800 border-green-300",
  overdue: "bg-red-100 text-red-800 border-red-300",
  cancelled: "bg-gray-100 text-gray-800 border-gray-300",
};

const statusLabels = {
  pending: "Pendiente",
  paid: "Pagada",
  overdue: "Vencida",
  cancelled: "Cancelada",
};

const typeLabels = {
  income: "Ingreso",
  expense: "Gasto",
};

export function InvoicesTable() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<InvoiceFilters>({});
  const [searchTerm, setSearchTerm] = useState("");

  // Server actions
  const { execute: loadInvoices } = useServerAction(getInvoicesAction);
  const { execute: deleteInvoice } = useServerAction(deleteInvoiceAction);
  const { execute: markAsPaid } = useServerAction(markInvoiceAsPaidAction);
  const { execute: exportCSV } = useServerAction(exportInvoicesToCSVAction);

  // Cargar facturas inicialmente
  useEffect(() => {
    loadInvoicesData();
  }, []);

  const loadInvoicesData = async () => {
    try {
      setLoading(true);
      const [result, error] = await loadInvoices(filters);
      
      if (error) {
        toast.error("Error al cargar facturas");
        return;
      }

      if (result?.success) {
        setInvoices(result.invoices);
      }
    } catch (error) {
      toast.error("Error al cargar facturas");
    } finally {
      setLoading(false);
    }
  };

  // Recargar cuando cambien los filtros
  useEffect(() => {
    loadInvoicesData();
  }, [filters]);

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta factura?")) {
      return;
    }

    try {
      const [result, error] = await deleteInvoice({ id });
      
      if (error) {
        toast.error("Error al eliminar factura");
        return;
      }

      if (result?.success) {
        toast.success("Factura eliminada exitosamente");
        loadInvoicesData();
      }
    } catch (error) {
      toast.error("Error al eliminar factura");
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const [result, error] = await markAsPaid({ id });
      
      if (error) {
        toast.error("Error al marcar como pagada");
        return;
      }

      if (result?.success) {
        toast.success("Factura marcada como pagada");
        loadInvoicesData();
      }
    } catch (error) {
      toast.error("Error al marcar como pagada");
    }
  };

  const handleExport = async () => {
    try {
      const [result, error] = await exportCSV(filters);
      
      if (error) {
        toast.error("Error al exportar facturas");
        return;
      }

      if (result?.success) {
        // Crear y descargar archivo CSV
        const blob = new Blob([result.csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "facturas.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success("Facturas exportadas exitosamente");
      }
    } catch (error) {
      toast.error("Error al exportar facturas");
    }
  };

  // Filtrar facturas por término de búsqueda
  const filteredInvoices = invoices.filter(invoice =>
    invoice.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (invoice.description && invoice.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros y búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar facturas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select 
            value={filters.status || "all"} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, status: value === 'all' ? undefined : value as any }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="paid">Pagada</SelectItem>
              <SelectItem value="overdue">Vencida</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Select 
            value={filters.type || "all"} 
            onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === 'all' ? undefined : value as any }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="income">Ingreso</SelectItem>
              <SelectItem value="expense">Gasto</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={handleExport}>
          <IconDownload className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Tabla */}
      {filteredInvoices.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No se encontraron facturas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="text-right">IVA</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>{invoice.companyName}</TableCell>
                  <TableCell>
                    {new Date(invoice.issueDate).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    {new Date(invoice.dueDate).toLocaleDateString('es-ES')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {typeLabels[invoice.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[invoice.status]}>
                      {statusLabels[invoice.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    €{invoice.totalAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">
                    €{invoice.vatAmount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {invoice.fileUrl && (
                          <DropdownMenuItem asChild>
                            <a href={invoice.fileUrl} target="_blank" rel="noopener noreferrer">
                              <IconEye className="mr-2 h-4 w-4" />
                              Ver archivo
                            </a>
                          </DropdownMenuItem>
                        )}
                        {invoice.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleMarkAsPaid(invoice.id)}>
                            <IconCheck className="mr-2 h-4 w-4" />
                            Marcar como pagada
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDelete(invoice.id)}>
                          <IconTrash className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
