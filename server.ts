import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes can go here if needed
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    // Use vite's connect instance as middleware
    app.use(vite.middlewares);

    // If the request doesn't match any static asset or API route,
    // serve index.html to allow client-side routing (SPA fallback)
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        // 1. Read index.html
        let template = fs.readFileSync(
          path.resolve(__dirname, "index.html"),
          "utf-8"
        );

        // 2. Apply Vite HTML transforms. This injects the Vite HMR client, and
        //    also applies HTML transforms from Vite plugins, e.g. global preambles
        //    from @vitejs/plugin-react
        template = await vite.transformIndexHtml(url, template);

        // 3. Send the transformed HTML back.
        res.status(200).set({ "Content-Type": "text/html" }).end(template);
      } catch (e) {
        // If an error is caught, let Vite fix the stack trace so it maps back
        // to your actual source code.
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static files from dist
    app.use(express.static(distPath));

    // Fallback all other routes to index.html for SPA
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
