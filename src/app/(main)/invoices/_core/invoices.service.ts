import { createClient } from '@/lib/supabase/server';
import type { CreateInvoice, UpdateInvoice, InvoiceFilters, Invoice, VATSummary } from './invoices.schemas';

export class InvoicesService {
  
  /**
   * Crea una nueva factura en la base de datos
   */
  static async createInvoice(invoiceData: CreateInvoice): Promise<Invoice> {
    const supabase = await createClient();
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuario no autenticado');
    }
        console.log(user.user.id);

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        user_id: user.user.id,
        customer_id: null, // Por ahora null, se puede actualizar después
        quote_id: null, // Por ahora null, se puede actualizar después
        invoice_number: invoiceData.invoiceNumber,
        company_name: invoiceData.companyName,
        issue_date: invoiceData.issueDate,
        due_date: invoiceData.dueDate,
        type: invoiceData.type || 'income',
        status: invoiceData.status || 'pending',
        subtotal: invoiceData.netAmount || 0,
        vat_percentage: invoiceData.vatRate || 21,
        vat_amount: invoiceData.vatAmount || 0,
        total_amount: invoiceData.totalAmount,
        file_url: invoiceData.fileUrl || null,
      })
      .select()
      .single();

    if (error) {
      console.log(error)
      throw new Error(`Error al crear factura: ${error}`);
    }

    return this.mapDatabaseToInvoice(data);
  }

  /**
   * Obtiene todas las facturas del usuario con filtros opcionales
   */
  static async getInvoices(filters?: InvoiceFilters): Promise<Invoice[]> {
    const supabase = await createClient();
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuario no autenticado');
    }

    let query = supabase
      .from('invoices')
      .select('*')
      .eq('user_id', user.user.id)  // CRÍTICO: Sin RLS, necesitamos filtrar manualmente
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters?.startDate) {
      query = query.gte('issue_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('issue_date', filters.endDate);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    if (filters?.companyName) {
      query = query.ilike('company_name', `%${filters.companyName}%`);
    }
    if (filters?.minAmount) {
      query = query.gte('total_amount', filters.minAmount);
    }
    if (filters?.maxAmount) {
      query = query.lte('total_amount', filters.maxAmount);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error al obtener facturas: ${error.message}`);
    }

    return data?.map(this.mapDatabaseToInvoice) || [];
  }

  /**
   * Obtiene una factura específica por ID
   */
  static async getInvoiceById(id: string): Promise<Invoice | null> {
    const supabase = await createClient();
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.user.id)  // CRÍTICO: Sin RLS, necesitamos filtrar manualmente
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error al obtener factura: ${error.message}`);
    }

    return this.mapDatabaseToInvoice(data);
  }

  /**
   * Actualiza una factura existente
   */
  static async updateInvoice(invoiceData: UpdateInvoice): Promise<Invoice> {
    const supabase = await createClient();
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuario no autenticado');
    }

    const updateData: any = {};
    
    // Mapear campos del esquema a campos de base de datos según el esquema real
    if (invoiceData.invoiceNumber) updateData.invoice_number = invoiceData.invoiceNumber;
    if (invoiceData.companyName) updateData.company_name = invoiceData.companyName;
    if (invoiceData.issueDate) updateData.issue_date = invoiceData.issueDate;
    if (invoiceData.dueDate) updateData.due_date = invoiceData.dueDate;
    if (invoiceData.type) updateData.type = invoiceData.type;
    if (invoiceData.status) updateData.status = invoiceData.status;
    if (invoiceData.netAmount !== undefined) updateData.subtotal = invoiceData.netAmount;
    if (invoiceData.vatRate !== undefined) updateData.vat_percentage = invoiceData.vatRate;
    if (invoiceData.vatAmount !== undefined) updateData.vat_amount = invoiceData.vatAmount;
    if (invoiceData.totalAmount !== undefined) updateData.total_amount = invoiceData.totalAmount;
    if (invoiceData.fileUrl !== undefined) updateData.file_url = invoiceData.fileUrl;

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceData.id)
      .eq('user_id', user.user.id)  // CRÍTICO: Sin RLS, necesitamos filtrar manualmente
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar factura: ${error.message}`);
    }

    return this.mapDatabaseToInvoice(data);
  }

  /**
   * Elimina una factura
   */
  static async deleteInvoice(id: string): Promise<void> {
    const supabase = await createClient();
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id)
      .eq('user_id', user.user.id);  // CRÍTICO: Sin RLS, necesitamos filtrar manualmente

    if (error) {
      throw new Error(`Error al eliminar factura: ${error.message}`);
    }
  }

  /**
   * Genera resumen de IVA para un período específico
   */
  static async getVATSummary(startDate: string, endDate: string): Promise<VATSummary> {
    const supabase = await createClient();
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('invoices')
      .select('vat_amount, total_amount, subtotal, type')
      .eq('user_id', user.user.id)  
      .gte('issue_date', startDate)
      .lte('issue_date', endDate)
      .eq('status', 'paid'); // Solo facturas pagadas para el cálculo de IVA

    if (error) {
      throw new Error(`Error al obtener resumen de IVA: ${error.message}`);
    }

    const invoices = data || [];
    
    const incomeInvoices = invoices.filter(inv => inv.type === 'income');
    const expenseInvoices = invoices.filter(inv => inv.type === 'expense');

    const totalVATReceivable = incomeInvoices.reduce((sum, inv) => sum + (inv.vat_amount || 0), 0);
    const totalVATPayable = expenseInvoices.reduce((sum, inv) => sum + (inv.vat_amount || 0), 0);
    const totalIncome = incomeInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const totalExpenses = expenseInvoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

    return {
      period: `${startDate} - ${endDate}`,
      totalVATPayable,
      totalVATReceivable,
      netVATPosition: totalVATReceivable - totalVATPayable,
      totalIncome,
      totalExpenses,
      invoiceCount: invoices.length,
    };
  }

  /**
   * Subir archivo de factura a Supabase Storage
   */
  static async uploadInvoiceFile(file: File, invoiceId: string): Promise<string> {
    const supabase = await createClient();
    
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      throw new Error('Usuario no autenticado');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${invoiceId}-${Date.now()}.${fileExt}`;
    const filePath = `${user.user.id}/invoices/${fileName}`;

    const { data, error } = await supabase.storage
      .from('invoice-files')
      .upload(filePath, file);

    if (error) {
      throw new Error(`Error al subir archivo: ${error.message}`);
    }

    // Obtener URL pública del archivo
    const { data: urlData } = supabase.storage
      .from('invoice-files')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  }

  /**
   * Mapea los campos de base de datos al esquema de la aplicación
   */
  private static mapDatabaseToInvoice(dbRow: any): Invoice {
    return {
      id: dbRow.id,
      userId: dbRow.user_id,
      companyName: dbRow.company_name,
      invoiceNumber: dbRow.invoice_number,
      issueDate: dbRow.issue_date,
      dueDate: dbRow.due_date,
      totalAmount: dbRow.total_amount,
      // Mapear subtotal a netAmount para compatibilidad con el esquema de tipos actual
      netAmount: dbRow.subtotal || dbRow.net_amount,
      vatAmount: dbRow.vat_amount,
      // Mapear vat_percentage a vatRate para compatibilidad
      vatRate: dbRow.vat_percentage || dbRow.vat_rate,
      // Campos que no existen en la nueva tabla, usar valores por defecto
      description: dbRow.description || '',
      fileUrl: dbRow.file_url,
      fileName: dbRow.file_name || '',
      fileSize: dbRow.file_size || 0,
      status: dbRow.status,
      type: dbRow.type,
      createdAt: dbRow.created_at,
      updatedAt: dbRow.updated_at,
    };
  }
}
