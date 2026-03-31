-- Agregar columnas slug y status a la tabla business
ALTER TABLE public.business
ADD COLUMN IF NOT EXISTS slug VARCHAR(150);

ALTER TABLE public.business
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

-- Inicializar estado para negocios existentes
UPDATE public.business SET status = 'ACTIVE' WHERE status IS NULL;
