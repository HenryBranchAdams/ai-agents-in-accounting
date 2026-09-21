import fs from 'node:fs';
import path from 'node:path';
import worker from '../dist/server/index.js';
const root = path.resolve('dist/client');
export const ASSETS = { async fetch(request) {
  const file = path.resolve(root, '.' + new URL(request.url).pathname);
  if (!file.startsWith(root + path.sep)) return new Response(null,{status:404});
  try { return new Response(fs.readFileSync(file)); }
  catch { return new Response(null,{status:404}); }
} };
export default { fetch(request, env = {}) { return worker.fetch(request, { ASSETS, ...env }); } };
