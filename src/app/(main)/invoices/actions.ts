"use server";

import { createServerAction } from "zsa";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { 
  CreateInvoiceSchema, 
  UpdateInvoiceSchema, 
  InvoiceFiltersSchema, 
  VATReportSchema 
} from "./_core/invoices.schemas";
import { InvoicesUseCase } from "./_core/invoices.use-case";

/**
 * Action para crear una nueva factura
 */
export const createInvoiceAction = createServerAction()
  .input(CreateInvoiceSchema)
  .handler(async ({ input }) => {
    try {
      const invoice = await InvoicesUseCase.createInvoice(input);
      revalidatePath("/invoices");
      return { success: true, invoice };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al crear factura");
    }
  });

/**
 * Action para actualizar una factura existente
 */
export const updateInvoiceAction = createServerAction()
  .input(UpdateInvoiceSchema)
  .handler(async ({ input }) => {
    try {
      const invoice = await InvoicesUseCase.updateInvoice(input);
      revalidatePath("/invoices");
      return { success: true, invoice };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al actualizar factura");
    }
  });

/**
 * Action para eliminar una factura
 */
export const deleteInvoiceAction = createServerAction()
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    try {
      await InvoicesUseCase.deleteInvoice(input.id);
      revalidatePath("/invoices");
      return { success: true };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al eliminar factura");
    }
  });

/**
 * Action para marcar una factura como pagada
 */
export const markInvoiceAsPaidAction = createServerAction()
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    try {
      const invoice = await InvoicesUseCase.markInvoiceAsPaid(input.id);
      revalidatePath("/invoices");
      return { success: true, invoice };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al marcar factura como pagada");
    }
  });

/**
 * Action para obtener facturas con filtros
 */
export const getInvoicesAction = createServerAction()
  .input(InvoiceFiltersSchema.optional())
  .handler(async ({ input }) => {
    try {
      const invoices = await InvoicesUseCase.getInvoices(input);
      return { success: true, invoices };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al obtener facturas");
    }
  });

/**
 * Action para obtener una factura específica
 */
export const getInvoiceByIdAction = createServerAction()
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    try {
      const invoice = await InvoicesUseCase.getInvoiceById(input.id);
      return { success: true, invoice };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al obtener factura");
    }
  });

/**
 * Action para generar reporte de IVA
 */
export const generateVATReportAction = createServerAction()
  .input(VATReportSchema)
  .handler(async ({ input }) => {
    try {
      const report = await InvoicesUseCase.generateVATReport(input);
      return { success: true, report };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al generar reporte de IVA");
    }
  });

/**
 * Action para obtener estadísticas de facturas
 */
export const getInvoiceStatsAction = createServerAction()
  .input(z.void())
  .handler(async () => {
    try {
      const stats = await InvoicesUseCase.getInvoiceStats();
      return { success: true, stats };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al obtener estadísticas");
    }
  });

/**
 * Action para subir factura con archivo
 * Nota: Esta acción maneja FormData para archivos
 */
export const uploadInvoiceWithFileAction = async (formData: FormData) => {
  try {
    // Extraer archivo
    const file = formData.get('file') as File;
    if (!file) {
      throw new Error('Archivo requerido');
    }

    // Extraer datos de la factura
    const invoiceData = {
      companyName: formData.get('companyName') as string,
      invoiceNumber: formData.get('invoiceNumber') as string,
      issueDate: formData.get('issueDate') as string,
      dueDate: formData.get('dueDate') as string,
      totalAmount: parseFloat(formData.get('totalAmount') as string),
      netAmount: parseFloat(formData.get('netAmount') as string),
      vatAmount: parseFloat(formData.get('vatAmount') as string),
      vatRate: parseFloat(formData.get('vatRate') as string),
      description: formData.get('description') as string || undefined,
      status: (formData.get('status') as any) || 'pending',
      type: (formData.get('type') as any) || 'expense',
    };

    // Validar datos
    const validatedData = CreateInvoiceSchema.parse(invoiceData);

    // Crear factura con archivo
    const invoice = await InvoicesUseCase.uploadInvoiceWithFile(validatedData, file);
    
    revalidatePath("/invoices");
    return { success: true, invoice };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Error al subir factura");
  }
};

/**
 * Action para redirigir a una factura específica
 */
export const redirectToInvoiceAction = createServerAction()
  .input(z.object({ id: z.string().uuid() }))
  .handler(async ({ input }) => {
    redirect(`/invoices/${input.id}`);
  });

/**
 * Action para exportar facturas a CSV
 */
export const exportInvoicesToCSVAction = createServerAction()
  .input(InvoiceFiltersSchema.optional())
  .handler(async ({ input }) => {
    try {
      const invoices = await InvoicesUseCase.getInvoices(input);
      
      // Convertir a CSV
      const headers = [
        'Número de Factura',
        'Empresa',
        'Fecha de Emisión',
        'Fecha de Vencimiento',
        'Monto Total',
        'Monto Neto',
        'IVA',
        'Estado',
        'Tipo'
      ];
      
      const csvData = invoices.map(invoice => [
        invoice.invoiceNumber,
        invoice.companyName,
        invoice.issueDate,
        invoice.dueDate,
        invoice.totalAmount.toString(),
        invoice.netAmount.toString(),
        invoice.vatAmount.toString(),
        invoice.status,
        invoice.type
      ]);
      
      const csvContent = [headers, ...csvData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');
      
      return { success: true, csvContent };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : "Error al exportar facturas");
    }
  });
