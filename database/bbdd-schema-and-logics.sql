-- =============================================================================
-- MIGRACIÓN COMPLETA: FLUJO DE NEGOCIO CLIENTES → PRESUPUESTOS → FACTURAS
-- =============================================================================
-- Este archivo crea toda la estructura necesaria para el flujo de negocio:
-- 1. Clientes
-- 2. Presupuestos/Cotizaciones
-- 3. Facturas con relación a clientes y presupuestos
-- 4. RLS (Row Level Security) para todas las tablas
-- 5. Funciones auxiliares y triggers

-- PASO 1: Verificar y crear la tabla de clientes (si no existe)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Información personal/empresa
    name TEXT NOT NULL,
    surname TEXT,
    cif TEXT NOT NULL, -- NIF/CIF
    
    -- Dirección
    address TEXT NOT NULL,
    cp TEXT NOT NULL, -- Código postal
    state TEXT NOT NULL, -- Localidad
    city TEXT NOT NULL, -- Provincia
    
    -- Contacto
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    
    -- Información adicional opcional
    company_name TEXT, -- Nombre comercial si es empresa
    contact_person TEXT, -- Persona de contacto si es empresa
    notes TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- PASO 2: Crear la tabla de presupuestos/cotizaciones
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
    
    -- Información del presupuesto
    quote_number TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    
    -- Fechas
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE NOT NULL,
    
    -- Estado del presupuesto
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
    
    -- Importes (sin IVA)
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    
    -- IVA
    vat_percentage DECIMAL(5,2) NOT NULL DEFAULT 21.00,
    vat_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Total (con IVA)
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    
    -- Términos y condiciones
    terms_and_conditions TEXT,
    notes TEXT,
    
    -- Archivo del presupuesto (PDF)
    file_url TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    
    -- Constraint para numeración única por usuario
    CONSTRAINT unique_quote_number_per_user UNIQUE (user_id, quote_number)
);

-- PASO 3: Crear tabla de categorías de ítems
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.item_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Información de la categoría
    name TEXT NOT NULL,
    description TEXT,
    color TEXT, -- Color hex para UI (ej: #FF5733)
    icon TEXT, -- Nombre del icono para UI
    
    -- Jerarquía (categorías padre/hijo)
    parent_id UUID REFERENCES public.item_categories(id) ON DELETE CASCADE,
    
    -- Estado
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    
    -- Constraint para nombre único por usuario
    CONSTRAINT unique_category_name_per_user UNIQUE (user_id, name)
);

-- PASO 4: Crear tabla de ítems/productos
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.item_categories(id) ON DELETE SET NULL,
    
    -- Información básica del ítem
    name TEXT NOT NULL,
    description TEXT,
    
    -- Precios
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(10,2), -- Precio de coste
    
    -- Unidades
    unit TEXT NOT NULL DEFAULT 'unidad', -- unidad, kg, m, m2, m3, litros, etc.
    
    -- Información adicional
    brand TEXT, -- Marca
    model TEXT, -- Modelo
    specifications JSONB, -- Especificaciones técnicas en JSON
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    
    -- Constraint para SKU único por usuario (si se especifica)
    CONSTRAINT unique_sku_per_user UNIQUE (user_id, sku)
);

-- PASO 5: Crear tabla de líneas de presupuesto (modificada)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.quote_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE NOT NULL,
    item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
    
    -- Información del ítem (puede sobrescribir la del item maestro)
    description TEXT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit TEXT NOT NULL DEFAULT 'unidad',
    
    -- Descuento específico para esta línea
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    
    -- Totales
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0, -- quantity * unit_price
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0, -- subtotal - discount_amount
    
    -- Orden en el presupuesto
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Notas específicas para esta línea
    notes TEXT,
    
    -- Metadatos
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- PASO 4: Modificar la tabla de facturas para integrarla con el flujo
-- =============================================================================
-- Primero, verificamos si existe la tabla actual y la modificamos
DO $$ 
BEGIN
    -- Si la tabla existe, la modificamos
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'invoices') THEN
        -- Agregar columnas nuevas si no existen
        BEGIN
            ALTER TABLE public.invoices ADD COLUMN customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_column THEN
            -- La columna ya existe, continuar
        END;
        
        BEGIN
            ALTER TABLE public.invoices ADD COLUMN quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_column THEN
            -- La columna ya existe, continuar
        END;
        
        -- Hacer opcional el company_name ya que ahora tenemos customer_id
        BEGIN
            ALTER TABLE public.invoices ALTER COLUMN company_name DROP NOT NULL;
        EXCEPTION WHEN OTHERS THEN
            -- Si falla, continuar
        END;
        
    ELSE
        -- Si no existe, crear tabla completa
        CREATE TABLE public.invoices (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
            quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
            
            -- Información de la factura
            invoice_number TEXT NOT NULL,
            company_name TEXT, -- Opcional si tenemos customer_id
            
            -- Fechas
            issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
            due_date DATE NOT NULL,
            
            -- Tipo y estado
            type TEXT NOT NULL DEFAULT 'income' CHECK (type IN ('income', 'expense')),
            status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
            
            -- Importes
            subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
            vat_percentage DECIMAL(5,2) NOT NULL DEFAULT 21.00,
            vat_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
            
            -- Archivos
            file_url TEXT,
            
            -- Metadatos
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
            
            -- Constraint para numeración única por usuario
            CONSTRAINT unique_invoice_number_per_user UNIQUE (user_id, invoice_number)
        );
    END IF;
