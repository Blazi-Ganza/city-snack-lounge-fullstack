import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { getDb } from "./db/mongo";
import { adminRouter } from "./routes/admin";
import { branchesRouter } from "./routes/branches";
import { customerRouter } from "./routes/customer";
import { receptionRouter } from "./routes/reception";
import { chatRouter } from "./routes/chat";
import { authRouter } from "./routes/auth";
import { menuRouter } from "./routes/menu";
import { eventsRouter } from "./routes/events";
import { promosRouter } from "./routes/promos";
import { analyticsRouter } from "./routes/analytics";
import { analyticsRouter } from "./routes/analytics";
import { staffRouter } from "./routes/staff";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      credentials: true,
    })
  );
  app.use(express.json({ limit: "10mb" }));

  // Request logger — helps debug
  app.use((req, _res, next) => {
    console.log(`→ ${req.method} ${req.path}`);
    next();
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "city-snack-api",
      env: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  app.get("/api/health/db", async (_req, res, next) => {
    try {
      const db = getDb();
      await db.command({ ping: 1 });
      res.json({ ok: true, db: db.databaseName });
    } catch (error) {
      next(error);
    }
  });

  app.use("/api/branches", branchesRouter);
  app.use("/api/customer", customerRouter);
  app.use("/api/reception", receptionRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/chat", chatRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/menu", menuRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/promos", promosRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/analytics", analyticsRouter);
  app.use("/api/staff", staffRouter);

  // 404 handler — for unknown routes (BEFORE error handler)
  app.use((req, res) => {
    console.warn(`⚠️ 404: ${req.method} ${req.path}`);
    res.status(404).json({ ok: false, message: `Route not found: ${req.path}` });
  });

  // Global error handler — MUST have 4 params
  app.use((
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("💥 Backend error:", error);
    const message = error instanceof Error ? error.message : "Unexpected server error";
    const stack = error instanceof Error ? error.stack : undefined;

    if (!res.headersSent) {
      res.status(500).json({
        ok: false,
        message,
        stack: env.NODE_ENV === "development" ? stack : undefined,
      });
    }
  });

  return app;
}