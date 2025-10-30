import { createClient } from "@/lib/supabase/server";
import type { 
  Customer, 
  CreateCustomer, 
  UpdateCustomer, 
  CustomerFilters,
  CustomersResponse,
  CustomerStats 
} from "./customers.schemas";

export class CustomersService {
  
  /**
   * Obtiene todos los clientes con filtros y paginación
   * Solo operación de base de datos, sin validaciones de negocio
   */
  static async getCustomers(filters: CustomerFilters): Promise<CustomersResponse> {
    const supabase = await createClient();
    
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' });

    // Aplicar filtros de búsqueda
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,surname.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%`);
    }

    if (filters.city) {
      query = query.eq('city', filters.city);
    }

    if (filters.state) {
      query = query.eq('state', filters.state);
    }

    // Aplicar ordenamiento
    query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });

    // Aplicar paginación
    const from = (filters.page - 1) * filters.limit;
    const to = from + filters.limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Error fetching customers: ${error.message}`);
    }

    const totalPages = Math.ceil((count || 0) / filters.limit);

    return {
      customers: data || [],
      total: count || 0,
      page: filters.page,
      limit: filters.limit,
      totalPages,
    };
  }

  /**
   * Obtiene un cliente por ID
   * Solo operación de base de datos
   */
  static async getCustomerById(id: string): Promise<Customer | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Cliente no encontrado
      }
      throw new Error(`Error fetching customer: ${error.message}`);
    }

    return data;
  }

  /**
   * Crea un nuevo cliente en la base de datos
   * Solo operación de inserción, validaciones en UseCase
   */
  static async createCustomer(customerData: CreateCustomer): Promise<Customer> {
    const supabase = await createClient();
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('customers')
      .insert({
        ...customerData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating customer: ${error.message}`);
    }

    return data;
  }

  /**
   * Actualiza un cliente existente
   * Solo operación de base de datos, validaciones en UseCase
   */
  static async updateCustomer(customerData: UpdateCustomer): Promise<Customer> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...customerData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerData.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating customer: ${error.message}`);
    }

    return data;
  }

  /**
   * Elimina un cliente de la base de datos
   * Solo operación de eliminación, validaciones en UseCase
   */
  static async deleteCustomer(id: string): Promise<void> {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting customer: ${error.message}`);
    }
  }

  /**
   * Obtiene estadísticas de clientes
   */
  static async getCustomerStats(): Promise<CustomerStats> {
    const supabase = await createClient();
    
    // Total de clientes
    const { count: total } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    // Clientes de este mes
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const { count: thisMonth } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString());

    // Clientes de este año
    const startOfYear = new Date();
    startOfYear.setMonth(0, 1);
    startOfYear.setHours(0, 0, 0, 0);
    
    const { count: thisYear } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfYear.toISOString());

    // Top ciudades
    const { data: citiesData } = await supabase
      .from('customers')
      .select('city')
      .not('city', 'is', null);

    // Procesar top ciudades
    const cityCount: Record<string, number> = {};
    citiesData?.forEach((customer: { city: string }) => {
      cityCount[customer.city] = (cityCount[customer.city] || 0) + 1;
    });

    const topCities = Object.entries(cityCount)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      total: total || 0,
      thisMonth: thisMonth || 0,
      thisYear: thisYear || 0,
      topCities,
    };
  }

  /**
   * Busca clientes por término de búsqueda
   * Solo consulta de base de datos, validaciones en UseCase
   */
  static async searchCustomers(searchTerm: string): Promise<Customer[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,surname.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(10);

    if (error) {
      throw new Error(`Error searching customers: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Verifica si existe un cliente con el mismo CIF
   * Solo consulta de base de datos
   */
  static async checkCIFExists(cif: string, excludeId?: string): Promise<boolean> {
    const supabase = await createClient();
    
    let query = supabase
      .from('customers')
      .select('id')
      .eq('cif', cif);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error checking CIF: ${error.message}`);
    }

    return (data?.length || 0) > 0;
  }
}
