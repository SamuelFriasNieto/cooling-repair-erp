"use client";

import { useState, useTransition } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2 
} from "lucide-react";
import { deleteCustomerAction } from "../actions";
import { CustomerDetailsDialog } from "./customer-details-dialog";
import { EditCustomerDialog } from "./edit-customer-dialog";
import { toast } from "sonner";
import type { Customer } from "../_core/customers.schemas";

interface CustomerActionsProps {
  customer: Customer;
}

export function CustomerActions({ customer }: CustomerActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showDetails, setShowDetails] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el cliente "${customer.name} ${customer.surname}"?`)) {
      return;
    }

    setIsDeleting(true);
    startTransition(async () => {
      try {
                const [result, error] = await deleteCustomerAction({ id: customer.id! });
        
        if (error) {
          toast.error("Error al eliminar el cliente");
          return;
        }

        if (result?.success) {
          toast.success("Cliente eliminado exitosamente");
        } else {
          toast.error("Error al eliminar el cliente");
        }
      } catch (error) {
        toast.error("Error inesperado al eliminar el cliente");
      } finally {
        setIsDeleting(false);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="h-8 w-8 p-0"
            disabled={isPending}
          >
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowDetails(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Ver detalles
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setShowEdit(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem 
            className="text-destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Diálogos */}
      <CustomerDetailsDialog
        customerId={customer.id}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
      
      <EditCustomerDialog
        customerId={customer.id}
        open={showEdit}
        onOpenChange={setShowEdit}
      />
    </>
  );
}
