-- FullShell Database Schema
-- Execute this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Comercios (Tenants)
CREATE TABLE IF NOT EXISTS comercios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    nombre TEXT NOT NULL,
    correo TEXT,
    telefono TEXT,
    whatsapp TEXT,
    direccion TEXT,
    latitud DECIMAL,
    longitud DECIMAL,
    logo_url TEXT,
    logo_width INTEGER DEFAULT 48,
    logo_height INTEGER DEFAULT 48,
    printer_ip TEXT,
    printer_port INTEGER DEFAULT 9100,
    printer_enabled BOOLEAN DEFAULT false,
    plan_status TEXT DEFAULT 'trial', -- trial, active, expired
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '10 days'),
    plan_expiration TIMESTAMP WITH TIME ZONE,
    fidelidad_meta INTEGER DEFAULT 10, -- Configurable: N lavadas para 1 gratis
    security_pin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id UUID REFERENCES comercios(id) ON DELETE CASCADE NOT NULL,
    nombre TEXT NOT NULL,
    telefono TEXT,
    placa TEXT, -- License plate
    lavadas_acumuladas INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Servicios
CREATE TABLE IF NOT EXISTS servicios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id UUID REFERENCES comercios(id) ON DELETE CASCADE NOT NULL,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio DECIMAL NOT NULL,
    costo_insumos DECIMAL DEFAULT 0,
    es_premio BOOLEAN DEFAULT false,
    suma_puntos BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Empleados
CREATE TABLE IF NOT EXISTS empleados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id UUID REFERENCES comercios(id) ON DELETE CASCADE NOT NULL,
    nombre TEXT NOT NULL,
    tipo_pago TEXT CHECK (tipo_pago IN ('por_lavado', 'por_dia', 'por_hora', 'porcentaje')),
    monto_pago DECIMAL NOT NULL, -- Comision por lavado o sueldo base
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Lavados (Transactions)
CREATE TABLE IF NOT EXISTS lavados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id UUID REFERENCES comercios(id) ON DELETE CASCADE NOT NULL,
    cliente_id UUID REFERENCES clientes(id),
    servicio_id UUID REFERENCES servicios(id),
    empleado_id UUID REFERENCES empleados(id),
    monto_total DECIMAL NOT NULL,
    metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'yappy', 'gratis')),
    es_gratis BOOLEAN DEFAULT false,
    comision_empleado DECIMAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. Recompensas de Fidelidad
CREATE TABLE IF NOT EXISTS recompensas_fidelidad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id UUID REFERENCES comercios(id) ON DELETE CASCADE NOT NULL,
    premio_nombre TEXT NOT NULL,
    lavadas_requeridas INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Membresias (SaaS Payments)
CREATE TABLE IF NOT EXISTS pagos_membresia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id UUID REFERENCES comercios(id) ON DELETE CASCADE NOT NULL,
    monto DECIMAL NOT NULL,
    comprobante_url TEXT,
    estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ROW LEVEL SECURITY (RLS)

ALTER TABLE comercios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comercios: owner can manage own commerce" ON comercios
    FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clientes: commerce can manage own clients" ON clientes
    FOR ALL USING (comercio_id IN (SELECT id FROM comercios WHERE owner_id = auth.uid()));

ALTER TABLE servicios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Servicios: commerce can manage own services" ON servicios
    FOR ALL USING (comercio_id IN (SELECT id FROM comercios WHERE owner_id = auth.uid()));

ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Empleados: commerce can manage own employees" ON empleados
    FOR ALL USING (comercio_id IN (SELECT id FROM comercios WHERE owner_id = auth.uid()));

ALTER TABLE lavados ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lavados: commerce can manage own transactions" ON lavados
    FOR ALL USING (comercio_id IN (SELECT id FROM comercios WHERE owner_id = auth.uid()));

ALTER TABLE pagos_membresia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pagos: commerce can manage own payments" ON pagos_membresia
    FOR ALL USING (comercio_id IN (SELECT id FROM comercios WHERE owner_id = auth.uid()));

ALTER TABLE recompensas_fidelidad ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recompensas: commerce can manage own rewards" ON recompensas_fidelidad
    FOR ALL USING (comercio_id IN (SELECT id FROM comercios WHERE owner_id = auth.uid()));
