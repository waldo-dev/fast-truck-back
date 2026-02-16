import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  API_VERSION: string;
  DB_HOST: string;
  DB_PORT: number;
  DB_NAME: string;
  DB_USER: string;
  DB_PASSWORD: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};

export const env: EnvConfig = {
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  PORT: parseInt(getEnvVar('PORT', '3000'), 10),
  API_VERSION: getEnvVar('API_VERSION', 'v1'),
  DB_HOST: getEnvVar('DB_HOST'),
  DB_PORT: parseInt(getEnvVar('DB_PORT', '5432'), 10),
  DB_NAME: getEnvVar('DB_NAME'),
  DB_USER: getEnvVar('DB_USER'),
  DB_PASSWORD: getEnvVar('DB_PASSWORD'),
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  JWT_EXPIRES_IN: getEnvVar('JWT_EXPIRES_IN', '24h'),
};

