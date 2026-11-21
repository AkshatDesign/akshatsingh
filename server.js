import compression from 'compression';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';

const BLOCKED_PATHS = new Set([
  '/server.js',
  '/package.json',
  '/package-lock.json',
]);

app.disable('x-powered-by');
app.use(compression({ threshold: 1024 }));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  const normalized = path.posix.normalize(req.path);
  if (
    BLOCKED_PATHS.has(normalized) ||
    normalized.startsWith('/node_modules') ||
    normalized.startsWith('/.')
  ) {
    return res.status(404).end();
  }
  next();
});

app.use(
  express.static(__dirname, {
    extensions: ['html'],
    index: 'index.html',
    setHeaders(res, filePath) {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.html') {
        res.setHeader('Cache-Control', 'no-cache');
      } else if (
        ['.webp', '.png', '.jpg', '.jpeg', '.svg', '.mp4', '.webm', '.woff2'].includes(ext)
      ) {
        res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400');
      }
    },
  })
);

app.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
