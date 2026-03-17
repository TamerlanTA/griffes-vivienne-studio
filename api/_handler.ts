import "dotenv/config";

type RequestHandler = (req: any, res: any) => void | Promise<void>;

let appPromise: Promise<RequestHandler> | null = null;

async function createApp(): Promise<RequestHandler> {
  const expressModule = await import("express");
  const { createExpressMiddleware } = await import(
    "@trpc/server/adapters/express"
  );
  const { appRouter } = await import("../server/routers");
  const { createContext } = await import("../server/_core/context");
  const { registerOAuthRoutes } = await import("../server/_core/oauth");

  const express = expressModule.default;
  const app = express();

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Vercel runs the existing Express/tRPC API as a serverless function. We
  // initialize the app lazily so cold starts surface normal 500 responses
  // instead of crashing the whole function during module evaluation.
  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API route not found" });
  });

  return app;
}

async function getApp(): Promise<RequestHandler> {
  if (!appPromise) {
    appPromise = createApp();
  }

  return appPromise;
}

export default async function handler(req: any, res: any) {
  try {
    const app = await getApp();
    return await app(req, res);
  } catch (error) {
    console.error("[Vercel API] Failed to bootstrap Express handler", error);
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "API bootstrap failed" }));
  }
}
