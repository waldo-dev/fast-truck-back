-- Agregar columna code a órdenes para almacenar el código generado por backend
ALTER TABLE IF EXISTS public.orders
ADD COLUMN IF NOT EXISTS code VARCHAR(255);

-- Garantizar unicidad del código (los NULLs están permitidos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_code ON public.orders(code);