END $$;

-- PASO 7: Índices para optimización
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_cif ON public.customers(cif);

CREATE INDEX IF NOT EXISTS idx_item_categories_user_id ON public.item_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_item_categories_name ON public.item_categories(name);

CREATE INDEX IF NOT EXISTS idx_items_user_id ON public.items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_category_id ON public.items(category_id);
CREATE INDEX IF NOT EXISTS idx_items_name ON public.items(name);

CREATE INDEX IF NOT EXISTS idx_quotes_user_id ON public.quotes(user_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON public.quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_issue_date ON public.quotes(issue_date);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON public.quote_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_items_item_id ON public.quote_items(item_id);

CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON public.invoices(quote_id);

-- PASO 8: Configurar RLS (Row Level Security)
-- =============================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Políticas para customers
DROP POLICY IF EXISTS "Users can view their own customers" ON public.customers;
CREATE POLICY "Users can view their own customers"
    ON public.customers FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own customers" ON public.customers;
CREATE POLICY "Users can insert their own customers"
    ON public.customers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own customers" ON public.customers;
CREATE POLICY "Users can update their own customers"
    ON public.customers FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own customers" ON public.customers;
CREATE POLICY "Users can delete their own customers"
    ON public.customers FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para item_categories
DROP POLICY IF EXISTS "Users can view their own item categories" ON public.item_categories;
CREATE POLICY "Users can view their own item categories"
    ON public.item_categories FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own item categories" ON public.item_categories;
CREATE POLICY "Users can insert their own item categories"
    ON public.item_categories FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own item categories" ON public.item_categories;
CREATE POLICY "Users can update their own item categories"
    ON public.item_categories FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own item categories" ON public.item_categories;
CREATE POLICY "Users can delete their own item categories"
    ON public.item_categories FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para items
DROP POLICY IF EXISTS "Users can view their own items" ON public.items;
CREATE POLICY "Users can view their own items"
    ON public.items FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own items" ON public.items;
CREATE POLICY "Users can insert their own items"
    ON public.items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own items" ON public.items;
CREATE POLICY "Users can update their own items"
    ON public.items FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own items" ON public.items;
CREATE POLICY "Users can delete their own items"
    ON public.items FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para quotes
DROP POLICY IF EXISTS "Users can view their own quotes" ON public.quotes;
CREATE POLICY "Users can view their own quotes"
    ON public.quotes FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own quotes" ON public.quotes;
CREATE POLICY "Users can insert their own quotes"
    ON public.quotes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own quotes" ON public.quotes;
CREATE POLICY "Users can update their own quotes"
    ON public.quotes FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own quotes" ON public.quotes;
CREATE POLICY "Users can delete their own quotes"
    ON public.quotes FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para quote_items
DROP POLICY IF EXISTS "Users can view quote items of their quotes" ON public.quote_items;
CREATE POLICY "Users can view quote items of their quotes"
    ON public.quote_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.quotes 
        WHERE quotes.id = quote_items.quote_id 
        AND quotes.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can insert quote items to their quotes" ON public.quote_items;
CREATE POLICY "Users can insert quote items to their quotes"
    ON public.quote_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.quotes 
        WHERE quotes.id = quote_items.quote_id 
        AND quotes.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can update quote items of their quotes" ON public.quote_items;
CREATE POLICY "Users can update quote items of their quotes"
    ON public.quote_items FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.quotes 
        WHERE quotes.id = quote_items.quote_id 
        AND quotes.user_id = auth.uid()
    ));

