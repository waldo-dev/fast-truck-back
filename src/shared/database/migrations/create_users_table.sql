-- Crear ENUM para roles de usuario
CREATE TYPE public.user_role AS ENUM (
  'ADMIN',
  'BUSINESS_OWNER',
  'LOCAL_OPERATOR'
);

-- Crear tabla users
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role public.user_role NOT NULL DEFAULT 'LOCAL_OPERATOR',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Crear índice en email para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Crear índice en role para filtros
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);


