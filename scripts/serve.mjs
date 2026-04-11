import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const [, , rootArg = '.', portArg = '3000'] = process.argv;
const root = resolve(process.cwd(), rootArg);
const port = Number(portArg);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
};

createServer((req, res) => {
  const requestUrl = new URL(req.url || '/', `http://localhost:${port}`);
  const urlPath = requestUrl.pathname;

  if (urlPath === '/api/invitado') {
    const guestId = requestUrl.searchParams.get('id');

    if (!guestId) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Falta el parametro id' }));
      return;
    }

    try {
      const dataPath = resolve(process.cwd(), 'data', 'invitados.json');
      const raw = readFileSync(dataPath, 'utf8');
      const parsed = JSON.parse(raw);
      const guest = parsed.invitados?.find(item => item.id === guestId);

      if (!guest) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: 'Invitado no encontrado' }));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(guest));
      return;
    } catch {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'No fue posible cargar el invitado' }));
      return;
    }
  }

  const safePath = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  const requestedPath = safePath === '/' ? 'index.html' : safePath;
  let filePath = join(root, requestedPath);

  if (!existsSync(filePath)) {
    const publicPath = join(root, 'public', requestedPath);
    if (existsSync(publicPath)) {
      filePath = publicPath;
    } else {
      filePath = join(root, 'index.html');
    }
  } else if (statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html');
  }

  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
    return;
  }

  const type = mimeTypes[extname(filePath)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type });
  createReadStream(filePath).pipe(res);
}).listen(port, () => {
  console.log(`Servidor listo en http://localhost:${port}`);
  console.log(`Sirviendo: ${root}`);
});
