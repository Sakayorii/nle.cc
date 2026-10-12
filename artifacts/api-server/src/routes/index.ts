import { Hono } from "hono";
import health from "./health";

const router = new Hono();

router.route("/", health);

export default router;
