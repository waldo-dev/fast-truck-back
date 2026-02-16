-- Crear tabla para almacenar OTPs
CREATE TABLE IF NOT EXISTS public.otps (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(30) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Crear índice en phone para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_otps_phone ON public.otps(phone);

-- Crear índice en expires_at para limpieza de OTPs expirados
CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON public.otps(expires_at);

-- Crear índice compuesto para búsquedas de verificación
CREATE INDEX IF NOT EXISTS idx_otps_phone_code_verified ON public.otps(phone, code, verified);

