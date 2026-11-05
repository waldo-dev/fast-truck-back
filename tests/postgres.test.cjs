const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

test(
  'PostgreSQL: migration, unique retry key, JSON snapshots and rollback',
  { skip: !process.env.OPERFOODS_TEST_DATABASE_URL },
  async () => {
    const url = new URL(process.env.OPERFOODS_TEST_DATABASE_URL);
    if (!/test/i.test(url.pathname))
      throw Error(
        'La base indicada debe incluir test en su nombre. No se ejecutan pruebas en bases operativas.'
      );
    const client = new Client({ connectionString: url.toString() });
    await client.connect();
    const schema = `operfoods_test_${Date.now()}`;
    try {
      await client.query(`CREATE SCHEMA "${schema}"`);
      await client.query(`SET search_path TO "${schema}"`);
      await client.query(
        'CREATE TABLE orders (id SERIAL PRIMARY KEY, business_id INTEGER); CREATE TABLE order_items (id SERIAL PRIMARY KEY)'
      );
      const sql = fs.readFileSync(
        path.join(
          __dirname,
          '../src/shared/database/migrations/20261105_order_integrity.sql'
        ),
        'utf8'
      );
      await client.query(sql);
      await client.query(sql);
      const insert =
        'INSERT INTO orders (business_id, request_key, request_hash) VALUES ($1, $2, $3)';
      await client.query(insert, [1, 'repeat-request', 'hash']);
      await assert.rejects(
        client.query(insert, [1, 'repeat-request', 'hash']),
        error => error.code === '23505'
      );
      await client.query(insert, [2, 'repeat-request', 'hash']);
      await client.query(
        'INSERT INTO order_items (selected_options, line_total, product_name) VALUES ($1, 2200, $2)',
        [JSON.stringify([{ id: 2, name: 'Queso' }]), 'Burger']
      );
      assert.equal(
        (await client.query('SELECT selected_options FROM order_items')).rows[0]
          .selected_options[0].name,
        'Queso'
      );
      await client.query('BEGIN');
      await client.query(
        "SELECT pg_advisory_xact_lock(hashtextextended('test-order', 0))"
      );
      await client.query(insert, [1, 'rollback-request', 'hash']);
      await client.query('ROLLBACK');
      assert.equal(
        (
          await client.query(
            "SELECT COUNT(*)::int AS count FROM orders WHERE request_key = 'rollback-request'"
          )
        ).rows[0].count,
        0
      );
    } finally {
      await client.query('ROLLBACK').catch(() => {});
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await client.end();
    }
  }
);
