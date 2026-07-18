/**
 * Dependency-free structured JSON logger (server-safe: no browser APIs).
 *
 * Each call emits exactly one line of JSON — `debug`/`info` to stdout, `warn`/
 * `error` to stderr — shaped `{ level, msg, time, ...fields }`. This one-line-
 * per-event shape is what log collectors (CloudWatch, Vercel, etc.) expect so
 * a single event never gets split across lines.
 *
 * The active threshold is read from `process.env.LOG_LEVEL` on *every* call
 * rather than cached at module load, so ops can change verbosity via env
 * without a restart, and tests can flip it between assertions.
 *
 * `logger.child(boundFields)` returns a logger that merges `boundFields` into
 * every subsequent emit (e.g. binding a request-scoped `requestId` once at the
 * top of a handler instead of threading it through every call site). Children
 * of children accumulate their bound fields.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug(msg: string, fields?: Record<string, unknown>): void;
  info(msg: string, fields?: Record<string, unknown>): void;
  warn(msg: string, fields?: Record<string, unknown>): void;
  error(msg: string, fields?: Record<string, unknown>): void;
  /** Returns a new logger that merges `boundFields` into every emit it makes. */
  child(boundFields: Record<string, unknown>): Logger;
}

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Streams below this rank are dropped. Unset/unrecognized env falls back to "info". */
function currentThreshold(): number {
  const configured = process.env.LOG_LEVEL as LogLevel | undefined;
  return configured !== undefined && configured in LEVEL_RANK
    ? LEVEL_RANK[configured]
    : LEVEL_RANK.info;
}

/**
 * JSON.stringify replacer: `Error` has no *enumerable* own properties, so
 * `JSON.stringify(err)` serializes to `{}` by default. Surface the fields that
 * actually matter instead of losing the error entirely. Runs for every
 * key/value in the payload (including nested ones), so this also covers an
 * `Error` buried inside a field object, not just top-level field values.
 */
function errorReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack };
  }
  return value;
}

function createLogger(boundFields: Record<string, unknown>): Logger {
  function emit(level: LogLevel, msg: string, fields?: Record<string, unknown>): void {
    if (LEVEL_RANK[level] < currentThreshold()) return;
    const payload = { level, msg, time: new Date().toISOString(), ...boundFields, ...fields };
    const line = `${JSON.stringify(payload, errorReplacer)}\n`;
    const stream = level === "warn" || level === "error" ? process.stderr : process.stdout;
    stream.write(line);
  }

  return {
    debug: (msg, fields) => emit("debug", msg, fields),
    info: (msg, fields) => emit("info", msg, fields),
    warn: (msg, fields) => emit("warn", msg, fields),
    error: (msg, fields) => emit("error", msg, fields),
    child: (boundFieldsToAdd) => createLogger({ ...boundFields, ...boundFieldsToAdd }),
  };
}

const logger: Logger = createLogger({});

export default logger;
