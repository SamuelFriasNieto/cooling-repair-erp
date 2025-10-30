"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getCustomerByIdAction } from "../actions";
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Calendar,
  Loader2
} from "lucide-react";
import type { Customer } from "../_core/customers.schemas";

interface CustomerDetailsDialogProps {
  customerId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailsDialog({ 
  customerId, 
  open, 
  onOpenChange 
}: CustomerDetailsDialogProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && customerId) {
      loadCustomer();
    }
  }, [open, customerId]);

  const loadCustomer = async () => {
    if (!customerId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [result, error] = await getCustomerByIdAction({ id: customerId });
      
      if (error || !result?.success) {
        setError("Error al cargar los datos del cliente");
        return;
      }

      setCustomer(result.customer);
    } catch (error) {
      setError("Error inesperado al cargar el cliente");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalles del Cliente
          </DialogTitle>
          <DialogDescription>
            Información completa del cliente seleccionado
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando información...</span>
          </div>
        )}

        {error && (
          <div className="p-4 text-center text-destructive">
            {error}
          </div>
        )}

        {customer && !loading && (
          <div className="space-y-6">
            {/* Información Principal */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {customer.company_name ? (
                  <Building className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <User className="h-5 w-5 text-muted-foreground" />
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {customer.company_name || `${customer.name} ${customer.surname}`}
                  </h3>
                  {customer.company_name && (
                    <p className="text-sm text-muted-foreground">
                      {customer.name} {customer.surname}
                    </p>
                  )}
                </div>
              </div>

              {customer.cif && (
                <Badge variant="outline" className="w-fit">
                  CIF: {customer.cif}
                </Badge>
              )}
            </div>

            <Separator />

            {/* Información de Contacto */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contacto
              </h4>
              <div className="grid gap-3 pl-6">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{customer.phone}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Dirección */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Dirección
              </h4>
              <div className="pl-6 space-y-1">
                <p>{customer.address}</p>
                <p className="text-sm text-muted-foreground">
                  {customer.city}, {customer.state} - {customer.cp}
                </p>
              </div>
            </div>

            {customer.notes && (
              <>
                <Separator />
                
                {/* Notas */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notas
                  </h4>
                  <div className="pl-6">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {customer.notes}
                    </p>
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Información del Sistema */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Información del Sistema
              </h4>
              <div className="grid gap-2 pl-6 text-sm text-muted-foreground">
                <div>
                  <strong>Creado:</strong> {formatDate(customer.created_at!)}
                </div>
                {customer.updated_at && (
                  <div>
                    <strong>Última actualización:</strong> {formatDate(customer.updated_at)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
