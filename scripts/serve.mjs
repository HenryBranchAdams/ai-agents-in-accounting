import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import worker from "../dist/server/index.js";

const root = path.resolve("dist/client");
const contentTypes = {
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".jsonl": "application/x-ndjson; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".zip": "application/zip",
};
const isSourceArchivePartPath = (pathname) =>
  /^\/downloads\/accounting-agents-source\.zip\.part-\d+$/.test(pathname);
const env = {
  ASSETS: {
    async fetch(request) {
      let file;
      try {
        file = path.resolve(
          root,
          "." + decodeURIComponent(new URL(request.url).pathname),
        );
      } catch {
        return new Response("Bad path", { status: 400 });
      }
      if (!file.startsWith(root + path.sep))
        return new Response("Not found", { status: 404 });
      try {
        const body = await fs.readFile(file);
        return new Response(body, {
          headers: {
            "Content-Type": isSourceArchivePartPath(new URL(request.url).pathname)
              ? "application/octet-stream"
              : contentTypes[path.extname(file)] || "text/plain; charset=utf-8",
            "Content-Length": String(body.length),
          },
        });
      } catch (error) {
        if (error.code === "ENOENT" || error.code === "EISDIR")
          return new Response("Not found", { status: 404 });
        throw error;
      }
    },
  },
};
const port = Number(process.env.PORT || 5177),
  hostname = process.env.HOST || "127.0.0.1";
if (!Number.isInteger(port) || port < 0 || port > 65535)
  throw new Error("Invalid PORT");
const server = http.createServer(async (req, res) => {
  try {
    const actualPort = server.address()?.port || port;
    const request = new Request(`http://${hostname}:${actualPort}${req.url}`, {
      method: req.method,
      headers: req.headers,
    });
    const result = await worker.fetch(request, env);
    res.writeHead(result.status, Object.fromEntries(result.headers));
    if (result.body) Readable.fromWeb(result.body).pipe(res);
    else res.end();
  } catch (error) {
    console.error("Request failed:", error.message);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Server error");
  }
});
server.listen(port, hostname, () => {
  const origin = `http://${hostname}:${server.address().port}`;
  console.log(`Accounting Agents corpus: ${origin}`);
  process.send?.({ type: "ready", origin });
});
for (const signal of ["SIGINT", "SIGTERM"]) process.once(signal, () => {
  server.closeAllConnections();
  server.close(() => process.exit(0));
});
