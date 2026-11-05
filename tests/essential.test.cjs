const { test, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
Object.assign(process.env, {
  NODE_ENV: 'test',
  DB_HOST: '127.0.0.1',
  DB_PORT: '1',
  DB_NAME: 'operfoods_test',
  DB_USER: 'test',
  DB_PASSWORD: 'test-only',
  JWT_SECRET: 'isolated-regression-test-secret-not-for-deployment',
});
const express = require('express');
const jwt = require('jsonwebtoken');
const models = require('../dist/shared/database/models');
const { sequelize } = require('../dist/shared/database/connection');
const { logger } = require('../dist/shared/utils/logger');
const { errorHandler } = require('../dist/shared/middlewares/errorHandler');
const { orderRepository } = require('../dist/modules/orders/order.repository');
const { orderService } = require('../dist/modules/orders/order.service');
const { eventService } = require('../dist/modules/events/event.service');
const {
  customerRepository,
} = require('../dist/modules/customers/customer.repository');
const {
  paymentRepository,
} = require('../dist/modules/payments/payment.repository');
const {
  cashRegisterRepository,
} = require('../dist/modules/cash-registers/cash-register.repository');
const {
  orderFingerprint,
  assertOrderTransition,
  calculateEventResult,
} = require('../dist/modules/orders/order.integrity');
const orders = require('../dist/modules/orders/order.routes').default;
const events = require('../dist/modules/events/event.routes').default;
const publicRoutes = require('../dist/modules/public/public.routes').default;
const cashRoutes =
  require('../dist/modules/cash-registers/cash-register.routes').default;
const {
  authenticateCustomer,
} = require('../dist/shared/middlewares/customerAuth');

beforeEach(() => {
  mock.method(logger, 'error', () => {});
  mock.method(models.User, 'findByPk', async id => ({
    id,
    email: 'owner@example.test',
    name: 'Test owner',
    role: id === 99 ? 'ADMIN' : 'BUSINESS_OWNER',
    business_id: id === 99 ? null : 1,
    active: true,
  }));
  mock.method(models.UserBusiness, 'findOne', async () => null);
});
afterEach(() => mock.restoreAll());

async function request(
  path,
  { user = 7, method = 'GET', body, headers = {} } = {}
) {
  const app = express();
  app.use(express.json());
  app.use('/orders', orders);
  app.use('/events', events);
  app.use('/public', publicRoutes);
  app.use(cashRoutes);
  app.get('/customer-profile', authenticateCustomer, (_req, res) =>
    res.json({ success: true })
  );
  app.use(errorHandler);
  const server = await new Promise(resolve => {
    const server = app.listen(0, '127.0.0.1', () => resolve(server));
  });
  try {
    const token =
      user === null
        ? undefined
        : jwt.sign({ id: user }, process.env.JWT_SECRET);
    const response = await fetch(
      `http://127.0.0.1:${server.address().port}${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      }
    );
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

test('anonymous requests cannot list orders or read a customer address through an order ID', async () => {
  assert.equal(
    (await request('/orders?business_id=1', { user: null })).status,
    401
  );
  assert.equal((await request('/orders/42', { user: null })).status, 401);
});
test('changing business_id does not grant access to another business', async () => {
  const list = mock.method(models.Order, 'findAll', async () => {
    throw Error('must not query orders');
  });
  assert.equal((await request('/orders?business_id=2')).status, 404);
  assert.equal(list.mock.callCount(), 0);
});
test('conflicting business IDs in headers and body are rejected', async () => {
  assert.equal(
    (
      await request('/orders', {
        method: 'POST',
        headers: { 'X-Business-Id': '1' },
        body: { business_id: 2 },
      })
    ).status,
    400
  );
});
test('owner role cannot export the orders of a different user', async () => {
  assert.equal((await request('/orders/by-user/8')).status, 403);
  assert.equal((await request('/orders/by-user/8/csv')).status, 403);
});
test('a legitimately associated second business works and is used in the database filter', async () => {
  mock.method(models.UserBusiness, 'findOne', async () => ({
    user_id: 7,
    business_id: 2,
  }));
  let businessId;
  mock.method(models.Order, 'findAll', async options => {
    businessId = options.where.business_id;
    return [];
  });
  assert.equal((await request('/orders?business_id=2')).status, 200);
  assert.equal(businessId, 2);
});
test('a guessed order ID from another business cannot be read or changed', async () => {
  mock.method(models.Order, 'findByPk', async () => ({ business_id: 2 }));
  assert.equal((await request('/orders/42')).status, 404);
  assert.equal(
    (
      await request('/orders/42/status', {
        method: 'PATCH',
        body: { status: 'READY' },
      })
    ).status,
    404
  );
});
test('administrator can explicitly select a business without a default business', async () => {
  mock.method(models.Order, 'findAll', async () => []);
  assert.equal(
    (await request('/orders?business_id=2', { user: 99 })).status,
    200
  );
});
test('event summary uses the event in the URL rather than the authenticated user ID', async () => {
  mock.method(models.Event, 'findByPk', async () => ({ business_id: 1 }));
  let args;
  mock.method(eventService, 'getSummary', async (...values) => {
    args = values;
    return { sales: 0 };
  });
  assert.equal((await request('/events/88/summary')).status, 200);
  assert.deepEqual(args, [88, 1]);
});
test('public checkout cannot impersonate a stored customer or mark a payment received', async () => {
  let input;
  mock.method(orderService, 'createOrder', async data => {
    input = data;
    return { id: 11, code: 'ABC123' };
  });
  const response = await request('/public/orders?business_id=1', {
    user: null,
    method: 'POST',
    body: {
      request_key: 'request-public-test-0001',
      customer_id: 999,
      address_id: 888,
      status: 'DELIVERED',
      order_source: 'POS',
      order_type: 'PICKUP',
      customer: { name: 'New customer' },
      payment_received: true,
      cash_register_id: 999,
      items: [{ product_id: 1, quantity: 1 }],
    },
  });
  assert.equal(response.status, 201);
  assert.equal(input.order_source, 'ONLINE');
  assert.equal(input.customer_id, undefined);
  assert.equal(input.address_id, undefined);
  assert.equal(input.payment_received, false);
  assert.equal(input.status, undefined);
});
test('checkout requires a retry key before performing side effects', async () => {
  assert.equal(
    (
      await request('/public/orders?business_id=1', {
        user: null,
        method: 'POST',
        body: {
          customer: { name: 'Test' },
          order_source: 'ONLINE',
          order_type: 'PICKUP',
          items: [{ product_id: 1, quantity: 1 }],
        },
      })
    ).status,
    400
  );
});
test('fingerprint is stable across property order and changes if the purchase changes', () => {
  assert.equal(
    orderFingerprint({ b: 2, a: 1 }),
    orderFingerprint({ a: 1, b: 2, request_key: 'different' })
  );
  assert.notEqual(
    orderFingerprint({ quantity: 1 }),
    orderFingerprint({ quantity: 2 })
  );
});
test('a retry returns the existing order before creating a customer or stock movements', async () => {
  const input = {
    business_id: 1,
    request_key: 'request-retry-test-0001',
    customer: { name: 'Test' },
    order_source: 'POS',
    order_type: 'PICKUP',
    items: [{ product_id: 1, quantity: 1 }],
  };
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  mock.method(sequelize, 'transaction', async callback =>
    callback(transaction)
  );
  mock.method(sequelize, 'query', async () => []);
  mock.method(models.Order, 'findOne', async () => ({
    id: 21,
    request_hash: orderFingerprint(input),
  }));
  mock.method(orderRepository, 'findById', async id => ({ id }));
  const create = mock.method(customerRepository, 'create', async () => {
    throw Error('must not create');
  });
  assert.deepEqual(await orderService.createOrder(input), { id: 21 });
  assert.equal(create.mock.callCount(), 0);
});
test('reuse of a retry key for a different purchase is rejected', async () => {
  mock.method(sequelize, 'transaction', async callback => callback({}));
  mock.method(sequelize, 'query', async () => []);
  mock.method(models.Order, 'findOne', async () => ({
    id: 21,
    request_hash: 'different',
  }));
  await assert.rejects(
    orderService.createOrder({
      business_id: 1,
      request_key: 'request-conflict-0001',
    }),
    error => error.statusCode === 409
  );
});
test('two simultaneous identical submissions create only one order and one customer', async () => {
  let saved;
  let tail = Promise.resolve();
  mock.method(sequelize, 'transaction', async callback => {
    const transaction = {};
    try {
      return await callback(transaction);
    } finally {
      transaction.release?.();
    }
  });
  mock.method(sequelize, 'query', async (_sql, options) => {
    const previous = tail;
    tail = new Promise(resolve => {
      options.transaction.release = resolve;
    });
    await previous;
  });
  mock.method(models.Order, 'findOne', async () => saved);
  const customer = mock.method(
    customerRepository,
    'create',
    async (data, transaction) => {
      assert.ok(transaction);
      assert.ok(
        data.phone.length <= 30,
        'temporary phone must fit the existing database column'
      );
      return { id: 4 };
    }
  );
  const create = mock.method(
    orderRepository,
    'create',
    async (data, transaction) => {
      assert.ok(transaction);
      saved = { id: 42, request_hash: data.request_hash };
      return saved;
    }
  );
  mock.method(orderRepository, 'findById', async () => saved);
  const input = {
    business_id: 1,
    request_key: 'simultaneous-request-0001',
    customer: { name: 'Test' },
    order_type: 'PICKUP',
    order_source: 'POS',
    items: [{ product_id: 1, quantity: 1 }],
  };
  const [first, second] = await Promise.all([
    orderService.createOrder(input),
    orderService.createOrder(input),
  ]);
  assert.equal(first.id, second.id);
  assert.equal(create.mock.callCount(), 1);
  assert.equal(customer.mock.callCount(), 1);
});
test('historical lines preserve discounted totals, selected options, names and total ingredient cost', async () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  let lines;
  const product = { id: 1, price: '1000', name: 'Burger' };
  mock.method(models.Customer, 'findOne', async () => ({
    id: 4,
    business_id: 1,
  }));
  mock.method(models.Product, 'findOne', async () => product);
  mock.method(models.Product, 'findByPk', async () => product);
  mock.method(models.ProductOption, 'findAll', async () => [
    { id: 2, option_type: 'Extra', option_value: 'Queso', extra_price: '200' },
  ]);
  mock.method(models.Promotion, 'findAll', async () => [
    { discount_type: 'FIXED', discount_value: 100 },
  ]);
  mock.method(models.ProductRecipe, 'findAll', async () => [
    {
      quantity_required: 1,
      inventoryItem: { id: 9, business_id: 1, cost_per_item: 100 },
    },
  ]);
  mock.method(models.ProductOptionRecipe, 'findAll', async () => [
    {
      quantity_required: 1,
      inventoryItem: { id: 9, business_id: 1, cost_per_item: 50 },
    },
  ]);
  mock.method(models.InventoryItem, 'findOne', async () => ({
    current_stock: 20,
    update: async (_data, options) =>
      assert.equal(options.transaction, transaction),
  }));
  mock.method(models.InventoryMovement, 'create', async () => ({}));
  mock.method(models.Order, 'findOne', async () => null);
  mock.method(models.Order, 'create', async data => ({
    ...data,
    id: 42,
    dataValues: { id: 42 },
  }));
  mock.method(models.OrderItem, 'bulkCreate', async data => {
    lines = data;
    return data;
  });
  mock.method(orderRepository, 'findById', async () => ({ id: 42 }));
  await orderRepository.create(
    {
      business_id: 1,
      customer_id: 4,
      order_type: 'PICKUP',
      order_source: 'POS',
      items: [
        {
          product_id: 1,
          quantity: 2,
          selected_option_ids: [2],
          notes: 'Sin cebolla',
        },
      ],
    },
    transaction
  );
  assert.equal(lines[0].unit_price, 1100);
  assert.equal(lines[0].line_total, 2200);
  assert.equal(lines[0].cost, 300);
  assert.equal(lines[0].product_name, 'Burger');
  assert.equal(lines[0].selected_options[0].name, 'Extra: Queso');
  assert.equal(lines[0].notes, 'Sin cebolla');
});
test('terminal states cannot regress and repeating the same state is harmless', () => {
  assert.doesNotThrow(() => assertOrderTransition('CANCELLED', 'CANCELLED'));
  assert.throws(
    () => assertOrderTransition('DELIVERED', 'PREPARING'),
    error => error.statusCode === 409
  );
  assert.throws(
    () => assertOrderTransition('CREATED', 'READY'),
    error => error.statusCode === 409
  );
});
test("an operator working on a stale state receives a conflict instead of advancing someone else's work", async () => {
  mock.method(sequelize, 'transaction', async callback =>
    callback({ LOCK: { UPDATE: 'UPDATE' } })
  );
  mock.method(models.Order, 'findByPk', async () => ({
    id: 42,
    status: 'CONFIRMED',
  }));
  await assert.rejects(
    orderRepository.updateStatus(42, 'PREPARING', 'CREATED'),
    error => error.statusCode === 409
  );
});
test('cancellation restores unprepared ingredients once, even when the action is retried', async () => {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  const state = {
    id: 42,
    business_id: 1,
    status: 'CONFIRMED',
    update: async data => Object.assign(state, data),
  };
  mock.method(sequelize, 'transaction', async callback =>
    callback(transaction)
  );
  mock.method(sequelize, 'query', async () => []);
  mock.method(models.Order, 'findByPk', async () => state);
  mock.method(orderRepository, 'findById', async () => state);
  mock.method(models.Payment, 'count', async () => 0);
  mock.method(models.Payment, 'update', async () => []);
  mock.method(models.InventoryMovement, 'findAll', async () => [
    { inventory_item_id: 9, quantity: 2, event_id: null, location_id: null },
  ]);
  const increment = mock.fn(async (_field, options) =>
    assert.equal(options.by, 2)
  );
  mock.method(models.InventoryItem, 'findOne', async () => ({ increment }));
  const movement = mock.method(
    models.InventoryMovement,
    'create',
    async () => ({})
  );
  await orderRepository.updateStatus(42, 'CANCELLED');
  await orderRepository.updateStatus(42, 'CANCELLED');
  assert.equal(increment.mock.callCount(), 1);
  assert.equal(movement.mock.callCount(), 1);
  assert.ok(state.cancelled_at instanceof Date);
});
test('cancellation after preparation retains consumed ingredients', async () => {
  const state = {
    id: 42,
    status: 'PREPARING',
    update: async data => Object.assign(state, data),
  };
  mock.method(sequelize, 'transaction', async callback =>
    callback({ LOCK: { UPDATE: 'UPDATE' } })
  );
  mock.method(sequelize, 'query', async () => []);
  mock.method(models.Order, 'findByPk', async () => state);
  mock.method(orderRepository, 'findById', async () => state);
  mock.method(models.Payment, 'count', async () => 0);
  mock.method(models.Payment, 'update', async () => []);
  const stock = mock.method(models.InventoryMovement, 'findAll', async () => {
    throw Error('must not restock prepared food');
  });
  await orderRepository.updateStatus(42, 'CANCELLED');
  assert.equal(stock.mock.callCount(), 0);
});
test('a paid order cannot silently disappear through cancellation', async () => {
  mock.method(sequelize, 'transaction', async callback =>
    callback({ LOCK: { UPDATE: 'UPDATE' } })
  );
  mock.method(models.Order, 'findByPk', async () => ({
    id: 42,
    status: 'CREATED',
  }));
  mock.method(models.Payment, 'count', async () => 1);
  await assert.rejects(
    orderRepository.updateStatus(42, 'CANCELLED'),
    error => error.statusCode === 409
  );
});
test('received payment and cash entry are one operation; a retry adds no second cash entry', async () => {
  let paid;
  mock.method(sequelize, 'transaction', async callback =>
    callback({ LOCK: { UPDATE: 'UPDATE' } })
  );
  mock.method(models.Order, 'findOne', async () => ({
    id: 42,
    business_id: 1,
    status: 'READY',
    total: 5000,
  }));
  mock.method(models.Payment, 'findOne', async () => paid);
  mock.method(models.Payment, 'update', async () => []);
  mock.method(models.Payment, 'create', async data => {
    paid = { ...data, id: 12 };
    return paid;
  });
  mock.method(models.CashRegister, 'findOne', async () => ({
    id: 3,
    status: 'OPEN',
  }));
  const movement = mock.method(models.CashMovement, 'create', async () => ({}));
  const input = {
    order_id: 42,
    businessId: 1,
    payment_method: 'CARD',
    amount: 5000,
  };
  await paymentRepository.create(input);
  await paymentRepository.create(input);
  assert.equal(movement.mock.callCount(), 1);
  assert.equal(paid.payment_status, 'PAID');
});
test('pending payments are excluded from collected cash/card totals', async () => {
  mock.method(models.Order, 'findAll', async () => [
    {
      total: 10000,
      status: 'CREATED',
      payments: [
        { amount: 10000, payment_method: 'CASH', payment_status: 'PENDING' },
      ],
    },
  ]);
  const result = await orderRepository.findCloseout(1, {});
  assert.equal(result.gross_sales, 10000);
  assert.equal(result.payment_breakdown.CASH, 0);
});
test('manual card movements do not inflate expected physical cash', async () => {
  mock.method(cashRegisterRepository, 'getById', async () => ({
    opening_amount: 1000,
  }));
  mock.method(cashRegisterRepository, 'getMovements', async () => [
    { type: 'IN', amount: 5000, payment_method: 'CARD' },
    { type: 'SALE', amount: 2000, payment_method: 'CASH' },
  ]);
  assert.equal(
    (await cashRegisterRepository.getSummaryData(1)).expectedCash,
    3000
  );
});
test('event margin subtracts total line costs once, not cost multiplied by quantity again', () => {
  assert.equal(
    calculateEventResult(800000, 200000, [{ cost: 300000 }]).margin,
    300000
  );
});
test('missing ingredient costs are shown as incomplete rather than a fictitious profit', () => {
  assert.equal(
    calculateEventResult(800000, 200000, [{ cost: null }]).margin,
    null
  );
  assert.equal(
    calculateEventResult(800000, 200000, []).cost_coverage_complete,
    false
  );
});
test('guessing a cash register ID from another business cannot reveal its movements or close it', async () => {
  mock.method(models.CashRegister, 'findByPk', async () => ({
    business_id: 2,
  }));
  assert.equal((await request('/cash-registers/42/summary')).status, 404);
  assert.equal((await request('/cash-registers/42/movements')).status, 404);
  assert.equal(
    (await request('/cash-registers/42/close', { method: 'POST', body: {} }))
      .status,
    404
  );
});
test('forged customer IDs and arbitrary session headers are not authenticated', async () => {
  assert.equal(
    (
      await request('/customer-profile', {
        user: null,
        headers: { 'X-Session-Token': '123', 'X-Customer-Id': '123' },
      })
    ).status,
    401
  );
});
test('database failure details are not exposed to customers', async () => {
  mock.method(models.Order, 'findAll', async () => {
    throw Object.assign(new Error('sensitive-database-detail'), {
      parent: { detail: 'private-customer-data' },
    });
  });
  const response = await request('/orders?business_id=1');
  assert.equal(response.status, 500);
  assert.doesNotMatch(
    JSON.stringify(response.body),
    /sensitive-database-detail|private-customer-data/
  );
});
