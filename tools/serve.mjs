#!/usr/bin/env node
// A tiny static server for sessions: serves site/ under /104-boyz/, the
// same subpath GitHub Pages uses, so relative URLs are tested for real.
//
//   npm run serve                 http://127.0.0.1:8104/104-boyz/
//   npm run serve -- --port 9000 --host 0.0.0.0

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, resolve, sep, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT } from './pics.mjs';

export const PREFIX = '/104-boyz/';

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
      const path = decodeURIComponent(url.pathname);
      if (path === '/' || path === PREFIX.slice(0, -1)) return send(302, '', { Location: PREFIX });
      if (!path.startsWith(PREFIX)) return send(404, 'Not here: try /104-boyz/\n', { 'Content-Type': 'text/plain' });
      let rel = path.slice(PREFIX.length);
      if (rel === '' || rel.endsWith('/')) rel += 'index.html';
      const file = resolve(base, rel);
      if (file !== base && !file.startsWith(base + sep)) return send(403, 'No\n');
      let st;
      try {
        st = await stat(file);
      } catch {
        return send(404, 'Not found\n', { 'Content-Type': 'text/plain' });
      }
      if (st.isDirectory()) return send(302, '', { Location: `${path}/` });
      const body = await readFile(file);
      send(200, req.method === 'HEAD' ? '' : body, {
        'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
        'Content-Length': String(body.length),
      });
    } catch (e) {
      send(500, `${e && e.message}\n`);
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
    console.log(`serve: ${dir} at http://${host}:${port}${PREFIX}`);
  });
}
