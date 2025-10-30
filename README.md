# 🚀 Prueba Técnica – Sistema de Pedidos B2B (Node.js + MySQL + Docker + Lambda)

Este monorepo implementa un sistema mínimo compuesto por dos APIs (**Customers** y **Orders**) y un **Lambda Orchestrator**.  
Cada servicio se ejecuta de forma independiente en contenedores Docker, y la Lambda se puede ejecutar localmente con **Serverless Offline** o desplegar en AWS.

---

## 🧱 Estructura del proyecto

/db
├── schema.sql
├── seed.sql
/customers-api
├── src/
/orders-api
├── src/
/lambda-orchestrator
├── src/
/docker-compose.yml


---

## ⚙️ Variables de entorno

Cada servicio tiene su propio archivo `.env`.  
Ejemplo de configuración:

### 🧩 Base de datos (MySQL)

MYSQL_ROOT_PASSWORD=rootpass
MYSQL_DATABASE=JelouDB
MYSQL_USER=jbpitae
MYSQL_PASSWORD=Jbpitae28231317*



### 🧩 Customers API (`customers-api/.env`)

PORT=3002
MYSQL_HOST=mysql_db
MYSQL_PORT=3306
MYSQL_USER=jbpitae
MYSQL_PASSWORD=Jbpitae28231317*
MYSQL_DATABASE=JelouDB
JWT_SECRET=super-secret-key


### 🧩 Orders API (`orders-api/.env`)

PORT=3001
MYSQL_HOST=mysql_db
MYSQL_PORT=3306
MYSQL_USER=jbpitae
MYSQL_PASSWORD=Jbpitae28231317*
MYSQL_DATABASE=JelouDB
CUSTOMERS_API_URL=http://customers-api:3002/api

IDEMPOTENCY_TTL_HOURS=24
JWT_SECRET=super-secret-key


### 🧩 Lambda Orchestrator (`lambda-orchestrator/.env`)

CUSTOMERS_API_BASE=http://customers-api:3002/api

ORDERS_API_BASE=http://orders-api:3001/api

JWT_SECRET=super-secret-key
OFFLINE_HTTP_PORT=3003
DEFAULT_IDEMPOTENCY_KEY=demo-idem-123


---

## 🐳 Comandos para levantar el sistema

