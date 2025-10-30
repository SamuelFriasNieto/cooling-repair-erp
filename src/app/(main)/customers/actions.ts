"use server";

import { createServerAction } from "zsa";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { 
  CreateCustomerSchema, 
  UpdateCustomerSchema, 
  CustomerFiltersSchema 
} from "./_core/customers.schemas";
import { CustomersUseCase } from "./_core/customers.use-cases";

/**
 * Action para crear un nuevo cliente
 */
export const createCustomerAction = createServerAction()
  .input(CreateCustomerSchema)
  .handler(async ({ input }) => {
    try {
      const customer = await CustomersUseCase.createCustomer(input);
      revalidatePath("/dashboard/customers");
      return { success: true, customer };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al crear cliente");
    }
  });

/**
 * Action para actualizar un cliente existente
 */
export const updateCustomerAction = createServerAction()
  .input(UpdateCustomerSchema)
  .handler(async ({ input }) => {
    try {
      const customer = await CustomersUseCase.updateCustomer(input);
      revalidatePath("/dashboard/customers");
      return { success: true, customer };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al actualizar cliente");
    }
  });

/**
 * Action para eliminar un cliente
 */
export const deleteCustomerAction = createServerAction()
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    try {
      await CustomersUseCase.deleteCustomer(input.id);
      revalidatePath("/dashboard/customers");
      return { success: true };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al eliminar cliente");
    }
  });

/**
 * Action para obtener clientes con filtros
 */
export const getCustomersAction = createServerAction()
  .input(CustomerFiltersSchema.optional())
  .handler(async ({ input }) => {
    try {
      const filters = input || {
        search: "",
        page: 1,
        limit: 10,
        sortBy: "created_at" as const,
        sortOrder: "desc" as const,
      };
      const customers = await CustomersUseCase.getCustomers(filters);
      return { success: true, customers };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al obtener clientes");
    }
  });

/**
 * Action para obtener un cliente específico
 */
export const getCustomerByIdAction = createServerAction()
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    try {
      const customer = await CustomersUseCase.getCustomerById(input.id);
      return { success: true, customer };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al obtener cliente");
    }
  });

/**
 * Action para buscar clientes
 */
export const searchCustomersAction = createServerAction()
  .input(z.object({ searchTerm: z.string().min(2, "El término de búsqueda debe tener al menos 2 caracteres") }))
  .handler(async ({ input }) => {
    try {
      const customers = await CustomersUseCase.searchCustomers(input.searchTerm);
      return { success: true, customers };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al buscar clientes");
    }
  });

/**
 * Action para obtener estadísticas de clientes
 */
export const getCustomerStatsAction = createServerAction()
  .input(z.void())
  .handler(async () => {
    try {
      const stats = await CustomersUseCase.getCustomerStats();
      return { success: true, stats };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al obtener estadísticas");
    }
  });

/**
 * Action para verificar disponibilidad de CIF
 */
export const checkCIFAvailabilityAction = createServerAction()
  .input(z.object({ 
    cif: z.string().min(8, "El CIF debe tener al menos 8 caracteres"),
    excludeId: z.string().uuid().optional()
  }))
  .handler(async ({ input }) => {
    try {
      const isAvailable = await CustomersUseCase.checkCIFAvailability(input.cif, input.excludeId);
      return { success: true, isAvailable };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al verificar CIF");
    }
  });

/**
 * Action para obtener clientes por ciudad
 */
export const getCustomersByCityAction = createServerAction()
  .input(z.object({ city: z.string().min(2, "La ciudad debe tener al menos 2 caracteres") }))
  .handler(async ({ input }) => {
    try {
      const customers = await CustomersUseCase.getCustomersByCity(input.city);
      return { success: true, customers };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al obtener clientes por ciudad");
    }
  });

/**
 * Action para obtener clientes recientes
 */
export const getRecentCustomersAction = createServerAction()
  .input(z.object({ limit: z.number().min(1).max(50).default(10) }).optional())
  .handler(async ({ input }) => {
    try {
      const limit = input?.limit || 10;
      const customers = await CustomersUseCase.getRecentCustomers(limit);
      return { success: true, customers };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al obtener clientes recientes");
    }
  });

/**
 * Action para redirigir a un cliente específico
 */
export const redirectToCustomerAction = createServerAction()
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    redirect(`/dashboard/customers/${input.id}`);
  });

/**
 * Action para exportar clientes a CSV
 */
export const exportCustomersToCSVAction = createServerAction()
  .input(CustomerFiltersSchema.optional())
  .handler(async ({ input }) => {
    try {
      const filters = input || {
        search: "",
        page: 1,
        limit: 1000, // Para exportar todos
        sortBy: "name" as const,
        sortOrder: "asc" as const,
      };
      
      const result = await CustomersUseCase.getCustomers(filters);
      
      // Convertir a CSV
      const headers = [
        'Nombre',
        'Apellidos',
        'Email',
        'Teléfono',
        'CIF',
        'Empresa',
        'Dirección',
        'Ciudad',
        'Provincia',
        'C.P.',
        'Fecha de Registro'
      ];
      
      const csvData = result.customers.map(customer => [
        customer.name,
        customer.surname || '',
        customer.email,
        customer.phone,
        customer.cif,
        customer.company_name || '',
        customer.address,
        customer.city,
        customer.state,
        customer.cp,
        customer.created_at ? new Date(customer.created_at).toLocaleDateString('es-ES') : ''
      ]);
      
      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      return { success: true, csvContent };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al exportar clientes");
    }
  });
