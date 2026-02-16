-- Crear ENUMs para payment_configs
CREATE TYPE public.payment_provider AS ENUM (
  'WEBPAY',
  'STRIPE',
  'MERCADOPAGO',
  'OTHER'
);

CREATE TYPE public.payment_environment AS ENUM (
  'TEST',
  'PRODUCTION'
);

-- Crear tabla payment_configs
CREATE TABLE IF NOT EXISTS public.payment_configs (
  id SERIAL PRIMARY KEY,
  business_id INT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  provider public.payment_provider NOT NULL,
  commerce_code VARCHAR(50) NOT NULL,
  api_key TEXT NOT NULL,
  environment public.payment_environment DEFAULT 'TEST',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE (business_id, provider)
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_payment_configs_business_id ON public.payment_configs(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_configs_provider ON public.payment_configs(provider);
CREATE INDEX IF NOT EXISTS idx_payment_configs_active ON public.payment_configs(active);


