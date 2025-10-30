"use client";

import { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateCustomerAction, getCustomerByIdAction } from "../actions";
import { UpdateCustomerSchema } from "../_core/customers.schemas";
import { toast } from "sonner";
import { Loader2, Edit } from "lucide-react";
import type { UpdateCustomer, Customer } from "../_core/customers.schemas";

interface EditCustomerDialogProps {
  customerId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCustomerDialog({ 
  customerId, 
  open, 
  onOpenChange 
}: EditCustomerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<UpdateCustomer>({
    resolver: zodResolver(UpdateCustomerSchema),
    defaultValues: {
      id: "",
      name: "",
      surname: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      cp: "",
      cif: "",
      company_name: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (open && customerId) {
      loadCustomer();
    }
  }, [open, customerId]);

  const loadCustomer = async () => {
    if (!customerId) return;
    
    setLoading(true);
    
    try {
      const [result, error] = await getCustomerByIdAction({ id: customerId });
      
      if (error || !result?.success) {
        toast.error("Error al cargar los datos del cliente");
        onOpenChange(false);
        return;
      }

      const customer = result.customer;
      
      // Llenar el formulario con los datos actuales
      form.reset({
        id: customer.id!,
        name: customer.name,
        surname: customer.surname || "",
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        cp: customer.cp,
        cif: customer.cif || "",
        company_name: customer.company_name || "",
        notes: customer.notes || "",
      });
    } catch (error) {
      toast.error("Error inesperado al cargar el cliente");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (data: UpdateCustomer) => {
    startTransition(async () => {
      try {
        const [result, error] = await updateCustomerAction(data);
        
        if (error) {
          toast.error("Error al actualizar el cliente");
          return;
        }

        if (result?.success) {
          toast.success("Cliente actualizado exitosamente");
          onOpenChange(false);
        } else {
          toast.error("Error al actualizar el cliente");
        }
      } catch (error) {
        toast.error("Error inesperado al actualizar el cliente");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Editar Cliente
          </DialogTitle>
          <DialogDescription>
            Modifica los datos del cliente seleccionado.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Cargando datos...</span>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {/* Campo oculto para el ID */}
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <Input type="hidden" {...field} />
                )}
              />

              {/* Información Personal */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="surname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellidos</FormLabel>
                      <FormControl>
                        <Input placeholder="Pérez García" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contacto */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="juan@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono *</FormLabel>
                      <FormControl>
                        <Input placeholder="+34 666 777 888" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Dirección */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección *</FormLabel>
                    <FormControl>
                      <Input placeholder="Calle Mayor, 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad *</FormLabel>
                      <FormControl>
                        <Input placeholder="Madrid" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provincia *</FormLabel>
                      <FormControl>
                        <Input placeholder="Madrid" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>C.P. *</FormLabel>
                      <FormControl>
                        <Input placeholder="28001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Información de Empresa */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cif"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CIF</FormLabel>
                      <FormControl>
                        <Input placeholder="B12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de la Empresa</FormLabel>
                      <FormControl>
                        <Input placeholder="Empresa S.L." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notas */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observaciones adicionales sobre el cliente..."
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending || loading}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    "Actualizar Cliente"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
