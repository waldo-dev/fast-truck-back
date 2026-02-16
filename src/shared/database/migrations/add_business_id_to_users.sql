-- Agregar columna business_id a la tabla users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS business_id INTEGER;

-- Agregar foreign key constraint
ALTER TABLE public.users
ADD CONSTRAINT users_business_id_fkey 
FOREIGN KEY (business_id) 
REFERENCES public.businesses(id);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_users_business_id ON public.users(business_id);

