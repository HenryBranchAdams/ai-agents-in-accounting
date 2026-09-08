import {
  inputSchemas,
  outputSchemas,
} from "../dist/internal/agent-contract.mjs";

export class ConnectorError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
export function connectorError(error) {
  return {
    error: {
      code: error.code || "CONNECTOR_ERROR",
      message: error.message,
      retryable: error.code === "NETWORK_ERROR",
    },
  };
}
export function createCorpusClient({
  baseUrl,
  fetch: fetcher = globalThis.fetch,
} = {}) {
  let remote;
  if (baseUrl) {
    remote = new URL(baseUrl);
    if (
      !["http:", "https:"].includes(remote.protocol) ||
      remote.username ||
      remote.password ||
      remote.search ||
      remote.hash ||
      remote.pathname !== "/"
    )
      throw new ConnectorError(
        "INVALID_BASE_URL",
        "base-url must be an HTTP(S) origin without credentials, path, query, or fragment.",
      );
  }
  return {
    async call(op, args = {}) {
      if (!Object.hasOwn(inputSchemas, op))
        throw new ConnectorError(
          "UNKNOWN_OPERATION",
          `Unknown operation: ${op}.`,
        );
      const parsed = inputSchemas[op].safeParse(args);
      if (!parsed.success)
        throw new ConnectorError(
          "INVALID_ARGUMENT",
          parsed.error.issues
            .map((i) => `${i.path.join(".") || "arguments"}: ${i.message}`)
            .join("; "),
        );
      let result;
      if (!remote) {
        const { executeAgent } = await import("../dist/internal/agent.mjs");
        result = executeAgent(op, parsed.data);
      } else {
        const url = new URL(`/api/v1/agent/${op}`, remote);
        for (const [key, value] of Object.entries(parsed.data))
          for (const v of Array.isArray(value) ? value : [value])
            url.searchParams.append(key, String(v));
        let response;
        try {
          response = await fetcher(url, {
            method: "GET",
            redirect: "error",
            headers: { Accept: "application/json" },
            signal: AbortSignal.timeout(15000),
          });
        } catch {
          throw new ConnectorError(
            "NETWORK_ERROR",
            "Could not read the configured corpus API within 15 seconds.",
            502,
          );
        }
        if (!response.headers.get("content-type")?.includes("application/json"))
          throw new ConnectorError(
            "INVALID_RESPONSE",
            "The configured server did not return JSON. Confirm that the agent API is deployed there.",
            502,
          );
        const reader = response.body?.getReader();
        if (!reader)
          throw new ConnectorError(
            "INVALID_RESPONSE",
            "The configured server returned no body.",
            502,
          );
        let bytes = 0;
        const chunks = [];
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          bytes += value.length;
          if (bytes > 2_000_000) {
            await reader.cancel();
            throw new ConnectorError(
              "INVALID_RESPONSE",
              "API response exceeded 2 MB.",
              502,
            );
          }
          chunks.push(value);
        }
        const body = new Uint8Array(bytes);
        let offset = 0;
        for (const chunk of chunks) {
          body.set(chunk, offset);
          offset += chunk.length;
        }
        try {
          result = JSON.parse(new TextDecoder().decode(body));
        } catch {
          throw new ConnectorError(
            "INVALID_RESPONSE",
            "The API returned malformed JSON.",
            502,
          );
        }
        if (!response.ok)
          throw new ConnectorError(
            result.error?.code || "HTTP_ERROR",
            result.error?.message || `API returned HTTP ${response.status}.`,
            response.status,
          );
        if (
          args.corpus_version &&
          result.corpus_version !== args.corpus_version
        )
          throw new ConnectorError(
            "VERSION_MISMATCH",
            "The API did not honor the requested corpus version.",
            409,
          );
      }
      if (!outputSchemas[op].safeParse(result).success)
        throw new ConnectorError(
          "INVALID_RESPONSE",
          "The response does not match the retrieval contract.",
          502,
        );
      return result;
    },
  };
}

export function parseArguments(argv) {
  const positionals = [],
    flags = Object.create(null);
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      positionals.push(token);
      continue;
    }
    const key = token.slice(2).replace(/-/g, "_");
    if (["help", "pretty"].includes(key)) {
      flags[key] = true;
      continue;
    }
    const value = argv[++i];
    if (value === undefined || value.startsWith("--"))
      throw new ConnectorError(
        "INVALID_ARGUMENT",
        `Missing value for ${token}.`,
      );
    if (["ids", "allowed_host"].includes(key)) {
      (flags[key] ??= []).push(value);
      continue;
    }
    if (Object.hasOwn(flags, key))
      throw new ConnectorError("INVALID_ARGUMENT", `Duplicate ${token}.`);
    flags[key] =
      ["limit", "max_chars", "port"].includes(key) && /^\d+$/.test(value)
        ? Number(value)
        : key === "include_sources" && ["true", "false"].includes(value)
          ? value === "true"
          : value;
  }
  return { positionals, flags };
}
