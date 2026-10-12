import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import router from "./routes";

export interface AppEnv {
  LOG_LEVEL?: string;
  DATABASE_URL?: string;
  HYPERDRIVE?: { connectionString: string };
}

const app = new Hono<{ Bindings: AppEnv }>();

app.use(logger());
app.use("/api/*", cors());

app.route("/api", router);

export default app;
