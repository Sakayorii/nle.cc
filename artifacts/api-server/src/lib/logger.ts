type LogLevel = "debug" | "info" | "warn" | "error";

const ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function envLevel(): LogLevel {
  const raw = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env?.LOG_LEVEL;
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return "info";
}

function write(level: LogLevel, obj: unknown, msg?: string) {
  if (ORDER[level] < ORDER[envLevel()]) return;
  const payload =
    typeof obj === "object" && obj !== null ? obj : { data: obj };
  const line = JSON.stringify({
    level,
    time: new Date().toISOString(),
    msg,
    ...payload,
  });
  if (level === "warn" || level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (obj: unknown, msg?: string) => write("debug", obj, msg),
  info: (obj: unknown, msg?: string) => write("info", obj, msg),
  warn: (obj: unknown, msg?: string) => write("warn", obj, msg),
  error: (obj: unknown, msg?: string) => write("error", obj, msg),
};
