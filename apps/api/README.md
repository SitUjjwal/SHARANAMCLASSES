# @sharanam/api

Express + TypeScript backend for SHARANAM CLASSES.

## Stack

- Express · TypeScript · Morgan · Helmet · Compression · CORS
- Dotenv · express-rate-limit · cookie-parser · JWT · Zod validation

## Structure

```
src/
  config/
  controllers/
  middlewares/
  models/
  routes/
  services/
  utils/
```

## Scripts

```bash
npm run dev -w @sharanam/api
npm run build -w @sharanam/api
npm start -w @sharanam/api
```

## Health

`GET /health` → `{ "status": "ok" }`
