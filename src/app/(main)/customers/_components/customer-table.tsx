import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { CustomerFilters } from "../_core/customers.schemas";
import { getCustomersAction } from "../actions";
import { CustomerActions } from "./customer-actions";
import { CustomerSearch } from "./customer-search";
import { CustomerPagination } from "./customer-pagination";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Building,
  User
} from "lucide-react";
import Link from "next/link";

interface CustomerTableProps {
  filters: CustomerFilters;
}

export async function CustomerTable({ filters }: CustomerTableProps) {
  try {
    const [result, error] = await getCustomersAction(filters);
    
    if (error || !result?.success) {
      return (
        <div className="p-6 text-center">
          <p className="text-destructive">Error al cargar los clientes</p>
        </div>
      );
    }

    const { customers, total, totalPages } = result.customers;

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center gap-4 p-6 pb-0">
        <CustomerSearch currentSearch={filters.search} />
      </div>

      {/* Table */}
      <div className="rounded-md border-0">
        <Table>
          <TableHeader>
            <TableRow className="border-b">
              <TableHead>
                <Button variant="ghost" className="h-8 p-0">
                  Cliente
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="h-8 p-0">
                  Contacto
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="h-8 p-0">
                  Ubicación
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="h-8 p-0">
                  Fecha Registro
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <User className="h-8 w-8 text-muted-foreground" />
                    <p>No se encontraron clientes</p>
                    <p className="text-sm text-muted-foreground">
                      {filters.search 
                        ? "Prueba con un término de búsqueda diferente" 
                        : "Comienza agregando tu primer cliente"
                      }
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        {customer.company_name ? (
                          <Building className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">
                          {customer.company_name || `${customer.name} ${customer.surname}`}
                        </span>
                      </div>
                      {customer.company_name && (
                        <span className="text-sm text-muted-foreground">
                          {customer.name} {customer.surname}
                        </span>
                      )}
                      {customer.cif && (
                        <Badge variant="outline" className="mt-1 w-fit text-xs">
                          {customer.cif}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">{customer.email}</span>
                      <span className="text-sm text-muted-foreground">
                        {customer.phone}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {customer.city}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {customer.state} - {customer.cp}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {new Date(customer.created_at!).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <CustomerActions customer={customer} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 pb-6">
          <CustomerPagination 
            currentPage={filters.page} 
            totalPages={totalPages} 
            total={total}
            filters={filters}
          />
        </div>
      )}
    </div>
  );
  } catch (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-destructive">Error al cargar la tabla de clientes</p>
      </div>
    );
  }
}