DROP POLICY IF EXISTS "Users can delete quote items of their quotes" ON public.quote_items;
CREATE POLICY "Users can delete quote items of their quotes"
    ON public.quote_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.quotes 
        WHERE quotes.id = quote_items.quote_id 
        AND quotes.user_id = auth.uid()
    ));

-- Políticas para invoices (mantener las existentes si las hay)
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
CREATE POLICY "Users can view their own invoices"
    ON public.invoices FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.invoices;
CREATE POLICY "Users can insert their own invoices"
    ON public.invoices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
CREATE POLICY "Users can update their own invoices"
    ON public.invoices FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;
CREATE POLICY "Users can delete their own invoices"
    ON public.invoices FOR DELETE
    USING (auth.uid() = user_id);

-- PASO 9: Funciones para cálculos automáticos
-- =============================================================================

-- Función para calcular totales de líneas de presupuesto
CREATE OR REPLACE FUNCTION calculate_quote_item_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Calcular subtotal (cantidad * precio unitario)
    NEW.subtotal := NEW.quantity * NEW.unit_price;
    
    -- Calcular descuento de la línea
    IF NEW.discount_percentage > 0 THEN
        NEW.discount_amount := (NEW.subtotal * NEW.discount_percentage) / 100;
    ELSE
        NEW.discount_amount := COALESCE(NEW.discount_amount, 0);
    END IF;
    
    -- Calcular total de la línea (subtotal - descuento)
    NEW.total_price := NEW.subtotal - NEW.discount_amount;
    
    -- Actualizar timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular totales de presupuestos
CREATE OR REPLACE FUNCTION calculate_quote_totals()
RETURNS TRIGGER AS $$
DECLARE
    quote_subtotal DECIMAL(10,2);
    quote_vat_amount DECIMAL(10,2);
    quote_total DECIMAL(10,2);
    quote_discount_amount DECIMAL(10,2);
    quote_vat_percentage DECIMAL(5,2);
    quote_discount_percentage DECIMAL(5,2);
    items_discount_total DECIMAL(10,2);
BEGIN
    -- Obtener el subtotal sumando todos los items (antes de descuentos de línea)
    SELECT 
        COALESCE(SUM(subtotal), 0),
        COALESCE(SUM(discount_amount), 0),
        COALESCE(SUM(total_price), 0)
    INTO quote_subtotal, items_discount_total, quote_subtotal
    FROM public.quote_items
    WHERE quote_id = COALESCE(NEW.quote_id, OLD.quote_id);
    
    -- Obtener porcentajes de la tabla quotes
    SELECT vat_percentage, discount_percentage
    INTO quote_vat_percentage, quote_discount_percentage
    FROM public.quotes
    WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);
    
    -- El subtotal ya incluye los descuentos de línea, pero aplicamos descuento general si existe
    quote_discount_amount := (quote_subtotal * COALESCE(quote_discount_percentage, 0)) / 100;
    
    -- Calcular IVA sobre (subtotal de líneas - descuento general)
    quote_vat_amount := ((quote_subtotal - quote_discount_amount) * COALESCE(quote_vat_percentage, 21)) / 100;
    
    -- Calcular total final
    quote_total := quote_subtotal - quote_discount_amount + quote_vat_amount;
    
    -- Actualizar la tabla quotes
    UPDATE public.quotes
    SET 
        subtotal = quote_subtotal,
        discount_amount = quote_discount_amount,
        vat_amount = quote_vat_amount,
        total_amount = quote_total,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.quote_id, OLD.quote_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Función para auto-completar datos del ítem cuando se selecciona
CREATE OR REPLACE FUNCTION auto_fill_quote_item_from_item()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
BEGIN
    -- Si se especifica un item_id, auto-completar datos
    IF NEW.item_id IS NOT NULL THEN
        SELECT name, description, unit_price, unit
        INTO item_record
        FROM public.items
        WHERE id = NEW.item_id;
        
        -- Auto-completar solo si los campos están vacíos
        IF NEW.description IS NULL OR NEW.description = '' THEN
            NEW.description := item_record.name;
        END IF;
        
        IF NEW.unit_price = 0 THEN
            NEW.unit_price := COALESCE(item_record.unit_price, 0);
        END IF;
        
        IF NEW.unit IS NULL OR NEW.unit = 'unidad' THEN
            NEW.unit := COALESCE(item_record.unit, 'unidad');
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para crear factura desde presupuesto
CREATE OR REPLACE FUNCTION create_invoice_from_quote(
    quote_uuid UUID,
    invoice_number_param TEXT
)
RETURNS UUID AS $$
DECLARE
    quote_record RECORD;
    new_invoice_id UUID;
