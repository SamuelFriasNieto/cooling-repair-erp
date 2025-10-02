import { InvoicesService } from './invoices.service';
import type { 
  CreateInvoice, 
  UpdateInvoice, 
  InvoiceFilters, 
  VATReport, 
  Invoice, 
  VATSummary 
} from './invoices.schemas';

export class InvoicesUseCase {

    /**
     * Crear una nueva factura con validaciones de negocio
        */
  static async createInvoice(invoiceData: CreateInvoice): Promise<Invoice> {

    this.validateInvoiceData(invoiceData);
    
    const existingInvoices = await InvoicesService.getInvoices({
      companyName: invoiceData.companyName,
    });
    
    const duplicateInvoice = existingInvoices.find(
      inv => inv.invoiceNumber === invoiceData.invoiceNumber && 
             inv.companyName === invoiceData.companyName
    );
    
    if (duplicateInvoice) {
      throw new Error(`Ya existe una factura con el número ${invoiceData.invoiceNumber} para ${invoiceData.companyName}`);
    }

    return await InvoicesService.createInvoice(invoiceData);
  }

  /**
   * Subir una nueva factura con archivo
   */
  static async uploadInvoiceWithFile(
    invoiceData: CreateInvoice, 
    file: File
  ): Promise<Invoice> {
    this.validateFile(file);
    
    const invoice = await this.createInvoice(invoiceData);
    
    try {
      const fileUrl = await InvoicesService.uploadInvoiceFile(file, invoice.id);
      
      const updatedInvoice = await InvoicesService.updateInvoice({
        id: invoice.id,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
      });
      
      return updatedInvoice;
    } catch (error) {
      await InvoicesService.deleteInvoice(invoice.id);
      throw error;
    }
  }

  /**
   * Obtener facturas con filtros y paginación
   */
  static async getInvoices(filters?: InvoiceFilters): Promise<Invoice[]> {
    if (filters?.startDate && filters?.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      
      if (startDate > endDate) {
        throw new Error('La fecha de inicio no puede ser mayor que la fecha de fin');
      }
    }

    return await InvoicesService.getInvoices(filters);
  }

  /**
   * Obtener factura por ID con validaciones
   */
  static async getInvoiceById(id: string): Promise<Invoice> {
    if (!id) {
      throw new Error('ID de factura requerido');
    }

    const invoice = await InvoicesService.getInvoiceById(id);
    if (!invoice) {
      throw new Error('Factura no encontrada');
    }

    return invoice;
  }

  /**
   * Actualizar factura con validaciones
   */
  static async updateInvoice(invoiceData: UpdateInvoice): Promise<Invoice> {
    if (!invoiceData.id) {
      throw new Error('ID de factura requerido');
    }

    await this.getInvoiceById(invoiceData.id);

    if (invoiceData.totalAmount !== undefined || 
        invoiceData.netAmount !== undefined || 
        invoiceData.vatAmount !== undefined) {
      this.validateInvoiceAmounts({
        totalAmount: invoiceData.totalAmount,
        netAmount: invoiceData.netAmount,
        vatAmount: invoiceData.vatAmount,
      });
    }

    return await InvoicesService.updateInvoice(invoiceData);
  }

  /**
   * Eliminar factura con validaciones
   */
  static async deleteInvoice(id: string): Promise<void> {
    if (!id) {
      throw new Error('ID de factura requerido');
    }

    await this.getInvoiceById(id);

    await InvoicesService.deleteInvoice(id);
  }

  /**
   * Marcar factura como pagada
   */
  static async markInvoiceAsPaid(id: string): Promise<Invoice> {
    const invoice = await this.getInvoiceById(id);
    
    if (invoice.status === 'paid') {
      throw new Error('La factura ya está marcada como pagada');
    }

    return await InvoicesService.updateInvoice({
      id,
      status: 'paid',
    });
  }

