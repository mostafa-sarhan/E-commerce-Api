import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import chatHandler from "./api/chat.js";
import adminLoginHandler from "./api/adminLogin.js";

/* Runs the project's serverless functions inside `vite dev` and
 * `vite preview`.
 *
 * The handlers in api/ are written for Vercel, which is where they run
 * in production. This mounts those exact handlers in the dev server so
 * local work behaves like the deployed app, instead of every request
 * dying on a 404.
 *
 * The handlers are imported into the config bundle, never into the
 * client graph, and the secrets they read are copied into Node's own
 * process.env - none of it is exposed to the browser. loadEnv is called
 * with an empty prefix on purpose: it returns the .env entries without
 * the VITE_ filter, and this only happens server-side. */
function localApiRoutes() {
  const routes = {
    "/api/chat": { handler: chatHandler, name: "ai" },
    "/api/admin-login": { handler: adminLoginHandler, name: "admin" },
  };

  async function attach(server) {
    for (const [route, { handler, name }] of Object.entries(routes)) {
      server.middlewares.use(route, async (req, res, next) => {
        try {
          const chunks = [];

          for await (const chunk of req) {
            chunks.push(chunk);
          }

          const raw = Buffer.concat(chunks).toString("utf8");

          req.body = raw ? JSON.parse(raw) : {};

          /* The handlers are written against the Vercel response
             helpers, while connect hands over a bare ServerResponse.
             These two shims are the whole difference between the two
             runtimes. */
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };

          res.json = (payload) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(payload));
            return res;
          };

          await handler(req, res);
        } catch (error) {
          server.config.logger.error(
            `[${name}] dev handler failed: ${error?.message}`
          );

          if (res.writableEnded) return;

          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ message: "Request failed." }));
        }

        return next;
      });
    }
  }

  return {
    name: "voltix-local-api-routes",

    /* Runs once the config is resolved, so the .env values are in place
       before any request can arrive. Real environment variables win. */
    configResolved(config) {
      const env = loadEnv(config.mode, config.root, "");

      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    },

    configureServer: attach,
    configurePreviewServer: attach,
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApiRoutes()],
});