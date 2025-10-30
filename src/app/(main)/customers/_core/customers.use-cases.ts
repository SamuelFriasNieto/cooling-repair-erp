import { CustomersService } from './customers.service';
import type { 
  Customer, 
  CreateCustomer, 
  UpdateCustomer, 
  CustomerFilters,
  CustomersResponse,
  CustomerStats 
} from './customers.schemas';

export class CustomersUseCase {

  /**
   * Crear un nuevo cliente con validaciones de negocio
   */
  static async createCustomer(customerData: CreateCustomer): Promise<Customer> {
    
    // Verificar si ya existe un cliente con el mismo CIF
    if (customerData.cif) {
      const cifExists = await CustomersService.checkCIFExists(customerData.cif);
      if (cifExists) {
        throw new Error(`Ya existe un cliente con el CIF ${customerData.cif}`);
      }
    }

    // Verificar si ya existe un cliente con el mismo email
    const existingCustomers = await CustomersService.searchCustomers(customerData.email);
    const duplicateEmail = existingCustomers.find(
      customer => customer.email.toLowerCase() === customerData.email.toLowerCase()
    );
    
    if (duplicateEmail) {
      throw new Error(`Ya existe un cliente con el email ${customerData.email}`);
    }

    return await CustomersService.createCustomer(customerData);
  }

  /**
   * Obtener clientes con filtros y paginación
   */
  static async getCustomers(filters: CustomerFilters): Promise<CustomersResponse> {
    // Validar parámetros de paginación
    if (filters.page < 1) {
      throw new Error('El número de página debe ser mayor a 0');
    }

    if (filters.limit < 1 || filters.limit > 100) {
      throw new Error('El límite debe estar entre 1 y 100');
    }

    // Validar campos de ordenamiento
    const allowedSortFields = ['name', 'surname', 'email', 'city', 'created_at'];
    if (!allowedSortFields.includes(filters.sortBy)) {
      throw new Error(`Campo de ordenamiento no válido: ${filters.sortBy}`);
    }

    return await CustomersService.getCustomers(filters);
  }

  /**
   * Obtener cliente por ID con validaciones
   */
  static async getCustomerById(id: string): Promise<Customer> {
    if (!id) {
      throw new Error('ID de cliente requerido');
    }

    const customer = await CustomersService.getCustomerById(id);
    if (!customer) {
      throw new Error('Cliente no encontrado');
    }

    return customer;
  }

  /**
   * Actualizar cliente con validaciones
   */
  static async updateCustomer(customerData: UpdateCustomer): Promise<Customer> {

    // Verificar que el cliente existe
    await this.getCustomerById(customerData.id);

    // Verificar CIF duplicado si se está actualizando
    if (customerData.cif) {
      const cifExists = await CustomersService.checkCIFExists(customerData.cif, customerData.id);
      if (cifExists) {
        throw new Error(`Ya existe otro cliente con el CIF ${customerData.cif}`);
      }
    }

    // Verificar email duplicado si se está actualizando
    if (customerData.email) {
      const existingCustomers = await CustomersService.searchCustomers(customerData.email);
      const duplicateEmail = existingCustomers.find(
        customer => customer.email.toLowerCase() === customerData.email!.toLowerCase() && 
                   customer.id !== customerData.id
      );
      
      if (duplicateEmail) {
        throw new Error(`Ya existe otro cliente con el email ${customerData.email}`);
      }
    }

    return await CustomersService.updateCustomer(customerData);
  }

  /**
   * Eliminar cliente con validaciones
   */
  static async deleteCustomer(id: string): Promise<void> {
    if (!id) {
      throw new Error('ID de cliente requerido');
    }

    // Verificar que el cliente existe
    await this.getCustomerById(id);

    // TODO: Verificar si el cliente tiene facturas asociadas
    // const hasInvoices = await this.checkCustomerHasInvoices(id);
    // if (hasInvoices) {
    //   throw new Error('No se puede eliminar un cliente que tiene facturas asociadas');
    // }

    await CustomersService.deleteCustomer(id);
  }

  /**
   * Buscar clientes por término de búsqueda
   */
  static async searchCustomers(searchTerm: string): Promise<Customer[]> {
    if (!searchTerm || searchTerm.trim().length < 2) {
      throw new Error('El término de búsqueda debe tener al menos 2 caracteres');
    }

    return await CustomersService.searchCustomers(searchTerm.trim());
  }

  /**
   * Obtener estadísticas de clientes
   */
  static async getCustomerStats(): Promise<CustomerStats> {
    return await CustomersService.getCustomerStats();
  }

  /**
   * Verificar disponibilidad de CIF
   */
  static async checkCIFAvailability(cif: string, excludeId?: string): Promise<boolean> {
    if (!cif) {
      throw new Error('CIF requerido');
    }

    this.validateCIF(cif);

    const exists = await CustomersService.checkCIFExists(cif, excludeId);
    return !exists; // Retorna true si está disponible (no existe)
  }

  /**
   * Obtener clientes por ciudad
   */
  static async getCustomersByCity(city: string): Promise<Customer[]> {
    if (!city) {
      throw new Error('Ciudad requerida');
    }

    const filters: CustomerFilters = {
      page: 1,
      limit: 100,
      city: city.trim(),
      search: '',
      state: '',
      sortBy: 'name',
      sortOrder: 'asc',
    };

    const result = await this.getCustomers(filters);
    return result.customers;
  }

  /**
   * Obtener clientes recientes
   */
  static async getRecentCustomers(limit: number = 10): Promise<Customer[]> {
    if (limit < 1 || limit > 50) {
      throw new Error('El límite debe estar entre 1 y 50');
    }

    const filters: CustomerFilters = {
      page: 1,
      limit,
      search: '',
      city: '',
      state: '',
      sortBy: 'created_at',
      sortOrder: 'desc',
    };

    const result = await this.getCustomers(filters);
    return result.customers;
  }

  /**
   * Validaciones privadas
   */


  private static validateCIF(cif: string): void {
    // Validar formato básico del CIF español
    const cifRegex = /^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/;
    if (!cifRegex.test(cif.toUpperCase())) {
      throw new Error('El formato del CIF no es válido (ej: B12345678)');
    }

    // TODO: Implementar validación completa del dígito de control del CIF
    // Esta es una validación básica de formato
  }

  // TODO: Implementar cuando tengamos el módulo de facturas integrado
  // private static async checkCustomerHasInvoices(customerId: string): Promise<boolean> {
  //   // Verificar si el cliente tiene facturas asociadas
  //   return false;
  // }
}