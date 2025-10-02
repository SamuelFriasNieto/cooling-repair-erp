import { z } from "zod";

// Esquema para crear una nueva factura
export const CreateInvoiceSchema = z.object({
  companyName: z.string().min(1, "El nombre de la empresa es requerido"),
  invoiceNumber: z.string().min(1, "El número de factura es requerido"),
  issueDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Fecha inválida",
  }),
  dueDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Fecha inválida",
  }),
  totalAmount: z.number().min(0, "El monto total debe ser mayor a 0"),
  netAmount: z.number().min(0, "El monto neto debe ser mayor a 0"),
  vatAmount: z.number().min(0, "El IVA debe ser mayor o igual a 0"),
  vatRate: z.number().min(0).max(100, "El porcentaje de IVA debe estar entre 0 y 100"),
  description: z.string().optional(),
  fileUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  status: z.enum(["pending", "paid", "overdue", "cancelled"]),
  type: z.enum(["income", "expense"]),
});

// Esquema para actualizar una factura existente
export const UpdateInvoiceSchema = CreateInvoiceSchema.partial().extend({
  id: z.string().uuid(),
});

// Esquema para filtros de búsqueda
export const InvoiceFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.enum(["pending", "paid", "overdue", "cancelled"]).optional(),
  type: z.enum(["income", "expense"]).optional(),
  companyName: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
});

// Esquema para reportes de IVA
export const VATReportSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Fecha de inicio inválida",
  }),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Fecha de fin inválida",
  }),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]).optional(),
  year: z.number().min(2000).max(2100).optional(),
});

// Esquema para subida de archivos
export const FileUploadSchema = z.object({
  file: z.instanceof(File),
  invoiceData: CreateInvoiceSchema,
});

// Tipos TypeScript derivados de los esquemas
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof UpdateInvoiceSchema>;
export type InvoiceFilters = z.infer<typeof InvoiceFiltersSchema>;
export type VATReport = z.infer<typeof VATReportSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;

// Tipo completo de factura (incluye campos de base de datos)
export type Invoice = CreateInvoice & {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

// Tipo para resumen de IVA
export type VATSummary = {
  period: string;
  totalVATPayable: number;
  totalVATReceivable: number;
  netVATPosition: number;
  totalIncome: number;
  totalExpenses: number;
  invoiceCount: number;
};
