#!/usr/bin/env node
import http from "node:http";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createMcpHandler } from "@modelcontextprotocol/server";
import {
  hostHeaderValidation,
  originValidation,
  toNodeHandler,
} from "@modelcontextprotocol/node";
import { createMcpServer } from "./mcp-server.mjs";
import {
  parseArguments,
  ConnectorError,
  connectorError,
} from "./agent-client.mjs";

try {
  const { positionals, flags } = parseArguments(process.argv.slice(2));
  const {
    help,
    base_url,
    transport = "stdio",
    port = 5178,
    host = "127.0.0.1",
    allowed_host = [],
    ...unknown
  } = flags;
  if (positionals.length || Object.keys(unknown).length)
    throw new ConnectorError(
      "INVALID_ARGUMENT",
      "Unknown MCP arguments. Use --help.",
    );
  if (help) {
    process.stdout.write(
      "accounting-corpus-mcp [--base-url ORIGIN] [--transport stdio|http] [--port 5178] [--host 127.0.0.1] [--allowed-host HOSTNAME]\nDefaults: local corpus, stdio. HTTP serves /mcp with explicit Host/Origin validation.\n",
    );
  } else {
    // Validate configuration before starting a protocol transport.
    createMcpServer({ baseUrl: base_url });
    const factory = () => createMcpServer({ baseUrl: base_url });
    if (transport === "stdio") {
      serveStdio(factory, {
        onerror: () => process.stderr.write("MCP protocol error.\n"),
      });
    } else if (transport === "http") {
      if (!Number.isInteger(port) || port < 0 || port > 65535)
        throw new ConnectorError("INVALID_ARGUMENT", "port must be 0–65535.");
      if (!/^[a-zA-Z0-9.:[\]-]+$/.test(host))
        throw new ConnectorError("INVALID_ARGUMENT", "Invalid bind host.");
      const allowed = ["localhost", "127.0.0.1", "[::1]", ...allowed_host];
      const validateHost = hostHeaderValidation(allowed),
        validateOrigin = originValidation(allowed);
      const handler = createMcpHandler(factory, {
        responseMode: "json",
        keepAliveMs: 0,
      });
      const nodeHandler = toNodeHandler(handler);
      const server = http.createServer(async (req, res) => {
        if (!validateHost(req, res) || !validateOrigin(req, res)) return;
        if (req.url !== "/mcp") {
          res.writeHead(404).end("Use /mcp.\n");
          return;
        }
        if (!["POST", "GET", "DELETE"].includes(req.method)) {
          res.writeHead(405, { Allow: "POST, GET, DELETE" }).end();
          return;
        }
        let size = 0;
        const chunks = [];
        try {
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 65536) {
              res.writeHead(413).end("Request too large.\n");
              return;
            }
            chunks.push(chunk);
          }
          const body = size
            ? JSON.parse(Buffer.concat(chunks).toString("utf8"))
            : undefined;
          await nodeHandler(req, res, body);
        } catch {
          if (!res.headersSent)
            res
              .writeHead(400, { "Content-Type": "application/json" })
              .end(JSON.stringify({ error: "Malformed request." }));
          else res.end();
        }
      });
      server.requestTimeout = 15000;
      server.headersTimeout = 10000;
      server.on("error", (error) => {
        process.stderr.write(JSON.stringify(connectorError(error)) + "\n");
        process.exitCode = 1;
      });
      server.listen(port, host, () =>
        process.stderr.write(
          `Accounting corpus MCP listening on http://${host.includes(":") ? `[${host}]` : host}:${server.address().port}/mcp\n`,
        ),
      );
      const close = () => {
        server.close();
        server.closeAllConnections();
        void handler.close();
      };
      process.once("SIGINT", close);
      process.once("SIGTERM", close);
    } else
      throw new ConnectorError(
        "INVALID_ARGUMENT",
        "transport must be stdio or http.",
      );
  }
} catch (error) {
  process.stderr.write(JSON.stringify(connectorError(error)) + "\n");
  process.exitCode = 1;
}