BEGIN
    -- Obtener datos del presupuesto
    SELECT * INTO quote_record
    FROM public.quotes
    WHERE id = quote_uuid AND status = 'accepted';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Presupuesto no encontrado o no aceptado';
    END IF;
    
    -- Crear la factura
    INSERT INTO public.invoices (
        user_id,
        customer_id,
        quote_id,
        invoice_number,
        issue_date,
        due_date,
        type,
        status,
        subtotal,
        vat_percentage,
        vat_amount,
        total_amount
    )
    VALUES (
        quote_record.user_id,
        quote_record.customer_id,
        quote_record.id,
        invoice_number_param,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days', -- 30 días por defecto
        'income',
        'pending',
        quote_record.subtotal - quote_record.discount_amount,
        quote_record.vat_percentage,
        quote_record.vat_amount,
        quote_record.total_amount
    )
    RETURNING id INTO new_invoice_id;
    
    -- Marcar el presupuesto como facturado (opcional)
    -- UPDATE public.quotes SET status = 'invoiced' WHERE id = quote_uuid;
    
    RETURN new_invoice_id;
END;
$$ LANGUAGE plpgsql;

-- PASO 10: Triggers
-- =============================================================================

-- Trigger para auto-completar datos del ítem antes de calcular totales
DROP TRIGGER IF EXISTS trigger_auto_fill_quote_item ON public.quote_items;
CREATE TRIGGER trigger_auto_fill_quote_item
    BEFORE INSERT OR UPDATE ON public.quote_items
    FOR EACH ROW
    EXECUTE FUNCTION auto_fill_quote_item_from_item();

-- Trigger para calcular total de items automáticamente
DROP TRIGGER IF EXISTS trigger_calculate_quote_item_total ON public.quote_items;
CREATE TRIGGER trigger_calculate_quote_item_total
    BEFORE INSERT OR UPDATE ON public.quote_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_quote_item_total();

-- Trigger para recalcular totales del presupuesto cuando cambian los items
DROP TRIGGER IF EXISTS trigger_calculate_quote_totals_on_item_change ON public.quote_items;
CREATE TRIGGER trigger_calculate_quote_totals_on_item_change
    AFTER INSERT OR UPDATE OR DELETE ON public.quote_items
    FOR EACH ROW
    EXECUTE FUNCTION calculate_quote_totals();

-- Trigger para recalcular totales cuando cambian los porcentajes del presupuesto
DROP TRIGGER IF EXISTS trigger_calculate_quote_totals_on_quote_change ON public.quotes;
CREATE TRIGGER trigger_calculate_quote_totals_on_quote_change
    AFTER UPDATE OF vat_percentage, discount_percentage ON public.quotes
    FOR EACH ROW
    EXECUTE FUNCTION calculate_quote_totals();

