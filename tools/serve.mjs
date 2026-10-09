#!/usr/bin/env node
// A tiny static server for sessions: serves site/ at the root, as
// ophiker.com does, so main is at / and preview at /preview/, each with its
// own worker scope. A folder without its slash is sent to it with a 301, as
// GitHub Pages does (/preview to /preview/).
//
//   npm run serve                 http://127.0.0.1:8104/ (preview at /preview/)
//   npm run serve -- --port 9000 --host 0.0.0.0 --dir site

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve, sep, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './pics.mjs';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.pic': 'text/plain; charset=utf-8',
};

/**
 * @param {string} dir the folder to serve (site/)
 */
export function makeServer(dir = join(ROOT, 'site')) {
  const base = resolve(dir);
  return createServer(async (req, res) => {
    const send = (code, body, headers = {}) => {
      res.writeHead(code, { 'Cache-Control': 'no-cache', ...headers });
      res.end(body);
    };
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      let path;
      try {
        path = decodeURIComponent(url.pathname);
      } catch {
        return send(400, 'Bad path\n', { 'Content-Type': 'text/plain' });
      }
      if (path.includes('\0')) return send(400, 'Bad path\n', { 'Content-Type': 'text/plain' });
      const rel = path.endsWith('/') ? `${path}index.html` : path;
      const file = resolve(base, `.${rel}`);
      if (file !== base && !file.startsWith(base + sep)) return send(403, 'No\n', { 'Content-Type': 'text/plain' });
      let st;
      try {
        st = await stat(file);
      } catch {
        return send(404, 'Not found\n', { 'Content-Type': 'text/plain' });
      }
      if (st.isDirectory()) return send(301, '', { Location: `${url.pathname}/${url.search}` });
      const body = await readFile(file);
      send(200, req.method === 'HEAD' ? '' : body, {
        'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
        'Content-Length': String(body.length),
      });
    } catch (e) {
      send(500, `${e && e.message}\n`, { 'Content-Type': 'text/plain' });
    }
  });
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const opt = (name, dflt) => {
    const i = args.indexOf(name);
    return i >= 0 ? args[i + 1] : dflt;
  };
  const port = Number(opt('--port', process.env.PORT || 8104));
  const host = opt('--host', '127.0.0.1');
  const dir = opt('--dir', join(ROOT, 'site'));
  makeServer(dir).listen(port, host, () => {
    console.log(`serve: ${dir} at http://${host}:${port}/ (preview at /preview/)`);
  });
}
