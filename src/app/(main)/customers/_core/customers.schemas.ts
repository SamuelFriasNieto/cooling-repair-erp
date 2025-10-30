import { z } from "zod";

// Schema base del cliente
export const CustomerSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  surname: z.string().optional(),
  cif: z.string().min(8, "El CIF/NIF debe tener al menos 8 caracteres"),
  address: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  cp: z.string().min(5, "El código postal debe tener al menos 5 caracteres"),
  state: z.string().min(2, "La localidad es requerida"),
  city: z.string().min(2, "La provincia es requerida"),
  phone: z.string().min(9, "El teléfono debe tener al menos 9 dígitos"),
  email: z.string().email("Email debe ser válido"),
  company_name: z.string().optional(),
  contact_person: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Schema para crear cliente (sin ID)
export const CreateCustomerSchema = CustomerSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});

// Schema para actualizar cliente (todos los campos opcionales excepto ID)
export const UpdateCustomerSchema = CustomerSchema.partial().required({ id: true });

// Schema para filtros de búsqueda
export const CustomerFiltersSchema = z.object({
  search: z.string(),
  city: z.string().optional(),
  state: z.string().optional(),
  sortBy: z.enum(["name", "created_at", "updated_at", "city", "email"]).default("created_at"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// Tipos TypeScript
export type Customer = z.infer<typeof CustomerSchema>;
export type CreateCustomer = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomer = z.infer<typeof UpdateCustomerSchema>;
export type CustomerFilters = z.infer<typeof CustomerFiltersSchema>;

// Tipo para la respuesta paginada
export interface CustomersResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Tipo para estadísticas de clientes
export interface CustomerStats {
  total: number;
  thisMonth: number;
  thisYear: number;
  topCities: Array<{ city: string; count: number }>;
}