-- PASO 11: Función para generar números de presupuesto y factura
-- =============================================================================
CREATE OR REPLACE FUNCTION generate_quote_number(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    next_number INTEGER;
    quote_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Obtener el siguiente número para este año
    SELECT COALESCE(MAX(
        CASE 
            WHEN quote_number ~ ('^PRE-' || current_year || '-[0-9]+$')
            THEN CAST(SPLIT_PART(quote_number, '-', 3) AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO next_number
    FROM public.quotes
    WHERE user_id = user_uuid;
    
    quote_number := 'PRE-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN quote_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_invoice_number(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    current_year TEXT;
    next_number INTEGER;
    invoice_number TEXT;
BEGIN
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    
    -- Obtener el siguiente número para este año
    SELECT COALESCE(MAX(
        CASE 
            WHEN invoice_number ~ ('^FAC-' || current_year || '-[0-9]+$')
            THEN CAST(SPLIT_PART(invoice_number, '-', 3) AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO next_number
    FROM public.invoices
    WHERE user_id = user_uuid;
    
    invoice_number := 'FAC-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
    
    RETURN invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener categorías con jerarquía
CREATE OR REPLACE FUNCTION get_category_hierarchy(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    parent_id UUID,
    level INTEGER,
    path TEXT
) AS $$
WITH RECURSIVE category_tree AS (
    -- Categorías raíz (sin padre)
    SELECT 
        c.id,
        c.name,
        c.description,
        c.parent_id,
        0 as level,
        c.name as path
    FROM public.item_categories c
    WHERE c.user_id = user_uuid 
    AND c.parent_id IS NULL
    AND c.is_active = true
    
    UNION ALL
    
    -- Categorías hijas (recursivo)
    SELECT 
        c.id,
        c.name,
        c.description,
        c.parent_id,
        ct.level + 1,
        ct.path || ' > ' || c.name as path
    FROM public.item_categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
    WHERE c.is_active = true
)
SELECT * FROM category_tree
ORDER BY path;
$$ LANGUAGE sql;

-- Función para obtener ítems más utilizados
CREATE OR REPLACE FUNCTION get_most_used_items(user_uuid UUID, limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
    item_id UUID,
    item_name TEXT,
    category_name TEXT,
    usage_count BIGINT,
    last_used TIMESTAMP WITH TIME ZONE
) AS $$
SELECT 
    i.id,
    i.name,
    COALESCE(ic.name, 'Sin categoría') as category_name,
    COUNT(qi.id) as usage_count,
    MAX(qi.created_at) as last_used
FROM public.items i
LEFT JOIN public.item_categories ic ON ic.id = i.category_id
LEFT JOIN public.quote_items qi ON qi.item_id = i.id
WHERE i.user_id = user_uuid 
GROUP BY i.id, i.name, ic.name
ORDER BY usage_count DESC, last_used DESC
LIMIT limit_count;
$$ LANGUAGE sql;

-- PASO 10: Configurar Storage para archivos (si no existe)
-- =============================================================================
DO $$
BEGIN
    -- Crear bucket para presupuestos si no existe
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('quotes', 'quotes', false)
    ON CONFLICT (id) DO NOTHING;
    
    -- Políticas de storage para presupuestos
    CREATE POLICY IF NOT EXISTS "Users can upload their own quote files"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'quotes' AND
        auth.uid()::TEXT = (storage.foldername(name))[1]
    );
    
    CREATE POLICY IF NOT EXISTS "Users can view their own quote files"
    ON storage.objects FOR SELECT
    USING (
        bucket_id = 'quotes' AND
        auth.uid()::TEXT = (storage.foldername(name))[1]
    );
    
    CREATE POLICY IF NOT EXISTS "Users can delete their own quote files"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'quotes' AND
        auth.uid()::TEXT = (storage.foldername(name))[1]
    );
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Storage policies may already exist or storage is not configured';
END $$;

-- DATOS DE EJEMPLO --
/*
INSERT INTO public.item_categories (
    user_id, name, description, color, sort_order
) VALUES (
    auth.uid(), 
    'Equipos de Refrigeración', 
    'Equipos principales para sistemas de refrigeración',
    '#2563eb',
    1
);

INSERT INTO public.items (
    user_id, category_id, name, description, sku, unit_price, unit, is_service
) VALUES (
    auth.uid(),
    (SELECT id FROM public.item_categories WHERE name = 'Equipos de Refrigeración' LIMIT 1),
    'Compresor Industrial 5HP',
    'Compresor hermético para cámaras frigoríficas',
    'COMP-5HP-001',
    1200.00,
    'unidad',
    false
);

INSERT INTO public.customers (
    user_id, name, surname, cif, address, cp, state, city, phone, email, company_name
) VALUES (
    auth.uid(), 
    'Juan', 'Pérez García', '12345678A', 'Calle Mayor 123', '28001', 'Madrid', 'Madrid',
    '+34 600 123 456', 'juan.perez@email.com', 'Empresa Ejemplo SL'
);

INSERT INTO public.quotes (
    user_id, customer_id, quote_number, title, description, issue_date, valid_until,
    status, subtotal, vat_percentage, vat_amount, total_amount
) VALUES (
    auth.uid(),
    (SELECT id FROM public.customers WHERE email = 'juan.perez@email.com' LIMIT 1),
    'PRE-2025-0001',
    'Instalación sistema de refrigeración',
    'Instalación completa de sistema de refrigeración industrial',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    'draft',
    1200.00,
    21.00,
    252.00,
    1452.00
);

INSERT INTO public.quote_items (
    quote_id, item_id, description, quantity, unit_price, unit
) VALUES (
    (SELECT id FROM public.quotes WHERE quote_number = 'PRE-2025-0001' LIMIT 1),
    (SELECT id FROM public.items WHERE sku = 'COMP-5HP-001' LIMIT 1),
    'Compresor Industrial 5HP',
    1,
    1200.00,
    'unidad'
);
*/

