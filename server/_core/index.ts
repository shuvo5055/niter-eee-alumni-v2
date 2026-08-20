import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { storageGetSignedUrl } from "../storage";

const OFFICIAL_NITER_LOGO_KEY = "niter-official-logo_ca7597f4.jpg";

/**
 * A stable, same-origin brand route. Browsers never receive the expiring object
 * URL used internally to retrieve the immutable logo from project storage.
 */
function registerStableBrandAssets(app: express.Express) {
  app.get("/static/niter-official-logo.jpg", async (_req, res) => {
    try {
      const signedUrl = await storageGetSignedUrl(OFFICIAL_NITER_LOGO_KEY);
      const upstream = await fetch(signedUrl);
      if (!upstream.ok) throw new Error(`Logo source returned ${upstream.status}`);
      const asset = Buffer.from(await upstream.arrayBuffer());
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      res.type("image/jpeg").send(asset);
    } catch (error) {
      console.error("[Brand Asset] Failed to serve official NITER logo", error);
      res.status(503).type("text/plain").send("Official NITER logo is temporarily unavailable");
    }
  });
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStableBrandAssets(app);
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