  /**
   * Generar reporte de IVA para un período
   */
  static async generateVATReport(reportParams: VATReport): Promise<VATSummary> {
    let startDate: string;
    let endDate: string;

    if (reportParams.quarter && reportParams.year) {
      const quarterDates = this.getQuarterDates(reportParams.quarter, reportParams.year);
      startDate = quarterDates.start;
      endDate = quarterDates.end;
    } else {
      startDate = reportParams.startDate;
      endDate = reportParams.endDate;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      throw new Error('La fecha de inicio no puede ser mayor que la fecha de fin');
    }

    if (start > new Date()) {
      throw new Error('La fecha de inicio no puede ser futura');
    }

    return await InvoicesService.getVATSummary(startDate, endDate);
  }

  /**
   * Obtener estadísticas generales de facturas
   */
  static async getInvoiceStats(): Promise<{
    totalInvoices: number;
    pendingInvoices: number;
    paidInvoices: number;
    overdueInvoices: number;
    totalAmount: number;
    pendingAmount: number;
  }> {
    const allInvoices = await InvoicesService.getInvoices();
    
    const stats = {
      totalInvoices: allInvoices.length,
      pendingInvoices: allInvoices.filter(inv => inv.status === 'pending').length,
      paidInvoices: allInvoices.filter(inv => inv.status === 'paid').length,
      overdueInvoices: allInvoices.filter(inv => inv.status === 'overdue').length,
      totalAmount: allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      pendingAmount: allInvoices
        .filter(inv => inv.status === 'pending')
        .reduce((sum, inv) => sum + inv.totalAmount, 0),
    };

    return stats;
  }

  /**
   * Validaciones privadas
   */
  private static validateInvoiceData(invoiceData: CreateInvoice): void {
    // Validar fechas
    const issueDate = new Date(invoiceData.issueDate);
    const dueDate = new Date(invoiceData.dueDate);
    
    if (issueDate > dueDate) {
      throw new Error('La fecha de vencimiento no puede ser anterior a la fecha de emisión');
    }

    // Validar montos
    this.validateInvoiceAmounts(invoiceData);
  }

  private static validateInvoiceAmounts(amounts: {
    totalAmount?: number;
    netAmount?: number;
    vatAmount?: number;
  }): void {
    const { totalAmount, netAmount, vatAmount } = amounts;
    
    if (totalAmount !== undefined && netAmount !== undefined && vatAmount !== undefined) {
      const expectedTotal = netAmount + vatAmount;
      const tolerance = 0.01; // Tolerancia para errores de redondeo
      
      if (Math.abs(totalAmount - expectedTotal) > tolerance) {
        throw new Error('El monto total debe ser igual al monto neto más el IVA');
      }
    }

    if (totalAmount !== undefined && totalAmount <= 0) {
      throw new Error('El monto total debe ser mayor a 0');
    }

    if (netAmount !== undefined && netAmount < 0) {
      throw new Error('El monto neto no puede ser negativo');
    }

    if (vatAmount !== undefined && vatAmount < 0) {
      throw new Error('El IVA no puede ser negativo');
    }
  }

  private static validateFile(file: File): void {
    const maxSize = 10 * 1024 * 1024; 
    if (file.size > maxSize) {
      throw new Error('El archivo no puede ser mayor a 10MB');
    }

    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de archivo no permitido. Solo se permiten PDF e imágenes');
    }
  }

  private static getQuarterDates(quarter: string, year: number): { start: string; end: string } {
    const quarterMap = {
      'Q1': { start: `${year}-01-01`, end: `${year}-03-31` },
      'Q2': { start: `${year}-04-01`, end: `${year}-06-30` },
      'Q3': { start: `${year}-07-01`, end: `${year}-09-30` },
      'Q4': { start: `${year}-10-01`, end: `${year}-12-31` },
    };

    return quarterMap[quarter as keyof typeof quarterMap];
  }
}
