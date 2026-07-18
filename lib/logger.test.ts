import { afterEach, describe, expect, it, vi } from "vitest";

import logger from "./logger";

/** Spy on both output streams, made to look like a normal successful write. */
function spyStreams() {
  const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
  return { stdout, stderr };
}

/** Every emit is exactly one line of JSON; parse the first/only argument of a write call. */
function parseLine(line: unknown): Record<string, unknown> {
  expect(typeof line).toBe("string");
  const str = line as string;
  expect(str.endsWith("\n")).toBe(true);
  expect(str.trim().split("\n")).toHaveLength(1); // exactly one JSON object, no embedded newlines
  return JSON.parse(str) as Record<string, unknown>;
}

const originalLogLevel = process.env.LOG_LEVEL;

afterEach(() => {
  vi.restoreAllMocks();
  if (originalLogLevel === undefined) delete process.env.LOG_LEVEL;
  else process.env.LOG_LEVEL = originalLogLevel;
});

describe("level filtering", () => {
  it('defaults to "info" when LOG_LEVEL is unset: drops debug, keeps info', () => {
    delete process.env.LOG_LEVEL;
    const { stdout } = spyStreams();

    logger.debug("hidden");
    logger.info("shown");

    expect(stdout).toHaveBeenCalledTimes(1);
    expect(parseLine(stdout.mock.calls[0][0]).msg).toBe("shown");
  });

  it("allows debug through once LOG_LEVEL=debug", () => {
    process.env.LOG_LEVEL = "debug";
    const { stdout } = spyStreams();

    logger.debug("now visible");

    expect(stdout).toHaveBeenCalledTimes(1);
    expect(parseLine(stdout.mock.calls[0][0]).msg).toBe("now visible");
  });

  it("drops info once LOG_LEVEL=warn", () => {
    process.env.LOG_LEVEL = "warn";
    const { stdout, stderr } = spyStreams();

    logger.info("dropped");
    logger.warn("kept");

    expect(stdout).not.toHaveBeenCalled();
    expect(stderr).toHaveBeenCalledTimes(1);
  });

  it("falls back to the info threshold for an unrecognized LOG_LEVEL value", () => {
    process.env.LOG_LEVEL = "verbose"; // not one of debug/info/warn/error
    const { stdout } = spyStreams();

    logger.debug("still dropped");
    logger.info("still kept");

    expect(stdout).toHaveBeenCalledTimes(1);
    expect(parseLine(stdout.mock.calls[0][0]).msg).toBe("still kept");
  });

  it("re-reads LOG_LEVEL on every call rather than caching it", () => {
    delete process.env.LOG_LEVEL;
    const { stdout } = spyStreams();

    logger.debug("before the flip, dropped");
    process.env.LOG_LEVEL = "debug";
    logger.debug("after the flip, kept");

    expect(stdout).toHaveBeenCalledTimes(1);
    expect(parseLine(stdout.mock.calls[0][0]).msg).toBe("after the flip, kept");
  });
});

describe("JSON shape", () => {
  it("emits one line shaped { level, msg, time, ...fields }", () => {
    const { stdout } = spyStreams();

    logger.info("hello", { a: 1, b: "two" });

    const parsed = parseLine(stdout.mock.calls[0][0]);
    expect(parsed).toMatchObject({ level: "info", msg: "hello", a: 1, b: "two" });
    expect(typeof parsed.time).toBe("string");
    // `time` is a valid ISO-8601 timestamp.
    expect(new Date(parsed.time as string).toISOString()).toBe(parsed.time);
  });

  it("omits fields entirely when none are passed", () => {
    const { stdout } = spyStreams();

    logger.info("no fields");

    const parsed = parseLine(stdout.mock.calls[0][0]);
    expect(parsed).toEqual({ level: "info", msg: "no fields", time: parsed.time });
  });
});

describe("child", () => {
  it("merges bound fields into every emit", () => {
    const { stdout } = spyStreams();
    const child = logger.child({ requestId: "req-1" });

    child.info("bound in");

    expect(parseLine(stdout.mock.calls[0][0])).toMatchObject({
      requestId: "req-1",
      msg: "bound in",
    });
  });

  it("merges call-site fields alongside bound fields", () => {
    const { stdout } = spyStreams();
    const child = logger.child({ requestId: "req-1" });

    child.info("both", { extra: true });

    expect(parseLine(stdout.mock.calls[0][0])).toMatchObject({
      requestId: "req-1",
      extra: true,
    });
  });

  it("accumulates bound fields across nested children", () => {
    const { stdout } = spyStreams();
    const grandchild = logger.child({ requestId: "req-1" }).child({ userId: "u-9" });

    grandchild.info("nested");

    expect(parseLine(stdout.mock.calls[0][0])).toMatchObject({
      requestId: "req-1",
      userId: "u-9",
    });
  });

  it("does not leak bound fields back onto the parent logger", () => {
    const { stdout } = spyStreams();
    logger.child({ requestId: "req-1" });

    logger.info("parent unaffected");

    expect(parseLine(stdout.mock.calls[0][0]).requestId).toBeUndefined();
  });
});

describe("error serialization", () => {
  it("serializes an Error field to { name, message, stack }", () => {
    const { stderr } = spyStreams();

    logger.error("failed", { err: new TypeError("boom") });

    const parsed = parseLine(stderr.mock.calls[0][0]);
    expect(parsed.err).toEqual({
      name: "TypeError",
      message: "boom",
      stack: expect.any(String),
    });
  });

  it("never serializes to a raw (empty) Error object", () => {
    const { stderr } = spyStreams();

    logger.error("failed", { err: new Error("x") });

    const parsed = parseLine(stderr.mock.calls[0][0]);
    expect(parsed.err).not.toEqual({});
  });

  it("serializes an Error nested inside a field object", () => {
    const { stderr } = spyStreams();

    logger.error("failed", { context: { cause: new Error("nested") } });

    const parsed = parseLine(stderr.mock.calls[0][0]);
    expect(parsed.context).toEqual({
      cause: { name: "Error", message: "nested", stack: expect.any(String) },
    });
  });
});

describe("stream routing", () => {
  it("sends debug and info to stdout only", () => {
    process.env.LOG_LEVEL = "debug";
    const { stdout, stderr } = spyStreams();

    logger.debug("d");
    logger.info("i");

    expect(stdout).toHaveBeenCalledTimes(2);
    expect(stderr).not.toHaveBeenCalled();
  });

  it("sends warn and error to stderr only", () => {
    const { stdout, stderr } = spyStreams();

    logger.warn("w");
    logger.error("e");

    expect(stderr).toHaveBeenCalledTimes(2);
    expect(stdout).not.toHaveBeenCalled();
  });
});
