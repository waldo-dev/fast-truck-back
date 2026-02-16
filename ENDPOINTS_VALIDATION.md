# Validación de Endpoints

## ✅ TODOS LOS ENDPOINTS IMPLEMENTADOS

### 🔑 AUTH
- ✅ POST /auth/login
- ✅ GET /auth/me

### 🏢 BUSINESSES
- ✅ POST /businesses (ADMIN)
- ✅ GET /businesses/:id
- ✅ PUT /businesses/:id (ADMIN)

### 👥 USERS (STAFF)
- ✅ POST /users (ADMIN)
- ✅ GET /users
- ✅ PUT /users/:id (ADMIN)
- ✅ DELETE /users/:id (desactivar, ADMIN)

### 👤 CUSTOMERS
- ✅ POST /customers/otp/send
- ✅ POST /customers/otp/verify (soporta "otp" y "code")
- ✅ GET /customers
- ✅ GET /customers/:id
- ✅ POST /customers/:id/addresses
- ✅ PUT /customers/addresses/:id
- ✅ PUT /customers/:customerId/addresses/:addressId (ambas rutas disponibles)

### 🗂️ CATEGORIES
- ✅ POST /categories
- ✅ GET /categories
- ✅ PUT /categories/:id
- ✅ DELETE /categories/:id (soft delete implementado)

### 🍕 PRODUCTS
- ✅ POST /products
- ✅ GET /products
- ✅ GET /products/:id
- ✅ PUT /products/:id
- ✅ PATCH /products/:id/status

### 🔀 PRODUCT OPTIONS
- ✅ POST /products/:id/options
- ✅ PUT /product-options/:id
- ✅ DELETE /product-options/:id

### 🎯 PROMOTIONS
- ✅ POST /promotions
- ✅ GET /promotions
- ✅ PUT /promotions/:id
- ✅ PATCH /promotions/:id/active

### 📍 LOCATIONS
- ✅ POST /locations
- ✅ GET /locations

### 🎪 EVENTS
- ✅ POST /events
- ✅ GET /events (con query param future=true para solo futuros)
- ✅ GET /events/:id

### 🧾 ORDERS
- ✅ POST /orders
- ✅ GET /orders
- ✅ GET /orders/:id
- ✅ PATCH /orders/:id/status

### 💰 PAYMENTS
- ✅ POST /payments
- ✅ GET /payments/:orderId

### 💳 PAYMENT CONFIG
- ✅ POST /payment-configs
- ✅ GET /payment-configs

### 🌐 PUBLIC ENDPOINTS
- ✅ GET /public/menu
- ✅ GET /public/events
- ✅ GET /public/payment-methods

---

## 📝 NOTAS

- Todos los endpoints están protegidos según los roles especificados
- business_id se obtiene del token JWT para endpoints autenticados
- Los endpoints públicos requieren business_id en query, body o header
- Soft delete implementado en categorías
- Promociones ahora usan /active en lugar de /status
- Customers OTP acepta tanto "otp" como "code" para compatibilidad

