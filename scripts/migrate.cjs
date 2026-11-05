const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();
const { Client } = require('pg');
const name = '20261105_order_integrity.sql';
const sql = fs.readFileSync(
  path.join(__dirname, '../src/shared/database/migrations', name),
  'utf8'
);

async function main() {
  if (!process.argv.includes('--apply')) {
    console.log(
      `Migración disponible: ${name}. Añade claves de reintento, snapshots de líneas e historial de estados.`
    );
    console.log(
      'No se conectó ni modificó ninguna base. Después de respaldar y validar en pruebas: npm run migrate -- --apply'
    );
    return;
  }
  for (const key of ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']) {
    if (!process.env[key])
      throw Error(`Falta configurar ${key}. No se aplicó la migración.`);
  }
  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  await client.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended('operfoods:migrations', 0))"
    );
    await client.query(
      'CREATE TABLE IF NOT EXISTS operfoods_schema_migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())'
    );
    const previous = await client.query(
      'SELECT name FROM operfoods_schema_migrations WHERE name = $1',
      [name]
    );
    if (!previous.rowCount) {
      await client.query(
        sql.replace(/^BEGIN;\s*/i, '').replace(/COMMIT;\s*$/i, '')
      );
      await client.query(
        'INSERT INTO operfoods_schema_migrations (name) VALUES ($1)',
        [name]
      );
    }
    await client.query('COMMIT');
    console.log(
      previous.rowCount
        ? 'La migración ya estaba aplicada.'
        : `Migración aplicada: ${name}`
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    await client.end();
  }
}
main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
