# Backend Environment Setup

This project now includes a backend starter in `backend/`.

## 1. Create Backend Env File

Copy the sample env file:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set secure production values for:

- `DATABASE_URL`
- `JWT_SECRET`

## 2. Run Backend Server

Since root scripts are frontend-only, run backend directly with `tsx`:

```bash
npx tsx backend/src/server.ts
```

The API health endpoint will be available at:

- `GET /api/health`
- `GET /api/health/db`

Example:

```bash
curl http://localhost:4000/api/health
```

## 3. Installed Backend Packages

- `express`
- `cors`
- `dotenv`
- `zod`
- `tsx`

## 4. Next Backend Step

Core branch-aware APIs included:

- `GET /api/branches`
- `GET /api/customer/:branchId/menu`
- `GET /api/customer/:branchId/reviews`
- `POST /api/customer/reservations`
- `POST /api/customer/chats`
- `GET /api/reception/:branchId/dashboard`
- `PATCH /api/reception/:branchId/chats/:chatId`
- `PATCH /api/reception/:branchId/orders/:orderId`
- `PATCH /api/reception/:branchId/deliveries/:deliveryId`
- `GET /api/admin/overview`

When `AUTO_SEED=true`, sample records are inserted if collections are empty.