### 🔹 Construir e iniciar todo el entorno (ejecutar en la raizde todo el proyecto)
```bash
docker-compose build
docker-compose up -d

Esto levanta:

MySQL (con esquema y seed automáticos)

Customers API (puerto 3002)

Orders API (puerto 3001)

Verificar:

http://localhost:3001/health
http://localhost:3002/health


💡 Endpoints principales
🧾 Customers API

| Método | Ruta                    | Descripción                                       |
| ------ | ----------------------- | ------------------------------------------------- |
| POST   | /customers              | Crea cliente                                      |
| GET    | /customers/:id          | Obtiene cliente                                   |
| GET    | /internal/customers/:id | Requiere `Authorization: Bearer super-secret-key` |


📦 Orders API

| Método | Ruta                | Descripción                  |
| ------ | ------------------- | ---------------------------- |
| POST   | /orders             | Crea orden y descuenta stock |
| GET    | /orders/:id         | Devuelve detalle con items   |
| POST   | /orders/:id/confirm | Confirma orden (idempotente) |
| POST   | /orders/:id/cancel  | Cancela y restaura stock     |


🧮 Ejemplos cURL
➕ Crear cliente

curl -X POST http://localhost:3002/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name": "ACME", "email": "ops@acme.com", "phone": "0999999999"}'

➕ Crear orden

curl -X POST http://localhost:3001/api/orders \
  -H "Content-Type: application/json" \
  -d '{
        "customer_id": 1,
        "items": [
          {"product_id": 2, "qty": 3}
        ]
      }'



✅ Confirmar orden

curl -X POST http://localhost:3001/api/orders/1/confirm \
  -H "X-Idempotency-Key: test-123"

--------------------------------------------------------------------------------------

⚡ Lambda Orchestrator
🔹 Ejecutar localmente

cd lambda-orchestrator
npm install
npm run build
npm run dev


Servicio disponible en:

http://localhost:3003/orchestrator/create-and-confirm-order


🔹 Invocar desde Postman o cURL
curl -X POST http://localhost:3003/orchestrator/create-and-confirm-order \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "items": [{ "product_id": 2, "qty": 3 }],
    "idempotency_key": "abc-123",
    "correlation_id": "req-789"
  }'


🟢 Respuesta esperada
{
  "success": true,
  "correlationId": "req-789",
  "data": {
    "customer": {
      "id": 1,
      "name": "ACME",
      "email": "ops@acme.com",
      "phone": "0999999999"
    },
    "order": {
      "id": 101,
      "status": "CONFIRMED",
      "total_cents": 459900,
      "items": [
        { "product_id": 2, "qty": 3, "unit_price_cents": 129900, "subtotal_cents": 389700 }
      ]
    }
  }
}

--------NO SE PROVO ESTA PARTE SOLO LOCALMENTE SE AGREGA COMO INFORMACION 

☁️ Despliegue en AWS

Instalar dependencias:

npm install -g serverless
npm install


Configurar credenciales AWS:

aws configure


Desplegar Lambda:

npx serverless deploy


Variables requeridas en AWS:

CUSTOMERS_API_BASE: URL pública del Customers API

ORDERS_API_BASE: URL pública del Orders API

JWT_SECRET: Clave compartida entre servicios



🔄 Flujo de orquestación (Lambda)

Valida cliente → llama Customers /internal/customers/:id

Crea orden → Orders /orders

Confirma orden → Orders /orders/:id/confirm (usa X-Idempotency-Key)

Devuelve JSON consolidado con cliente + orden confirmada

🧰 Scripts NPM disponibles
Script	Descripción
npm run build	Compila TypeScript
npm run dev	Inicia Serverless Offline
docker-compose up -d	Levanta APIs y DB
docker-compose down -v	Detiene y limpia contenedores



-----------------------------------------------------------------------------------------
---

## 📘 Swagger / OpenAPI Documentation

Cada API cuenta con su propia documentación generada con **OpenAPI 3.0** y servida por Swagger UI.

### 🧾 Customers API
**Base URL:** `http://localhost:3002/api`  
**Swagger UI:** [http://localhost:3002/api-docs](http://localhost:3002/api-docs)

**Endpoints principales:**
- `POST /customers` → Crea un cliente nuevo  
- `GET /customers/:id` → Obtiene un cliente por ID  
- `GET /customers?search=` → Busca clientes por nombre o email  
- `GET /internal/customers/:id` → Solo accesible con header `Authorization: Bearer super-secret-key`

---

### 📦 Orders API
**Base URL:** `http://localhost:3001/api`  
**Swagger UI:** [http://localhost:3001/api-docs](http://localhost:3001/api-docs)

**Endpoints principales:**
- `POST /orders` → Crea una orden (`customer_id`, `items`)  
- `GET /orders/:id` → Devuelve detalle con items  
- `POST /orders/:id/confirm` → Confirma orden (idempotente, requiere `X-Idempotency-Key`)  
- `POST /orders/:id/cancel` → Cancela y restaura stock  

**Notas de implementación:**
- Confirmaciones repetidas con la misma `X-Idempotency-Key` devuelven siempre la misma respuesta.
- Cancelaciones dentro de 10 minutos después de confirmada la orden son válidas y restauran stock.

---

### ⚡ Lambda Orchestrator
**Base URL:** `http://localhost:3003/orchestrator`  
**Endpoint:**  
- `POST /create-and-confirm-order`

**Flujo ejecutado:**
1. Valida el cliente en Customers API (`/internal/customers/:id`)
2. Crea la orden en Orders API (`/orders`)
3. Confirma la orden (`/orders/:id/confirm`)
4. Devuelve JSON consolidado con cliente + orden confirmada + items.

---

## 🔍 Ejemplo End-to-End

```bash
curl -X POST http://localhost:3003/orchestrator/create-and-confirm-order \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 1,
    "items": [{ "product_id": 2, "qty": 3 }],
    "idempotency_key": "abc-123",
    "correlation_id": "req-789"
  }'

